# Mobile Session Strategy

This document captures the Toon Ranks mobile session plan after the first real mobile login bridge.

## Current State

- Mobile login uses the production website CAPTCHA flow.
- The website returns a short-lived mobile auth code to `toonranks://auth/callback`.
- The app exchanges that code with the backend for the normal Toon Ranks JWT/user response.
- The app stores the JWT/user in `expo-secure-store`.
- The backend access token currently expires after about 3 days.

This is enough for a working first login, but it is not the final mobile session model.

## Target Mobile Behavior

Mobile users should stay signed in for roughly 30 days, which is consistent with normal app
expectations. They should only be asked to log in again when:

- they manually log out,
- the refresh session expires,
- the backend rejects/revokes the session,
- their account state changes in a way that invalidates access,
- or a security-sensitive backend change requires a fresh login.

## Preferred Architecture

Use the standard access-token plus refresh-token pattern:

- Access token: short-lived JWT used on API requests.
- Refresh token: longer-lived opaque token stored securely on the phone.
- Mobile app silently refreshes the access token before or after expiry.
- Backend can revoke refresh tokens without waiting for a long-lived JWT to expire.

Avoid simply extending the current JWT to 30 days. That would work mechanically, but it gives the
backend less control if a token needs to be invalidated.

## First Safety Net Implemented

Until refresh tokens exist, the app must fail cleanly when a stored token is no longer accepted.

The mobile API client now treats authenticated `401` and `403` responses as session-expired events.
`AuthProvider` responds by clearing secure storage and returning the app to a signed-out state.

The app intentionally does not clear auth state for unauthenticated `401` responses, such as a failed
web/mobile login attempt.

## Future Refresh-Token Contract

Suggested backend work:

- Add a `mobile_refresh_tokens` table with hashed token storage.
- Include device/session metadata, issued time, expiry time, revoked time, and last-used time.
- Return `refresh_token` plus `access_token` from `/auth/mobile-token`.
- Add `POST /auth/mobile-refresh` to exchange refresh token for a new access token.
- Add `POST /auth/mobile-logout` or reuse logout semantics to revoke the current refresh token.
- Start with a 30-day refresh token lifetime.

Suggested mobile work:

- Store `refresh_token` in `expo-secure-store` beside the access token and user snapshot.
- On app launch, try a refresh when the access token is missing or rejected.
- On authenticated `401`, attempt refresh once before clearing the session.
- Clear both access and refresh tokens on logout or refresh failure.

## UX Rules

- A signed-in user should not see stale signed-in UI after the backend rejects the token.
- The app should show a clear "Session expired. Please log in again." style message when possible.
- Normal failed login/signup errors should stay local to the auth screen and should not clear an
  unrelated stored session unless the failing request used that stored session.
