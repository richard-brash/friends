## Application State Summary

**Last Updated:** April 3, 2026 | **Current Commit:** `5e28237` (main)

---

### **Project Overview**

Friend Helper is an MVP outreach coordination system for tracking people encountered during outreach, recording their needs, and managing fulfillment workflows. **Target users:** field volunteers, warehouse managers, admin coordinators.

**Status:** In real-world field testing. MVP v0.1 with role-based access and invite-based onboarding just deployed to Railway.

---

### **Architecture**

**Stack:**
- **Frontend:** Vue 3 (PWA, mobile-first) + TypeScript + Tailwind CSS + Axios
- **Backend:** NestJS + TypeScript + Prisma v6 ORM
- **Database:** PostgreSQL (managed on Railway)
- **Auth:** Supabase Email OTP (no OAuth currently)
- **Hosting:** Railway (web + API services, single PostgreSQL instance)

**Design Principles** (from MVP-Architecture.md):
1. Person-centric (organized around "Friends"/people encountered)
2. Lifecycle integrity (append-only fulfillment events, no hard deletes)
3. Mobile-first (field-driven UX)
4. Multi-tenant (org-scoped data)
5. Minimal surface area (no speculative features)

---

### **Database Schema** (key entities)

Recent additions for role management:

| Table | Purpose |
|-------|---------|
| `organizations` | Org tenant root |
| `users` | System users (volunteers/managers/admins) |
| `user_roles` | Many-to-many role assignment (`admin`, `manager`, `volunteer`) |
| `user_memberships` | Org membership + status tracking (active/inactive) |
| `invites` | Email-based org invitations (status: PENDING/SENT/ACCEPTED/EXPIRED/REVOKED) |
| `roles` | Role definitions (admin/manager/volunteer) |
| `people` | "Friends" individuals encountered (separate from system users) |
| `requests` | Items needed by a person |
| `encounters` | Outreach interactions with people |
| `locations` | Warehouse/field locations |
| `routes` | UI grouping of locations for delivery runs |
| `quick_pick_items` | Preset item templates for fast request entry |

---

### **Recent Changes** (commits d8aa7b7 + 5e28237)

**Commit d8aa7b7:** "Add invite auth and user access management"
- **Authentication overhaul:** Switched from Supabase OAuth to email OTP (Resend API)
- **Role system:** Implemented multi-role support (`admin`, `manager`, `volunteer`) via `user_roles` table
- **User memberships:** Added `user_memberships` for org-scoped status tracking
- **Invites feature:** Built full invite workflow (send → SENT → ACCEPTED) in Settings UI
- **User Access settings:** Added Settings → User Access section for admins to grant/revoke roles
- **Cookie-based auth:** Sessions now use httpOnly cookies (`fh_access_token`, `fh_refresh_token`) instead of Bearer tokens
- **Bootstrap admins:** Added `AUTH_ADMIN_EMAILS` env var for provisioning initial admins without invites

**Files added:**
- `auth.constants.ts`, `auth.controller.ts`, `auth.service.ts` (expanded)
- `invites.controller.ts`, `invites.service.ts`
- `user-access.controller.ts`, `user-access.service.ts`
- Web: `api/invites.ts`, `api/userAccess.ts`
- Prisma migrations: `20260331175807_add_invites_and_membership`, `20260331180000_backfill_user_memberships`

**Commit 5e28237:** "Fix production auth cookies for cross-origin Railway"
- Changed cookie `SameSite` from `lax` to `none` for production (allows cross-origin web/API)
- Ensures cookies sent between railway web subdomain and railway API subdomain

---

### **Known Issues / Bugs**

1. **Cross-Origin Cookie Transport (partly fixed)**
   - Issue: Production auth failing with 401 + refresh 400 (missing refresh token)
   - Root: Cookies not being sent cross-domain (web ≠ API domain)
   - Fix applied: `SameSite=None; Secure` in production
   - **Status:** Deployed, awaiting user confirmation after browser cache clear

2. **Role Resolution Hierarchy**
   - System resolves multiple roles to single `role` field in JWT context (admin > manager > volunteer)
   - May cause issues if granular multi-role checks needed (currently only single role used in guards)
   - Current guard usage: `@Roles('admin', 'manager')` checks if user's singular role is in list

3. **Membership vs Role Separation**
   - Both `user_roles` and `user_memberships` track org relationship 
   - Could become inconsistent if not kept in sync during role/membership changes
   - Membership status controls login permissions; role controls feature access

4. **Invite Email Dependency**
   - `RESEND_API_KEY` required in production; if missing, invite send fails silently
   - No graceful fallback if email service down
   - `INVITE_LOGIN_URL` must match deployed web domain or invite links redirect to wrong place

5. **Last Admin Protection Incomplete**
   - User access controller prevents removing last admin from org
   - But no protection if admin role revoked via bulk replace
   - Edge case: direct DB tampering or script errors could orphan orgs

6. **Auth Flow State Management**
   - Frontend `authReady` + `isAuthenticated` flags in separate stores
   - No explicit logout flow cleanup in all cases
   - Route guards check `currentUser.value?.role` but if user loads before auth ready, guard may fail

---

### **Current Feature Set**

**Deployed & Working:**
- ✅ Dashboard (route view + needs queue)
- ✅ Encounter creation (location + notes)
- ✅ Request/Need tracking (REQUESTED → PREPARING → READY → DELIVERED)
- ✅ Delivery attempts logging
- ✅ Quick-pick item templates
- ✅ Help guides (stored in docs/)

**Recently Added & In Testing:**
- ✅ Email OTP login (replace OAuth)
- ✅ Invite-based onboarding
- ✅ Role-based access control (admin/manager/volunteer)
- ✅ Settings panel (quick-pick, invites, user access management)
- ⚠️ Production auth cookies (cross-origin fix deployed, unconfirmed)

**Not Yet Implemented:**
- Analytics dashboards
- Inventory management
- Cross-org matching
- SMS invites
- Hard deletes
- Audit logging

---

### **Critical Service Files**

**Backend:**
- `/apps/api/src/auth.service.ts` — Supabase JWT verification, role resolution, bootstrap admin provisioning
- `/apps/api/src/supabase-auth.guard.ts` — Request authentication (JWT or cookie-based token extraction)
- `/apps/api/src/user-access.service.ts` — Role grant/revoke, last-admin checks
- `/apps/api/src/invites.service.ts` — Email invite lifecycle, Resend API integration

**Frontend:**
- `/apps/web/src/stores/auth.ts` — Session state (isAuthenticated, authError)
- `/apps/web/src/stores/user.ts` — Current user + role info (currentUser)
- `/apps/web/src/api/client.ts` — Axios instance with auto-refresh interceptor
- `/apps/web/src/router/index.ts` — Route guards (auth + role checks)

---

### **Environment Variables (Production Critical)**

**API Required:**
- `DATABASE_URL` 
- `SUPABASE_URL` (Email OTP issuer)
- `SUPABASE_SERVICE_ROLE_KEY` (Supabase admin token for user creation)
- `JWT_SECRET` (local token signing, not used with Supabase JWT)
- `RESEND_API_KEY` (email service for invites)
- `INVITE_FROM_EMAIL` (sender address)
- `INVITE_LOGIN_URL` (link in invite emails, should point to deployed web domain)
- `AUTH_ADMIN_EMAILS` (optional, comma-separated bootstrap admins)

**Web Required:**
- `VITE_API_URL` (backend API domain)

---

### **Git Branches & Deployment**

- **main** — Production branch, auto-deployed to Railway
- **Last deploy:** Commit `5e28237` (auth cookie fix)
- **Next required:** User testing + bug fixes before next deploy

---

### **To Begin Bug Fixing:**

1. **Identify exact failures** — reproduce the 401 issue locally (check browser DevTools Network tab during login)
2. **Verify cookie flow** — confirm `Set-Cookie` headers in `/auth/verify-email-code` response and `Cookie` headers in subsequent requests
3. **Test role-based access** — verify Settings page access (admin/manager only), endpoint guarding, and role resolution
4. **Check multi-step flows** — invite send → email → login with invited email → role assignment → Settings access
5. **Validate backwards compatibility** — ensure existing volunteer workflows still function