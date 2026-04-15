# Outreach Platform MVP
## Architectural Blueprint v0.2

> **Last updated:** April 15, 2026 — reflects implemented state as of commit `4d06eb8`.
> Decisions and historical context live in `docs/decisions/`.

---

# 1. Purpose

## Mission

Provide a mobile-first system that ensures continuity in the lifecycle of a need from request to fulfillment for individuals served by outreach organizations.

## MVP Objective

Eliminate loss, duplication, and breakdown in the process of:

Identifying a need → Tracking it → Fulfilling it → Recording the outcome.

The MVP does NOT attempt:
- Cross-organization matching
- Analytics dashboards
- Inventory control
- Policy reporting
- AI recommendations

---

# 2. Design Principles

1. Person-Centric — Everything orbits the Friend.
2. Lifecycle Integrity — Every need has a traceable state history.
3. Mobile-First — Designed for live field use.
4. Multi-Tenant Ready — Every record scoped by organization.
5. Minimal Surface Area — No speculative features.
6. No Hard Deletes — Preserve longitudinal data.
7. Privacy-Conscious — Avoid sensitive PII in MVP.

---

# 3. System Context

Users (Volunteers / Managers / Admins)
        |
        v
Vue 3 PWA (Mobile-first)
        |
        v
NestJS API
        |
        v
PostgreSQL Database

Authentication:
- Supabase Email OTP (magic code — no passwords, no OAuth)
- Sessions via httpOnly cookies (`fh_access_token`, `fh_refresh_token`)
- Bearer token fallback stored in sessionStorage for environments where cookies are blocked (e.g. mobile WebViews)
- Token carries `org_id` and `role` claims; resolved server-side on every request
- Invite-based onboarding — users cannot self-register without a valid invite
- Bootstrap admins provisioned via `AUTH_ADMIN_EMAILS` env var (bypasses invite requirement)red in sessionStorage for environments where cookies are blocked (e.g. mobile WebViews)
- Token carries `org_id` and `role` claims; resolved server-side on every request
- Invite-based onboarding — users cannot self-register without a valid invite
- Bootstrap admins provisioned via `AUTH_ADMIN_EMAILS` env var (bypasses invite requirement)

---

# 4. Identity Domains

There are TWO separate identity domains:

## Authentication Identity
Represents system users.
- Volunteers
Stored in: `users` table (+ `user_roles`, `user_memberships`, `roles`)

## Service Identity
Represents individuals being served ("Friends" in the UI).

Stored in: `people` table (referred to as "Friends" in the UI, "Person" in code and schema)
Represents individuals being served ("Friends" in the UI).

Stored in: `people` table (referred to as "Friends" in the UI, "Person" in code and schema)

These identities are intentionally separate.

A person may exist in both domains but they are not structurally coupled.

---

# 5. Domain Model Overview

Core E (+ Role, UserRole, UserMembership)
- Person ("Friend" in UI)
- Encounter
- Request / RequestItem ("Need" in architecture docs)
- FulfillmentEvent
- Invite

Model semantics:
- Encounters record real-world interactions with people and may produce zero or more requests.
- Requests contain one or more RequestItems (individual needed items).
- FulfillmentEvents are append-only lifecycle records for RequestItems and may optionally reference an encounter.
- Locations are explicitly selected by users (no GPS auto-capture).
- Routes are a UI-only grouping of locations for delivery runs.
- Invites gate new user registration; only invited emails (or bootstrap admins) can create accounts.
- UserMembership tracks active/inactive org membership, separate from role assignment.

The atomic unit of value in the system is:

Person + Requesta UI-only grouping of locations for delivery runs.
- Invites gate new user registration; only invited emails (or bootstrap admins) can create accounts.
- UserMembership tracks active/inactive org membership, separate from role assignment.

The atomic unit of value in the system is:

> The canonical source of truth is `apps/api/prisma/schema.prisma`. This section reflects the current implemented schema.

## organizations
- id (UUID, PK)
- name (TEXT NOT NULL)
- created_at (TIMESTAMP)

## users
- id (UUID, PK)
- organization_id (UUID FK organizations)
- auth_user_id (TEXT UNIQUE) — Supabase Auth UID
- email (TEXT UNIQUE)
- phone_number (TEXT UNIQUE)
- name (TEXT NOT NULL)
- created_at (TIMESTAMP)

## roles
- id (UUID, PK)
- name (TEXT UNIQUE) — one of: admin, manager, volunteer
- created_at (TIMESTAMP)

## user_roles
- id (UUID, PK)
- user_id (UUID FK users)
- role_id (UUID FK roles)
- created_at (TIMESTAMP)
- UNIQUE(user_id, role_id)

## user_memberships
- id (UUID, PK)
- user_id (UUID FK users)
- organization_id (UUID FK organizations)
- status (TEXT DEFAULT 'active')
- created_at / updated_at
- UNIQUE(user_id, organization_id)

## invites
- id (UUID, PK)
- organization_id (UUID FK organizations)
- channel (TEXT) — 'email' or 'sms'
- destination (TEXT) — email address or phone
- status (ENUM: PENDING, SENT, ACCEPTED, EXPIRED, REVOKED)
- token_hash (TEXT UNIQUE)
- invited_by_user_id (UUID FK users, nullable)
- accepted_by_user_id (UUID FK users, nullable)
- expires_at (TIMESTAMP, nullable)
- created_at / updated_at

## people
- id (UUID, PK)
- organization_id (UUID FK organizations)
- display_name (TEXT)
- normalized_name (TEXT)
- last_seen_at (TIMESTAMP)
- notes (TEXT)
- created_at (TIMESTAMP)

## encounters
- id (UUID, PK)
- type (ENUM: DELIVERY, INTERACTION)
- organization_id (UUID FK organizations)
- person_id (UUID FK people)
- route_id (UUID FK routes, nullable)
- occurred_at (TIMESTAMP)
- notes (TEXT)
- created_at (TIMESTAMP)

## requests
- id (UUID, PK)
- person_id (UUID FK people)
- location_id (UUID FK locations)
- taken_by_user_id (UUID FK users)
- status (ENUM: REQUESTED, PREPARING, READY, DELIVERED, CANCELLED)
- notes (TEXT)
- created_at (TIMESTAMP)

## request_items
- id (UUID, PK)
- request_id (UUID FK requests)
- description (TEXT)
- quantity_requested (INT)
- quantity_fulfilled (INT)
- quantity_delivered (INT)
- fulfilled_by_user_id (UUID FK users, nullable)
- fulfilled_at (TIMESTAMP, nullable)
- status (ENUM: OPEN, READY, OUT_FOR_DELIVERY, DELIVERED, CLOSED_UNABLE)
- created_at (TIMESTAMP)

## fulfillment_events
- id (UUID, PK)
- request_item_id (UUID FK request_items)
- event_type (ENUM: CREATED, READY, OUT_FOR_DELIVERY, DELIVERED, ATTEMPTED_NOT_FOUND, CLOSED_UNABLE)
- notes (TEXT)
- created_at (TIMESTAMP)

## locations
- id (UUID, PK)
- organization_id (UUID FK organizations)
- name (TEXT)
- description (TEXT)
- is_active (BOOLEAN)
- latitude / longitude (DECIMAL, optional)
- created_at (TIMESTAMP)

## routes
- id (UUID, PK)
- organization_id (UUID FK organizations)
- name (TEXT)
- description (TEXT)
- created_at (TIMESTAMP)

## quick_pick_items
- id (UUID, PK)
- organization_id (UUID FK organizations)
- label (TEXT)
- created_at (TIMESTAMPED, EXPIRED, REVOKED)
- token_hash (TEXT UNIQUE)
- invited_by_user_id (UUID FK users, nullable)
- accepted_by_user_id (UUID FK users, nullable)
- expires_at (TIMESTAMP, nullable)
- created_at / updated_at

## people
- id (UUID, PK)
- organization_id (UUID FK organizations)
- display_name (TEXT)
- normalized_name (TEXT)
- last_seen_at (TIMESTAMP)
- notes (TEXT)
- created_at (TIMESTAMP)

## encounters
- id (UUID, PK)
- type (ENUM: DELIVERY, INTERACTION)
- organization_id (UUID FK organizations)
- person_id (UUID FK people)
- route_id (UUID FK routes, nullable)
- occurred_at (TIMESTAMP)
- notes (TEXT)
- created_at (TIMESTAMP)

## requests
- id (UUID, PK)
- person_id (UUID FK people)
- location_id (UUID FK locations)
- taken_by_user_id (UUID FK users)
- status (ENUM: REQUESTED, PREPARING, READY, DELIVERED, CANCELLED)
- notes (TEXT)
- created_at (TIMESTAMP)

## request_items
- id (UUID, PK)
- request_id (UUID FK requests)
- description (TEXT)
- quantity_requested (INT)
- quantity_fulfilled (INT)
- quantity_delivered (INT)
- fulfilled_by_user_id (UUID FK users, nullable)
- fulfilled_at (TIMESTAMP, nullable)
- status (ENUM: OPEN, READY, OUT_FOR_DELIVERY, DELIVERED, CLOSED_UNABLE)
- created_at (TIMESTAMP)

## fulfillment_events
- id (UUID, PK)
- request_item (grant/revoke roles, view all org members)
- Send and manage invites
- Change any request/item status
- Access Settings page
- No hard delete

## manager
- View all org data
- Send and manage invites
- Manage requests and items
- Change request/item status
- Access Settings page
- Cannot manage user roles
- Cannot delete records

## volunteer
- Create person record
- Log encounters
- Create requests and items
- Mark delivered or attempted_not_found
- Cannot delete
- Cannot manage users or roles
- Cannot access Settings page

Role assignment is managed via the Settings → User Access panel (admin only).
Roles are stored in the `user_roles` junction table. A user may hold multiple roles;
the system resolves to the highest-privilege role for access control (admin > manager > volunteer).
- description (TEXT)
- created_at (TIMESTAMP)

## quick_pick_items
- id (UUID, PK)
- organization_id (UUID FK organizations)
- label (TEXT)
- created_at (TIMESTAMP)

---

# 7. Need Lifecycle State Machine

Allowed transitions:

open
→ ready
→ out_for_delivery
→ delivered

and

open
→ attempted_not_found
→ open

or

open
→ closed_unable

Rules:

- needs.status is a derived snapshot of the latest fulfillment_event
- delivered is terminal
- closed_unable is terminal
- Every status change creates a fulfillment_event record

Status mapping from fulfillment event type:
- created → open
- ready → ready
- out_for_delivery → out_for_delivery
- delivered → delivered
- attempted_not_found → open
- closed_unable → closed_unable

Derived state:

## Authentication
POST /auth/request-email-code   — send OTP to email
POST /auth/verify-email-code    — verify OTP, set session cookies
POST /auth/refresh              — refresh session using refresh cookie
POST /auth/logout               — clear session cookies
GET  /auth/me                   — return authenticated user + role
GET  /me                        — alias for current user context

## People ("Friends")
GET    /friends?search=
POST   /friends
GET    /friends/:id
PATCH  /friends/:id

## Encounters
POST   /encounters
GET    /encounters

## Requests
GET    /requests
POST   /requests
PATCH  /requests/:id

## Delivery Attempts
POST   /delivery-attempts
GET    /delivery-attempts

## Routes & Locations
GET    /routes
GET    /routes/:id
GET    /locations
GET    /locations/:id

## Invites (admin/manager only)
GET    /invites
POST   /invites
POST   /invites/:id/resend
DELETE /invites/:id/cancel
DELETE /invites/:id

## User Access (admin/manager read; admin write)
GET    /user-access
POST   /user-access/:userId/roles
DELETE /user-access/:userId/roles/:roleName
PUT    /user-access/:userId/roles

## Quick Pick Items (admin/manager only)
GET    /quick-pick-items
POST   /quick-pick-items
PATCH  /quick-pick-items/:id
DELETE /quick-pick-items/:id
POST   /quick-pick-items/seed-defaults

## Dashboard
GET    /dashboard

## Health
GET    /health
## volunteer
- Create person record
- Log encounters
- Create requests and items
- Mark delivered or attempted_not_found
- Cannot del (Route List)
- List of active routes
- Open request counts per location

## Route Detail / Location Page
- People at this location
- Open requests
- Log encounter button

## Encounter Form
- Person search / create
- Notes
- Quick-pick item buttons
- Submit

## Warehouse Queue
- List of open/preparing requests
- Status transition buttons (Preparing → Ready → Out for Delivery → Delivered)

## Settings (admin/manager only)
- Quick Pick Items — manage preset item buttons
- Invite Management — send, track, resend, cancel invites
- User Access — view all org users, grant/revoke roles

## Login
- Email input → OTP code input
- Invite-gated (unknown emails are rejected at OTP request time)s
2. Move to sourcing / ready
3. Mark out_for_delivery

---

## Delivery Flow

1. Search Friend
2. Open Need
3. Mark delivered OR attempted_not_found

---

## Transcription Flow

Admin or Manager may:

- Create encounter retroactively
- Override occurred_at timestamp
- Add needs retroactively

All manual timestamps must be auditable.

---

# 10. API Surface

## Authentication
POST /auth/request-email-code   — send OTP to email
POST /auth/verify-email-code    — verify OTP, set session cookies
POST /auth/refresh              — refresh session using refresh cookie
POST /auth/logout               — clear session cookies
GET  /auth/me                   — return authenticated user + role
GET  /me                        — alias for current user context

## People ("Friends")
GET    /friends?search=
POST   /friends
GET    /friends/:id
PATCH  /friends/:id

## Encounters
POST   /encounters
GET    /encounters

## Requests
GET    /requests
POST   /requests
PATCH  /requests/:id

## Delivery Attempts
POST   /delivery-attempts
GET    /delivery-attempts

## Routes & Locations
GET    /routes
GET    /routes/:id
GET    /locations
GET    /locations/:id

## Invites (admin/manager only)
GET    /invites
POST   /invites
POST   /invites/:id/resend
DELETE /invites/:id/cancel
DELETE /invites/:id

## User Access (admin/manager read; admin write)
GET    /user-access
POST   /user-access/:userId/roles
DELETE /user-access/:userId/roles/:roleName
PUT    /user-access/:userId/roles

## Quick Pick Items (admin/manager only)
GET    /quick-pick-items
POST   /quick-pick-items
PATCH  /quick-pick-items/:id
DELETE /quick-pick-items/:id
POST   /quick-pick-items/seed-defaults

## Dashboard
GET    /dashboard

## Health
GET    /health

---

# 11. Frontend Screens

## Dashboard (Route List)
- List of active routes
- Open request counts per location

## Route Detail / Location Page
- People at this location
- Open requests
- Log encounter button

## Encounter Form
- Person search / create
- Notes
- Quick-pick item buttons
- Submit

## Warehouse Queue
- List of open/preparing requests
- Status transition buttons (Preparing → Ready → Out for Delivery → Delivered)

## Settings (admin/manager only)
- Quick Pick Items — manage preset item buttons
- Invite Management — send, track, resend, cancel invites
- User Access — view all org users, grant/revoke roles

## Login
- Email input → OTP code input
- Invite-gated (unknown emails are rejected at OTP request time)

---

# 12. Data Privacy Constraints (MVP)

- No legal names required
- No DOB required
- No SSN or government ID
- No medical diagnosis fields
- No document uploads
- Consent scope required on Friend creation
- No data export in MVP
- No hard delete

---

# 13. Scalability Safeguards

Even in MVP:

- All tables include org_id
- Index on (org_id, friend_id)
- Index on (org_id, status)
- UUID primary keys
- No org assumptions hardcoded

---

# 14. Non-Goals (Strict)

The following are explicitly excluded:

- Cross-organization identity matching
- Analytics dashboards
- Heat maps
- Inventory management
- AI features
- Friend self-service portal
- Public API
- Data exports
- Hard delete endpoints

---

# 15. MVP Success Criteria

The MVP is successful if:

- No need is lost between encounters.
- Volunteers can log needs in under 30 seconds.
- Managers can instantly see open needs.
- Delivery attempts are consistently recorded.
- The system is usable on mobile in the field.