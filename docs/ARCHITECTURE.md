# Mobile Architecture Notes

## Project Shape

The mobile app lives in:

```text
F:\ma-review-project\toon-ranks-mobile
```

Current structure:

```text
src/
  api/
    client.ts         - Axios client, auth token injection, error normalisation
    auth.ts           - Auth API wrappers (login, signup, mobile-code exchange, refresh, logout)
    forum.ts          - Forum thread/post API calls
    issues.ts         - Issue reporting endpoint
    readingLists.ts   - List CRUD and item management
    series.ts         - Series/ranking API calls
    votes.ts          - Series voting endpoints
  auth/
    AuthContext.tsx   - Auth provider (login, logout, signup, user state)
    authCallback.ts   - Callback URL parsing for toonranks://auth/callback
    authStorage.ts    - Secure storage helpers (expo-secure-store)
    sessionEvents.ts  - Session expiry and refresh handling
    webAuthBridge.ts  - Opens web auth session with mobile params
  components/
    AccountRequiredCard.tsx
    AppButton.tsx
    AppText.tsx
    Chip.tsx
    ForumMarkdown.tsx       - Custom markdown renderer for forum post content
    ForumMentionSuggestions.tsx
    ForumSeriesStrip.tsx
    IconButton.tsx
    PlaceholderCard.tsx
    RoleNameText.tsx
    ScreenShell.tsx
    SectionHeader.tsx
    StateMessage.tsx        - EmptyState / ErrorState / LoadingState
    Surface.tsx
    UserAvatar.tsx
    UserIdentity.tsx
    index.ts
  config/
    env.ts            - EXPO_PUBLIC_API_BASE_URL
    site.ts           - Branding constants (Toon Ranks, Nofara LLC, contact email)
  context/
    CompareContext.tsx - Local compare state (series selections, add/remove)
  navigation/
    RootNavigator.tsx  - Root stack: tabs + series detail + auth screens + forum thread
    TabsNavigator.tsx  - Bottom tabs: Home, Search, Lists, Forum, More
  screens/
    CheckEmailScreen.tsx
    CompareScreen.tsx
    ForumActivityScreen.tsx
    ForumCreateThreadScreen.tsx
    ForumScreen.tsx
    ForumThreadScreen.tsx
    HomeScreen.tsx
    LoginScreen.tsx
    MoreScreen.tsx
    ProfileScreen.tsx
    ReadingListDetailScreen.tsx
    ReadingListsScreen.tsx
    ReportIssueScreen.tsx
    SearchScreen.tsx
    SeriesDetailScreen.tsx
    SettingsScreen.tsx
    SignupScreen.tsx
  theme/
    tokens.ts         - Colors, typography, spacing, border radius, shadows
  types/
    account.ts
    forum.ts
    issue.ts
    readingList.ts
    series.ts
  utils/
    avatar.ts
    externalLinks.ts
    forumFormatting.ts
    forumMentions.ts
    forumValidation.ts
    issueValidation.ts
    seriesFormatting.ts
    voting.ts
```

## Runtime Entry

`App.tsx` wraps the app with:

- `SafeAreaProvider`
- `QueryClientProvider`
- `AuthProvider`
- `CompareProvider`
- `NavigationContainer`
- `RootNavigator`

## Navigation

Current navigation:

- Root native stack:
  - `MainTabs`
  - `SeriesDetail`
  - `ForumThread`
  - `ForumCreateThread`
  - `Login`
  - `Signup`
  - `CheckEmail`

- Bottom tabs:
  - `Home`
  - `Search`
  - `Lists`
  - `Forum`
  - `More`

## API Layer

API base URL is in `src/config/env.ts`:

```ts
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
  "https://man-review-backend-production.up.railway.app";
```

The Railway deployment URL (`man-review-backend-production`) is a historical name that predates the
GitHub repo rename. The URL itself is still correct — Railway keeps deployment URLs stable.

All network calls go through `src/api`. Do not hardcode production URLs in screens.

`src/api/client.ts` owns shared request behaviour:

- base URL from `EXPO_PUBLIC_API_BASE_URL`
- request timeout
- auth token attachment through `setApiAuthToken`
- session expiry handling via `sessionEvents`
- normalized errors through `ApiError` and `normalizeApiError`

A `profile.ts` API module can be added once the backend exposes a dedicated non-admin
current-user profile endpoint beyond `/auth/me/avatar`.

## Auth

Auth is implemented. The detailed contract lives in `docs/MOBILE_AUTH_CONTRACT.md`.

Flow summary:

1. User taps login/signup in the app.
2. `webAuthBridge` opens `https://www.toonranks.com/login?mobile=1&redirect_uri=toonranks://auth/callback&state=<random>`.
3. User completes CAPTCHA-protected login on the website.
4. Website calls `POST /auth/mobile-code` and redirects to `toonranks://auth/callback?code=...`.
5. `authCallback` parses the URL, validates state.
6. App calls `POST /auth/mobile-token` with the code.
7. JWT access token and refresh token are stored via `authStorage` (expo-secure-store).
8. All subsequent API calls include `Authorization: Bearer {access_token}`.
9. On 401, `sessionEvents` tries `POST /auth/mobile-refresh` before clearing the session.
10. Logout revokes the refresh token via `POST /auth/mobile-logout`.

## Shared Backend

The mobile app uses the same backend as the website. Do not create mobile-only backend state
for user data that should be shared across platforms.

Key shared concepts:

- JWT login with short-lived access tokens + mobile refresh tokens (~30 days)
- Reading lists are account-backed and shared with the website
- Forum routes are account-backed for posting and reactions
- Series voting is shared and per-category locked after the first vote
- Avatars are stored in S3 and shared across web and mobile

## State Management

- TanStack Query (React Query) for all server data and caching
- `AuthContext` for the signed-in user state and token lifecycle
- `CompareContext` for local compare selections
- Small `useState` for per-screen UI state

Avoid a large global store unless there is real pressure for one.

## Testing And CI

The mobile quality baseline is documented in `docs/QUALITY_BASELINE.md`.

Available checks:

```powershell
npm run typecheck
npm run lint
npm run format
npm run test
npm run verify
```

GitHub Actions runs separate jobs for Typecheck, Lint, Format, and Tests on PRs and pushes
to main.

Current tests are unit-level helper tests only. They do not launch iOS, Android, or Expo.
Good test targets: formatting helpers, score/rank utilities, API response mapping, auth storage
helpers, small pure reducers or state helpers.

## App Store Readiness Notes

Not ready yet:

- final bundle identifiers (currently `com.anonymous.toonranksmobile`)
- app icon and splash assets
- privacy and terms mobile links
- EAS build config
- store screenshots
- platform sign-in requirements

These are Phase 9 milestones, after the core product is stable.
