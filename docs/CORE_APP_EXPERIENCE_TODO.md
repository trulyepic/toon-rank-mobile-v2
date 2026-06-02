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

The biggest remaining product blockers are app-store readiness checks, native avatar upload,
Rankers/Cred Point parity, public profiles, and the remaining forum parity slices
(categories/sort, reporting, follows/bookmarks, notifications, read state, and richer composer
tools).

## Status Summary (current)

_Last reviewed: June 2026, after auditing the app code against this roadmap._

### Fully complete (Phases 1–37 + 28)

All core product features are implemented with real API integration, React Query state, and
loading/error/empty states:

| Area                                                                           | Status  |
| ------------------------------------------------------------------------------ | ------- |
| Auth (native login, signup, Google Sign-In, refresh tokens, forgot password)   | ✅ Done |
| Series rankings, search, genre filter, series detail                           | ✅ Done |
| Voting (1–10 per category, locked after vote, signed-out guard)                | ✅ Done |
| Reading lists (view, create, delete, add/remove items, chapter tracking)       | ✅ Done |
| Reading list sharing (public/private toggle, share sheet, share link)          | ✅ Done |
| Reading list filter/sort (type, status, score, sort order)                     | ✅ Done |
| Public reading list viewer + deep link (`toonranks://lists/:token`)            | ✅ Done |
| Compare (up to 4 series, side-by-side)                                         | ✅ Done |
| Forum (threads, replies, nested replies, markdown/media, up/down votes)        | ✅ Done |
| Forum thread management (edit, delete, lock, pin, latest-first, categories)    | ✅ Done |
| Forum search (thread search, post-content search, user @-mention autocomplete) | ✅ Done |
| Forum image/GIF upload                                                         | ✅ Done |
| Forum follow threads, bookmark posts                                           | ✅ Done |
| Forum post reporting + admin report queue                                      | ✅ Done |
| Forum unread badges + mark-read tracking                                       | ✅ Done |
| Forum activity screen (Threads / Replies / Votes / Following / Saved tabs)     | ✅ Done |
| Notifications (bell, unread badge, mark-read, mark-all-read)                   | ✅ Done |
| Profile (avatar upload/reset, preset picker, username change, pinned faves)    | ✅ Done |
| Series ratings on profile                                                      | ✅ Done |
| Leaderboard + Cred Points + ranker badges in forum                             | ✅ Done |
| Public profiles (avatar, role, CP/rank chips, pinned favorites, public lists)  | ✅ Done |
| Settings (delete account, change password via in-app browser)                  | ✅ Done |
| Issue reporting + public issue tracker                                         | ✅ Done |
| About, How Rankings Work, NotFound screens                                     | ✅ Done |
| Theme picker (Violet / Classic / Amber, persisted)                             | ✅ Done |
| Contributor series submission + My Submissions                                 | ✅ Done |
| App store config (bundle IDs, splash/icon assets, iOS encryption declaration)  | ✅ Done |
| Android production build (APK/AAB confirmed)                                   | ✅ Done |

### Blocked on external prerequisites (not code gaps)

| Item                                                  | Blocker                                                 |
| ----------------------------------------------------- | ------------------------------------------------------- |
| iOS production build + TestFlight (Phase 19b)         | Apple Developer account ($99/yr)                        |
| App Store Connect listing, screenshots, age rating    | Apple Developer account                                 |
| Google Play Console listing, screenshots, data safety | Google Play Developer account ($25)                     |
| Phase 16 — email verification deep link back to app   | App live in stores + Universal/App Links verified first |

### Remaining enhancement phases (not core — optional for MVP)

These are being worked next, in order. **Phase 28.5 (admin pending titles + role management) is
deferred to much later** by product decision.

| Phase    | What it adds                                                                      | Status      |
| -------- | --------------------------------------------------------------------------------- | ----------- |
| **38**   | Reading-list quick-add on home/search cards; type-page decision; regression tests | ✅ Done     |
| **39**   | Draft persistence (done); quote-reply, reading-list insertion, keyboard polish    | In progress |
| **40**   | Admin issue triage controls (currently read-only by design)                       | Planned     |
| **41**   | Deep-link handling for more routes (series, threads, profiles, reset-password)    | Planned     |
| **28.5** | Admin pending titles review + user role management                                | Deferred    |

### Minor open items inside core phases

| Item                                          | Notes                                                     |
| --------------------------------------------- | --------------------------------------------------------- |
| Phase 5.5 — markdown regression tests         | Two test items never written                              |
| Phase 21 — session info / revoke-all-sessions | Backend `DELETE /auth/sessions` may not be live; deferred |

## Design Direction — Violet/Indigo Theme (Option A)

**Decision (June 2026):** Replace the generic blue-navy colour palette with a deep violet/indigo
identity. Rationale:

- The original blue-on-blue-on-dark-navy palette was generic and lacked personality.
- Amber-gold (Option B) was tried first but not preferred.
- Violet/indigo reads as premium and distinctive — used by apps like Linear, Notion, and Luma.
- The dark violet background (`#0f0e14`) is a subtle but meaningful shift from cold navy — it
  gives the app depth and a richer night-mode feel.
- `accentStrong: "#a78bfa"` (violet-400) is soft enough not to be garish but distinct enough
  to replace the generic `#5f88ff` blue convincingly.

**Palette change summary:**

| Token                       | Before                 | After                           |
| --------------------------- | ---------------------- | ------------------------------- |
| `background`                | `#101216` (cold navy)  | `#0f0e14` (deep violet-dark)    |
| `surface`                   | `#1a1f2a` (blue-gray)  | `#1a1828` (violet-dark)         |
| `surfaceRaised`             | `#202737` (blue-gray)  | `#221f35` (violet-raised)       |
| `accent` (surface bg)       | `#315fdc` (blue)       | `#1e1a3a` (dark violet)         |
| `accentStrong` (icons/text) | `#5f88ff` (blue)       | `#a78bfa` (violet-400)          |
| `accentBorder`              | `#6d93ff` (blue)       | `#5b45b8` (violet-border)       |
| `text`                      | `#f7f9fc` (cold white) | `#f4f2ff` (violet-tinted white) |
| `textMuted`                 | `#aeb8ca` (blue-gray)  | `#a8a4c4` (violet-muted)        |

Semantic colours (`success`, `warning`, `danger`, `credText`) are unchanged.

---

## Web-To-Mobile Parity Index

Use this index before adding new phases. It maps major website features to the mobile roadmap so
future work does not miss or duplicate large feature areas.

| Website feature area                                                  | Mobile status                                                         | TODO phase        |
| --------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------- |
| Auth, signup, and longer mobile sessions                              | Mostly implemented; refresh/session hardening tracked                 | Phases 1, 2, 2.5  |
| Series ratings and category voting                                    | Implemented                                                           | Phase 3           |
| Reading lists and public list sharing                                 | Mostly implemented; list detail filter/sort still tracked             | Phases 4, 14, 25  |
| Forum posting, replies, nested replies, markdown/media, up/down votes | Mostly implemented; markdown regression tests still tracked           | Phases 5, 6, 27   |
| Forum thread sort, pinned threads, categories, category management    | Missing on mobile                                                     | Phase 30          |
| Forum follow, post bookmarks, saved/following activity tabs           | Missing on mobile                                                     | Phase 31          |
| Forum post reporting and admin report queue                           | Missing on mobile                                                     | Phases 32, 36     |
| Forum notifications, unread counts, read-state badges                 | Missing on mobile                                                     | Phases 33, 34     |
| Forum post-content search and user mention autocomplete               | Missing on mobile                                                     | Phase 35          |
| Rankers leaderboard, Cred Points, rank chips, ranker badges           | Missing on mobile                                                     | Phase 23          |
| Public user profiles and pinned favorite series                       | Missing on mobile                                                     | Phase 24          |
| My submissions, contributor title submission flow                     | Missing on mobile; edit submission and synopsis steps incomplete      | Phase 28          |
| Admin pending title review and user role management                   | Not in mobile — future work                                           | Phases 28.5, 36   |
| Public issue tracker view and optional admin issue triage             | Public read-only tracker implemented; admin triage intentionally open | Phases 21, 26, 40 |
| Public info pages, route/deep-link parity, fallback screens           | Partially implemented; Terms/Privacy and public list deep link exist  | Phases 37, 41     |

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
- [x] Public/private share controls implemented in Phase 14 (share toggle, share link, unshare).

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
- [x] Smoke-test both native flows (username/password and Google) against the production backend on
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
- [ ] Add a `VerifiedScreen` or navigate to `Login` with a "Account verified - you can now log in"
      banner when the deep link fires
- [ ] Pass `source: "mobile"` in the `signup()` call from `SignupScreen.tsx`

Done means a mobile-registered user who taps the confirmation email on their phone is taken
directly back into the app, while a web-registered user or anyone opening the link on a desktop
continues through the normal website flow.

---

## Phase 17: App Store Build Configuration (Hard Blockers)

Suggested branch: `mobile-store-build-config`

Purpose: resolve every configuration gap that would cause an App Store or Play Store rejection
before a single reviewer sees the app. These are all code and config changes - no external accounts
or assets required yet.

### Background

Four hard blockers were identified in the May 2026 store-readiness audit:

1. **No real asset files.** `app.json` references `assets/icon.png`, `assets/splash.png`, and
   `assets/adaptive-icon.png`. The folder only contains `ASSET_SPEC.md`. A production EAS build
   will fail without the real files. Asset creation is design work handled separately; the spec is
   documented in `assets/ASSET_SPEC.md`.
2. **Missing iOS encryption declaration.** Apple requires every app to declare whether it uses
   non-exempt encryption. The app uses only standard HTTPS - the correct declaration is
   `ITSAppUsesNonExemptEncryption: false` in `app.json`. Without it Apple holds the submission for
   French export compliance paperwork that does not apply.
3. **`supportsTablet: true` without iPad testing.** Apple requires iPad screenshots and tests the
   app on iPad when this flag is set. If the layout has not been verified on tablet, this flag must
   be set to `false` for v1 to avoid a rejection on tablet-specific layout issues.
4. **Placeholder settings copy.** Settings should not advertise unavailable controls. App Store
   reviewers sometimes request a demo of features shown in the UI. For v1, unavailable settings
   should either be removed or clearly marked as future work without tappable behavior.

### Work items

**17a - iOS encryption declaration**

- [x] Add `"ITSAppUsesNonExemptEncryption": false` to `ios.infoPlist` in `app.json`
- [x] Confirm no custom encryption libraries are used anywhere in the dependency tree

**17b - Tablet support decision**

- [x] Test the full app on an iPad simulator (all tabs, all modals, all forms)
- [x] If layout needs work: set `supportsTablet: false` in `app.json` for v1; add a tablet
      optimisation phase before v2

**17c - Placeholder settings copy**

- [x] Remove the "Notifications" settings row from `SettingsScreen.tsx` for v1, or replace the
      body copy with "Coming in a future update" and disable any tappable behavior so reviewers
      cannot interact with a non-functional feature

**17d - EAS account and project link**

- [x] Create a free Expo account at expo.dev if one does not already exist
- [x] Run `npm install -g eas-cli` to install the EAS CLI globally
- [x] Run `eas login` to authenticate
- [x] Run `eas build:configure` inside the mobile project to link the project to the Expo account
      and generate the project ID in `app.json`
- [x] Confirm `eas build --platform android --profile preview` produces a working APK before
      attempting a production build

**17e - Real asset files**

- [x] Produce `assets/icon.png` at 1024×1024 px, no transparency (see `assets/ASSET_SPEC.md`)
- [x] Produce `assets/adaptive-icon.png` at 1024×1024 px, logo within inner 66% safe zone
- [x] Produce `assets/splash.png` at 1284×2778 px, background `#17110f`, logo centered
- [x] Run `npx expo start` and confirm assets render correctly on both Android and iOS simulators
- [x] Run `eas build --platform android --profile preview` and confirm the APK installs and
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

- [x] Run `eas build --platform android --profile production` to produce an AAB (Android App
      Bundle) — this is what the Play Store requires
- [x] Also run `eas build --platform android --profile preview` to produce an APK for direct
      install and testing on a physical device or emulator
- [x] Install the preview APK on a real Android device or emulator and confirm it launches

**19b — iOS production build**

- [ ] Run `eas build --platform ios --profile production`
- [ ] Install on a real iOS device via TestFlight (requires the app record to exist in App Store
      Connect and the device to be added as a tester)
- [ ] Confirm it launches without the Expo splash being replaced by a blank screen

**19c — Smoke test all critical flows against production backend**

Test every flow that touches the real backend — do not use a staging or mock environment:

- [ ] **Signup**: create a new account, receive verification email, verify, log in
- [x] **Login**: log in with verified credentials; confirm session persists after app restart
- [ ] **Refresh token**: force an access token expiry (or wait) and confirm the session refreshes
      silently rather than logging the user out
- [x] **Logout**: confirm session is cleared and the user is returned to the signed-out state
- [x] **Home rankings**: confirm titles load, type filters work, load-more works
- [x] **Search**: confirm results load and tapping a result navigates to Series Detail
- [x] **Series Detail**: confirm summary, detail, voting, and save-to-list work
- [x] **Reading lists**: confirm lists load, items show, add/remove/chapter edit work, share works
- [x] **Forum**: confirm threads load, replies work, create thread works, votes work
- [x] **Avatar upload**: confirm photo selection, crop, and upload land on the user's profile
- [x] **Issue report**: confirm a report submits and appears in the backend admin queue
- [x] **Forgot password**: confirm the in-app browser opens the correct reset page

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
- [x] If no for v1: update Appearance row copy to "Dark theme — light theme coming in a future
      update" and leave the row non-interactive

**21b — Account safety controls**

- [x] Add `deleteAccount()` → `DELETE /auth/me` (or equivalent) to `src/api/auth.ts` and add a
      "Delete account" destructive option to Settings, guarded by a confirmation Alert; this is
      mandatory for both Apple and Google store policies (see Phase 20c)
- [x] Add change-password entry point that opens the website reset flow via in-app browser
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

- [x] Add `genre: Optional[str] = Query(None)` to `get_ranked_series` in `series_routes.py`
- [x] When `genre` is present, add `Series.genre.ilike(f"%{genre}%")` to the filter clause
      (same pattern used by the search endpoint)
- [x] Add a backend test: request with `?type=MANGA&genre=action` returns only manga whose genre
      field contains "action" (case-insensitive)

**22b — Mobile API: pass `genre` to `fetchRankings`**

Suggested branch: `mobile-genre-filter`

- [x] Add optional `genre?: string` to `fetchRankings()` in `src/api/series.ts`
- [x] Pass `genre` in the `params` object alongside `type`

**22c — Mobile UX: genre strip below the type rail on HomeScreen**

- [x] Derive the genre list from already-loaded ranking items using the same
      dedup/canonicalize logic as the website's `GenreStrip` component
- [x] Render a second horizontal `ScrollView` pill strip below the existing type rail, only when
      there is at least one genre to show
- [x] Tapping a genre pill resets `queryKey` to `["rankings", activeType, activeGenre]` and
      re-fetches from page 1 — identical to how the type rail works today
- [x] "ALL" pill (or deselecting the active pill) clears the genre filter
- [x] The genre list should be derived from the full loaded set, not just the first page — if
      the user has loaded more items, those genres also appear in the strip

Done means mobile users can narrow rankings by genre with accurate, server-filtered results, and
the strip works reliably because the backend drives pagination, not client-side array slicing.

---

## Phase 23: Community Leaderboard And Cred Points

Suggested branch: `mobile-community-leaderboard`

Purpose: bring the Rankers leaderboard, Cred Point display, and ranker badges to mobile, matching
the features shipped to the production website in May 2026.

### Background - what was built on the web

**Backend changes (already live, no further backend work needed):**

| Endpoint                                     | Returns                                                                                                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /users/leaderboard?page=1&page_size=50` | Paginated leaderboard ranked by `cred_score` descending. Each item includes `rank`, `username`, `role`, `avatar_url`, `avatar_preset`, `cred_score`, `post_count`, `series_rated`. Admins are excluded. |
| `GET /users/{username}`                      | Public profile. Includes `cred_score`, `rank`, and `post_count` for profile headers and account summaries.                                                                                              |

**Frontend additions on web:**

- **Leaderboard page** (`/leaderboard`): top-3 podium spotlight cards arranged #2 / #1 / #3 so #1 is centred and taller. Below that, a paginated ranked list (#4 onward) shows avatar, username, CP, series rated, and post count.
- **CP + rank chips on public user profiles** (`/user/:username`): CP chip and #N Ranker chip in the profile header, both linking to the leaderboard.
- **CP + rank chips on own account page** (`/account`): same chips in the left panel, fetched via the public profile endpoint since `cred_score` and `rank` are not in the JWT payload.
- **Ranker badges in forum bylines**: diamond symbol for top-3 users and muted `#N` text for ranks 4-10. Shown next to usernames in the thread list and in all post/reply bylines. The rank map is fetched once per session and cached.

### Work items

**23a - API layer**

- [x] Add `LeaderboardUser` and `LeaderboardPage` types to `src/types/account.ts`.
- [x] Add `PublicProfile` type with `cred_score`, `rank`, and `post_count` to `src/types/account.ts`.
- [x] Add `getLeaderboard(page, pageSize)` and `getPublicProfile(username)` to `src/api/users.ts`.

**23b - Leaderboard screen**

- [x] Create `src/screens/LeaderboardScreen.tsx`.
- [x] Add a top-3 podium arranged #2 / #1 / #3 with #1 visually taller/elevated.
- [x] Show avatar, role-colored username, CP, post count, and series rated on podium cards.
- [x] Add ranked list rows for #4+ using `useInfiniteQuery` and a `Load more` button.
- [x] Add loading, error, and empty states.
- [x] Follow-up polish: add mobile-native gold/silver/bronze podium styling, warmer CP chips,
      and more colorful rank badges inspired by the website leaderboard.
- [x] Add podium/list card taps to native public profiles after Phase 24 adds `PublicProfileScreen`.

**23c - Add Leaderboard to navigation**

- [x] Add `Leaderboard: undefined` to `RootStackParamList` in `RootNavigator.tsx`.
- [x] Register `LeaderboardScreen` in `RootNavigator.tsx`.
- [x] Add a `Rankers` row in `MoreScreen`.

**23d - CP and rank display on profile screens**

- [x] On `ProfileScreen` (own account), fetch the public profile by username.
- [x] Show CP and `#N Ranker` chips under the identity card when data is available.
- [x] Make the chips navigate to `LeaderboardScreen`.
- [x] Add the same chips to native public profile headers after Phase 24 adds public profiles.

**23e - Ranker badges in forum bylines**

- [x] Create `useTopRankMap()` in `src/hooks/` backed by React Query cache.
- [x] Create `RankerBadge` in `src/components/`.
- [x] Add `RankerBadge` next to usernames in `ForumScreen` thread row bylines.
- [x] Add `RankerBadge` next to usernames in `ForumThreadScreen` hero, original post, and reply bylines.

**23f - Emulator test steps**

1. Open `More` -> `Rankers` and confirm the leaderboard screen loads.
2. Confirm top-3 podium cards show avatars, role-colored names, CP values, post counts, and rated counts.
3. Confirm the #1 card is visually taller/elevated compared with #2 and #3.
4. Scroll down and tap `Load more` if available; confirm additional ranks append.
5. Open `More` -> `Profile` while signed in; confirm CP and rank chips show under your identity card and tapping them opens `Rankers`.
6. Open `Forum`; confirm top-10 ranked users show a small diamond or `#N` badge next to their usernames.
7. Open a thread by a ranked user; confirm the badge appears in the thread hero, original post, and reply bylines.
8. Sign out and confirm `More` -> `Rankers` is still accessible because the leaderboard is public.

Done means mobile users can browse the community leaderboard natively, see Cred Points and rank on their profile, and immediately identify top-ranked contributors in forum discussions. Public profile navigation remains tracked in Phase 24.

---

## Phase 24: Public User Profiles And Pinned Favorites

Suggested branch: `mobile-public-profiles`

Purpose: let mobile users view any member's public profile — avatar, role, Cred Points, rank, post
count, join date, pinned favorite series grid, and public reading lists — and let signed-in users
manage their own pinned favorites from their profile screen. Matches the feature set already live on
the production website.

### Background — what was built on the web

**Backend (already live, no further backend work needed):**

| Endpoint                                 | Auth     | Description                                                                                                                                                                                              |
| ---------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /users/{username}`                  | None     | Public profile. Returns `username`, `role`, `avatar_url`, `avatar_preset`, `registered_at`, `cred_score`, `rank`, `post_count`, `favourites` (pinned series array), `reading_lists` (public-only array). |
| `GET /auth/me/favourites`                | Required | Returns the signed-in user's pinned series in position order.                                                                                                                                            |
| `PUT /auth/me/favourites`                | Required | Atomically replaces pinned series with the provided ordered `series_ids` array. Max 15.                                                                                                                  |
| `DELETE /auth/me/favourites/{series_id}` | Required | Removes a single pinned series and re-compacts positions.                                                                                                                                                |

**Frontend features on web:**

- **Public profile page** (`/user/:username`):
  - Header card with role-colored accent strip, avatar, username (role-colored gradient), role badge,
    CP chip (amber, navigates to `/leaderboard`), rank chip (slate, navigates to `/leaderboard`),
    post count, join date.
  - Pinned favorites section: grid of up to 15 series cover images (2 cols mobile → 3 tablet →
    5 desktop). Each card taps through to the series detail page. Hover overlay shows title.
  - Public reading lists section: only shows if the user has at least one public list. Each row is a
    tappable card showing list name and item count; navigates to the shared list view.
  - Accessible from forum author bylines (clicking a username) and leaderboard cards.
- **Own account favorites management** (`/account` → Pinned Favorites section):
  - Shows current pinned series with reorder handles and remove (×) buttons.
  - "+" button opens a series search modal; selecting a series appends it to the end.
  - Uses `PUT /auth/me/favourites` for both add (append) and `DELETE /auth/me/favourites/{series_id}` for
    removal. Max 15 pins.

### Work items

**24a — API layer and types**

- [x] In `src/types/account.ts`, add the following (if not already present from Phase 23):

  ```ts
  export interface FavoriteSeries {
    series_id: number;
    position: number;
    title: string;
    cover_url: string | null;
    type: string | null;
  }

  export interface PublicReadingListPreview {
    name: string;
    item_count: number;
    share_token: string;
  }

  export interface PublicProfile {
    username: string;
    role: string;
    avatar_url: string | null;
    avatar_preset: string | null;
    registered_at: string | null;
    cred_score: number;
    rank: number | null;
    post_count: number;
    favourites: FavoriteSeries[];
    reading_lists: PublicReadingListPreview[];
  }
  ```

- [ ] In `src/api/users.ts` (create if it doesn't exist), add:
  - [x] `getPublicProfile(username: string): Promise<PublicProfile>`
  - [x] `getMyFavorites(): Promise<FavoriteSeries[]>`
  - [x] `replaceMyFavorites(seriesIds: number[]): Promise<FavoriteSeries[]>`
  - [x] `removeMyFavorite(seriesId: number): Promise<FavoriteSeries[]>`
  - `getPublicProfile(username: string): Promise<PublicProfile>` → `GET /users/{username}`
  - `getMyFavorites(): Promise<FavoriteSeries[]>` → `GET /auth/me/favourites`
  - `replaceMyFavorites(seriesIds: number[]): Promise<FavoriteSeries[]>` → `PUT /auth/me/favourites`
    with body `{ series_ids: seriesIds }`
  - `removeMyFavorite(seriesId: number): Promise<FavoriteSeries[]>` →
    `DELETE /auth/me/favourites/{seriesId}`
- [ ] In Phase 23's `src/api/users.ts` (or `auth.ts`), `getPublicProfile` may already exist — check
      and consolidate into one file before adding duplicates.

**24b — PublicProfileScreen**

- [x] Create `src/screens/PublicProfileScreen.tsx`
- [x] Fetch `getPublicProfile(username)` with `useQuery`. Show a skeleton while loading; show a
      centered "User not found" state with a back button on 404.
- [x] **Profile header card:**
  - Role-colored accent strip at the top (amber for ADMIN, blue for CONTRIBUTOR, muted for GENERAL).
  - `UserAvatar` (size `xl`), username in role-colored text (match the gradient/color logic from
    `RankerBadge` and forum bylines), role badge pill, CP chip (`◆ N CP`, amber, taps to
    `LeaderboardScreen`), rank chip (`#N Ranker`, slate, taps to `LeaderboardScreen`) — only shown
    when `cred_score > 0` / rank is set, post count, join date (formatted as "Month D, YYYY").
- [x] **Pinned Favorites section:**
  - Section heading "Favorite Series". If `favourites` is empty, show muted text
    `"{username} hasn't pinned any series yet."`.
  - Grid: 2 columns (mobile). Each cell is a pressable cover image card with `aspectRatio: 2/3`,
    rounded corners, `SeriesCoverImage` or `Image` component. On press navigate to
    `SeriesDetail` with the `series_id`.
  - Show a title label overlay on long-press (or use a bottom overlay that fades in on press for
    discoverability).
- [x] **Public Reading Lists section:**
  - Only render this section when `reading_lists.length > 0`.
  - Section heading "Reading Lists", sub-heading "Shared lists from {username}."
  - Each list renders as a pressable row card: list name (bold), item count (muted), trailing arrow.
  - On press: navigate to the shared list view (use `PublicReadingList: { token: string }` route if
    it exists, or note it as a dependency to add in a later phase).
- [ ] Show a "← Back" button or rely on the native stack back arrow (no custom back button needed if
      the navigator provides one).

**24c — Navigation and entry points**

- [x] Add `PublicProfile: { username: string }` to `RootStackParamList` in `RootNavigator.tsx` and
      register `PublicProfileScreen` in the stack.
- [x] **Forum author bylines** (from Phase 23 forum work or current implementation): tapping the
      author username in a thread row (`ForumScreen`) and in post/reply bylines
      (`ForumThreadScreen`) should navigate to `PublicProfile: { username: authorUsername }`.
- [x] **Leaderboard cards** (Phase 23, 23b): confirm that tapping a leaderboard card already
      navigates to `PublicProfile: { username }`. If it was left as a placeholder, wire it up here.
- [ ] Optionally: tapping the username on `ProfileScreen` (own profile) should NOT navigate
      anywhere — it is already the profile view.

**24d — Own profile: pinned favorites management**

- [x] On `ProfileScreen`, below the role/stats row, add a "Favorite Series" section (auth-gated —
      only visible when signed in).
- [x] Fetch `getMyFavorites()` with `useQuery` on mount. Display the same 2-column cover grid as
      `PublicProfileScreen`.
- [x] Each cover card shows a small `×` remove button in the corner. Tapping it calls
      `removeMyFavorite(series_id)`, then invalidates the query to refresh the list.
- [x] Show a "＋ Add Series" button (or an empty-slot card) when fewer than 15 series are pinned.
      Tapping it opens a series search modal (can reuse or adapt the search logic from `SearchScreen`
      or the series search already wired in Series Detail) where the user can pick a series to pin.
      On selection, call `replaceMyFavorites([...currentIds, newId])` and refresh.
- [x] Show a loading/saving indicator while any mutation is in flight; show an error toast on failure.
- [x] Note: the backend enforces max 15 pins and rejects duplicate IDs — handle the error response
      gracefully.

**24e — Emulator test steps**

1. Open the forum, tap any post's author username — confirm it navigates to that user's
   `PublicProfileScreen` and loads their profile (avatar, role badge, CP/rank chips if applicable).
2. Tap a user who has pinned favorites — confirm the cover art grid appears. Tap a cover — confirm
   it navigates to the correct `SeriesDetailScreen`.
3. Tap a user with no pinned series — confirm the "hasn't pinned any series yet" message appears.
4. Tap the CP chip or rank chip on a public profile — confirm it navigates to the Leaderboard
   screen.
5. Tap the back button — confirm it returns to the forum thread or previous screen correctly.
6. Open `LeaderboardScreen`, tap a top-3 podium card — confirm it navigates to `PublicProfileScreen`
   for that user.
7. Sign in, open own `ProfileScreen` — confirm the Favorite Series section appears.
8. Add a series via the "＋ Add Series" flow — confirm it appears in the grid and on the public
   profile (navigate to own public profile from forum to verify).
9. Remove a series via the `×` button — confirm it disappears from the grid and the list re-compacts
   without gaps.
10. Sign out — confirm the favorites management section is hidden on `ProfileScreen`, and that public
    profiles are still viewable without auth.

Done means any user can tap an author name in the forum or leaderboard and see their public profile
with pinned series cover art, and signed-in users can manage their own pinned favorites from their
profile screen, matching the production web experience.

---

## Phase 25: Reading List Detail — Filter And Sort

Suggested branch: `mobile-reading-list-filters`

Purpose: bring the filter and sort controls from the web's reading list detail view to mobile, so
users with long lists can slice and sort their titles without scrolling through everything.

### Background — what was built on the web

The web's `/my-lists` page embeds a filter+sort bar inside every expanded reading list. Controls:

- **Type filter**: Manhwa / Manga / Manhua / All
- **Status filter**: Ongoing / Complete / Hiatus / Season End / Unknown / All
- **Sort**: Default (list insertion order), Rank ↑, Rank ↓, Stars high→low, Stars low→high, Votes
  high→low, Votes low→high, Title A–Z, Title Z–A
- **Stars floor**: free-text minimum stars (e.g., `7.5` shows only titles with score ≥ 7.5 and < 8)
- **Reset** button that clears all filters to defaults

Filters apply client-side against series summary data already fetched for each item. When any filter
or sort is active, infinite pagination is disabled (only already-loaded items are shown, sorted in
memory). Pagination resumes when filters are cleared.

The mobile `ReadingListDetailScreen` currently shows items in insertion order with no filter or sort
controls.

### Work items

**25a — Filter state and logic**

- [x] Add a `FilterBar` component (or inline state block) to `ReadingListDetailScreen`:
  - `filterType: "" | "MANHWA" | "MANGA" | "MANHUA"` — picker or segmented chips
  - `filterStatus: "" | "ONGOING" | "COMPLETE" | "HIATUS" | "SEASON_END" | "UNKNOWN"` — picker
  - `sortBy: "DEFAULT" | "RANK_ASC" | "RANK_DESC" | "STARS_DESC" | "STARS_ASC" | "VOTES_DESC" |
"VOTES_ASC" | "TITLE_ASC" | "TITLE_DESC"` — picker
  - `minStars: string` — numeric text input (e.g., `"7.5"`)
  - "Reset" button that clears all four fields to their defaults
- [x] Apply filters and sort client-side against the `summaries` map already built from fetched items.
      Filtering predicate:
  - type: `summary.type === filterType` (skip if blank)
  - status: `summary.status.toUpperCase() === filterStatus` (skip if blank)
  - min stars: `summary.final_score >= parsed` and `< parsed + step` (where step depends on decimal
    precision of the input; e.g., `"7.5"` means `>= 7.5 and < 7.6`)
  - Sort: apply the chosen sort key after filtering; use `localeCompare` for title sorts; nulls last
    for numeric sorts
- [x] When any filter/sort is active, suppress the "Load more" pagination button and show a muted
      note "Load all items first to sort accurately" if `hasNextPage` is true.
- [x] Reset clears all state and re-enables pagination.

**25b — UI placement**

- [x] Show the FilterBar as a collapsible/expandable section at the top of the screen below the list
      header — collapsed by default (to keep the screen clean for users with short lists). A single
      "Sort & Filter" chip shows the active filter count as a badge when any filter is active.
- [x] Inside the expanded bar, lay out the four controls in a 2-column grid or vertical stack
      appropriate for the screen width.

**25c — Emulator test steps**

1. Open a reading list with ≥ 10 items of mixed types. Expand the filter bar. Set type = Manhwa —
   confirm only Manhwa items remain visible.
2. Set status = Ongoing — confirm combined filter (Manhwa + Ongoing) works.
3. Change sort to Stars high→low — confirm items reorder by score.
4. Set min stars to `7.5` — confirm only items with score ≥ 7.5 and < 7.6 are shown.
5. Tap Reset — confirm all items return and the list is back in default insertion order.
6. Open a reading list with < 5 items — confirm the filter bar is still accessible but gracefully
   shows results (including "no items match" if filters are too strict).

Done means users with long reading lists can filter by type or status and sort by score or rank,
matching the filtering capability of the production website.

---

## Phase 26: Issue Tracker View

Suggested branch: `mobile-issue-tracker`

Purpose: let mobile users view the public Toon Ranks issue tracker so they can see what bugs and
features have been reported, their current status, and whether their own issue is already known —
matching the `/issues` page on the web.

### Background — what was built on the web

The web's `/issues` page is **publicly accessible** (no login required). It shows:

- A "Report an Issue" button linking to the report form
- Summary count cards: Open / In Progress / Resolved / Won't Fix
- Status tab filters: All / Open / In Progress / Resolved / Won't Fix
- A search field (searches title + description)
- A type filter dropdown (Bug / Feature / Content / Other)
- A paginated table of issues showing: title, description preview, type, status badge, reported date,
  screenshot link
- Admins see: inline status change dropdown and delete button per row

**Backend endpoint (already live):**

| Endpoint                                                                       | Auth | Returns                  |
| ------------------------------------------------------------------------------ | ---- | ------------------------ |
| `GET /issues` (or `GET /issues?q=...&type=...&status=...&page=1&page_size=50`) | None | Paginated list of issues |

### Work items

**26a — API and types**

- [x] Add `Issue` type to `src/types/issue.ts` if not already there (it may already exist from the
      report screen). Ensure it includes: `id`, `title`, `description`, `type`, `status`,
      `created_at`, `screenshot_url`.
- [x] Add `listIssues(params: { q?: string; type?: string; status?: string; page?: number;
page_size?: number }): Promise<Issue[]>` → `GET /issues` to `src/api/issues.ts`

**26b — IssueTrackerScreen**

- [x] Create `src/screens/IssueTrackerScreen.tsx`
- [x] Header section: screen title "Site Updates & Known Issues", subtitle explaining what the tracker
      is for, and a "Report an Issue" button that navigates to `ReportIssue`.
- [x] Status summary row: four chips showing count of Open / In Progress / Resolved / Won't Fix.
      Tapping a chip sets the active status filter.
- [x] Filter bar: status tab pills (All / Open / In Progress / Resolved / Won't Fix), type dropdown
      or segmented control (All / Bug / Feature / Content / Other), and a search text input.
- [x] List of issue rows. Each row shows title (bold), truncated description (2 lines),
      type chip, status badge (color-coded), and reported date.
- [x] Status badge colors: Open = amber, In Progress = blue, Resolved = green, Won't Fix = muted.
- [x] Load up to 50 issues per page; show a "Load more" button when the backend returns a full page.
      Refetch when filter inputs change (debounce search by 300 ms).
- [x] Empty state when no issues match the filters.
- [x] Screenshot link: if `screenshot_url` is set on an issue, show a small camera icon that opens
      the URL in the in-app browser.
- [x] Admin status editing: admin-only — skip for mobile (the tracker is read-only on mobile).

**26c — Navigation**

- [x] Add `IssueTracker: undefined` to `RootStackParamList` in `RootNavigator.tsx` and register
      `IssueTrackerScreen`.
- [x] Add "Issue Tracker" entry to `MoreScreen` in the Support section, below "Report an Issue".
      Icon: `list-outline`. Navigate to `IssueTracker`.

**26d — Emulator test steps**

1. Open `MoreScreen` — confirm "Issue Tracker" row appears in the Support section.
2. Tap it — confirm `IssueTrackerScreen` loads with issues visible and summary counts.
3. Tap the "Open" chip in the summary row — confirm the list filters to open issues only.
4. Type a search term — confirm the list narrows to matching titles/descriptions.
5. Tap "Report an Issue" button — confirm it navigates to `ReportIssueScreen`.
6. Tap a row with a screenshot — confirm the screenshot opens in the in-app browser.
7. Sign out — confirm the issue tracker is still accessible without auth.

Done means mobile users can browse the live issue tracker, see what's been reported and resolved,
and reach the report form from the same screen.

---

## Phase 27: Forum Image And GIF Uploads

Suggested branch: `mobile-forum-media`

Status: completed on branch `mobile-forum-media`.

Purpose: let signed-in users attach images and GIFs to new forum posts and replies, matching the
image embedding already available on the web.

### Background — what was built on the web

The web's `RichReplyEditor` and thread creation modal support image/GIF attachment via
`POST /forum/media/upload`. On upload, the backend:

1. Validates MIME type (png/jpeg/webp/gif), file size (300 KB for images, 1 MB for GIFs), and
   dimensions (1024×1024 max for images, 512×512 max for GIFs).
2. Uploads to S3 under `forum/media/`.
3. Returns a public URL and the `ForumMedia` record.

The client inserts the URL as a Markdown image: `![alt text](url)`. The web forum renderer already
supports `<img>` tags inside markdown via `rehype-raw` + `rehype-sanitize` (only `https://` sources
allowed).

The mobile `ForumCreateThreadScreen.tsx` already notes: `"Series references and image uploads are
coming in the next forum slices."` The thread screen's markdown renderer already renders inline
images.

**Backend endpoint:**

| Endpoint                   | Auth     | Body                                   | Returns                              |
| -------------------------- | -------- | -------------------------------------- | ------------------------------------ |
| `POST /forum/media/upload` | Required | `thread_id` (form), `file` (multipart) | `{ url, width, height, media_type }` |

Note: `thread_id` is required by the endpoint. For new threads, image upload must happen after the
thread is created (or a placeholder thread_id must be used — check the endpoint behavior).

### Work items

**27a — API**

- [x] Add `uploadForumMedia(threadId: number, fileUri: string, mimeType: string): Promise<{ url:
string; width: number; height: number }>` → `POST /forum/media/upload` (multipart form) to
      `src/api/forum.ts`
- [x] Handle the size/dimension validation error from the backend gracefully (show a toast with the
      reason)

**27b — Image picker and upload flow (thread creation)**

- [x] In `ForumCreateThreadScreen`, add an "Attach image" button in the editor toolbar area.
      Tapping it opens `ImagePicker.launchImageLibraryAsync` (or camera). Limit to 1 attachment at a
      time to start.
- [x] On pick: show a thumbnail preview in the compose area with a remove (×) button.
- [x] On "Post thread": if an image is attached, upload it first via `uploadForumMedia`, then insert
      `\n![image](url)\n` at the end of the body before submitting.
- [x] Show an upload progress indicator while the image is uploading.

**27c — Image picker and upload flow (replies)**

- [x] In the reply composer (`ForumThreadScreen`), add the same "Attach image" button.
- [x] Same flow: pick → preview → upload on submit → insert markdown into reply body.

**27d — Emulator test steps**

1. Create a new thread, attach a JPEG under 300 KB — confirm it uploads, the thread posts, and the
   image renders in the thread view.
2. Attach a GIF under 1 MB — confirm it uploads and renders.
3. Attach a file over the size limit — confirm the backend error is shown as a toast and the post
   is not submitted.
4. Write a reply in an existing thread, attach an image — confirm the image renders inline in the
   reply.
5. Remove the attachment (× button) before submitting — confirm the post goes through without an
   image.

Done means mobile users can embed images and GIFs in forum posts and replies using the same upload
infrastructure as the web.

---

## Phase 28: Series Submission (Contributor Feature)

Suggested branch: `mobile-series-submission`

Purpose: let Contributor and Admin users submit new series for ranking consideration directly from
the mobile app, and track the status of their submissions — matching the web's series submission
flow.

### Background — what was built on the web

**Who can submit:** users with `role === "CONTRIBUTOR"` or `role === "ADMIN"`. The `canSubmitSeriesUser`
utility checks for this. Regular members (`GENERAL` role) cannot submit.

**Submission flow on web:**

1. Contributor clicks "Add Series" (via `AddSeriesModal`), fills in: title, type
   (Manhwa/Manga/Manhua), genre, author, artist, and uploads a cover image.
2. Backend creates the series record in `PENDING` state with `approval_status = PENDING_REVIEW`.
3. The series immediately appears in `MySubmissionsPage` under the contributor's "My submitted
   titles" list, with `detail_ready = false`.
4. The contributor opens the series detail page and adds a synopsis and a secondary cover image
   (the "detail" fields needed for review). When done, `detail_ready` flips to `true`.
5. An admin reviews and approves the series via `PendingTitlesPage`.
6. Once approved, the series goes live across search, rankings, and series detail.

**Backend endpoints (already live):**

| Endpoint                       | Auth                      | Description                                                                      |
| ------------------------------ | ------------------------- | -------------------------------------------------------------------------------- |
| `POST /series/`                | Contributor+              | Submit a new series (multipart: title, type, genre, author, artist, cover image) |
| `GET /series/submissions/mine` | Contributor+              | List own submitted series with status                                            |
| `PUT /series/{series_id}`      | Contributor (own) / Admin | Edit a pending submission's metadata                                             |

**28a — Series submission form**

- [x] Create `src/screens/SubmitSeriesScreen.tsx` (Contributor/Admin only — shows
      "Contributor access required" card for GENERAL users).
- [x] Form fields: Title (required), Type selector (Manhwa/Manga/Manhua), Genre (required), Author
      (optional), Artist (optional), Cover image (required — `ImagePicker` 2:3 crop, uploaded as
      multipart to `POST /series/`).
- [x] On submit, shows `ActivityIndicator` while uploading. On success, navigates to
      `MySubmissionsScreen` via `navigation.replace`.
- [x] On failure, shows the backend error inline above the form.

**28b — My Submissions screen**

- [x] Create `src/screens/MySubmissionsScreen.tsx`
- [x] Fetches `GET /series/submissions/mine` via `useQuery`. Shows a card per submission with:
      cover thumbnail (`CoverImage`), title, type chip, status chip
      (`Awaiting approval` / `Approved` / `Rejected`), and `detail_ready` readiness row.
- [x] If `detail_ready` is false and `PENDING_REVIEW`, shows prompt to open the title page and add
      synopsis/secondary cover before admin review.
- [x] Tapping a submission navigates to `SeriesDetailScreen` for that series.
- [x] Loading, error, and empty states.

**28c — Navigation**

- [x] Add `SubmitSeries: undefined` and `MySubmissions: undefined` to `RootStackParamList` and
      register both screens in `RootNavigator.tsx`.
- [x] Add a "My Submissions" entry to `MoreScreen` under a "Contributor" section (visible only when
      `user.role === "CONTRIBUTOR"` or `"ADMIN"`); "Submit a Title" button is inside
      `MySubmissionsScreen`.

**28a.api — API additions (done alongside 28a/28b)**

- [x] Add `SeriesSubmission` and `SubmissionStatus` types to `src/types/series.ts`
- [x] Add `submitSeries(payload)` → `POST /series/` (multipart) to `src/api/series.ts`
- [x] Add `getMySubmissions()` → `GET /series/submissions/mine` to `src/api/series.ts`

**28d — Emulator test steps**

1. Sign in as a GENERAL user — confirm "My Submissions" does not appear in MoreScreen.
2. Sign in as a Contributor — confirm "My Submissions" appears under the Contributor section.
3. Tap "Submit a Title" — fill in title, type, genre, attach a cover image — confirm the series is
   created and the screen navigates to My Submissions showing the new card with `Awaiting approval`.
4. Tap the submission card — confirm it navigates to the series detail page.
5. Confirm a `detail_ready = false` card shows the synopsis/secondary cover prompt.
6. Sign in as Admin — confirm the same screens are accessible.

Done means Contributor and Admin users can submit new series for the rankings and track their
submission status from the mobile app.

### Known gaps — documented for future phases

The following two steps of the web submission flow are not yet covered by any work item above. They
are documented here so they are not missed when Phase 28 is implemented.

**28e — Edit pending submission (future work)**

The web's `EditSeriesModal` lets a contributor edit a pending submission's metadata (title, type,
genre, author, artist, cover image) via `PUT /series/{series_id}` before admin review. Mobile
Phase 28 does not yet include this edit path.

- Add an Edit action to each submission card in `MySubmissionsScreen` (accessible only while
  `approval_status === "PENDING_REVIEW"`).
- Re-uses the same form fields as `SubmitSeriesScreen`; pre-fills with current values.
- Calls `PUT /series/{series_id}` (multipart if cover image is changed).
- On success, refreshes the submissions list and shows a success toast.

**28f — Add synopsis and secondary cover (future work)**

The web's `AddSeriesDetailModal` lets a contributor add a synopsis and a secondary cover image
directly to a pending submission to flip `detail_ready` to `true`, which signals the series is
ready for admin review. Mobile Phase 28 currently just navigates to the series detail page with a
prompt, but no native form covers this step.

- Add a "Complete for review" action/button on pending submission cards where `detail_ready` is
  false.
- Opens a bottom sheet or screen with: synopsis text area + secondary cover image picker.
- Calls the relevant backend field-update endpoint to set synopsis and secondary cover.
- On success, shows `detail_ready = true` chip on the submission card and dismisses the sheet.

---

## Phase 28.5: Admin — Pending Titles Review (Deferred to much later)

> **Status: Deferred to much later (product decision, June 2026).** Even though Phase 28 (contributor
> submission) is now complete, the admin counterpart is intentionally pushed back behind the Phase
> 38–41 enhancement sweep. Do not pick this up until the enhancement phases are done and the product
> owner re-prioritises it. This phase covers reviewing, approving, or rejecting pending submissions
> and managing user roles — admins can continue to use the website for this workflow in the meantime.

Suggested branch: `mobile-admin-pending-titles`

Purpose: let admins approve or reject pending series submissions and manage user roles from the
mobile app, matching the web's `PendingTitlesPage`.

### Background — what exists on the web

The web's `PendingTitlesPage` combines two admin functions on a single page:

1. **Pending series review** — lists all series with `approval_status === "PENDING_REVIEW"`;
   admins can approve (series goes live) or delete/reject each submission.
2. **User role management** — lists all users with their current role; admins can change any
   user's role between `GENERAL`, `CONTRIBUTOR`, and `ADMIN` via a dropdown.

### Backend endpoints (to verify before implementing)

| Endpoint                          | Auth  | Description                                            |
| --------------------------------- | ----- | ------------------------------------------------------ |
| `GET /series/submissions/pending` | Admin | List all pending series submissions for admin review   |
| `POST /series/{id}/approve`       | Admin | Approve a pending series (goes live)                   |
| `DELETE /series/{id}`             | Admin | Reject/delete a pending submission                     |
| `GET /admin/users`                | Admin | List all users with role                               |
| `PATCH /admin/users/{id}/role`    | Admin | Update a user's role (`GENERAL`/`CONTRIBUTOR`/`ADMIN`) |

> Re-verify these endpoint paths against the backend before implementing — they may differ from the
> web's API calls.

### Work items

**28.5a — Admin pending submissions screen**

- [ ] Create `src/screens/AdminPendingTitlesScreen.tsx` (admin-only; show
      `AccountRequiredCard` or "Admin access required" if not admin).
- [ ] Fetch the pending submissions list. Show a card per pending series: cover thumbnail, title,
      type, contributor name, submission date, `detail_ready` chip.
- [ ] Approve action: confirmation alert → calls approve endpoint → removes row optimistically.
- [ ] Delete/reject action: confirmation alert with reason (optional) → calls delete endpoint →
      removes row optimistically.
- [ ] Empty state: "No pending submissions."

**28.5b — Admin user role management screen**

- [ ] Add a "User Roles" section or tab within `AdminPendingTitlesScreen` (or as a separate
      `AdminUserRolesScreen`).
- [ ] Fetch the user list. Show rows: username, email, current role badge.
- [ ] Role change control: action sheet with `GENERAL` / `CONTRIBUTOR` / `ADMIN` options;
      calls `PATCH /admin/users/{id}/role`; optimistic update with revert on error.
- [ ] Guard: prevent demoting yourself (the signed-in admin's own row should have the role
      control disabled or hidden).

**28.5c — Navigation**

- [ ] Add `AdminPendingTitles: undefined` (and `AdminUserRoles: undefined` if separate) to
      `RootStackParamList`.
- [ ] Add an "Admin: Pending Titles" entry to `MoreScreen` under the existing admin-only section
      (visible only when `user.role === "ADMIN"`).

**28.5d — Emulator test steps**

1. Sign in as a non-admin user — confirm the Pending Titles entry does not appear in MoreScreen.
2. Sign in as admin — confirm the entry appears; open it.
3. Confirm pending submissions are listed with approve and delete actions.
4. Approve a submission — confirm it disappears from the list and is live on the series detail page.
5. Delete a submission — confirm it disappears from the list.
6. Open user role management — confirm users are listed with current roles.
7. Change a user's role — confirm the badge updates; open the website and confirm the change is reflected.
8. Confirm your own role control is disabled so self-demotion is not possible.

Done means admins can manage the full submission and contributor workflow entirely from the mobile
app without needing to open the website.

---

## Phase 29: Username Change

Suggested branch: `mobile-username-change`

Purpose: let signed-in users update their username directly from the mobile app, matching the
pencil-icon modal added to the web account page.

### Background — what was built on the web

**Backend endpoint (already live, no further backend work needed):**

| Endpoint                  | Auth           | Body                       | Returns                                                                       |
| ------------------------- | -------------- | -------------------------- | ----------------------------------------------------------------------------- |
| `PATCH /auth/me/username` | Required (JWT) | `{ new_username: string }` | `UsernameUpdateOut` (`id`, `username`, `role`, `avatar_url`, `avatar_preset`) |

Rules enforced by the backend:

- Username must match `^[A-Za-z0-9_-]{3,20}$` — validated server-side via Pydantic
- Uniqueness checked against existing users; returns 409 if already taken
- No password required — JWT is sufficient proof of identity, works for Google OAuth accounts too
- Rate limited: 5 requests per hour per user

**Frontend (web):** a small pencil icon sits next to the username `<h2>` on the account page.
Clicking it opens a modal with a single "New username" field. On success the stored session user
is updated immediately and a toast confirms the change.

### Work items

**29a — API layer**

- [x] Add `updateMyUsername(newUsername: string): Promise<UsernameUpdateOut>` →
      `PATCH /auth/me/username` with body `{ new_username: newUsername }` to `src/api/auth.ts`
- [x] Add `UsernameUpdateOut` type to `src/types/account.ts`:
  ```ts
  export interface UsernameUpdateOut {
    id: number;
    username: string;
    role: string;
    avatar_url: string | null;
    avatar_preset: string | null;
  }
  ```
- [x] Handle 409 (username taken) and 429 (rate limited) errors with readable messages

**29b — UI**

- [x] Add a small edit/pencil icon button next to the username text on `ProfileScreen`
- [x] Tapping it opens a bottom sheet or modal with a single "New username" text input
- [x] Input is pre-filled with the current username; user clears and types the new one
- [x] Inline validation before submit: enforce the `^[A-Za-z0-9_-]{3,20}$` rule client-side
      and show a helper text ("3–20 characters — letters, numbers, underscores, or hyphens")
- [x] Save button is disabled until the input is non-empty and different from the current username
- [x] On success: call `updateUser` with the returned username so all surfaces update immediately;
      show a success toast; close the modal
- [x] On error: show the backend detail message inline (e.g. "That username is already taken.")
- [x] Show a loading state on the Save button while the request is in flight

**29c — Emulator test steps**

1. Sign in, open `ProfileScreen` — confirm the pencil icon appears next to the username.
2. Tap it — confirm the modal opens with the current username pre-filled (or empty).
3. Clear the field and type a valid new username — confirm the Save button becomes active.
4. Save — confirm the username updates on screen immediately and a success toast appears.
5. Open the modal again and type a username that already exists — confirm a "already taken"
   error appears inline.
6. Type a username shorter than 3 characters or with a disallowed character — confirm the
   client-side validation message appears before the request is even sent.
7. Sign in as a Google OAuth account — confirm the pencil icon appears and the change works
   (no password prompt, works identically to email/password accounts).

Done means signed-in users can change their username from mobile with the same rules and
behavior as the web account page, including Google OAuth accounts.

---

---

## Phase 30: Forum Enhancements I — Thread Pinning, Sorting, Categories, And Post Meta

Suggested branch: `mobile-forum-enhancements-1`

Purpose: bring forum list improvements to mobile — pinned thread visual treatment, sort controls, category/subforum filtering, thread view counts, and "(edited)" post indicators — matching the features live on the production website.

> **Confirmed gap (June 2026 audit):** Mobile forum screens (`ForumScreen`, `ForumCreateThreadScreen`,
> `ForumThreadScreen`) contain zero references to `category`, `ForumCategory`, or category slugs.
> Categories are entirely absent from mobile and must be built from scratch in this phase.

### Background — what was built on the web and backend

**Backend (all live, no further backend work needed):**

| Endpoint                                                  | Description                                                                                                                      |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `GET /forum/threads-paged?sort=activity\|newest\|replies` | Sort param already accepted; `is_pinned` returned on every thread; pinned threads always sort first regardless of sort selection |
| `GET /forum/threads-paged?category_slug=general`          | Filter threads by category slug; also accepts `category_id`                                                                      |
| `PATCH /forum/threads/{id}/pin`                           | Admin-only; body `{ pinned: bool }`; returns `{ id, is_pinned }`                                                                 |
| `GET /forum/categories`                                   | Returns all visible categories ordered by position, each with `thread_count`                                                     |
| `POST /forum/categories`                                  | Admin-only; create a new category                                                                                                |
| `PATCH /forum/categories/{id}`                            | Admin-only; update name, slug, description, position, visibility                                                                 |
| `DELETE /forum/categories/{id}`                           | Admin-only; fails with 409 if threads still assigned                                                                             |

**Fields now returned on `ForumThread`:**

- `is_pinned: boolean` — whether the thread is pinned to the top
- `category_id: number | null` — the category this thread belongs to
- `category_name: string | null` — the category name (denormalized for display)

**`ForumCategory` type:**

```ts
{
  id: number;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  thread_count: number;
}
```

**`CreateThreadIn` payload now accepts:**

- `category_id?: number | null` — assign a category at thread creation time

**`UpdateThreadIn` payload now accepts:**

- `category_id?: number | null` — pass `0` to unset, any valid id to re-assign

### Work items

**30a — Thread pinning display**

- [x] Add `is_pinned?: boolean`, `category_id?: number | null`, and `category_name?: string | null` to the `ForumThread` type in `src/types/forum.ts`
- [x] In `ForumScreen` thread list rows: when `thread.is_pinned` is true, show a 📌 pin icon before the thread title and apply a subtle amber tint to the row background (or an amber left border on the card)
- [x] Show a small "Pinned" badge in the thread row meta row alongside the existing locked badge
- [x] Admin users: add a Pin/Unpin action to the thread management actions (alongside the existing Lock/Edit/Delete actions already added in Phase 12). Call `PATCH /forum/threads/{id}/pin` with `{ pinned: !thread.is_pinned }`. Optimistic update with revert on error.

**30b — Thread sort controls**

- [x] Add a sort state to `ForumScreen`: `"activity" | "newest" | "replies"` (default `"activity"`)
- [x] Persist sort choice in `AsyncStorage` so it survives app restarts
  > **Note:** `AsyncStorage` is not installed in this project (only `expo-secure-store` for sensitive data). Sort preference uses in-memory state and resets on app restart. Acceptable for v1.
- [x] Add a sort control above the thread list — three pill buttons (Active / Newest / Most replies) styled to match the existing type-rail pills
- [x] When sort changes, reset to page 1 and refetch

**30c — Category filter strip**

- [x] Add `getForumCategories(): Promise<ForumCategory[]>` → `GET /forum/categories` to `src/api/forum.ts`
- [x] Add `ForumCategory` type to `src/types/forum.ts`
- [x] On `ForumScreen` mount, fetch categories once and cache in state
- [x] Render a horizontal scrollable pill strip below the sort controls: "All" pill + one pill per category (name + thread count)
- [x] Selecting a category passes `category_slug` to `getForumThreads`; selecting "All" clears it; resets to page 1 on change
- [x] When a category is active, show its description as a muted subtitle below the pills (if set)
- [x] Show a category badge on each thread row when "All" is selected (so users can see which category each thread belongs to)

**30d — Category in thread creation**

- [x] Pass the available categories to `ForumCreateThreadScreen` (or fetch them there if not already cached)
- [x] Add a category picker above the title field: pill buttons, one per category; optional (user can post without a category)
- [x] Pre-select the currently active category filter if one is set
- [x] Pass `category_id` in the create thread payload

**30e — Category in thread edit (Phase 12 extension)**

- [x] In the inline edit form (Phase 12, edit thread UI), add category pill selector showing current category pre-selected
- [x] On save, include `category_id` in the `updateForumThread` payload (pass `0` to unset)

**30f — Admin category management**

- [x] Admin-only: add a "Manage Categories" option accessible from `ForumScreen` (e.g., a gear icon in the header, visible only when `isAdmin`)
- [x] Opens a modal/bottom sheet listing all categories with Edit and Delete actions per row
- [x] Edit: inline name, slug, description, position fields; calls `PATCH /forum/categories/{id}`
- [x] Delete: confirmation alert; calls `DELETE /forum/categories/{id}`; shows error if 409 (threads still assigned)
- [x] Add category: form at the bottom of the modal; slug auto-generated from name; calls `POST /forum/categories`

**30g — Thread view count display**

The backend already returns `view_count` on `ForumThread` objects. The web shows a `👁 N` chip in
each thread row.

- [x] Add `view_count?: number` to the `ForumThread` type in `src/types/forum.ts` (if not already
      present).
- [x] In `ForumScreen` thread row meta row (alongside reply count and date), show a `👁 {view_count}`
      chip when `view_count` is defined and > 0.
- [x] Keep the chip muted/secondary so it does not compete visually with reply count.

**30h — "(edited)" indicator on posts**

The backend returns `updated_at` on `ForumPost` objects. The web shows an `(edited)` label when
`updated_at` is meaningfully later than `created_at` (> ~10 seconds). Mobile covers editing posts
(Phase 12) but does not yet surface this indicator in rendered posts.

- [x] Add `updated_at?: string` to the `ForumPost` type in `src/types/forum.ts` (if not already
      present).
- [x] In `ForumThreadScreen` post and reply cards, show a muted `(edited)` label in the meta row
      when `updated_at` and `created_at` differ by more than 10 seconds.
- [x] Apply to the original post and all reply cards.

**30i — Emulator test steps**

1. Open `ForumScreen` — confirm sort pills (Active / Newest / Most replies) appear and switching sort reloads the list in the correct order
2. Confirm category pills appear (General Discussion, Series Talk, Recommendations, Off-Topic)
3. Tap a category — confirm only threads in that category are shown; description appears below
4. Open a pinned thread's row — confirm 📌 icon and amber styling are visible
5. As admin, tap the pin toggle on an unpinned thread — confirm it moves to the top with amber styling; tap again — confirm it un-pins
6. Create a new thread — confirm the category picker is shown; select a category; confirm the thread appears in that category's filtered view
7. Edit a thread (admin) — confirm the category picker shows the current category and allows changing it
8. Confirm thread rows show a `👁 N` view count chip when the backend returns a non-zero `view_count`
9. Edit a post body, then open the thread — confirm the edited post shows an `(edited)` label in its meta row; confirm unedited posts do not show it

Done means the mobile forum list matches the web in pinned thread treatment, sort options, category browsing, view counts, and edited post indicators.

---

## Phase 31: Forum Enhancements II — Thread Following And Post Bookmarking

Suggested branch: `mobile-forum-enhancements-2`

Purpose: let users follow threads to receive notifications on new replies, and bookmark individual posts to revisit later — matching the follow/bookmark features live on the production website.

### Background — what was built on the web and backend

**Backend (all live, no further backend work needed):**

| Endpoint                                                   | Description                                                                                  |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `POST /forum/threads/{thread_id}/follow`                   | Toggle follow; returns `{ following: bool, follower_count: int }`                            |
| `GET /forum/me/following`                                  | Paginated list of threads the signed-in user follows (`PageOut` — same shape as thread list) |
| `POST /forum/threads/{thread_id}/posts/{post_id}/bookmark` | Toggle bookmark; returns `{ bookmarked: bool }`                                              |
| `GET /forum/me/bookmarks`                                  | Paginated list of bookmarked posts (`PostsPageOut`)                                          |

**Fields now returned on `ForumThread`:**

- `viewer_is_following: boolean` — true when the authenticated viewer follows this thread

**Fields now returned on `ForumPost`:**

- `viewer_has_bookmarked: boolean` — true when the authenticated viewer has bookmarked this post

### Work items

**31a — API layer**

- [x] Add `toggleThreadFollow(threadId: number): Promise<{ following: boolean; follower_count: number }>` → `POST /forum/threads/{id}/follow` to `src/api/forum.ts`
- [x] Add `getMyFollowedThreads(page: number, pageSize: number): Promise<ForumThreadPage>` → `GET /forum/me/following` to `src/api/forum.ts`
- [x] Add `togglePostBookmark(threadId: number, postId: number): Promise<{ bookmarked: boolean }>` → `POST /forum/threads/{id}/posts/{postId}/bookmark` to `src/api/forum.ts`
- [x] Add `getMyBookmarkedPosts(page: number, pageSize: number): Promise<ForumPostPage>` → `GET /forum/me/bookmarks` to `src/api/forum.ts`
- [x] Add `viewer_is_following?: boolean` to `ForumThread` type in `src/types/forum.ts`
- [x] Add `viewer_has_bookmarked?: boolean` to `ForumPost` type in `src/types/forum.ts`

**31b — Follow button on thread view**

- [x] In `ForumThreadScreen`, add a Follow/Following button in the thread header (visible to signed-in users only)
- [x] Button label: "Follow" when not following; "✓ Following" when following
- [x] On tap: optimistically toggle `viewer_is_following`, call `toggleThreadFollow`; revert on error with an alert
- [x] Show follower count next to the button as muted text

**31c — Bookmark button on posts**

- [x] In `ForumThreadScreen`, add a bookmark (🔖) button to each post/reply action row (visible to signed-in users only)
- [x] Show filled/amber bookmark when `viewer_has_bookmarked` is true; outline when false
- [x] On tap: optimistically toggle `viewer_has_bookmarked`, call `togglePostBookmark`; revert on error
- [x] Apply to the original post and all reply cards

**31d — Following and Saved tabs in ForumActivityScreen**

- [x] Add a "Following" tab to `ForumActivityScreen` alongside Threads / Replies / Votes
  - Fetches `getMyFollowedThreads` using `useInfiniteQuery`
  - Each row: thread title (tappable → `ForumThread`), post count, updated date, ✕ unfollow button
  - Tapping ✕ calls `toggleThreadFollow` and removes the row optimistically
- [x] Add a "Saved" tab to `ForumActivityScreen`
  - Fetches `getMyBookmarkedPosts` using `useInfiniteQuery`
  - Each row: post excerpt (first 140 chars of plain text), author, date, (edited) if applicable, "View →" link to `ForumThread` with `postId`, ✕ remove bookmark button
  - Tapping ✕ calls `togglePostBookmark` and removes the row optimistically
- [x] Lazy-load: only fetch Following/Saved data when the user first taps that tab (not on mount like the other three tabs)

**31e — Emulator test steps**

1. Open a thread as a signed-in user — confirm a Follow button appears in the thread header
2. Tap Follow — button turns to "✓ Following"; navigate away and back — confirm button still shows Following (persisted via backend)
3. In `ForumActivityScreen`, tap the Following tab — confirm the followed thread appears; tap ✕ — it disappears
4. On a reply, tap the 🔖 bookmark icon — it turns amber; tap again — reverts
5. In `ForumActivityScreen`, tap Saved — confirm bookmarked post appears with excerpt and View → link; tap ✕ — removed instantly
6. Sign out — confirm Follow and Bookmark buttons are hidden

Done means users can subscribe to threads for notifications and save posts to revisit, with a dedicated Following and Saved section in their forum activity.

---

## Phase 32: Post Reporting

Suggested branch: `mobile-forum-post-reporting`

Purpose: let signed-in users flag individual forum posts for admin review — matching the post reporting feature live on the production website.

### Background — what was built on the web and backend

**Backend (all live, no further backend work needed):**

| Endpoint                                                 | Description                                                                                              |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `POST /forum/threads/{thread_id}/posts/{post_id}/report` | Rate-limited 5/hour; blocks self-reporting (403); blocks duplicate reports (409); returns 201 on success |
| `GET /forum/reports?status=OPEN&page=1&page_size=20`     | Admin-only; paginated report queue with `post_excerpt` and `thread_title`                                |
| `PATCH /forum/reports/{report_id}`                       | Admin-only; body `{ status: "REVIEWED" \| "DISMISSED" }`                                                 |
| `DELETE /forum/reports/{report_id}`                      | Admin-only; permanently removes the report record                                                        |

**`ForumReport` response shape:**

```ts
{
  id: number;
  post_id: number;
  thread_id: number;
  reporter_username: string | null;
  reason: string | null;
  status: "OPEN" | "REVIEWED" | "DISMISSED";
  created_at: string;
  reviewed_at: string | null;
  reviewed_by_username: string | null;
  post_excerpt: string | null;
  thread_title: string | null;
}
```

### Work items

**32a — API layer**

- [x] Add `reportPost(threadId: number, postId: number, reason?: string): Promise<void>` → `POST /forum/threads/{id}/posts/{postId}/report` with body `{ reason }` to `src/api/forum.ts`
- [x] Add `ForumReport` type to `src/types/forum.ts`
- [x] Add `getForumReports(page: number, status?: "OPEN" | "REVIEWED" | "DISMISSED"): Promise<Paginated<ForumReport>>` → `GET /forum/reports` to `src/api/forum.ts`
- [x] Add `reviewForumReport(id: number, status: "REVIEWED" | "DISMISSED"): Promise<void>` → `PATCH /forum/reports/{id}` to `src/api/forum.ts`
- [x] Add `deleteForumReport(id: number): Promise<void>` → `DELETE /forum/reports/{id}` to `src/api/forum.ts`

**32b — Report button on posts**

- [x] In `ForumThreadScreen`, add a "⚑ Report" action to each post/reply action row
- [x] Visible only to signed-in users who are not the post author (block self-reporting client-side to match backend)
- [x] Tapping opens an `Alert` or a bottom sheet with:
  - Header: "Report this post"
  - Optional text input for reason (max 500 chars)
  - "Submit Report" button and Cancel
- [x] On 201 success: show a success alert ("Report submitted. Our team will review it.") and hide the Report button for that post in the current session
- [x] On 409: show alert "You have already reported this post."
- [x] On 429: show alert "You've reported too many posts recently. Try again later."

**32c — Admin report queue screen**

- [x] Create `src/screens/AdminReportQueueScreen.tsx` (admin-only)
- [x] Filter tabs: Open / Reviewed / Dismissed / All
- [x] Each report card shows: status badge, reporter username, timestamp, thread link (navigates to `ForumThreadScreen` scrolled to `post_id`), reason (if any), post excerpt
- [x] "✓ Reviewed" button and "Dismiss" button on Open reports — call `reviewForumReport`; update row status in-place
- [x] "Delete" button on all reports — calls `deleteForumReport`; removes row optimistically
- [x] Paginated with load-more; loading and empty states per tab
- [x] Add to `RootStackParamList` as `AdminReportQueue: undefined`
- [x] Add "Report Queue" entry to the admin section of `MoreScreen` (visible only when `isAdmin`)

**32d — Emulator test steps**

1. As a regular user, open a thread and tap "⚑ Report" on someone else's post — confirm the report form appears
2. Submit without a reason — confirm it succeeds (reason is optional)
3. Try to report the same post again — confirm 409 alert appears
4. Try to report your own post — confirm the Report button does not appear
5. As admin, open More → Report Queue — confirm Open reports appear
6. Tap "✓ Reviewed" — confirm status badge changes to green Reviewed
7. Tap "Delete" — confirm report row disappears immediately

Done means users can flag problematic posts from mobile, and admins can action the report queue without needing the web admin panel.

---

## Phase 33: Notifications

Suggested branch: `mobile-forum-notifications`

Purpose: bring in-app notifications to mobile — @-mentions, thread replies, and follower notifications — with a notification bell, unread badge count, and mark-as-read capability.

### Background — what was built on the web and backend

**Backend (all live, no further backend work needed):**

| Endpoint                                                   | Description                                                                |
| ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| `GET /notifications?page=1&page_size=20&unread_only=false` | Paginated notifications, newest first; includes `unread_count` in envelope |
| `GET /notifications/unread-count`                          | Returns `{ count: int }` for badge polling                                 |
| `PATCH /notifications/{id}/read`                           | Mark single notification read; sets `read_at`                              |
| `POST /notifications/read-all`                             | Mark all user notifications read                                           |

**Notification kinds:**

- `THREAD_REPLY` — someone replied to your thread
- `THREAD_FOLLOW_REPLY` — someone posted in a thread you follow
- `POST_MENTION` — someone `@mentioned` you in a post

**`NotificationOut` type:**

```ts
{
  id: number;
  kind: "THREAD_REPLY" | "THREAD_FOLLOW_REPLY" | "POST_MENTION";
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  thread_id: number | null;
  post_id: number | null;
  actor_username: string | null;
  summary: string | null;
}
```

### Work items

**33a — API layer**

- [x] Add `NotificationOut` type to a new `src/types/notification.ts`
- [x] Add `NotificationsPage` type (items, total, page, page_size, total_pages, has_prev, has_next, unread_count)
- [x] Add `getNotifications(page: number): Promise<NotificationsPage>` → `GET /notifications` to a new `src/api/notifications.ts`
- [x] Add `getUnreadCount(): Promise<{ count: number }>` → `GET /notifications/unread-count`
- [x] Add `markNotificationRead(id: number): Promise<void>` → `PATCH /notifications/{id}/read`
- [x] Add `markAllNotificationsRead(): Promise<void>` → `POST /notifications/read-all`

**33b — Unread count polling**

- [x] Create a `useNotificationCount()` hook in `src/hooks/` that:
  - Fetches `getUnreadCount()` on mount when signed in
  - Polls every 60 seconds while the app is in the foreground (`AppState` listener)
  - Re-fetches on app coming to foreground from background (`AppState` change to `"active"`)
  - Returns `{ count: number }` — 0 when signed out

**33c — Notification bell in navigation**

- [x] Add a bell icon button to the header of a primary screen (e.g., top-right of `ForumScreen` or the app's main tab header area). Show only when signed in.
- [x] When `unreadCount > 0`, overlay a red badge with the count (cap display at "99+")
- [x] Tapping the bell navigates to `NotificationsScreen`

**33d — NotificationsScreen**

- [x] Create `src/screens/NotificationsScreen.tsx`
- [x] Fetch notifications with `useInfiniteQuery`; newest first; load-more pagination
- [x] Each notification row shows:
  - Actor username (if any) + summary text (e.g. "replied to your thread")
  - Relative timestamp ("3h ago", "2d ago")
  - Unread rows have a distinct blue tint background; a small blue dot on the left
- [x] Tapping a row: calls `markNotificationRead(id)`, marks row as read in local state, navigates to `ForumThreadScreen` for the relevant `thread_id` (with `postId` for scroll-to-post if `post_id` is set)
- [x] "Mark all as read" button at the top — calls `markAllNotificationsRead()`; clears all tints and badge
- [x] Empty state: "No notifications yet."
- [x] Add `Notifications: undefined` to `RootStackParamList` and register the screen

**33e — Emulator test steps**

1. As User A, reply to a thread owned by User B
2. Sign in as User B — confirm a red badge appears on the bell icon
3. Tap the bell — `NotificationsScreen` opens; the reply notification appears with a blue tint
4. Tap the notification — navigates to the thread scrolled to the reply; the notification loses its blue tint
5. Tap "Mark all as read" — badge disappears; all rows lose blue tint
6. Put the app in the background, have another user post a mention; bring app to foreground — badge should update within 60 seconds
7. Sign out — bell icon is hidden

Done means mobile users receive and act on in-app notifications for replies, follows, and @-mentions without needing the website.

---

## Phase 34: Read State Tracking — Unread Badges

Suggested branch: `mobile-forum-read-tracking`

Purpose: show "new posts" indicators on threads the user hasn't fully read, and automatically mark threads as read when the user views them — matching the read-tracking feature on the production website.

### Background — what was built on the web and backend

**Backend (all live, no further backend work needed):**

| Endpoint                                    | Description                                                                                                                                                     |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /forum/threads/{thread_id}/mark-read` | Body: `{ last_seen_post_id: int }`; upserts read cursor; cursor only advances (never moves backwards); returns `{ thread_id, last_seen_post_id, last_seen_at }` |

**Fields now returned on `ForumThread` when viewer is authenticated:**

- `has_unread: boolean` — true if there are posts after the viewer's last read position
- `unread_count: number` — how many posts since last mark-read (0 if no read state or fully read)

The backend only populates `has_unread` / `unread_count` when the request includes a valid JWT. Unauthenticated requests always return `has_unread: false`.

### Work items

**34a — API layer**

- [x] Add `markThreadRead(threadId: number, lastSeenPostId: number): Promise<void>` → `POST /forum/threads/{id}/mark-read` to `src/api/forum.ts`
- [x] Add `has_unread?: boolean` and `unread_count?: number` to the `ForumThread` type in `src/types/forum.ts`

**34b — Unread badge on thread list**

- [x] In `ForumScreen` thread rows, when the signed-in viewer has `thread.has_unread === true`:
  - Show a green "N new" pill chip next to the thread title (where N is `thread.unread_count`)
  - Render the thread title in bold font weight (vs normal for fully-read threads)
- [x] When signed out, never show unread indicators

**34c — Mark thread as read**

- [x] In `ForumThreadScreen`, after each page of posts finishes loading, call `markThreadRead(threadId, lastPostId)` where `lastPostId` is the `id` of the last post in the current loaded set
- [x] Silent fail — never show an error to the user if this call fails; it is a background signal
- [x] Call again when the user loads more posts (the cursor only advances, so calling with an earlier post id is a no-op on the backend)
- [x] Only call when signed in (`isSignedIn` check before the call)

**34d — Emulator test steps**

1. Sign in as User A; note thread list — threads you haven't read should show no badges
2. Sign in as User B on another device/browser; post a reply in a thread User A follows or created
3. Open app as User A — the thread should show a green "1 new" chip and a bold title
4. Tap into the thread — after posts load, the mark-read call fires silently
5. Navigate back to thread list — the "new" chip should be gone on next refresh
6. Sign out — confirm no unread indicators are shown

Done means the mobile forum list communicates unread activity clearly, and viewing a thread automatically clears the unread state.

---

## Phase 35: Forum Search Enhancements

Suggested branch: `mobile-forum-search-enhancements`

Purpose: extend the existing thread search (Phase 13) with post-content search and user @-mention autocomplete in the reply composer — matching enhancements shipped to the production website.

### Background — what was built on the web and backend

**Backend (all live, no further backend work needed):**

| Endpoint                                                                    | Description                                                                                            |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `GET /forum/threads-paged?q=keyword&search_posts=true`                      | When `search_posts=true`, also matches threads where any post body contains the keyword                |
| `GET /forum/threads/{thread_id}/posts/search?q=keyword&page=1&page_size=20` | Search post content within a single thread; returns `PostsPageOut`                                     |
| `GET /users/search?q=partial&limit=8`                                       | Prefix username search for @-mention autocomplete; returns `[{ username, avatar_url, avatar_preset }]` |

### Work items

**35a — "Search inside posts" toggle**

- [x] Add `searchPosts: boolean` state (default `false`) to `ForumScreen`
- [x] Add a "Search inside posts" toggle switch or checkbox next to the existing search input — only visible when the search field is non-empty
- [x] When enabled, pass `search_posts=true` to `getForumThreads`; when disabled, omit it (default behavior)
- [x] Reset to page 1 when toggle changes

**35b — Post search within a thread**

- [x] Add `searchPostsInThread(threadId: number, q: string, page: number): Promise<ForumPostPage>` → `GET /forum/threads/{id}/posts/search` to `src/api/forum.ts`
- [x] In `ForumThreadScreen`, add a search icon button in the thread header that toggles a search input
- [x] Typing in the search input fetches matching posts from that thread; shows results in a separate list below the search bar (not mixed with the normal post list)
- [x] Tapping a search result navigates (scrolls) to that post; the search input can be dismissed to return to the normal view

**35c — User @-mention autocomplete in reply composer**

- [x] Add `searchUsers(q: string, limit: number): Promise<Array<{ username: string; avatar_url: string | null; avatar_preset: string | null }>>` → `GET /users/search` to `src/api/users.ts` (create if it doesn't exist)
- [x] The mobile reply composer already supports `@` to mention series (via `/forum/series-search`). Extend the `@` detection to also search users in parallel:
  - When `@token` is typed, fire both `forumSeriesSearch(token)` and `searchUsers(token, 5)` concurrently
  - Show results in the existing autocomplete dropdown in two labeled sections: "Series" (existing behavior) and "Users" (new)
  - Selecting a series inserts `[Title](series:id)` as before
  - Selecting a user inserts `@username` as plain text (the backend's `extract_mentions` function will pick it up and fire a POST_MENTION notification)
- [x] Apply to both the thread-view reply composer and the thread creation first-post textarea

**35d — Emulator test steps**

1. In `ForumScreen` search bar, type a keyword — confirm thread list filters by title as before
2. Enable "Search inside posts" toggle — confirm threads where any post body matches also appear
3. Open a thread with many posts, tap the search icon, type a keyword — confirm matching posts appear in a separate results list; tap one — confirm it scrolls to that post
4. In the reply composer, type `@go` — confirm a dropdown appears with two sections: Series (if any match) and Users (matching usernames); select a user — `@username` is inserted
5. Post the reply — confirm the mentioned user receives a POST_MENTION notification (check their notification bell)

Done means thread search covers post content in addition to titles, users can search within a thread, and the @-mention composer surfaces both series and user autocomplete.

---

## Phase 36: Admin Forum Tools

Suggested branch: `mobile-admin-forum-tools`

Purpose: give admins complete forum moderation capability from mobile — the report queue and any remaining admin-only forum actions not covered in earlier phases.

### Background — what was built on the web

The web ships a dedicated `/admin/reports` page with:

- Filter tabs: Open / Reviewed / Dismissed / All
- Each report card: status badge, reporter, timestamp, thread link, reason, post excerpt
- "✓ Reviewed", "Dismiss", and "Delete" actions per report

This is separate from the report button and form (covered in Phase 32). Phase 32 adds the report queue screen as part of the reporting feature. This phase covers any **remaining** admin-only forum tools not already captured.

### Work items

**36a — Confirm report queue (from Phase 32) is admin-accessible from More screen**

- [x] Verify `AdminReportQueueScreen` from Phase 32 is wired into `MoreScreen` under an admin-only section
- [x] Confirm the "Report Queue" entry only appears when `isAdmin === true`

**36b — Admin thread pin toggle (from Phase 30) — verify complete**

- [x] Verify the pin/unpin action added in Phase 30d is accessible and working from the thread view
- [x] Confirm it is hidden for non-admin users

**36c — Admin category management (from Phase 30f) — verify complete**

- [x] Verify the category management modal from Phase 30f is accessible from `ForumScreen` admin gear icon
- [x] Confirm create / edit / delete all work end-to-end

**36d — Emulator test steps**

1. Sign in as admin — open `MoreScreen` — confirm "Report Queue" appears in the admin section
2. Open Report Queue — confirm it mirrors Phase 32 behavior (filter tabs, review/dismiss/delete)
3. In `ForumThreadScreen` as admin — confirm pin toggle is visible; tap it — confirm thread pins/unpins
4. In `ForumScreen` as admin — confirm gear icon is visible; tap it — confirm category manager opens
5. Sign in as a non-admin user — confirm all the above admin-only controls are hidden

Done means mobile admins have the same moderation tools as the web — report queue, thread pinning, and category management — in a single branch.

### Future work — Admin user role management

> **Status: Future work.** Covered in Phase 28.5b. Documented here as a cross-reference so this
> phase does not appear incomplete when Phase 28.5 has not yet been built.

The web's `PendingTitlesPage` lets admins change any user's role (`GENERAL` → `CONTRIBUTOR` →
`ADMIN`) via a dropdown. This is not a forum moderation tool per se, but is admin-only and is
grouped with pending-title review on the web. The mobile equivalent is tracked in **Phase 28.5b**
and should be built alongside the pending titles review screen rather than here, since both live on
the same web page.

---

## Phase 37: Public Info, Help, And Legal Page Parity

Suggested branch: `mobile-public-info-pages`

Purpose: cover the public informational routes that exist on the website but do not yet have a clear mobile home.

### Background - what exists on the web

The website currently exposes public routes for:

- `/about`
- `/contact`
- `/terms`
- `/privacy`
- `/how-rankings-work`
- `NotFoundPage`

The mobile app should not blindly copy website layout, but users still need easy access to the same product, support, legal, and ranking-explanation information.

### Current mobile status

- [x] `MoreScreen` already links to Terms and Privacy through the production web legal pages.
- [x] `MoreScreen` already has Support email and Report an Issue entries.
- [x] Mobile does not yet have native About, Contact/help copy, or How rankings work screens.
- [x] Mobile does not yet have a native unknown-route/fallback screen for unsupported app links.

### Work items

- [x] Add a Help/About area in `MoreScreen` with entries for About, Contact/help, How rankings work, and Open website.
- [x] Use native screens for short product/help content where it improves the mobile experience: About, Contact, and How rankings work are good native candidates.
- [x] Keep Terms and Privacy pointed at the production web pages unless/until the legal copy is duplicated natively. If opened in a browser, use in-app browser behavior and make it obvious the user is viewing Toon Ranks legal pages.
- [x] Add a native not-found/fallback screen for unsupported deep links and broken internal navigation.
- [x] Make sure support/contact copy uses `support@toonranks.com` and stays aligned with the backend/frontend email alias docs.
- [x] **Inline ratings tooltip on `SeriesDetailScreen`:** The web has a `RatingInfoTooltip` component
      directly on the series detail ratings section, showing a brief "how rankings work" explanation
      inline without requiring navigation. Consider adding a small `ⓘ` info icon or tooltip sheet
      on the `SeriesRatingsSection` so users can understand the rating system without leaving the
      screen. The full "How Rankings Work" native screen (above) handles deep reading; this is a
      quick inline nudge. Decide whether both are needed or if one replaces the other.
- [x] Add tests for the More screen entries and any native info screens.

### Emulator test steps

1. Open More while signed out and signed in.
2. Confirm About, Contact/help, How rankings work, Terms, Privacy, Support, Report an Issue, and Open website are visible in a sensible help/support section.
3. Tap each item and confirm it opens the right native screen or production web URL.
4. Trigger an unknown app route/deep link and confirm the fallback screen is friendly and gives a way back home.

Done means mobile users can reach the same public trust/help/legal surfaces that website users can, without needing to guess that those pages only exist on the web.

---

## Phase 38: Discovery, Type Pages, And Compare Parity Sweep

Suggested branch: `mobile-discovery-compare-parity`

Purpose: close smaller browsing gaps between the website discovery flow and the native app after the core ranking, search, and detail screens are stable.

### Background - what exists on the web

The website has:

- Home rankings
- `/type/:seriesType` filtered ranking pages
- Global header search
- Dedicated `/compare` route
- Add-to-reading-list actions directly on ranking cards for signed-in users

Mobile already has Home, Search, Compare, and Reading Lists, but this phase should audit whether the experience matches the website's current behavior and feedback.

### Current mobile status

- [x] Home already has All/Manga/Manhwa/Manhua filters.
- [x] Home already has genre filtering from loaded rankings.
- [x] Search already has text search, type filters, and compare buttons.
- [x] Compare already has a dedicated tab, max-four selection rule, remove actions, clear action, and overflow-safe comparison rows.
- [x] Series detail already supports signed-in reading-list saves.
- [x] Ranking/search cards now have a native reading-list quick-add (bookmark button → shared
      `SaveToListSheet`), shown to signed-in users on Home and Search cards.
- [x] Deep-linkable type pages: decision recorded below — Home filter state is sufficient for the
      app-store MVP; no separate native type screens are built.

### Work items

- [x] Audit web `Home`, `FilteredSeriesPage`, header search, `ComparePage`, and reading-list card
      actions before changing mobile. (Web shows an add-to-list control on ranking cards; mobile now
      mirrors this with a bookmark quick-add that opens the shared save sheet.)
- [x] Confirm Manga, Manhwa, and Manhua filters behave consistently with web type pages, including
      loading, empty, and error states. (Home and Search now share `getTypeParam` /
      `filterSeriesByType` from `src/utils/seriesBrowse.ts`; loading/empty/error states verified on
      both screens.)
- [x] **Decision (June 2026): no deep-linkable native type screens for the MVP.** The Home type rail
      (All / Manga / Manhwa / Manhua) plus genre strip covers the same browsing intent as the web's
      `/type/:seriesType` pages, and the rankings endpoint is driven server-side by the `type` param
      so results are complete. Deep-linkable type routes can be revisited in Phase 41 if shared
      `/type/...` links become a real need.
- [x] Confirm max-limit feedback is visible everywhere users can add a title to Compare. Home and
      Search compare buttons show a disabled "Max 4" label once four titles are selected — the cap
      never fails silently. Series Detail intentionally has no compare-add action (compare is built
      from Home/Search cards), so there is no silent-failure surface there.
- [x] Confirm signed-in users can add titles to reading lists from ranking/search/detail surfaces in
      a native way. The shared `SaveToListSheet` (extracted from Series Detail) is now used from
      Home cards, Search cards, and Series Detail — one consistent native sheet, no web-like flow.
- [x] Add regression tests around compare max count, type filter switching, and ranking-card
      reading-list actions: `src/utils/compare.test.ts` (toggle, max cap, removal at max) and
      `src/utils/seriesBrowse.test.ts` (`getTypeParam`, `filterSeriesByType`, `isSeriesInAnyList`).

### Emulator test steps

1. Open Home and switch All/Manga/Manhwa/Manhua repeatedly.
2. Confirm each filter keeps the card layout stable and communicates loading/empty/error states.
3. Add titles to Compare until the max is reached; confirm the app explains the limit.
4. Remove compared titles and confirm the board updates without stale rows.
5. Sign in and add a ranking card to a reading list from mobile; confirm the website sees the same list update.

Done means mobile discovery and compare flows feel like first-class app experiences while still matching the website's data behavior.

---

## Phase 39: Forum Composer Convenience Parity

Suggested branch: `mobile-forum-composer-convenience`

Purpose: bring smaller web composer conveniences to mobile once posting, replies, markdown, votes, and media are already working.

### Background - what exists on the web

The web forum composer supports:

- Markdown shortcuts
- Series autocomplete
- User mention autocomplete
- Image/GIF upload
- Reading-list insertion
- Draft persistence for new threads and replies

Mobile already has or has TODO coverage for the major pieces. This phase is for the remaining convenience and recovery features that make composing on a phone less fragile.

### Current mobile status

- [x] Thread replies and new-thread creation already support series `@` autocomplete.
- [x] Forum markdown rendering exists and is used on thread posts.
- [x] Forum image/GIF rendering exists for posts after the media rendering pass.
- [x] Posting, nested replies, and up/down votes exist when signed in.
- [x] Compact markdown toolbar actions exist in new-thread, main reply, and inline reply composers.
- [x] Draft persistence is implemented for new threads and replies (AsyncStorage-backed).
- [ ] Reading-list insertion is not implemented in mobile forum composers.
- [ ] User mention autocomplete is tracked separately in Phase 35 and should not be duplicated here.

> **Scope note (June 2026):** Phase 39 is being delivered in slices. **This branch
> (`mobile-forum-composer-convenience`) ships draft persistence only.** Quote-reply,
> reading-list insertion, and keyboard-visibility polish are tracked as follow-up branches below.

> **Storage decision:** Drafts use `@react-native-async-storage/async-storage` (added this phase) —
> the standard mobile-forum approach. Drafts survive accidental navigation, app backgrounding, and a
> full app restart. `expo-secure-store` was rejected for drafts (it is for secrets and has a ~2 KB
> per-key Android limit that forum bodies can exceed). Writes are debounced (500 ms) and flushed on
> unmount; empty drafts are removed rather than stored.

### Work items

- [x] Re-audit web `RichReplyEditor` before implementing this phase.
- [x] Persist unsent new-thread drafts locally by forum context. (`ForumCreateThreadScreen` now uses
      `useForumDraft` with `newThreadDraftKey()`; persists title, body, and category; cleared on
      successful create.)
- [x] Persist unsent reply drafts locally so accidental navigation, app backgrounding, or restart
      does not erase a reply. (`ForumThreadScreen` reply composer is backed by `useForumDraft` with
      `replyDraftKey(threadId, …)`; cleared on successful post.) Note: the mobile thread view uses a
      single shared reply composer, so the draft is scoped per thread (root slot) rather than per
      individual parent post — this matches the shared-composer UX.
- [ ] **Quote-reply:** The web shipped a "Quote" button on each post/reply action row that inserts a
      blockquote attribution (`> **@author** wrote:\n> {excerpt}`) and pre-fills the reply composer,
      threading the reply under the quoted post via `quoteParentId`. Add:
  - A "Quote" action button in each post/reply action row (alongside the existing reply button),
    visible to signed-in users.
  - On tap: build the blockquote markdown string from the post author and first ~200 chars of body;
    pre-fill the relevant composer (inline reply if in a thread, main composer if quoting the OP).
  - Pass `quoteParentId` (the quoted post's id) so the backend threads it correctly.
  - Auto-scroll to and focus the composer after inserting the quote text.
- [ ] Add a mobile-friendly reading-list insertion flow that lets users attach or insert one of their public reading lists into a post.
- [x] Add compact markdown toolbar actions that are useful on mobile: bold, italic, list, spoiler/details, image/GIF, and series/user mention entry points.
- [ ] Keep the keyboard visible and the text box in view while using autocomplete, toolbar actions, and image/list pickers.
- [x] Add tests for draft key/clear logic (`src/utils/forumDrafts.test.ts` — key scoping per
      thread/parent and empty-draft detection that drives the remove-on-clear behavior). Reading-list
      insertion formatting tests will land with that follow-up slice.

### Emulator test steps

1. Start a thread draft, leave the screen, return, and confirm the draft remains.
2. Submit the draft and confirm it clears.
3. Start a reply draft to a top-level post and a nested reply, leave the thread, return, and confirm both restore in the right composer.
4. Insert a public reading list into a post and confirm the website renders it correctly.
5. Open the keyboard and use toolbar/autocomplete actions; confirm the input stays visible.

Done means mobile forum writing has the same recovery and insertion affordances as the website, adapted for phone ergonomics.

---

## Phase 40: Mobile Issue Tracker Admin Triage Follow-Up

Suggested branch: `mobile-admin-issue-triage`

Purpose: revisit the earlier decision to keep the mobile issue tracker read-only and decide whether admin triage belongs in the app.

### Background - what exists on the web

The website `/issues` page is public for viewing, and admins can update issue status or delete reports. Existing mobile Phase 26 already tracks the mobile Issue Tracker View and intentionally scoped it as read-only.

### Current mobile status

- [x] Mobile already has `ReportIssueScreen` and issue submission API coverage.
- [x] Mobile has the public read-only issue tracker screen from Phase 26.
- [ ] Mobile does not yet have admin issue triage controls.
- [x] This phase should not start until Phase 26 exists, unless the product decision changes.

### Work items

- [ ] Re-audit web `IssuesPage` and backend issue endpoints before changing mobile.
- [ ] After Phase 26 is implemented, decide whether mobile admins should be able to triage issues in-app or whether this remains a desktop-only admin workflow.
- [ ] If enabled, add admin-only controls for status update and delete.
- [ ] If deferred, document the reason clearly in Phase 26 and this phase so future agents do not rediscover the same gap.
- [ ] Add tests for role-gated visibility if admin controls are implemented.

### Emulator test steps

1. Open Issues while signed out and confirm public read-only behavior still works.
2. Sign in as a general user and confirm admin controls are hidden.
3. Sign in as admin and confirm the chosen behavior: either triage controls are available, or the screen clearly remains read-only by design.

Done means mobile has an explicit decision for website issue-admin parity, instead of an accidental gap.

---

## Phase 41: Deep Link And Route Parity Sweep

Suggested branch: `mobile-route-parity-polish`

Purpose: map every current website route to a mobile behavior so shared links, emails, and future notifications land somewhere intentional.

### Background - current website route set

The website currently has public and account routes for home, auth, verification, reset password, type pages, series detail, compare, account, public user profiles, leaderboard, reading lists, public lists, submissions, pending titles, admin reports, issues, report issue, forum, forum threads, public info pages, and not found.

### Current mobile status

- [x] Mobile linking currently handles `toonranks://lists/:token` for public reading lists.
- [x] Native routes already exist for series detail, login, signup, check email, reading lists, public reading list, forum threads, forum activity, profile, report issue, and settings.
- [ ] Native routes do not yet exist for verify email, reset password, leaderboard, public user profile, issue tracker, admin reports, public info pages, or not-found fallback.
- [ ] Password reset emails currently link to the website's `/reset-password` page; mobile has no
      deep link handler for this route, so tapping the email link on a mobile device does not open
      the app. Phase 2.6 opens the website forgot-password flow in an in-app browser, but does not
      handle the return deep link when the reset email is tapped.
- [ ] Deep linking is not yet mapped for most native routes.

### Work items

- [ ] Create a route parity table in this document or a dedicated mobile docs file with columns: Web route, Mobile behavior, Auth required, Status.
- [ ] Support deep links for high-value user-facing routes: series detail, forum thread, forum post anchor, public list, public profile, leaderboard, login, signup, verify email, reset password, and report issue.
- [ ] **Reset-password deep link (confirmed gap):** Add a `toonranks://auth/reset-password?token=…`
      deep link handler that opens a native `ResetPasswordScreen` (or hands off gracefully to the
      in-app browser) so that password reset emails route back into the app on mobile. Pair this
      with the existing Phase 2.6 forgot-password in-app browser entry point and Phase 16
      (email verification redirect) so the full auth recovery flow is consistent.
- [ ] Open low-value or desktop-heavy routes in the production website when native parity is not worth building yet.
- [ ] Add a native fallback screen for unsupported or expired links.
- [ ] Verify email templates and notification payloads point to links that mobile can either handle directly or gracefully hand off to the website.
- [ ] Add tests for deep-link parsing where practical.

### Emulator test steps

1. Open a series deep link and confirm it lands on `SeriesDetailScreen`.
2. Open a forum thread link and confirm it lands on `ForumThreadScreen`.
3. Open a public reading list link and confirm it lands on the public list screen.
4. Open a public user profile link and confirm it lands on the profile screen.
5. Open an unsupported route and confirm the fallback screen gives a clear way back.

Done means frontend route additions are less likely to quietly leave the mobile app behind.

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
