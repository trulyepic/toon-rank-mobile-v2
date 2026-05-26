# Mobile Session Strategy

This document describes how the Toon Ranks mobile app authenticates users and manages
sessions. It covers the two active auth paths, the refresh-token strategy, and the
narrower role the web-auth bridge now plays.

---

## Auth paths

### 1. Native username / password (primary)

The app submits credentials directly to the backend without opening a browser.

```
User fills form → reCAPTCHA v2 (WebView modal, invisible for most users)
  → POST /auth/login  { username, password, captcha_token }
  → { access_token, refresh_token, user }
  → stored in expo-secure-store via AuthProvider.setSession()
```

Signup follows the same pattern via `POST /auth/signup`, which returns a
`{ message, token }` response — the user must verify their email before their
first login.

The reCAPTCHA sitekey (`EXPO_PUBLIC_RECAPTCHA_SITE_KEY`) is the same public key
used on the Toon Ranks website — no separate mobile key is needed.

### 2. Native Google Sign-In (primary)

```
User taps "Continue with Google"
  → GoogleSignin.signOut()  (clears cache so picker always appears)
  → GoogleSignin.signIn()   (native Google account picker)
  → ID token extracted from result
  → POST /auth/google-oauth  { token, signup_platform: "mobile" }
  → { access_token, refresh_token, user }
  → stored via AuthProvider.setSession()
```

Google Sign-In is configured once at app startup in `App.tsx` via
`GoogleSignin.configure()`. Client IDs are read from `.env` — see `.env.example`
for the required variable names.

The backend `POST /auth/google-oauth` handles both new and returning Google
accounts in one endpoint, so the same button and flow works for both login and
signup screens.

### 3. Web-auth bridge (limited use only)

The original auth flow opened an in-app browser pointing at the Toon Ranks login
page, which handled reCAPTCHA, then redirected back to `toonranks://auth/callback`
with a short-lived code the app exchanged for a session.

This flow is **no longer used for login or signup**. It remains available for two
edge cases that still require a browser step:

| Use case           | Trigger                                  |
| ------------------ | ---------------------------------------- |
| Forgot password    | "Forgot password?" link on `LoginScreen` |
| Email verification | Future: Phase 16 deep-link redirect      |

The bridge lives in `src/auth/webAuthBridge.ts`. `WEB_AUTH_URLS.login` and
`.signup` have been removed — only `WEB_AUTH_URLS.forgotPassword` remains.

---

## Session storage

All session data is stored with `expo-secure-store` via `AuthProvider`:

| Key             | Value                                                             |
| --------------- | ----------------------------------------------------------------- |
| `access_token`  | Short-lived JWT sent as `Authorization: Bearer` on every API call |
| `refresh_token` | Long-lived token (~30 days) used to obtain new access tokens      |
| `user`          | Snapshot of `AuthUser` (id, username, role, avatar)               |

On app launch, `AuthProvider` reads the stored session and restores signed-in
state without prompting the user again.

---

## Token refresh

When an authenticated API call returns `401`, the session event bus fires
`SESSION_EXPIRED`. `AuthProvider` catches this and:

1. Calls `POST /auth/mobile-refresh  { refresh_token }` to get a new `access_token`
2. Stores the new token and continues
3. If the refresh also fails (expired or revoked), the session is cleared and the
   user is returned to the signed-out state

Only one refresh attempt runs at a time (`isRefreshingRef`) to prevent duplicate
calls under concurrent request failures.

---

## Logout

`AuthProvider.logout()`:

1. Calls `POST /auth/mobile-logout  { refresh_token }` to revoke the token on the backend
2. Calls `GoogleSignin.signOut()` to clear the cached Google session (ensures the
   account picker appears on the next Google sign-in rather than auto-signing in)
3. Clears `expo-secure-store`
4. Resets all in-memory auth state

---

## Google OAuth credentials

Three OAuth 2.0 client IDs are required — see `.env.example` for variable names:

| Client               | Purpose                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| iOS                  | Passed to `GoogleSignin.configure({ iosClientId })`                                            |
| Android (production) | Registered in Google Cloud Console for the EAS release keystore SHA-1                          |
| Android (debug)      | Registered in Google Cloud Console for the local debug keystore SHA-1                          |
| Web                  | Passed to `GoogleSignin.configure({ webClientId })` — the backend verifies tokens against this |

Android client IDs are **not** referenced in app code. Google matches them
automatically by package name + signing certificate SHA-1. Both the debug and
production Android clients must exist in Google Cloud Console for development
and store builds to work respectively.

> **Note:** If the `android/` directory is deleted and regenerated by Expo,
> copy `~/.android/debug.keystore` to `android/app/debug.keystore` before
> testing Google Sign-In on Android. Expo generates a new random keystore on
> each fresh prebuild.
