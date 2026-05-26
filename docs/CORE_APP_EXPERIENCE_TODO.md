# Toon Ranks Mobile Core App Experience TODO

This TODO is the active mobile roadmap after reviewing the production website, backend, and current
mobile app together. The goal is not to chase small polish items. The goal is to make the mobile app
the native app-store version of Toon Ranks, using the same backend, accounts, rankings, reading
lists, votes, forum identity, avatars, and issue reporting as the website.

The current mobile app already has a usable public browsing shell:

- Home rankings with type filters and load more.
- Search with native result cards.
- Series Detail with summary/detail loading, partial-data fallback, and a native detail layout.
- Local Compare.
- Public Forum browsing, thread reading, markdown/media rendering, series references, and load more.
- Native anonymous issue reporting without screenshots.
- Auth storage, auth context, login/signup screens, and a web-auth bridge shell.
- Mobile login/signup can complete the website CAPTCHA flow and return a native session.
- Mobile restores the saved access token/user from secure storage on app launch.
- Mobile login includes a forgot-password entry point that opens the production website reset flow.
- Series voting, reading-list management, forum replies, and forum up/down votes are connected.

The biggest remaining product blockers are long-lived mobile sessions, native avatar management,
forum creation/editing parity, and app-store readiness.

## Phase 1: Mobile Auth Contract Across Backend, Web, And App

Suggested branch: `mobile-core-auth-contract`

Purpose: define the exact handoff that lets a user log in or sign up from the native app and return
to the app with a real Toon Ranks session.

- [x] Review backend auth routes and current JWT response shape.
- [x] Review web login/signup pages and confirm where mobile query params are currently ignored.
- [x] Choose the first real mobile auth path:
  - preferred near-term path: web CAPTCHA/auth session returns a short-lived mobile auth code to `toonranks://auth/callback`
  - future option: native mobile CAPTCHA/app attestation path
- [x] Document backend endpoint(s) needed for mobile auth code exchange.
- [x] Document web frontend changes needed after successful login/signup when `mobile=1` and `redirect_uri` are present.
- [x] Document mobile app changes needed to parse `code`, exchange it for JWT/user, store it, and refresh UI.
- [x] Keep native username/password submit disabled until the session handoff really works.

Done means a backend/frontend/mobile implementation plan exists with endpoint names, payloads,
redirect behavior, error behavior, and security notes.

Contract doc: `docs/MOBILE_AUTH_CONTRACT.md`.

## Phase 2: Real Mobile Login And Signup

Suggested branch group:

- `backend-mobile-auth-callback`
- `frontend-mobile-auth-redirect`
- `mobile-auth-code-exchange`

Purpose: make app login/signup actually sign the user into the app, not just the website.

- [x] Add backend support for short-lived mobile auth codes or another agreed mobile-safe session exchange.
- [x] Add tests for code creation, expiry, one-time use, invalid codes, and returned JWT/user shape.
- [x] Update web login/signup success flow to redirect to the provided mobile callback only when the request is explicitly mobile.
- [x] Update mobile `openWebAuthBridge` to exchange the returned code for the normal Toon Ranks JWT/user.
- [x] Store JWT/user with `expo-secure-store` through `AuthProvider`.
- [x] Restore signed-in state on app launch.
- [x] Add session-expired handling for `401` and auth-related `403` responses.
- [x] Update Login/Signup screen copy so it no longer implies the flow is incomplete after it works.
- [x] Add long-lived refresh-token sessions in Phase 2.5 so mobile users stay signed in
      longer than the short access-token lifetime.

Done means a user can start login or signup in the app, complete the existing CAPTCHA-protected web
step if needed, return to the app, and see signed-in state without manually going back from the
website.

Session strategy doc: `docs/MOBILE_SESSION_STRATEGY.md`.

## Phase 2.5: Long-Lived Mobile Sessions

Suggested branch group:

- `backend-mobile-refresh-tokens`
- `mobile-refresh-token-session`

Purpose: keep mobile users signed in for about 30 days using a standard refresh-token flow.

Current state: mobile already stores the access token and user snapshot in `expo-secure-store` and
restores them on app launch. That is not the same as a long-lived refresh session. The current backend
mobile token exchange returns only an access token, and authenticated `401`/`403` responses clear the
session instead of refreshing it.

- [x] Add backend refresh-token storage with hashed tokens, expiry, revocation, and last-used tracking.
- [x] Return a refresh token from the mobile auth-code exchange endpoint.
- [x] Add a backend refresh endpoint that returns a new access token for a valid mobile refresh token.
- [x] Store the refresh token in mobile secure storage.
- [x] Try a one-time refresh when an authenticated request returns `401` before clearing the session.
- [x] Revoke/clear the refresh token on logout.

Done means mobile sessions behave like a real app: users stay logged in for roughly a month without
making the main access JWT dangerously long-lived.

## Phase 2.6: Mobile Account Recovery Entry Point

Suggested branch: `mobile-auth-forgot-password-entry`

Purpose: reflect the website/backend forgot-password flow in mobile without rebuilding account
recovery natively.

- [x] Add a clear "Forgot password?" action to the native Login screen.
- [x] Open the production website forgot-password page in the same web-auth browser pattern.
- [x] Keep users in the app after closing the browser; do not pretend reset completion happens in
      native mobile yet.
- [x] Add a small test for the generated forgot-password URL if the helper is shared.

Done means mobile users who cannot sign in have an obvious recovery path that uses the existing
website/backend reset flow.

## Phase 3: Voting On Series

Suggested branch: `mobile-core-voting`

Purpose: match the website's "Rate this series" behavior in native mobile.

- [x] Replace the current disabled meter-style voting preview with 1-10 native score buttons per category.
- [x] Use existing `POST /series-details/{series_id}/vote`.
- [x] Use `vote_scores` from `GET /series-details/{series_id}` to show categories already voted by the signed-in user.
- [x] Disable categories already voted by the current user and explain that each category is locked after voting.
- [x] Require sign-in before voting and route signed-out users to Login.
- [x] Refresh detail/ranking data after a vote so category averages and vote counts update.
- [x] Show clear duplicate-vote, expired-session, and network-error states.

Done means mobile users can rate the same categories as web users and those votes appear correctly on
the website.

## Phase 4: Reading Lists

Suggested branch: `mobile-core-reading-lists`

Purpose: make mobile saved lists useful, not only a preview.

- [x] Load the signed-in user's lists using the existing reading-list endpoints.
- [x] Add a native Reading List Detail screen.
- [x] Show list items with title summaries, cover art, rank, rating, type, status, and left-off chapter.
- [x] Add Save/Add to List from Series Detail.
- [x] Add remove-from-list.
- [x] Add edit left-off chapter.
- [x] Add create list if the backend limit allows it.
- [x] Show list limits and backend validation errors clearly.
- [ ] Keep public/private share controls for a later slice unless needed immediately.

Done means a signed-in mobile user can see and manage the same saved titles they use on the website.

## Phase 5: Forum Account Actions

Suggested branch: `mobile-core-forum-actions`

Purpose: move forum from read-only browsing to the same discussion model as the website.

- [x] Replace the old heart model with up/down votes using `POST /forum/threads/{thread_id}/posts/{post_id}/vote`.
- [x] Show `viewer_vote`, `upvote_count`, and `downvote_count` state correctly after login.
- [x] Add reply composer for unlocked threads.
- [x] Add reply-to-reply support using `parent_id`.
- [x] Add create-thread flow from the Forum screen.
- [x] Add native series reference picker using `/forum/series-search`.
- [x] Respect locked threads and latest-updates-first threads.
- [x] Add owner/admin edit/delete controls only if the current user's role allows them.
- [x] Preserve markdown/media/series-reference behavior so posts created on mobile render correctly on web, and vice versa.

Done means forum votes and posts are shared between mobile and web with the same account identity.

## Phase 5.5: Mobile Forum Markdown Parity

Suggested branch: `mobile-forum-markdown-parity`

Purpose: make mobile forum posts render the same practical content patterns as the website forum.

- [x] Review the website forum renderer and collect real post examples that currently fail on mobile.
- [x] Render common markdown consistently: bold, italic, links, blockquotes, lists, line breaks, and inline code.
- [x] Render supported forum HTML patterns safely, especially spoiler/details blocks.
- [x] Render images, GIF links, and attached media in a native-friendly way.
- [x] Keep series references tappable and routed to the mobile Series Detail screen.
- [ ] Add regression tests for real forum post examples so markdown rendering does not quietly break again.
- [ ] Confirm posts created on the website render correctly on mobile, and mobile-created posts render correctly on the website.

Done means the mobile thread view can display existing website forum content without raw markdown/HTML leaking into the UI.

## Phase 6: Profile, Avatar, And Account Surfaces

Suggested branch: `mobile-core-profile-account`

Purpose: make the account area reflect the user's real website identity.

- [x] Add or consume a backend current-user profile endpoint if needed.
- [x] Show username, role color, avatar URL, and avatar preset consistently.
- [x] Add default avatar preset selection using `PATCH /auth/me/avatar/preset`.
- [x] Decide whether custom avatar upload/cropping belongs in mobile v1 or remains web-only at first.
- [x] Connect Settings session status and logout to the real session.
- [x] Update More/Profile/Forum author surfaces to use the same role/avatar conventions as the website.

Done means the signed-in user identity feels shared across web and mobile.

## Phase 6.5: Native Avatar Upload

Suggested branch: `mobile-native-avatar-upload`

Purpose: let users manage their Toon Ranks avatar directly in the native app while still storing the
final image through the existing website/backend avatar pipeline and S3 storage.

- [x] Choose a native image picker/cropper package that works cleanly with Expo and store builds.
- [x] Request photo-library permissions with clear Android/iOS copy.
- [x] Crop selected images to the same square avatar standard used by the website.
- [x] Upload the cropped image through the existing backend/S3 avatar endpoint.
- [x] Allow users to choose one of the default avatar presets from mobile.
- [x] Refresh the stored mobile `AuthUser` after avatar or preset changes.
- [ ] Confirm updated avatars appear on Profile, More, forum posts, and website account surfaces.

Done means a mobile user can upload, crop, save, and see their avatar without needing the website.

## Phase 7: Issue Reporting Completion

Suggested branch: `mobile-core-issue-reporting`

Purpose: finish the native issue-report path.

- [x] Add contextual entry points from Series Detail and Forum Thread.
- [x] Add screenshot/image attachment after native image permissions are chosen.
- [x] Send screenshots through the existing `/issues/report` multipart endpoint.
- [x] Show upload progress or a clear submitting state for large screenshots.
- [x] Keep anonymous reporting available.

Done means mobile issue reports are practical enough for real users and land in the same backend issue
queue as website reports.

## Phase 8: Search And Browse Completeness

Suggested branch: `mobile-core-search-browse`

Purpose: clean up remaining public browsing gaps after account-backed flows are underway.

- [x] Review whether `/series/search` needs pagination or a result limit contract.
- [x] Add mobile search pagination/load-more only if the backend exposes or needs it.
- [x] Add richer filter/sort controls only if they match the native app experience.
- [x] Confirm Home, Search, Detail, Compare, and Forum navigation remain reliable after auth changes.

Done means public discovery feels complete, but this should not outrank real auth and account actions.

## Phase 9: Mobile App Store Readiness

Suggested branch group:

- `mobile-store-config`
- `mobile-store-assets`
- `mobile-release-readiness`

Purpose: prepare the app for actual store submission after the core product works.

- [x] Finalize Android package and iOS bundle identifiers.
- [x] Add production app icon and splash assets.
- [x] Configure EAS build or final build workflow.
- [x] Confirm Terms, Privacy, support email, and data safety disclosures.
- [ ] Add store screenshots after the UI is stable.
- [x] Decide whether legal pages open in native screens or in-app browser.
- [ ] Verify release builds against production backend.

Done means the app can be built and reviewed as a real app-store candidate.

## Phase 10: Forum Activity And Series Ratings On Account

Suggested branch: `mobile-forum-activity` (forum activity screen), then `mobile-series-ratings` (profile screen ratings section).

Purpose: surface the user's own forum history and series rating history in the native app, matching the account page features added to the production website in May 2026.

### Background — what was built on the web

Four backend endpoints were added and shipped:

| Endpoint                       | Returns                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `GET /forum/me/threads`        | Paginated list of threads the signed-in user created                                   |
| `GET /forum/me/posts`          | Paginated list of posts/replies the user wrote (each has `thread_id` for deep-linking) |
| `GET /forum/me/votes`          | Paginated list of forum posts the user upvoted or downvoted                            |
| `GET /series-details/me/votes` | Paginated list of series the user has rated, with per-category scores                  |

The web account page (`/account`) shows:

- A "Forum activity" card with three tabs (Threads / Replies / Votes), all fetched in parallel on mount so counts are always visible.
- A "Series ratings" card below it showing cover, title, type, status, and color-coded score pills per category.
- "View thread →" links from reply and vote rows navigate directly to the specific post via URL hash (`#post-{id}`).

### Work items

**10a — API layer**

- [x] Add `getMyForumThreads(page, pageSize)` → `GET /forum/me/threads` to `src/api/forum.ts`
- [x] Add `getMyForumPosts(page, pageSize)` → `GET /forum/me/posts` to `src/api/forum.ts`
- [x] Add `getMyForumVotes(page, pageSize)` → `GET /forum/me/votes` to `src/api/forum.ts`
- [x] Add `getMySeriesVotes(page, pageSize)` → `GET /series-details/me/votes` to `src/api/votes.ts`
- [x] Add `MySeriesVote`, `CategoryVote`, and `MySeriesVotesPage` types to `src/types/series.ts`
- [x] Add `ForumPostPage` type to `src/types/forum.ts` and `thread_id` field to `ForumPost`

**10b — ForumActivityScreen**

- [x] Replace the static placeholder cards with three real tabs (Threads / Replies / Votes)
- [x] Fetch all three in parallel on mount so tab counts are always visible without switching tabs
- [x] Threads tab: show title linked to `ForumThread` screen, post count, last updated date, locked badge
- [x] Replies tab: show truncated plain-text content, date, and a "View thread →" row action that navigates to `ForumThread` with `postId` for scroll-to-post
- [x] Votes tab: show truncated content, up/down badge, date, and a "View thread →" row action with `postId`
- [x] Each tab uses `useInfiniteQuery` with a "Load more" button
- [x] Signed-out guard: show `AccountRequiredCard` instead of the lists
- [x] Empty, loading, and error states for each tab

**10b.1 — Scroll to specific post in ForumThreadScreen**

- [x] Add `postId?: number` to `ForumThread` nav params in `RootNavigator.tsx`
- [x] Add `scrollRef` prop to `ScreenShell` so `ForumThreadScreen` can hold a `ScrollView` ref
- [x] Add `forwardRef` to `Surface` component so `PostCard` can register its View ref
- [x] Register a ref for every `PostCard` (original post + all replies at any depth) into a `Map<number, View>`
- [x] After posts load, use `measureLayout` to scroll to the target post with a 200 ms settle delay

**10c — Series ratings section on ProfileScreen**

- [x] Add `SeriesRatingsSection` component at `src/screens/SeriesRatingsSection.tsx`
- [x] Each card shows: cover thumbnail (`CoverImage`), title (tappable → `SeriesDetail`), type badge, status, and per-category score pills
- [x] Score color convention: green ≥ 8, amber 6–7, red ≤ 5 (matches web)
- [x] `useInfiniteQuery` with "Load more" button
- [x] Empty, loading, and error states
- [x] Section only shown when `isSignedIn`

**10d — Cover image caching (applied globally)**

- [x] Install `expo-image` and create shared `CoverImage` component with `cachePolicy="memory-disk"` and `transition={150}` fade-in
- [x] Replace all bare React Native `Image` usages for cover art across `HomeScreen`, `SearchScreen`, `SeriesDetailScreen`, `ReadingListDetailScreen`, `CompareScreen`, `ForumSeriesStrip`, `ForumMentionSuggestions`, and `SeriesRatingsSection`

Done means a signed-in mobile user can browse their own forum threads, replies, votes, and series ratings without needing the website, and navigating to a specific post scrolls the thread to that post automatically.

---

## Phase 11: Account Management Completeness

Suggested branch: `mobile-account-management`

Purpose: close the small but user-visible gaps in account self-service that already have backend support but no mobile UI.

### Background

Three gaps were found in the May 2026 audit:

1. **Avatar reset is missing.** Users who uploaded a photo cannot remove it from mobile. The backend `DELETE /auth/me/avatar` endpoint exists but is not in `src/api/auth.ts` and there is no reset button on `ProfileScreen`.
2. **Reading list delete has no UI.** `deleteReadingList` exists in `src/api/readingLists.ts` and the backend supports it, but no button is wired up anywhere in `ReadingListsScreen`.
3. **"Already in list" is not surfaced.** When a series is already saved to one or more reading lists, the save picker on `SeriesDetailScreen` shows no indication. Tapping a list that already contains the series produces a backend error caught by `Alert.alert`. A proactive check prevents the confusion.

### Work items

**11a — Avatar reset**

- [x] Add `resetMyAvatar()` → `DELETE /auth/me/avatar` to `src/api/auth.ts`
- [x] Add a "Remove photo" button in `ProfileScreen` below the custom photo section, visible only when `user.avatar_url` is set; shows a destructive confirmation `Alert` before calling `resetMyAvatar()`
- [x] Call `updateUser` with returned `avatar_url`/`avatar_preset` so avatar reverts to preset swatch immediately
- [x] Show an inline error state if the reset call fails

**11b — Reading list delete**

- [x] Add a trash icon button inside each list row in `ReadingListsScreen` (nested `Pressable` so the row still navigates on tap)
- [x] Show a destructive confirmation `Alert` before calling the existing `deleteReadingList(listId)`
- [x] Invalidate `["reading-lists", "me"]` on success; show spinner on the trash icon while pending
- [x] Show an error alert if deletion fails

**11c — "Already in list" indicator on Series Detail save picker**

- [x] Load reading lists on screen mount (`enabled: isSignedIn`) so data is available before the picker opens
- [x] Derive `isAlreadySaved` from any list containing the series; the "Save to list" button itself shows a filled bookmark icon + "Saved" label when true
- [x] Inside the picker, each list row shows a filled bookmark (green) and "Already in this list" subtitle when the series is already saved to that list; the row is disabled
- [x] Added inline "New list" section at the bottom of the picker (name input + "Create & save" button) so users never need to leave the screen to create a list; creation automatically saves the series into the new list
- [x] Fixed keyboard covering the new list input: `Keyboard.addListener("keyboardDidShow")` triggers `scrollToEnd` after the keyboard fully appears, and `paddingBottom` equal to the keyboard height is added to the scroll content

Done means users can fully manage their account from mobile: upload, preview, and remove their avatar, delete lists they no longer want, create lists inline from any series page, and clearly see which lists already have a given series — both on the save button itself and inside the picker.

---

## Phase 12: Forum Thread Management

Suggested branch: `mobile-forum-thread-management`

Purpose: give authors and admins the ability to edit and delete threads from mobile, matching the management controls available on the web.

### Background

The web forum lets thread authors edit the thread title and first post and delete their own threads. Admins can additionally lock/unlock threads and toggle the `latest_first` display order. None of these management actions are available on mobile. The following API functions are missing from `src/api/forum.ts`:

- `updateForumThread` → `PATCH /forum/threads/:id`
- `deleteForumThread` → `DELETE /forum/threads/:id`
- `lockForumThread` → `PATCH /forum/threads/:id/lock`
- `updateForumThreadSettings` → `PATCH /forum/threads/:id/settings`

### Work items

**12a — API layer**

- [x] Add `updateForumThread(threadId, payload)` → `PATCH /forum/threads/:id` to `src/api/forum.ts` (payload: `{ title, first_post_markdown, series_ids }`)
- [x] Add `deleteForumThread(threadId)` → `DELETE /forum/threads/:id` to `src/api/forum.ts`
- [x] Add `lockForumThread(threadId, locked)` → `PATCH /forum/threads/:id/lock` to `src/api/forum.ts`
- [x] Add `updateForumThreadSettings(threadId, settings)` → `PATCH /forum/threads/:id/settings` to `src/api/forum.ts` (payload: `{ latest_first }`)
- [x] Add `UpdateForumThreadRequest`, `LockForumThreadRequest`, `UpdateForumThreadSettingsRequest` types to `src/types/forum.ts`

**12b — Edit thread UI**

- [x] "Edit", "Delete", and (admin-only) "Lock/Unlock" and "Latest first" action pills appear in the hero card when the signed-in user is the thread author or admin
- [x] Tapping "Edit" swaps the hero card for an inline edit form pre-filled with the current title and first post markdown, with character counters and series mention support
- [x] On save, calls `updateForumThread`; cache is updated with the returned thread and the edited first-post body — no full refetch needed
- [x] Shows saving spinner and inline error state

**12c — Delete thread UI**

- [x] "Delete" pill in the hero card, visible to thread author and admins
- [x] Destructive confirmation `Alert` before calling `deleteForumThread`
- [x] On success, navigates back and invalidates the thread list query

**12d — Admin lock and display controls**

- [x] "Lock" / "Unlock" pill visible only to admins; shows confirmation `Alert`; calls `lockForumThread` and updates cache immediately so the locked flag and reply composer state update without a refetch
- [x] "Latest first" pill visible only to admins; active state highlighted; calls `updateForumThreadSettings` and updates cache

Done means thread authors and admins have the same management capability on mobile as on the web, and threads managed from mobile correctly reflect on the website.

---

## Phase 13: Forum Thread Search

Suggested branch: `mobile-forum-thread-search`

Purpose: make the forum list browseable when there are many threads, matching the search bar available on the web forum page.

### Background

`ForumScreen` currently shows all threads in reverse-chronological order with load-more pagination. The web forum has a search input that filters threads by keyword using the same backend endpoint. With many threads, users have no way to find a specific discussion from mobile without scrolling through everything.

A secondary UX gap was also found: `ForumCreateThreadScreen` has a 2000-character limit on the first post body enforced at submit time, but no character counter is shown during typing.

### Work items

**13a — Thread search**

- [x] Add a search `TextInput` at the top of `ForumScreen`, styled consistently with `SearchScreen`
- [x] Debounce the input (300 ms) before updating the `queryKey` to avoid firing a request on every keystroke
- [x] Pass the trimmed query as a `q` param to `getForumThreads` (the backend already supports `?q=` filtering)
- [x] When the search field is empty, fall back to the standard unfiltered list
- [x] Add a clear (×) button that resets the input and restores the unfiltered list
- [x] Preserve load-more behavior in search results
- [x] Show an appropriate empty state when a search returns no threads

**13b — Create thread character counter**

- [x] Body character counter (`{current}/{max}`) added to `ForumCreateThreadScreen` below the "First post" label, matching the title counter style — body is hard-capped at `MAX_BODY_LENGTH` via `.slice()` so the counter cannot show an over-limit value

Done means users can find threads by keyword from mobile and have clear feedback when composing a new thread.

---

## Phase 14: Reading List Sharing

Suggested branch: `mobile-reading-list-sharing`

Purpose: let users share their reading lists publicly from mobile and allow anyone with a share link to view a shared list.

### Background

The web reading list page lets users toggle a list between private and public, copy the public share URL, and view other users' shared lists at `/lists/:token`. On mobile:

- `shareReadingList` and `unshareReadingList` API functions do not exist in `src/api/readingLists.ts`.
- There is no share toggle or share URL copy action in `ReadingListsScreen`.
- `getPublicReadingList` exists in `src/api/readingLists.ts` and `PublicReadingListPage` type is defined, but there is no screen that renders it.
- Deep link handling for `toonranks://lists/:token` is not configured.

### Work items

**14a — API layer**

- [x] Add `shareReadingList(listId)` → `POST /reading-lists/:id/share` to `src/api/readingLists.ts`, returning `{ share_token, share_url }`
- [x] Add `unshareReadingList(listId)` → `DELETE /reading-lists/:id/share` to `src/api/readingLists.ts`
- [x] Add `ShareReadingListResponse` type to `src/types/readingList.ts`
- [x] Add `owner_username?: string | null` to `PublicReadingList` type so the viewer screen can attribute the list

**14b — Share toggle UI**

- [x] In `ReadingListsScreen`, added a share button (`share-social-outline` / `share-social` filled when public) per list row alongside the existing trash icon
- [x] Tapping the share button on a private list calls `shareReadingList`, shows an `ActivityIndicator` while pending, then presents the returned `share_url` in a native `Share.share` sheet
- [x] Tapping the share button on a public list shows an `Alert` with "Share link" (opens share sheet with `toonranks.com/lists/{token}`) and "Make private" (confirmation then calls `unshareReadingList`)
- [x] Both mutations invalidate `["reading-lists", "me"]` on success and show an alert on error

**14c — Public reading list viewer screen**

- [x] Added `PublicReadingList: { token: string }` to `RootStackParamList` in `RootNavigator.tsx`
- [x] Created `src/screens/PublicReadingListScreen.tsx` — calls `getPublicReadingList(token)`, enriches items with `getSeriesSummary` via `useQueries` (same pattern as `ReadingListDetailScreen`)
- [x] Each item card shows cover, title (tappable → `SeriesDetail`), type badge, score, and `left_off_chapter` read-only — no edit or remove actions
- [x] Screen title shows list name; subtitle shows `Shared by {owner_username}` when the field is present
- [x] 404/403 response shows "This list is private or no longer available"; other errors show a generic retry message

**14d — Deep link handling**

- [x] `toonranks` scheme was already registered in `app.json` under `expo.scheme` (no change needed)
- [x] Added `linking` config typed as `LinkingOptions<RootStackParamList>` to `NavigationContainer` in `App.tsx`: `toonranks://lists/:token` routes to `PublicReadingList` with the correct `token` param

Done means mobile users can share their lists publicly, share the link externally, and anyone who receives the link can open it directly in the app and browse the shared list.

---

## Phase 15: Native Login And Signup

Suggested branch group:

- `backend-native-auth-endpoints`
- `mobile-native-login`

Purpose: replace the in-app web-browser login flow with a fully native username/password form and
native Google Sign-In, so users never leave the app to authenticate.

### Background — why the current approach exists and its limits

The current mobile auth flow opens an in-app browser (via `expo-web-browser`) pointing at the
production Toon Ranks login page. The website handles hCaptcha verification, then redirects to
`toonranks://auth/callback?code=…` with a short-lived mobile auth code. The app exchanges that code
for a JWT/refresh-token pair.

This approach was pragmatic because:

- It reused the existing CAPTCHA-protected website login/signup without any backend changes.
- Google OAuth redirect flows require a browser by design.
- It avoided building a duplicate credential form before the core session contract was solid.

The limits are now significant:

- First-party username/password login via an in-app browser is unusual and can feel broken or
  untrustworthy to users, especially on iOS where the browser chrome is very visible.
- App Store reviewers have flagged non-OAuth browser flows in native apps; Apple expects
  username/password to be handled natively.
- The transition from app → browser → app introduces a visible context switch and a failure mode
  if the browser redirect does not fire.

### Design decision

Two auth paths must be supported natively:

| Path                             | Approach                                                                |
| -------------------------------- | ----------------------------------------------------------------------- |
| Username + password              | Native form → new backend endpoint → JWT/refresh token                  |
| Google Sign-In                   | Native Google SDK → ID token → new backend endpoint → JWT/refresh token |
| reCAPTCHA v2 (username/password) | Native reCAPTCHA SDK via WebView (no external browser needed)           |

Signup uses the same paths. The existing web-auth bridge is kept as a fallback for edge cases
(e.g. password reset, email verification) but should not appear during the normal login/signup flow.

### Phase 15a — Backend: native credential endpoints

Suggested branch: `backend-native-auth-endpoints`

> **Already done.** The backend already ships `POST /auth/login`, `POST /auth/signup`, and
> `POST /auth/google-oauth`, all of which accept native credentials and return
> `{ access_token, refresh_token, user }`. The matching API functions `login()`, `signup()`, and
> `loginWithGoogle()` already exist in `src/api/auth.ts` and the request types
> (`LoginRequest`, `SignupRequest`, `GoogleOAuthRequest`) are already in `src/types/account.ts`.
> No new backend endpoints are needed.

- [x] `POST /auth/login` accepts `{ username, password, captcha_token }` → `AuthSession`
- [x] `POST /auth/signup` accepts `{ email, username, password, captcha_token }` → `SignupResponse`
- [x] `POST /auth/google-oauth` accepts `{ token }` (Google ID token) → `AuthSession`
- [x] All three are already rate-limited with the same protections as the web login

### Phase 15b — Mobile: Google reCAPTCHA v2 SDK integration

Suggested branch: `mobile-native-login`

- [x] `react-native-webview` was already installed; added `react-native-recaptcha-that-works` which
      uses it internally to render the Google reCAPTCHA v2 challenge inside a Modal WebView
- [x] `Recaptcha` component (default export) rendered in `LoginScreen` and `SignupScreen` with
      `size="invisible"` — challenge only appears when Google deems the request suspicious; most
      users pass silently
- [x] Sitekey (`6Ld96JMrAAAAAOgkEHH4sARr5aHkCone2tYQBCXN`) read from
      `EXPO_PUBLIC_RECAPTCHA_SITE_KEY` in `.env`; this is the same public sitekey used on the
      Toon Ranks website — no new key is needed for production
- [x] `recaptchaRef.current?.open()` triggers the challenge; `onVerify(token)` callback receives
      the token string; `onError()` surfaces an inline error message to the user
- [x] `recaptchaRef.current?.close()` called inside `onVerify` before passing the token to the
      mutation so the Modal closes cleanly

### Phase 15c — Mobile: native login screen

Suggested branch: `mobile-native-login`

- [x] Removed the disabled "Continue" stub button and the "Continue with CAPTCHA login" web-bridge
      button from `LoginScreen`
- [x] Removed the warning notice banner about the CAPTCHA browser step
- [x] "Log in" primary button is now active: validates fields → triggers `recaptchaRef.current?.open()`
      → `onVerify(token)` calls `login({ username, password, captcha_token })` via `useMutation`
- [x] On success: calls `setSession()` and navigates to `MainTabs` — same path as the web bridge
- [x] Inline field validation: empty username, empty password shown before CAPTCHA is triggered
- [x] Inline error box shows server-returned message (wrong password, account not found, etc.)
- [x] "Log in" button label changes to "Signing in..." while the mutation is in flight; disabled
      until both fields are filled
- [x] Password field has show/hide toggle (eye icon) inside the field border
- [x] "Forgot password?" link retained — still opens the production website forgot-password page
- [x] "Create account" link retained, navigates to `SignupScreen`

### Phase 15d — Mobile: native signup screen

Suggested branch: `mobile-native-login`

- [x] Removed the disabled "Create account" stub, the "Continue with CAPTCHA signup" web-bridge
      button, and the warning notice banner from `SignupScreen`
- [x] Removed the "Check email flow preview" development artifact button
- [x] "Create account" primary button: validates fields → triggers `recaptchaRef.current?.open()`
      → `onVerify(token)` calls `signup({ email, username, password, captcha_token })` via `useMutation`
- [x] On success: navigates to `CheckEmail` (email verification required before first login)
- [x] Inline field validation: empty email, empty username, empty password, password < 8 chars
- [x] Inline error box shows server-returned validation errors (username taken, email registered)
- [x] Password field has show/hide toggle matching the login screen style

### Phase 15e — Mobile: native Google Sign-In

Suggested branch: `mobile-native-login`

> **Deferred — requires Google OAuth credentials.** The backend `POST /auth/google-oauth` and
> the `loginWithGoogle()` API function already exist. The mobile work requires:
>
> - A Google Cloud project with OAuth 2.0 enabled
> - A web OAuth client ID (for the backend to verify tokens)
> - An iOS OAuth client ID and an Android OAuth client ID (for the native SDK)
>
> Once credentials are available, the implementation is:

- [x] Install `@react-native-google-signin/google-signin` with its Expo config plugin
- [x] Add the plugin to `app.json` with `iosClientId` and Android `webClientId`
- [x] Add a "Continue with Google" button to both `LoginScreen` and `SignupScreen`
- [x] On press: call `GoogleSignin.signIn()`, extract `idToken`, call `loginWithGoogle({ token: idToken })`
- [x] Handle cancellation (user dismisses picker) as a no-op; show inline error on failure

### Phase 15f — Cleanup

- [x] Remove or hide the `openWebAuthBridge` login/signup path from the normal UI flow (keep it
      available for password reset and email verification only).
- [x] Update `LoginScreen` and `SignupScreen` copy to remove references to "continuing to the
      website".
- [ ] Smoke-test both native flows (username/password and Google) against the production backend on
      Android and iOS emulators before submitting to stores.
- [x] Update `docs/MOBILE_SESSION_STRATEGY.md` to reflect the new native-credential flow alongside
      the existing auth-code exchange.

Done means a user can create an account or sign in entirely within the native app without seeing a
browser, the session is indistinguishable from a web session (same JWT/refresh pattern), and the
experience meets App Store reviewer expectations for first-party credential flows.

---

## Phase 16: Mobile-Aware Email Verification Redirect

Suggested branch group:

- `backend-mobile-email-verify-redirect`
- `frontend-mobile-verify-landing`

Purpose: when a user signs up from the mobile app, the confirmation email should land them back in
the app after verifying, rather than dropping them on the website.

### Background

Currently all verification emails send a web link (`https://toonranks.com/verify?token=...`)
regardless of whether the account was created on web or mobile. This is intentional for now — the
app is not yet in the app stores and Universal Links / App Links cannot be configured without a
signed, publicly distributed build.

The correct implementation requires three sides working together:

- **Backend**: accept a `source` field (`"mobile"` or `"web"`) on `POST /auth/signup`; store it
  alongside the verification token; after verifying, use it to choose the post-verification
  redirect.
- **Web frontend**: the verification landing page checks the stored source; if `"mobile"`, renders
  an "Open in app" button that fires `toonranks://auth/verified` and auto-redirects on mobile
  browsers where the app is installed; if `"web"`, uses the existing post-verification flow.
- **Mobile**: register `toonranks://auth/verified` as a deep link route; navigate the user to the
  Login screen with a success banner when this link fires.

The email link must always be a web URL — `toonranks://` custom scheme links do not open in most
desktop email clients (Gmail web, Outlook, Apple Mail on macOS) and would be a dead link for those
users. The web-first approach ensures the link always works regardless of device.

### Prerequisites before starting this phase

- [ ] App is signed and live in the Apple App Store and Google Play Store
- [ ] `apple-app-site-association` file served from `toonranks.com/.well-known/`
- [ ] `assetlinks.json` file served from `toonranks.com/.well-known/`
- [ ] Universal Links (iOS) and App Links (Android) verified end-to-end

### Work items

- [ ] Add `source?: "mobile" | "web"` to `POST /auth/signup` request body and store it with the
      verification token
- [ ] Update the backend verification handler to read `source` and pass it to the post-verify
      redirect decision
- [ ] Update the web verification landing page to show an "Open in app" button when
      `source === "mobile"`, with a `toonranks://auth/verified` href and auto-redirect on mobile
      browsers
- [ ] Add `toonranks://auth/verified` to the deep link config in `App.tsx`
- [ ] Add a `VerifiedScreen` or navigate to `Login` with a "Account verified — you can now log in"
      banner when the deep link fires
- [ ] Pass `source: "mobile"` in the `signup()` call from `SignupScreen.tsx`

Done means a mobile-registered user who taps the confirmation email on their phone is taken
directly back into the app, while a web-registered user or anyone opening the link on a desktop
continues through the normal website flow.

---

## Phase 17: App Store Build Configuration (Hard Blockers)

Suggested branch: `mobile-store-build-config`

Purpose: resolve every configuration gap that would cause an App Store or Play Store rejection
before a single reviewer sees the app. These are all code and config changes — no external accounts
or assets required yet.

### Background

Four hard blockers were identified in the May 2026 store-readiness audit:

1. **No real asset files.** `app.json` references `assets/icon.png`, `assets/splash.png`, and
   `assets/adaptive-icon.png`. The folder only contains `ASSET_SPEC.md`. A production EAS build
   will fail without the real files. Asset creation is design work handled separately; the spec is
   documented in `assets/ASSET_SPEC.md`.
2. **Missing iOS encryption declaration.** Apple requires every app to declare whether it uses
   non-exempt encryption. The app uses only standard HTTPS — the correct declaration is
   `ITSAppUsesNonExemptEncryption: false` in `app.json`. Without it Apple holds the submission for
   French export compliance paperwork that does not apply.
3. **`supportsTablet: true` without iPad testing.** Apple requires iPad screenshots and tests the
   app on iPad when this flag is set. If the layout has not been verified on tablet, this flag must
   be set to `false` for v1 to avoid a rejection on tablet-specific layout issues.
4. **Notifications placeholder in Settings.** The Settings screen shows a "Notifications" row
   describing future reminders. It does nothing. App Store reviewers sometimes request a demo of
   features shown in the UI. For v1 this row should be removed or clearly marked "Coming soon" so
   reviewers cannot hold the submission.

### Work items

**17a — iOS encryption declaration**

- [ ] Add `"ITSAppUsesNonExemptEncryption": false` to `ios.infoPlist` in `app.json`
- [ ] Confirm no custom encryption libraries are used anywhere in the dependency tree

**17b — Tablet support decision**

- [ ] Test the full app on an iPad simulator (all tabs, all modals, all forms)
- [ ] If layout is acceptable: leave `supportsTablet: true` and add iPad screenshots to Phase 18
- [ ] If layout needs work: set `supportsTablet: false` in `app.json` for v1; add a tablet
      optimisation phase before v2

**17c — Notifications placeholder**

- [ ] Remove the "Notifications" settings row from `SettingsScreen.tsx` for v1, or replace the
      body copy with "Coming in a future update" and disable any tappable behavior so reviewers
      cannot interact with a non-functional feature

**17d — EAS account and project link**

- [ ] Create a free Expo account at expo.dev if one does not already exist
- [ ] Run `npm install -g eas-cli` to install the EAS CLI globally
- [ ] Run `eas login` to authenticate
- [ ] Run `eas build:configure` inside the mobile project to link the project to the Expo account
      and generate the project ID in `app.json`
- [ ] Confirm `eas build --platform android --profile preview` produces a working APK before
      attempting a production build

**17e — Real asset files**

- [ ] Produce `assets/icon.png` at 1024×1024 px, no transparency (see `assets/ASSET_SPEC.md`)
- [ ] Produce `assets/adaptive-icon.png` at 1024×1024 px, logo within inner 66% safe zone
- [ ] Produce `assets/splash.png` at 1284×2778 px, background `#17110f`, logo centered
- [ ] Run `npx expo start` and confirm assets render correctly on both Android and iOS simulators
- [ ] Run `eas build --platform android --profile preview` and confirm the APK installs and
      launches with the correct icon and splash

Done means a production EAS build completes without errors, the correct icon and splash appear on
device, and the iOS build will not be held at Apple's encryption review step.

---

## Phase 18: Store Assets and Listings

Suggested branch: `mobile-store-assets` (for any in-code metadata changes)

Purpose: produce every visual and text asset both stores require before the app can go live.
None of this work requires a code change — it is all done in App Store Connect, the Google Play
Console, and a design tool.

### App Store Connect (iOS)

**18a — App record**

- [ ] Sign in to App Store Connect (appstoreconnect.apple.com) with an Apple Developer Program
      account ($99/year membership required)
- [ ] Create a new app record: platform iOS, bundle ID `com.toonranks.mobile`, primary language
      English, category **Entertainment** (sub-category: none required)
- [ ] Set the app name to "Toon Ranks" and confirm it is not already taken in the store

**18b — Store listing copy**

- [ ] Write a subtitle (30 chars max): e.g. "Manga & Webtoon Rankings"
- [ ] Write a promotional text (170 chars max): shown above the description, changeable without
      a new build
- [ ] Write a description (4000 chars max): cover rankings, reading lists, voting, forum, and
      the shared account with the website
- [ ] Add keywords (100 chars total, comma-separated): manga, webtoon, comics, rankings, reading
      list, forum, anime
- [ ] Add support URL: `https://www.toonranks.com/support` or the support email page
- [ ] Add privacy policy URL: `https://www.toonranks.com/privacy` — confirm this page is live
      before submitting

**18c — iOS screenshots**

All screenshots must be taken from a production or preview build, not the Expo Go client.

- [ ] **6.7-inch** (iPhone 15 Pro Max): 1290×2796 px — required
- [ ] **5.5-inch** (iPhone 8 Plus): 1242×2208 px — required
- [ ] **12.9-inch iPad Pro** (if `supportsTablet: true`): 2048×2732 px — required if tablet
      is enabled; skip if `supportsTablet` was set to `false` in Phase 17b
- [ ] Minimum 3 screenshots per size; aim for 5–6 showing home, series detail, reading lists,
      forum, and account
- [ ] Screenshots must not show the Expo dev menu, Metro bundler UI, or any debug overlay

**18d — Age rating**

- [ ] Complete the age rating questionnaire in App Store Connect
- [ ] The forum contains user-generated text content — this typically results in a **12+** rating
      due to "Infrequent/Mild" mature/suggestive themes from user posts
- [ ] Do not select any gambling, realistic violence, or explicit sexual content categories

### Google Play Console (Android)

**18e — App record**

- [ ] Sign in to play.google.com/console with a Google Play Developer account ($25 one-time fee)
- [ ] Create a new app: free, available in all countries, app (not game), English
- [ ] Package name: `com.toonranks.mobile`

**18f — Store listing copy**

- [ ] Short description (80 chars): e.g. "Rank, track, and discuss manga and webtoons"
- [ ] Full description (4000 chars): same content as iOS description, adapted for Play tone
- [ ] Add the app category: **Entertainment**
- [ ] Upload a feature graphic: 1024×500 px JPEG or 24-bit PNG, no alpha — shown as the banner
      at the top of the Play Store listing

**18g — Android screenshots**

- [ ] Phone screenshots: minimum 2, maximum 8 — same content as iOS, cropped for Android ratio
- [ ] 7-inch tablet screenshots (optional but recommended if `supportsTablet: true`)
- [ ] 10-inch tablet screenshots (optional)

**18h — Content rating**

- [ ] Complete the IARC content rating questionnaire in Play Console
- [ ] Expected rating: **Teen** (due to user-generated forum content) or **Everyone 10+**
- [ ] Confirm the rating before submitting — misrating is a policy violation

**18i — Data safety section**

This is mandatory and cannot be skipped. Declare every data type the app collects:

- [ ] **Email address** — collected, used for account management, not shared with third parties
- [ ] **Username** — collected, used for account management and public display
- [ ] **Photos** — collected optionally for avatar upload, stored on Toon Ranks servers (S3)
- [ ] **User-generated content** (forum posts, reading lists) — collected, publicly visible if
      the user chooses to share
- [ ] **App activity** (votes, reading progress) — collected, used for product features
- [ ] Confirm data is encrypted in transit (HTTPS) and at rest (backend/S3)
- [ ] Confirm no data is sold to third parties
- [ ] Confirm users can request account deletion (add a delete-account flow or link to the
      website account deletion page if one exists)

Done means both store listings are complete, all required screenshots are uploaded, age and
content ratings are confirmed, and the data safety form is submitted.

---

## Phase 19: Production Build Verification

Suggested branch: none — this is a QA and ops phase, not a code phase

Purpose: confirm the production EAS build behaves identically to the development build against
the live production backend before submitting to either store.

### Background

Development builds (Expo Go or development client) differ from production builds in several
important ways: environment variables are re-evaluated, Metro bundler is not present, JavaScript
is bundled and minified, native modules use release configurations, and crash reporting (if added)
is active. A flow that works in dev can silently break in production due to any of these
differences.

### Work items

**19a — Android production build**

- [ ] Run `eas build --platform android --profile production` to produce an AAB (Android App
      Bundle) — this is what the Play Store requires
- [ ] Also run `eas build --platform android --profile preview` to produce an APK for direct
      install and testing on a physical device or emulator
- [ ] Install the preview APK on a real Android device or emulator and confirm it launches

**19b — iOS production build**

- [ ] Run `eas build --platform ios --profile production`
- [ ] Install on a real iOS device via TestFlight (requires the app record to exist in App Store
      Connect and the device to be added as a tester)
- [ ] Confirm it launches without the Expo splash being replaced by a blank screen

**19c — Smoke test all critical flows against production backend**

Test every flow that touches the real backend — do not use a staging or mock environment:

- [ ] **Signup**: create a new account, receive verification email, verify, log in
- [ ] **Login**: log in with verified credentials; confirm session persists after app restart
- [ ] **Refresh token**: force an access token expiry (or wait) and confirm the session refreshes
      silently rather than logging the user out
- [ ] **Logout**: confirm session is cleared and the user is returned to the signed-out state
- [ ] **Home rankings**: confirm titles load, type filters work, load-more works
- [ ] **Search**: confirm results load and tapping a result navigates to Series Detail
- [ ] **Series Detail**: confirm summary, detail, voting, and save-to-list work
- [ ] **Reading lists**: confirm lists load, items show, add/remove/chapter edit work, share works
- [ ] **Forum**: confirm threads load, replies work, create thread works, votes work
- [ ] **Avatar upload**: confirm photo selection, crop, and upload land on the user's profile
- [ ] **Issue report**: confirm a report submits and appears in the backend admin queue
- [ ] **Forgot password**: confirm the in-app browser opens the correct reset page

**19d — Crash and error monitoring (optional but recommended)**

- [ ] Consider adding `expo-updates` for over-the-air (OTA) fixes after store approval — this
      allows JS-layer bug fixes to ship without a full store review cycle
- [ ] Consider adding Sentry (`@sentry/react-native`) for production crash reporting — the free
      tier covers small apps and gives a stack trace for every crash
- [ ] If either is added, confirm they do not trigger additional permission prompts or store
      policy questions

Done means the production build is confirmed working end-to-end against the live backend on real
hardware, and any last-minute issues are fixed before submission.

---

## Phase 20: Store Submission

Suggested branch: none — this is entirely done in App Store Connect and Play Console

Purpose: submit the verified production build to both stores and respond to any reviewer
feedback.

### Work items

**20a — iOS submission**

- [ ] Upload the production IPA to App Store Connect using `eas submit --platform ios` or
      Transporter
- [ ] Complete the "What's new in this version" field (first version: describe the app, not
      changes)
- [ ] Select the build in App Store Connect and click "Submit for Review"
- [ ] Standard review time: 24–48 hours; expedited review available if a critical issue is
      discovered post-launch

**20b — Android submission**

- [ ] Upload the AAB to Play Console in the Production track using
      `eas submit --platform android` or manual upload
- [ ] Write release notes
- [ ] Roll out to 100% of users (or start with a staged rollout at 10–20% if preferred)
- [ ] Standard review time: 3–7 days for a new app

**20c — Reviewer response plan**

Common rejection reasons to be prepared for:

- [ ] **"App does not work as described"** — ensure every feature shown in screenshots works in
      the submitted build
- [ ] **"Login required to review"** — create a dedicated reviewer account with pre-loaded data
      (a reading list, a forum post, a vote) and include the credentials in the review notes
- [ ] **"Privacy policy not accessible"** — confirm `https://www.toonranks.com/privacy` loads
      without login
- [ ] **"Missing account deletion flow"** — both Apple and Google require users to be able to
      delete their account from within the app or via a clearly linked web page; add a
      "Delete account" option to Settings or link to a web page that handles it
- [ ] **"Guideline 4.0 — Design"** (Apple only) — may flag UI issues on specific device sizes;
      address and resubmit

Done means the app is live in both the App Store and Google Play and users can download it.

---

---

## Phase 21: Settings Screen — Appearance and Account Safety

Suggested branch: `mobile-settings-preferences`

Purpose: replace the two informational placeholder rows in Settings with real controls.

### Background

`SettingsScreen` currently shows two static rows that describe future functionality but do
nothing. Both are non-interactive info cards and will not cause a store review hold, but they
should be replaced with real controls before a v2 release.

**Appearance row** ("The mobile app currently uses the dark Toon Ranks palette.")

`app.json` sets `userInterfaceStyle: "automatic"`, which passes the system color-scheme
preference to React Native. However, all color tokens are hard-coded to the dark Toon Ranks
palette, so the setting has no effect — light-mode users see the same dark UI. For v1 this is
intentional (one palette, fully tested). A future iteration should either:

- Add a light-mode palette and wire up `useColorScheme()` so the app truly follows the system, or
- Allow the user to choose a preferred theme from Settings.

**Account safety row** ("Session, sign-out, and verification controls will be expanded here.")

The logout button on the same card already handles sign-out. Controls still missing:

- View active session info (device, last signed-in date)
- Revoke all sessions (backend: `DELETE /auth/sessions`)
- Change password from mobile (currently handled via the website forgot-password flow)
- Delete account (required by both Apple and Google — see Phase 20c)

### Work items

**21a — Native theme support**

- [ ] Audit all color tokens in `src/theme/tokens.ts` and decide whether a full light palette is
      in scope
- [ ] If yes: implement `useColorScheme()` conditional token sets and update `userInterfaceStyle:
"automatic"` behavior so the toggle actually changes the visible palette
- [ ] If no for v1: update Appearance row copy to "Dark theme — light theme coming in a future
      update" and leave the row non-interactive

**21b — Account safety controls**

- [ ] Add `deleteAccount()` → `DELETE /auth/me` (or equivalent) to `src/api/auth.ts` and add a
      "Delete account" destructive option to Settings, guarded by a confirmation Alert; this is
      mandatory for both Apple and Google store policies (see Phase 20c)
- [ ] Add change-password entry point that opens the website reset flow via in-app browser
      (same pattern as forgot-password)
- [ ] Session info and multi-session revocation can be deferred to a later slice unless the
      backend ships the relevant endpoint sooner

Done means Settings contains real, working controls rather than informational placeholders, and
the delete-account path satisfies App Store and Play Store policy requirements.

---

## Phase 22: Genre Browsing

Suggested branch: `backend-rankings-genre-param` then `mobile-genre-filter`

Purpose: let mobile users filter rankings by genre the same way the website does, without the
data-completeness problem that comes from client-side filtering on a paginated list.

### Background

The website (`FilteredSeriesPage`) derives genres from already-loaded items and filters the
display array client-side. This works on web because `InfiniteScroll` auto-loads as the user
scrolls, so the genre set grows automatically. On mobile, ranking pages are paginated with an
explicit "Load more" button — applying a client-side genre filter after loading only the first
page (20 items) would show a dangerously incomplete slice (e.g. 2 of 10 "Horror" titles).
The mobile type-rail filter (All / Manga / Manhwa / Manhua) is the correct level of filtering
for v1.

### Why server-side genre param is required first

The backend `/series/rankings` endpoint currently accepts only `page`, `page_size`, and `type`.
Adding a `genre` query param that filters `Series.genre` with a case-insensitive substring match
lets the mobile app reset the list and fetch page 1 of only the matching titles — exactly like
how `type` filtering works today. Without this, every genre-filter result on mobile would be
misleadingly incomplete.

### Work items

**22a — Backend: `genre` param on `/series/rankings`**

Suggested branch: `backend-rankings-genre-param`

- [ ] Add `genre: Optional[str] = Query(None)` to `get_ranked_series` in `series_routes.py`
- [ ] When `genre` is present, add `Series.genre.ilike(f"%{genre}%")` to the filter clause
      (same pattern used by the search endpoint)
- [ ] Add a backend test: request with `?type=MANGA&genre=action` returns only manga whose genre
      field contains "action" (case-insensitive)

**22b — Mobile API: pass `genre` to `fetchRankings`**

Suggested branch: `mobile-genre-filter`

- [ ] Add optional `genre?: string` to `fetchRankings()` in `src/api/series.ts`
- [ ] Pass `genre` in the `params` object alongside `type`

**22c — Mobile UX: genre strip below the type rail on HomeScreen**

- [ ] Derive the genre list from already-loaded ranking items using the same
      dedup/canonicalize logic as the website's `GenreStrip` component
- [ ] Render a second horizontal `ScrollView` pill strip below the existing type rail, only when
      there is at least one genre to show
- [ ] Tapping a genre pill resets `queryKey` to `["rankings", activeType, activeGenre]` and
      re-fetches from page 1 — identical to how the type rail works today
- [ ] "ALL" pill (or deselecting the active pill) clears the genre filter
- [ ] The genre list should be derived from the full loaded set, not just the first page — if
      the user has loaded more items, those genres also appear in the strip

Done means mobile users can narrow rankings by genre with accurate, server-filtered results, and
the strip works reliably because the backend drives pagination, not client-side array slicing.

---

## Working Rules For Future Phases

- Do not claim login, voting, lists, or forum posting work until the app has a real stored session.
- Keep using the production backend contracts unless a backend change is explicitly part of the phase.
- Keep phases branch-sized, but avoid tiny branches that only rename copy or move one small style.
- After each phase, provide:
  - what changed
  - what to verify in the emulator
  - commands run
  - commit message
  - short PR description
- Run `npm run format`, `npm run lint`, `npx tsc --noEmit`, `npm run test -- --run`, and `git diff --check` before handing back mobile work.
