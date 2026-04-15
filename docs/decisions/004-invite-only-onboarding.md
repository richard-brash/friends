# ADR-004: Onboarding — Invite-Only Registration

**Status:** Accepted  
**Date:** ~March 31, 2026  
**Commit:** `d8aa7b7`

---

## Context

The app handles sensitive information about vulnerable individuals. Open self-registration (anyone with the app URL can create an account) is not appropriate for a trust-based outreach coordination tool. We needed a way to control who can join an org.

## Decision

We implemented **invite-only registration**:

1. An admin or manager sends an invite to an email address from the Settings page
2. The invitee receives an email with a login link
3. When the invitee uses that email to authenticate, the API marks the invite as ACCEPTED and provisions their user record and org membership

Users who attempt to authenticate with an email that has no pending invite (and are not listed in `AUTH_ADMIN_EMAILS`) receive an error at the `POST /auth/request-email-code` step.

### Bootstrap path: `AUTH_ADMIN_EMAILS`

A comma-separated env var (`AUTH_ADMIN_EMAILS`) lists email addresses that bypass the invite requirement and are automatically provisioned with the `admin` role. This allows the first admin to bootstrap an org without a chicken-and-egg problem.

### Invite lifecycle

`PENDING` → `SENT` → `ACCEPTED` (or `EXPIRED` or `REVOKED`)

- Admins and managers can send, resend, and cancel invites
- Accepted invites are retained for audit purposes
- Invites can be removed (soft delete) after acceptance

## Consequences

**Positive:**
- Only explicitly invited individuals can join — no open registration attack surface
- Invite table provides a lightweight audit trail of who was invited by whom
- Invite resend + cancel gives admins full control without DB access
- Bootstrap path (AUTH_ADMIN_EMAILS) is simple and secure — set in env, not in code

**Negative:**
- Every new user requires manual action from an admin or manager
- If `INVITE_LOGIN_URL` is misconfigured, invite emails link to the wrong place
- Lost or expired invite emails require admin to resend manually
- `AUTH_ADMIN_EMAILS` is plain text in Railway env vars — not a secret, but should be managed carefully

## Alternatives Considered

- **Open registration with org code** — dismissed; shareable codes are hard to revoke and create an uncontrolled access surface
- **Admin-creates-user directly** — considered; less friction for the admin, but deprives the new user of choosing their own identity/email flow
- **OAuth-based "request to join"** — dismissed; too much complexity for MVP, and we moved away from OAuth (see ADR-001)
