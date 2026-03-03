# Outreach Platform MVP
## Architectural Blueprint v0.1

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
- Google OAuth
- JWT with org_id and role
- Role-based access control

---

# 4. Identity Domains

There are TWO separate identity domains:

## Authentication Identity
Represents system users.
- Volunteers
- Managers
- Admins

Stored in: users table

## Service Identity
Represents individuals being served (“Friends”).

Stored in: friends table

These identities are intentionally separate.

A person may exist in both domains but they are not structurally coupled.

---

# 5. Domain Model Overview

Core Entities:

- Organization
- User
- Friend
- Encounter
- Need
- FulfillmentEvent

The atomic unit of value in the system is:

Friend + Need + Fulfillment State

---

# 6. Database Schema (Authoritative Definition)

## organizations
- id (UUID, PK)
- name (TEXT NOT NULL)
- created_at (TIMESTAMP DEFAULT now())

## users
- id (UUID, PK)
- org_id (UUID FK organizations)
- email (TEXT UNIQUE NOT NULL)
- role (ENUM: admin, manager, volunteer)
- created_at (TIMESTAMP DEFAULT now())

## friends
- id (UUID, PK)
- org_id (UUID FK organizations)
- preferred_name (TEXT)
- aliases (JSONB DEFAULT [])
- identifying_notes (TEXT)
- consent_scope (ENUM: verbal, limited, none)
- created_at (TIMESTAMP DEFAULT now())

## encounters
- id (UUID, PK)
- org_id (UUID FK organizations)
- friend_id (UUID FK friends)
- user_id (UUID FK users)
- location_text (TEXT)
- occurred_at (TIMESTAMP)
- created_at (TIMESTAMP DEFAULT now())

## needs
- id (UUID, PK)
- org_id (UUID FK organizations)
- friend_id (UUID FK friends)
- category (TEXT)
- description (TEXT)
- priority (ENUM: low, medium, high)
- status (ENUM: see lifecycle below)
- created_at (TIMESTAMP DEFAULT now())

## fulfillment_events
- id (UUID, PK)
- org_id (UUID FK organizations)
- need_id (UUID FK needs)
- encounter_id (UUID NULL FK encounters)
- event_type (TEXT)
- notes (TEXT)
- created_at (TIMESTAMP DEFAULT now())

---

# 7. Need Lifecycle State Machine

Allowed transitions:

open
→ in_review
→ sourcing
→ ready
→ out_for_delivery
→ delivered

OR

open
→ attempted_not_found
→ closed_unable

Rules:

- No backward transitions
- delivered is terminal
- closed_unable is terminal
- Every status change creates a fulfillment_event record

---

# 8. Role Permissions

## admin
- Full read/write access
- Manage users
- Change any need status
- No hard delete

## manager
- View all data
- Manage needs
- Change status
- Cannot delete records

## volunteer
- Create friend
- Create encounter
- Create need
- Mark delivered
- Mark attempted_not_found
- Cannot delete
- Cannot manage users

---

# 9. MVP User Flows

## Field Flow

1. Login
2. Search Friend
3. If not found → Create Friend
4. Log Encounter
5. Add Need (optional)
6. Done

Target time: < 30 seconds

---

## Pre-Route Flow

1. Manager views Open Needs
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

# 10. API Surface (Minimal Contract)

## Authentication
POST /auth/login
GET  /auth/me

## Friends
GET    /friends?search=
POST   /friends
GET    /friends/:id
PATCH  /friends/:id

## Encounters
POST   /encounters
GET    /friends/:id/encounters

## Needs
POST   /needs
GET    /needs?status=
PATCH  /needs/:id/status

## Fulfillment
POST   /needs/:id/events

No additional endpoints in MVP.

---

# 11. Frontend Screens

## Dashboard
- Search input
- Open needs count
- Ready count
- Add Friend button

## Friend Profile
- Header: name, aliases, consent
- Tabs: Encounters | Needs
- + Log Encounter button

## Log Encounter
- Location text
- Notes
- Save
- Save & Add Need

## Add Need
- Category dropdown
- Description
- Priority toggle
- Submit

## Need Detail
- Friend name
- Description
- Status badge
- State transition buttons

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