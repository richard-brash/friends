# ADR-001: Authentication — Supabase Email OTP

**Status:** Accepted  
**Date:** ~March 31, 2026  
**Commit:** `d8aa7b7`

---

## Context

The original MVP-Architecture.md specified Google OAuth for authentication. Before field testing began, we assessed whether OAuth was the right fit for our user base:

- Users are community volunteers and coordinators, many of whom may not have or prefer to use a Google account
- The app is invite-based — users are known, trusted individuals being brought in by an admin
- The onboarding flow needed to tie an invite email to an account creation without requiring a third-party identity provider
- We were already using Supabase as our backend-as-a-service, which supports Email OTP natively

## Decision

We replaced Google OAuth with **Supabase Email OTP** (magic code, no passwords).

1. User enters their email address
2. Supabase sends a one-time code to that email
3. User enters the code → API verifies it with Supabase, creates/links the local user record, resolves their org role, and sets an httpOnly session cookie

The login URL is also embedded in invite emails so new users can click a link and land on the login page with their email pre-filled.

## Consequences

**Positive:**
- No Google account required
- No passwords to manage or hash
- Supabase handles OTP delivery and expiry
- Invite email → login link → OTP → account creation is a single seamless flow
- Works for any email address, not just Google

**Negative:**
- Users need access to their email to log in (no offline login)
- OTP codes expire, so users need to act promptly
- Requires reliable email delivery (dependent on Supabase transactional email)

## Alternatives Considered

- **Google OAuth** — dismissed; not all users have or want to use a Google account
- **Password-based auth** — dismissed; password reset flows and hashing add complexity without benefit for an invite-only system
- **SMS OTP** — considered; deferred as optional future channel (invite table supports `channel: 'sms'` already)
