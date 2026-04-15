# ADR-005: User Memberships — Separate Table From Roles

**Status:** Accepted  
**Date:** ~March 31, 2026  
**Commit:** `d8aa7b7` (table added), `20260331180000_backfill_user_memberships` (backfill)

---

## Context

When we added the role junction table (ADR-002), we had two related but distinct concerns:

1. **Role** — what is this user allowed to do? (admin vs manager vs volunteer)
2. **Membership** — is this user currently an active member of this org?

These are separate questions. A user could have their org access suspended (inactive membership) while retaining their role record. Or an invite could be created for a role before the user has a confirmed account.

## Decision

We created a separate `user_memberships` table with its own `status` column (`active` / `inactive`), distinct from `user_roles`.

- **`user_roles`** — governs feature access and permission checks
- **`user_memberships`** — governs whether a user can log in at all

On invite acceptance, both are provisioned:
1. A `user_roles` row is created for the invited role
2. A `user_memberships` row is created with `status: 'active'`

A backfill migration (`20260331180000_backfill_user_memberships`) created membership rows for all existing users at the time of deployment.

## Consequences

**Positive:**
- Access suspension (deactivate membership) can be done without touching role assignments
- Role changes don't affect active membership status
- Clean semantic separation between "what you can do" and "whether you're in"
- Membership provides a future hook for per-org subscription management if needed

**Negative:**
- Two tables must be kept in sync for normal flows (invite acceptance, user removal)
- Direct DB edits to one table without updating the other will create inconsistencies
- Currently no automated reconciliation or integrity check between the two tables

## Alternatives Considered

- **`is_active` boolean on `users`** — dismissed; not org-scoped (a user could be active in one org but not another in a multi-org future)
- **`status` column on `user_roles`** — considered; conflates role assignment with membership, makes it harder to suspend a user while preserving their role for reinstatement
- **Soft-delete the user** — dismissed; loses history, harder to reinstate
