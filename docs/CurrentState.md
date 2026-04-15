## Application State Summary

**Last Updated:** April 15, 2026 | **Current Commit:** `4d06eb8` (main)

---

### **Project Overview**

Friend Helper is an MVP outreach coordination system for tracking people encountered during outreach, recording their needs, and managing fulfillment workflows. **Target users:** field volunteers, warehouse managers, admin coordinators.

**Org:** The City Well / BeMoreCaring
**Status:** Deployed to Railway. In active field testing with role-based access and invite-based onboarding operational.

---

### **Architecture**

**Stack:**
- **Frontend:** Vue 3 (PWA, mobile-first) + TypeScript + Tailwind CSS + Axios
- **Backend:** NestJS + TypeScript + Prisma v6 ORM
- **Database:** PostgreSQL (managed on Railway)
- **Auth:** Supabase Email OTP — no passwords, no OAuth
- **Email:** Resend API (invite emails)
- **Hosting:** Railway — two services (web + API) + one PostgreSQL instance

**Design Principles** (from MVP-Architecture.md):
1. Person-centric (organized around "Friends"/people encountered)
2. Lifecycle integrity (append-only fulfillment events, no hard deletes)
3. Mobile-first (field-driven UX)
4. Multi-tenant (org-scoped data)
5. Minimal surface area (no speculative features)

---

### **Database Schema** (key tables)

| Table | Purpose |
|-------|---------|
| `organizations` | Org tenant root |
| `users` | System users (volunteers/managers/admins) |
| `roles` | Role definitions (admin/manager/volunteer) |
| `user_roles` | Many-to-many role assignment |
| `user_memberships` | Org membership + status (active/inactive) |
| `invites` | Email-based org invitations (PENDING/SENT/ACCEPTED/EXPIRED/REVOKED) |
| `people` | Individuals encountered ("Friends" in the UI) |
| `person_aliases` | Alternate names for a person |
| `encounters` | Outreach interactions with a person |
| `requests` | A set of items needed by a person at a location |
| `request_items` | Individual items within a request |
| `fulfillment_events` | Append-only item lifecycle history |
| `delivery_attempts` | Field delivery attempt records |
| `locations` | Named physical locations |
| `routes` | Named groupings of locations for delivery runs |
| `route_locations` | Ordered stops on a route |
| `quick_pick_items` | Preset item label buttons for fast request entry |

Canonical schema: `apps/api/prisma/schema.prisma`

---

### **Commit History (significant milestones)**

| Commit | Description |
|--------|-------------|
| `d8aa7b7` | Add invite auth and user access management |
| `5e28237` | Fix production auth cookies — SameSite=None for cross-origin Railway |
| `f9e7b57` | Fix Railway auth cookies and SPA routing |
| `ee44a63` | Fix route loading for authenticated orgs |
| `429f950` | Revert bad AI edits |
| `bf96608` | Fix invite link URL in email |
| `4d06eb8` | Add auth guard for mobile (Bearer token fallback via sessionStorage) |

---

### **Authentication & Session Flow**

1. User enters invited email → `POST /auth/request-email-code`
2. Supabase sends OTP to email
3. User enters code → `POST /auth/verify-email-code`
4. API sets `fh_access_token` + `fh_refresh_token` httpOnly cookies
5. API also returns `accessToken` in response body (Bearer fallback for mobile)
6. Frontend stores Bearer token in `sessionStorage` as `fh_access_token_fallback`
7. Every API request sends cookies (via `withCredentials`) AND Bearer header from sessionStorage
8. On 401, auto-refresh interceptor calls `POST /auth/refresh`, updates token, retries request
9. On refresh failure, token is cleared and user is redirected to login

**Cookie policy:**
- Development: `SameSite=Lax`
- Production: `SameSite=None; Secure; Partitioned`

---

### **Known Issues / Open Items**

1. **Role Resolution — single effective role**
   - A user can hold multiple roles simultaneously in `user_roles`
   - The system resolves to one effective role (admin > manager > volunteer) for guard checks
   - All guards use this single resolved role; granular multi-role checks are not currently needed

2. **Membership vs Role consistency**
   - `user_memberships.status` controls login access; `user_roles` controls feature access
   - These are kept in sync by the invite acceptance and user-access flows
   - No automated reconciliation if they drift (e.g. via direct DB edits)

3. **Invite email hard dependency**
   - `RESEND_API_KEY` missing → invite send throws a 400 (no silent failure)
   - No SMS fallback implemented yet (blocked in UI with "coming soon")

4. **Last admin protection — partial**
   - `DELETE /user-access/:id/roles/:role` prevents removing the last admin
   - `PUT /user-access/:id/roles` (bulk replace) also checks for last admin
   - Not enforced at DB level; direct DB edits could orphan an org

---

### **Current Feature Set**

**Deployed & Working:**
- ✅ Dashboard (route view + open request counts)
- ✅ Encounter creation (location + notes)
- ✅ Request/item tracking (REQUESTED → PREPARING → READY → DELIVERED)
- ✅ Delivery attempts logging
- ✅ Quick-pick item templates
- ✅ In-app help guides
- ✅ Email OTP login (invite-gated)
- ✅ Invite management (Settings — admin/manager)
- ✅ Role-based access control (admin/manager/volunteer)
- ✅ User Access panel (Settings — admin can grant/revoke roles)
- ✅ Production auth cookies (cross-origin Railway, including mobile fallback)

**Not Yet Implemented:**
- SMS invites
- Analytics / reporting dashboards
- Inventory management
- Audit logging
- Hard deletes
- Cross-org identity matching

---

### **Critical Source Files**

**Backend:**
- `apps/api/src/auth.service.ts` — OTP flow, Supabase JWT verification, role resolution, bootstrap admin provisioning
- `apps/api/src/auth.constants.ts` — Cookie names, cookie option builders (`SameSite`, `Secure`, `Partitioned`)
- `apps/api/src/supabase-auth.guard.ts` — Extracts token from cookie or Bearer header on every request
- `apps/api/src/user-access.service.ts` — Role grant/revoke, last-admin protection
- `apps/api/src/invites.service.ts` — Invite lifecycle, Resend API email sending

**Frontend:**
- `apps/web/src/stores/auth.ts` — `isAuthenticated`, `authReady`; login/logout/refresh actions
- `apps/web/src/stores/user.ts` — `currentUser` ref (includes `role`)
- `apps/web/src/api/client.ts` — Axios instance; request interceptor injects Bearer token; response interceptor handles 401 → auto-refresh
- `apps/web/src/router/index.ts` — Route guards (auth check + `requiredRoles` meta enforcement)
- `apps/web/server.js` — Custom Node HTTP server for SPA; serves `dist/`, falls back to `index.html`

---

### **Environment Variables (Production)**

**API service (Railway):**
| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection |
| `SUPABASE_URL` | ✅ | Email OTP issuer |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase admin operations |
| `JWT_SECRET` | ✅ | Present but not actively used (Supabase JWT is verified via JWKS) |
| `RESEND_API_KEY` | ✅ | Invite email sending |
| `INVITE_FROM_EMAIL` | ✅ | Sender address for invite emails |
| `INVITE_LOGIN_URL` | ✅ | Login URL embedded in invite emails — must match deployed web domain |
| `AUTH_ADMIN_EMAILS` | optional | Comma-separated emails that bypass invite requirement and auto-get admin role |
| `DEFAULT_ORGANIZATION_NAME` | optional | Org name used on first seed (default: "Friend Helper Outreach") |
| `NODE_ENV` | ✅ | Set to `production` on Railway — controls cookie security policy |

**Web service (Railway):**
| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_API_URL` | ✅ | Full URL of the API service |

---

### **Deployment**

- **Branch:** `main` → auto-deployed to Railway on push
- **API start command:** `prisma migrate deploy && node dist/main.js` (runs migrations on every deploy)
- **Web start command:** `node server.js` (custom SPA server, serves `dist/` with history fallback)
- **Web build:** `vue-tsc -b && vite build`

---

### **Starting a New Dev Session**

Useful reference docs (in order):
1. `docs/MVP-Architecture.md` — current system design
2. `docs/decisions/` — why key decisions were made
3. `docs/CurrentState.md` (this file) — current operational state, known issues, env vars