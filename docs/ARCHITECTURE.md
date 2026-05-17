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
    client.ts
    series.ts
  components/
    PlaceholderCard.tsx
    ScreenShell.tsx
  config/
    env.ts
  context/
    CompareContext.tsx
  navigation/
    RootNavigator.tsx
    TabsNavigator.tsx
  screens/
    CompareScreen.tsx
    HomeScreen.tsx
    MoreScreen.tsx
    SearchScreen.tsx
    SeriesDetailScreen.tsx
  theme/
    tokens.ts
  types/
    series.ts
```

## Runtime Entry

`App.tsx` wraps the app with:

- `SafeAreaProvider`
- `QueryClientProvider`
- `CompareProvider`
- `NavigationContainer`
- `RootNavigator`

## Navigation

Current navigation:

- Root native stack:
  - `MainTabs`
  - `SeriesDetail`

- Bottom tabs:
  - `Home`
  - `Search`
  - `Compare`
  - `More`

Expected future navigation:

- Root stack:
  - main tabs
  - series detail
  - auth flow
  - reading-list detail
  - forum thread detail
  - modal screens as needed

- Tabs, likely:
  - Home
  - Search
  - Lists
  - Forum
  - Account/More

The final tab structure should be revisited during design. Current `Compare` may become a secondary
screen or remain a tab depending on how central comparison feels on mobile.

## API Layer

Current API base URL is in `src/config/env.ts`:

```ts
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
  "https://man-review-backend-production.up.railway.app";
```

Current API files:

- `src/api/client.ts`
- `src/api/series.ts`
- `src/api/auth.ts`
- `src/api/readingLists.ts`
- `src/api/forum.ts`
- `src/api/issues.ts`
- `src/api/votes.ts`

Current typed data files:

- `src/types/account.ts`
- `src/types/forum.ts`
- `src/types/issue.ts`
- `src/types/readingList.ts`
- `src/types/series.ts`

Expected future API module:

- `profile.ts`, once the backend exposes a non-admin current-user profile endpoint

Do not hardcode production URLs in screens. Route all network calls through `src/api`.

`src/api/client.ts` owns shared request behavior:

- base URL from `EXPO_PUBLIC_API_BASE_URL`
- request timeout
- auth token attachment through `setApiAuthToken`
- normalized errors through `ApiError` and `normalizeApiError`

## Shared Backend

The mobile app should use the same backend used by the web app. Do not create mobile-only backend
state for user data that should be shared across platforms.

Important backend concepts:

- JWT login currently exists on backend.
- Reading lists are account-backed.
- Forum routes are account-backed for posting/reactions.
- Some routes are public and already suitable for Phase 1 mobile browsing.

## Auth Direction

Auth is not implemented yet. The detailed plan lives in `docs/AUTH_PLAN.md`.

When it is added:

- use the existing backend account system
- store tokens securely using `expo-secure-store`
- add request interceptors in the API client
- handle signed-out, expired-token, and offline states
- keep web/mobile identity shared

Do not store access tokens in plain React state as the only persistence. Do not store tokens in
plain AsyncStorage.

## State Management

Current state:

- React Query for server data
- React Context for compare selections

Recommended future state:

- Keep React Query for API/server cache.
- Keep small local UI state in components or simple contexts.
- Introduce a dedicated auth context/provider when auth starts.
- Avoid a large global store until there is real pressure for one.

## Design System Direction

Current tokens are in `src/theme/tokens.ts`, but many screens still hardcode colors.

Near-term goal:

- expand tokens
- centralize reusable primitives
- reduce one-off styling
- make app UI consistent before adding deeper functionality

Expected primitives:

- `AppText`
- `AppButton`
- `IconButton`
- `ScreenShell`
- `Surface`
- `SeriesPosterCard`
- `SeriesListItem`
- `MetricCard`
- `Chip`
- `EmptyState`
- `ErrorState`
- `LoadingState`

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

GitHub Actions runs separate jobs for:

- Typecheck
- Lint
- Format
- Tests

Do not add a heavy mobile testing stack until the design foundation stabilizes.

## App Store Readiness Notes

Not ready yet:

- final bundle identifiers
- app icon
- splash assets
- privacy text
- terms/privacy mobile links
- EAS build config
- store screenshots
- platform sign-in requirements

These are later milestones after the product shell is stable.
