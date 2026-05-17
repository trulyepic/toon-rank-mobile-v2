# Toon Ranks Mobile Auth Plan

This plan documents how mobile authentication should be added without splitting identity from the
production Toon Ranks website. The mobile app should use the same backend accounts, reading lists,
forum identity, votes, and future user data.

## Current Backend Contract

The mobile app already has typed API wrappers for the existing backend auth routes:

- `POST /auth/login`
- `POST /auth/signup`
- `POST /auth/google-oauth`
- `GET /auth/verify-email`
- `POST /auth/resend-verification`

Successful login and Google OAuth responses return:

```ts
{
  access_token: string;
  user: {
    id: number;
    username: string;
    role: string;
  }
}
```

Signup returns:

```ts
{
  message: string;
  token: string;
}
```

Both username/password login and signup currently require a `captcha_token`. Google OAuth requires a
Google ID token and returns the same session shape as login.

## Secure Storage Decision

Use `expo-secure-store` for access-token persistence.

Reasons:

- It is the Expo-native package intended for sensitive key/value storage.
- It maps to platform secure storage instead of plain AsyncStorage.
- It is lightweight enough for this app's current auth needs.

Do not store access tokens in AsyncStorage. React state can hold the active session at runtime, but it
must be restored from secure storage on app start.

Suggested package:

```powershell
npx expo install expo-secure-store
```

## Auth State Shape

Add an `AuthProvider` later with this minimum state:

```ts
type AuthStatus = "loading" | "signed_out" | "signed_in";

type AuthState = {
  status: AuthStatus;
  token: string | null;
  user: AuthUser | null;
};
```

The provider should expose:

- `login(payload)`
- `signup(payload)`
- `loginWithGoogle(payload)`
- `logout()`
- `refreshSessionFromStorage()`

When a token is loaded or received, call `setApiAuthToken(token)` from `src/api/client.ts`. When the
user logs out, remove the token from secure storage and call `setApiAuthToken(null)`.

## App Startup Flow

1. App boots.
2. `AuthProvider` reads the token from `expo-secure-store`.
3. If no token exists, set status to `signed_out`.
4. If a token exists, call `setApiAuthToken(token)`.
5. Because the backend does not currently expose `/auth/me`, use the stored user snapshot if saved
   with the token, or add a backend profile endpoint before relying on restored user details.
6. Set status to `signed_in` only when the app has a token and usable user identity.

Recommended storage keys:

- `toonranks.authToken`
- `toonranks.authUser`

## Expiry And Invalid Token Handling

The backend currently returns JWT access tokens, but mobile does not yet have a refresh-token flow.
Until refresh exists:

- Treat `401` and auth-related `403` responses from account-backed routes as session-expired states.
- Clear secure storage.
- Call `setApiAuthToken(null)`.
- Move the app back to signed-out state.
- Show a concise "Please log in again" message.

Do not silently retry login. Do not keep using a token after the API rejects it.

Future improvement:

- Add a backend refresh-token flow before implementing long-lived mobile sessions.

## Captcha And Mobile Signup/Login

The existing backend requires `captcha_token` for username/password signup and login. Before building
the final mobile login/signup screens, confirm the mobile reCAPTCHA approach.

Likely options:

- Use an in-app browser/web auth session for captcha-backed web flow.
- Add a mobile-friendly captcha provider path.
- Add backend support for a mobile app attestation flow later.

Do not hardcode a fake captcha token in production code. Temporary local-only dev bypasses must stay
out of committed app code.

## Google OAuth Path

Mobile Google sign-in needs a real native OAuth implementation before `POST /auth/google-oauth` can be
used.

Expected direction:

- Use Expo AuthSession or Google Sign-In tooling compatible with the final Expo workflow.
- Configure iOS and Android OAuth clients in Google Cloud.
- Send the returned Google ID token to `/auth/google-oauth`.
- Store the returned Toon Ranks JWT and user object through `AuthProvider`.

Open decisions before implementation:

- Confirm final bundle identifiers for iOS and Android.
- Confirm whether the app will stay managed Expo or move to prebuild/EAS native config.
- Confirm Google OAuth client IDs and redirect scheme.

## Navigation Plan

Keep public browsing available while signed out.

Signed-out users can:

- Browse rankings.
- Search titles.
- View series details.
- Compare titles locally.
- View More tab and auth entry points.

Signed-in users can additionally:

- Vote on series.
- Save titles to reading lists.
- View and manage reading lists.
- Post and react in the forum.
- See profile/account details.

Recommended future stack additions:

- `Login`
- `Signup`
- `CheckEmail`
- `ForgotPassword` only if backend support is added
- `ReadingLists`
- `ForumThread`

The More tab should switch from preview rows to real account rows after `AuthProvider` exists.

## First Implementation Phase After This Plan

When it is time to build auth, keep the first branch narrow:

1. Install `expo-secure-store`.
2. Add secure token storage helpers.
3. Add `AuthProvider`.
4. Restore token on startup.
5. Add logout only.
6. Do not build login/signup forms in the same branch.

This keeps the riskiest app-wide state change separate from form UI, captcha, and Google OAuth work.
