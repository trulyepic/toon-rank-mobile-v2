# Toon Ranks Mobile Auth Contract

This document defines the first real mobile authentication handoff for Toon Ranks. The goal is to let
the native app use the existing CAPTCHA-protected website login/signup flow without leaving users
signed in only on the website.

## Current State Verified

Backend:

- `POST /auth/login` requires `captcha_token` and returns `{ access_token, user }`.
- `POST /auth/signup` requires `captcha_token`, creates an unverified account, sends verification
  email, and does not return a signed-in JWT session.
- `POST /auth/google-oauth` returns `{ access_token, user }` after Google ID token verification.
- JWT user shape includes `id`, `username`, and `role`; current user serialization also includes
  avatar fields.

Web frontend:

- `/login` and `/signup` currently ignore `mobile`, `redirect_uri`, and `state` query params.
- Successful web login stores the JWT/user in browser local storage and navigates to `/`.
- Successful web signup navigates to the check-email flow.
- This is why the current mobile bridge can open the web login, but cannot return a real app session.

Mobile:

- The app has `AuthProvider`, secure token/user storage, and an API client auth header helper.
- The app opens website auth in an Expo auth browser session.
- The app already has a planned callback URL: `toonranks://auth/callback`.
- The callback parser recognizes a successful `code`, callback errors, unrelated URLs, and missing
  code returns.

## Contract V1

Use a short-lived one-time mobile auth code.

The website remains responsible for the existing CAPTCHA step. The mobile app never receives the web
JWT through the URL. Instead, after successful web login, the website asks the backend for a one-time
mobile code and redirects back to the app. The app exchanges that code directly with the backend for
the normal Toon Ranks JWT/user response.

## Mobile Entry URLs

The mobile app opens:

```text
https://www.toonranks.com/login?mobile=1&redirect_uri=toonranks%3A%2F%2Fauth%2Fcallback&state=<random-state>
```

or:

```text
https://www.toonranks.com/signup?mobile=1&redirect_uri=toonranks%3A%2F%2Fauth%2Fcallback&state=<random-state>
```

Rules:

- `state` must be generated per auth attempt and checked on callback.
- `redirect_uri` must exactly match the allowed mobile callback:
  `toonranks://auth/callback`.
- Web login/signup must preserve these params through form submission.

## Backend Endpoints To Add

### Create Mobile Code

```http
POST /auth/mobile-code
Authorization: Bearer <web-login-jwt>
Content-Type: application/json
```

Request:

```json
{
  "redirect_uri": "toonranks://auth/callback",
  "state": "random-state-from-mobile"
}
```

Response:

```json
{
  "code": "one-time-mobile-code",
  "expires_in": 300,
  "redirect_url": "toonranks://auth/callback?code=one-time-mobile-code&state=random-state-from-mobile"
}
```

Behavior:

- Requires a valid web JWT from the user who just logged in.
- Validates `redirect_uri` against an allowlist.
- Creates a high-entropy one-time code.
- Stores only a hashed code or an equivalent server-side one-time record.
- Expires the code after 5 minutes.
- Returns a redirect URL that the web frontend can assign to `window.location.href`.

### Exchange Mobile Code

```http
POST /auth/mobile-token
Content-Type: application/json
```

Request:

```json
{
  "code": "one-time-mobile-code"
}
```

Response:

```json
{
  "access_token": "normal-toon-ranks-jwt",
  "user": {
    "id": 123,
    "username": "reader",
    "role": "GENERAL",
    "avatar_url": null,
    "avatar_preset": "blue"
  }
}
```

Behavior:

- Rejects missing, invalid, expired, or already-used codes.
- Marks valid codes as used before returning the JWT.
- Returns the same session shape as normal login.
- Does not require CAPTCHA because CAPTCHA was already completed by the web login.

## Web Frontend Changes

Login page:

1. Parse `mobile`, `redirect_uri`, and `state` from the query string.
2. Run the existing login flow normally.
3. If the login is not mobile, keep the current `navigate("/")` behavior.
4. If `mobile=1` and `redirect_uri` is allowed:
   - call `POST /auth/mobile-code` with the newly received web JWT
   - redirect browser to the backend-provided `redirect_url`
5. If code creation fails, show a clear error and do not redirect to `/`.

Signup page:

1. Parse the same mobile query params.
2. Run the existing signup flow normally.
3. If signup is not mobile, keep the current check-email navigation.
4. If signup is mobile, redirect to:

```text
toonranks://auth/callback?error=email_verification_required&error_description=Please%20verify%20your%20email%20then%20log%20in&state=<state>
```

Reason: username/password signup does not create a signed-in session until email verification.

Google OAuth:

- When Google login succeeds on the website and has a web JWT, it can use the same
  `/auth/mobile-code` handoff.
- Native Google OAuth can be added later as a separate app-store-ready flow.

## Mobile App Changes

1. Generate a random `state` before opening the auth session.
2. Include that state in the web login/signup URL.
3. Confirm returned callback state matches the pending auth attempt.
4. On `toonranks://auth/callback?code=...`, call `POST /auth/mobile-token`.
5. Store returned JWT/user through `AuthProvider` and `expo-secure-store`.
6. Call `setApiAuthToken(access_token)`.
7. Return the user to the account/profile surface or the screen that required login.
8. On `email_verification_required`, show the existing Check Email screen.
9. On callback error, show the backend/web error message and leave the user signed out.

## Security Rules

- Never place a long-lived JWT in a deep link or browser redirect URL.
- Only allow known redirect URIs; first allowed URI is `toonranks://auth/callback`.
- Use short expiry for auth codes; 5 minutes is the starting value.
- Make codes one-time use.
- Store code records server-side or use an equivalent one-time-use mechanism.
- Rate limit code creation and exchange.
- Preserve and validate `state` to prevent stale or cross-request callbacks.
- Keep normal web login/signup behavior unchanged when mobile params are absent.

## Failure Cases

- Invalid redirect URI: web shows an error and does not redirect.
- User cancels browser auth: mobile remains signed out.
- Signup requires verification: mobile shows Check Email.
- Code expired or already used: mobile asks the user to log in again.
- Token exchange returns `401` or `403`: mobile clears any partial session and stays signed out.

## Test Plan

Backend tests:

- Create mobile code with valid web JWT.
- Reject code creation without auth.
- Reject invalid redirect URI.
- Exchange code for normal JWT/user shape.
- Reject reused code.
- Reject expired code.
- Reject unknown code.

Web tests:

- Non-mobile login still navigates to `/`.
- Mobile login calls `/auth/mobile-code` and redirects to the returned deep link.
- Mobile signup redirects with `email_verification_required`.
- Missing or invalid mobile params do not break normal login/signup.

Mobile tests:

- Generates and preserves state.
- Handles success callback with code.
- Rejects mismatched state.
- Exchanges code and stores session.
- Handles email-verification callback.
- Handles callback errors and canceled browser sessions.

## Implementation Branches

Recommended order:

1. `backend-mobile-auth-code`
   Add `/auth/mobile-code`, `/auth/mobile-token`, storage, validation, and backend tests.
2. `frontend-mobile-auth-redirect`
   Update web login/signup/Google success paths to honor mobile params.
3. `mobile-auth-code-exchange`
   Add state generation, token exchange, secure session storage, and signed-in UI handoff.

Do not enable voting, reading lists, forum hearts, or forum posting until this contract is complete
and the app can store a real Toon Ranks session.
