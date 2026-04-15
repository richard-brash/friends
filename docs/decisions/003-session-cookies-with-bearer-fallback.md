# ADR-003: Session Management — httpOnly Cookies + Bearer Token Fallback

**Status:** Accepted  
**Date:** April 2–15, 2026  
**Commits:** `d8aa7b7`, `5e28237`, `f9e7b57`, `4d06eb8`

---

## Context

When we implemented auth (ADR-001), we needed to decide how to persist the session token on the client side. The options are:

1. **localStorage / sessionStorage** — simple, but accessible to JavaScript (XSS risk)
2. **httpOnly cookie** — not accessible to JavaScript, automatically sent with requests
3. **In-memory only** — most secure, but lost on page refresh

Additionally, our production deployment on Railway uses two separate subdomains (web and API), which creates cross-origin cookie complexity.

## Decision

We use **httpOnly cookies as the primary session transport**, with a **Bearer token in sessionStorage as a defense-in-depth fallback** for environments where cookies are blocked.

### Primary path: httpOnly cookies
- On successful OTP verification, the API sets two httpOnly cookies:
  - `fh_access_token` — short-lived Supabase JWT
  - `fh_refresh_token` — longer-lived Supabase refresh token
- All Axios requests set `withCredentials: true`
- The API guard extracts the token from the `Cookie` header first

### Fallback path: Bearer token via sessionStorage
- The `POST /auth/verify-email-code` response body also includes `{ accessToken }` 
- The frontend stores this in sessionStorage as `fh_access_token_fallback`
- The Axios request interceptor always injects an `Authorization: Bearer <token>` header from the stored value
- The API guard falls back to the `Authorization` header if no cookie is found
- On token refresh, the response body also returns the new token so sessionStorage stays current
- On logout or failed refresh, the stored token is explicitly cleared

### Cookie policy
- **Development:** `SameSite=Lax; HttpOnly`
- **Production:** `SameSite=None; Secure; Partitioned` (required for cross-origin Railway deployment)

## Why Both?

`SameSite=None` cookies are supported broadly, but some mobile browsers and WebViews block third-party cookies regardless of `SameSite`. The Bearer fallback ensures those environments still work without any user-facing degradation. The security profile of sessionStorage Bearer tokens is acceptable here because:
- They are scoped to the tab/session
- The token is a short-lived JWT signed by Supabase
- The app is already accessible only to invited users

## Consequences

**Positive:**
- httpOnly cookies protect against XSS token theft
- Bearer fallback ensures compatibility across all browser environments
- The server-side guard handles both transparently — controllers don't need to know which path was used
- Works correctly across Railway's cross-origin web/API deployment

**Negative:**
- Two token stores to keep in sync (cookie + sessionStorage)
- `SameSite=None; Partitioned` required in production — if not set correctly, production auth silently fails
- The `NODE_ENV=production` check in `auth.constants.ts` must match Railway's env var settings exactly
- Fallback path relies on the API consistently returning `accessToken` in the response body

## Alternatives Considered

- **localStorage Bearer token** — dismissed; accessible to JavaScript (XSS risk), persists across sessions unexpectedly
- **httpOnly cookies only** — considered; blocked by some mobile WebViews in cross-origin scenarios
- **In-memory only** — considered; token lost on page refresh, bad UX in a PWA
- **Supabase client SDK on frontend** — dismissed; introduces a Supabase JS dependency on the client and duplicates the auth logic we already have on the API side
