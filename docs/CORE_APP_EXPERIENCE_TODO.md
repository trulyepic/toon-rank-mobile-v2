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
- [ ] Add create-thread flow from the Forum screen.
- [ ] Add native series reference picker using `/forum/series-search`.
- [ ] Respect locked threads and latest-updates-first threads.
- [ ] Add owner/admin edit/delete controls only if the current user's role allows them.
- [ ] Preserve markdown/media/series-reference behavior so posts created on mobile render correctly on web, and vice versa.

Done means forum votes and posts are shared between mobile and web with the same account identity.

## Phase 6: Profile, Avatar, And Account Surfaces

Suggested branch: `mobile-core-profile-account`

Purpose: make the account area reflect the user's real website identity.

- [ ] Add or consume a backend current-user profile endpoint if needed.
- [x] Show username, role color, avatar URL, and avatar preset consistently.
- [ ] Add default avatar preset selection using `PATCH /auth/me/avatar/preset`.
- [x] Decide whether custom avatar upload/cropping belongs in mobile v1 or remains web-only at first.
- [x] Connect Settings session status and logout to the real session.
- [x] Update More/Profile/Forum author surfaces to use the same role/avatar conventions as the website.

Done means the signed-in user identity feels shared across web and mobile.

## Phase 6.5: Native Avatar Upload

Suggested branch: `mobile-native-avatar-upload`

Purpose: let users manage their Toon Ranks avatar directly in the native app while still storing the
final image through the existing website/backend avatar pipeline and S3 storage.

- [ ] Choose a native image picker/cropper package that works cleanly with Expo and store builds.
- [ ] Request photo-library permissions with clear Android/iOS copy.
- [ ] Crop selected images to the same square avatar standard used by the website.
- [ ] Upload the cropped image through the existing backend/S3 avatar endpoint.
- [ ] Allow users to choose one of the default avatar presets from mobile.
- [ ] Refresh the stored mobile `AuthUser` after avatar or preset changes.
- [ ] Confirm updated avatars appear on Profile, More, forum posts, and website account surfaces.

Done means a mobile user can upload, crop, save, and see their avatar without needing the website.

## Phase 7: Issue Reporting Completion

Suggested branch: `mobile-core-issue-reporting`

Purpose: finish the native issue-report path.

- [ ] Add contextual entry points from Series Detail and Forum Thread.
- [ ] Add screenshot/image attachment after native image permissions are chosen.
- [ ] Send screenshots through the existing `/issues/report` multipart endpoint.
- [ ] Show upload progress or a clear submitting state for large screenshots.
- [ ] Keep anonymous reporting available.

Done means mobile issue reports are practical enough for real users and land in the same backend issue
queue as website reports.

## Phase 8: Search And Browse Completeness

Suggested branch: `mobile-core-search-browse`

Purpose: clean up remaining public browsing gaps after account-backed flows are underway.

- [ ] Review whether `/series/search` needs pagination or a result limit contract.
- [ ] Add mobile search pagination/load-more only if the backend exposes or needs it.
- [ ] Add richer filter/sort controls only if they match the native app experience.
- [ ] Confirm Home, Search, Detail, Compare, and Forum navigation remain reliable after auth changes.

Done means public discovery feels complete, but this should not outrank real auth and account actions.

## Phase 9: Mobile App Store Readiness

Suggested branch group:

- `mobile-store-config`
- `mobile-store-assets`
- `mobile-release-readiness`

Purpose: prepare the app for actual store submission after the core product works.

- [ ] Finalize Android package and iOS bundle identifiers.
- [ ] Add production app icon and splash assets.
- [ ] Configure EAS build or final build workflow.
- [ ] Confirm Terms, Privacy, support email, and data safety disclosures.
- [ ] Add store screenshots after the UI is stable.
- [ ] Decide whether legal pages open in native screens or in-app browser.
- [ ] Verify release builds against production backend.

Done means the app can be built and reviewed as a real app-store candidate.

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
