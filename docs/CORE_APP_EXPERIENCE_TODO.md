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

- [ ] Add `shareReadingList(listId)` → `POST /reading-lists/:id/share` to `src/api/readingLists.ts`, returning `{ share_token, share_url }`
- [ ] Add `unshareReadingList(listId)` → `DELETE /reading-lists/:id/share` to `src/api/readingLists.ts`

**14b — Share toggle UI**

- [ ] In `ReadingListsScreen`, add a share toggle per list row (icon or pill) that reflects the list's current `is_public` state
- [ ] Tapping the toggle on a private list calls `shareReadingList`, shows a loading state, then presents the returned `share_url` in a native share sheet (`Share.share`) or copies it to the clipboard
- [ ] Tapping the toggle on a public list calls `unshareReadingList` and reverts the `is_public` indicator
- [ ] Handle errors with an alert

**14c — Public reading list viewer screen**

- [ ] Add `PublicReadingList: { token: string }` to `RootStackParamList` in `RootNavigator.tsx`
- [ ] Create `src/screens/PublicReadingListScreen.tsx` that calls `getPublicReadingList(token)` and renders the list items in the same style as `ReadingListDetailScreen`, but read-only (no edit/remove actions)
- [ ] Each item should be tappable and navigate to `SeriesDetail`
- [ ] Show the list owner's username and list name in the screen header
- [ ] Handle not-found and private-list error states clearly

**14d — Deep link handling**

- [ ] Register the `toonranks://lists/:token` deep link scheme in `app.json` under `expo.scheme`
- [ ] Add a linking config entry in the navigation setup so `toonranks://lists/:token` routes to `PublicReadingList` with the correct `token` param
- [ ] Verify the link opens correctly from a browser and from the native share sheet output

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

| Path                         | Approach                                                                |
| ---------------------------- | ----------------------------------------------------------------------- |
| Username + password          | Native form → new backend endpoint → JWT/refresh token                  |
| Google Sign-In               | Native Google SDK → ID token → new backend endpoint → JWT/refresh token |
| hCaptcha (username/password) | Native hCaptcha SDK (no browser needed)                                 |

Signup uses the same paths. The existing web-auth bridge is kept as a fallback for edge cases
(e.g. password reset, email verification) but should not appear during the normal login/signup flow.

### Phase 15a — Backend: native credential endpoints

Suggested branch: `backend-native-auth-endpoints`

- [ ] Add `POST /auth/native/login` — accepts `{ username, password, captcha_token }`, verifies
      hCaptcha server-side, validates credentials, returns the same `{ access_token, refresh_token,
user }` shape as the existing mobile auth-code exchange endpoint.
- [ ] Add `POST /auth/native/signup` — accepts `{ username, email, password, captcha_token }`,
      verifies hCaptcha, creates the account, returns `{ access_token, refresh_token, user }`.
- [ ] Add `POST /auth/native/google` — accepts `{ id_token }` (Google Sign-In ID token from the
      native SDK), verifies with Google, creates or links account, returns
      `{ access_token, refresh_token, user }`.
- [ ] Rate-limit all three endpoints with the same brute-force protections used on the web login.
- [ ] Add tests for valid credentials, wrong password, unknown user, expired captcha, duplicate
      signup email/username, and Google token validation failure.
- [ ] Document the three endpoint contracts in `docs/MOBILE_AUTH_CONTRACT.md` (add a
      "native credential endpoints" section alongside the existing mobile auth-code section).

### Phase 15b — Mobile: hCaptcha SDK integration

Suggested branch: `mobile-native-login`

- [ ] Install `@hcaptcha/react-native-hcaptcha` (or the most-maintained community equivalent for
      Expo managed workflow).
- [ ] Wrap the SDK in a shared `useHCaptcha()` hook that triggers the challenge, awaits the token,
      and returns `{ token, error }`.
- [ ] Keep the sitekey in an environment variable (`EXPO_PUBLIC_HCAPTCHA_SITE_KEY`) so it is not
      hard-coded in the bundle.
- [ ] Handle captcha dismissal (user closes challenge) as a cancellation, not an error.

### Phase 15c — Mobile: native login screen

Suggested branch: `mobile-native-login`

- [ ] Replace the current "Continue to login" browser-launch button in `LoginScreen` with:
  - Email/username `TextInput`
  - Password `TextInput` with show/hide toggle
  - "Log in" primary `AppButton`
- [ ] On submit: trigger hCaptcha challenge via `useHCaptcha()`, then call `POST /auth/native/login`
      with `{ username, password, captcha_token }`.
- [ ] On success: store `access_token`, `refresh_token`, and `user` via `AuthProvider` (same path
      as the existing auth-code exchange).
- [ ] Show inline field validation: empty fields, password too short, captcha failure.
- [ ] Show a loading state on the "Log in" button while the request is in flight.
- [ ] Keep "Forgot password?" as a web-bridge link (existing Phase 2.6 behaviour).
- [ ] Keep the "Sign up" link navigating to the native signup screen (Phase 15d).

### Phase 15d — Mobile: native signup screen

Suggested branch: `mobile-native-login`

- [ ] Update `SignupScreen` (currently mirrors the login browser bridge) with:
  - Username `TextInput`
  - Email `TextInput`
  - Password `TextInput` with show/hide toggle
  - "Create account" primary `AppButton`
- [ ] On submit: trigger hCaptcha challenge, then call `POST /auth/native/signup`.
- [ ] On success: store session and navigate to the home tab (same as login success).
- [ ] Show server-returned validation errors inline (username taken, email already registered, etc.).

### Phase 15e — Mobile: native Google Sign-In

Suggested branch: `mobile-native-login`

- [ ] Install `@react-native-google-signin/google-signin` (Expo config plugin available; works in
      managed workflow with EAS build).
- [ ] Add the plugin to `app.json` with the correct iOS `iosClientId` and Android client ID.
- [ ] Add a "Continue with Google" button to both `LoginScreen` and `SignupScreen`.
- [ ] On press: call `GoogleSignin.signIn()`, extract the `idToken` from the result, then call
      `POST /auth/native/google` with `{ id_token }`.
- [ ] Handle Google sign-in cancellation (user dismisses the picker) as a no-op.
- [ ] No hCaptcha is required for the Google path — the Google ID token is sufficient proof of
      identity.

### Phase 15f — Cleanup

- [ ] Remove or hide the `openWebAuthBridge` login/signup path from the normal UI flow (keep it
      available for password reset and email verification only).
- [ ] Update `LoginScreen` and `SignupScreen` copy to remove references to "continuing to the
      website".
- [ ] Smoke-test both native flows (username/password and Google) against the production backend on
      Android and iOS emulators before submitting to stores.
- [ ] Update `docs/MOBILE_SESSION_STRATEGY.md` to reflect the new native-credential flow alongside
      the existing auth-code exchange.

Done means a user can create an account or sign in entirely within the native app without seeing a
browser, the session is indistinguishable from a web session (same JWT/refresh pattern), and the
experience meets App Store reviewer expectations for first-party credential flows.

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
