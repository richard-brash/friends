# ADR-002: Role Storage — Junction Table Instead of ENUM Column

**Status:** Accepted  
**Date:** ~March 31, 2026  
**Commit:** `d8aa7b7`

---

## Context

The original architecture specified a single `role` ENUM column (`admin | manager | volunteer`) directly on the `users` table. Before implementing the full user access management feature, we reconsidered this design.

Key questions:
- Can a user have more than one role? (e.g. an admin who also acts as a manager)
- Do we want to be able to add new roles without a schema migration?
- Can we track when a role was assigned and by whom?

## Decision

We replaced the single `role ENUM` column on `users` with a **junction table** structure:

- `roles` table — canonical role definitions (currently: `admin`, `manager`, `volunteer`)
- `user_roles` table — many-to-many join between `users` and `roles`
- A unique constraint on `(user_id, role_id)` prevents duplicate assignments

For all current authorization logic, the system resolves a user's **effective role** by taking the highest-privilege role they hold (admin > manager > volunteer). This resolved role is embedded in the JWT claim and used by all guards.

## Consequences

**Positive:**
- A user can hold multiple roles without a schema migration
- New roles can be added to the `roles` table without altering `users`
- Role assignment timestamps provide a lightweight audit trail
- The grant/revoke API naturally maps to INSERT/DELETE on `user_roles`

**Negative:**
- Every auth request requires a JOIN (or a cached lookup) to resolve the effective role
- The concept of "one role per user" that the original architecture assumed is now handled in application logic, not schema enforcement
- Tests and guards need to account for role resolution logic, not just a direct column value

## Alternatives Considered

- **ENUM column on users** — dismissed; no multi-role support, schema migration required to add roles, no assignment history
- **JSONB roles array on users** — considered; avoids the join but makes indexing and integrity harder
- **Single role per user, enforced by constraint** — considered; simpler but precludes realistic scenarios where one person covers multiple functions
