# Toon Ranks Mobile Agent Guide

This file is the first stop for any AI agent or developer working in the Toon Ranks mobile project.
The goal is to preserve product context so the user does not have to re-explain the mobile app every
time work resumes.

> ⚠️ **Workflow rules live in `CONSTRAINTS.md`** — never commit/push without explicit instruction,
> always end every task with numbered emulator/device test steps + a commit message + a PR
> description, one branch per task. `CLAUDE.md` is the quick-start companion to this file.

## Product Goal

Toon Ranks Mobile is the native app-store version of Toon Ranks. It should eventually provide the
same core product experience as the production website, using the same production backend and user
data:

- public manga/manhwa/manhua rankings
- public search and series detail pages
- comparison tools
- account login using the existing backend identity system
- the same saved reading lists users have on the website
- the same forum identity, posts, replies, up/down votes, and media rules
- the same voting/rating model

The app is not a web wrapper. It should feel like a real native mobile application built with Expo
and React Native.

## Current State

The mobile project has a complete feature foundation across all core product areas:

- Expo app scaffold with TypeScript, React Navigation stack and bottom tabs
- TanStack Query for server-state caching
- Axios API client with auth header injection and normalized errors
- Shared theme tokens and reusable UI primitives (AppText, AppButton, Chip, Surface, etc.)
- Home screen: ranked series grid with type filters and load-more
- Search screen: query-driven results with native card layout
- Series Detail screen: summary, metadata, voting UI, save/list actions
- Compare screen: side-by-side comparison with horizontal swipe
- Reading Lists screens: view lists, list detail, add/remove items, left-off chapter tracking
- Forum screens: thread list, thread detail, nested reply tree, reply composer, vote controls,
  create-thread flow with series reference picker, locked/latest-first thread flags
- Auth: web-auth bridge (CAPTCHA on website → mobile code handoff → JWT), secure token
  storage via expo-secure-store, refresh-token session durability (30-day), forgot-password
  entry point, session expiry handling on 401/403
- Voting: 1-10 per category, locked after voting, signed-out guard
- Issue reporting: native form, anonymous and authenticated

## Related Projects

Sibling directories in the same workspace:

- `F:\ma-review-project\toonranks-frontend`
  Production web frontend for Toon Ranks.
- `F:\ma-review-project\toonranks-backend`
  Production backend API shared by web and mobile.
- `F:\ma-review-project\toon-ranks-mobile`
  Native mobile app WIP.

Do not assume the mobile app has its own backend. The intended architecture is shared backend,
shared user data, native mobile frontend.

## Current Stack

- Expo 54 / React Native 0.81
- React Navigation (native stack + bottom tabs)
- TanStack Query
- Axios
- expo-secure-store (token storage)
- @react-native-async-storage/async-storage (forum composer draft persistence)
- expo-web-browser (web auth bridge)
- Expo vector icons

Primary commands:

```powershell
npm run typecheck
npm run lint
npm run format
npm run test
npm run verify
npm run start
npm run android
npm run ios
npm run web
```

## Implementation Priorities

Current priority update: Phases 1–37 plus Phase 28 (Series Submission) are complete, along with the
violet/classic/amber theme picker (More → Appearance, persisted via SecureStore). See the
"Status Summary" section at the top of `docs/CORE_APP_EXPERIENCE_TODO.md` for the full done/blocked
breakdown.

The active enhancement sweep runs in this order: **Phase 38** ✅ (discovery/compare parity) →
**Phase 39** ✅ (forum composer convenience — draft persistence, quote-reply, docked composer, and
reading-list insertion all shipped) → **Phase 40** ✅ (admin issue triage — status change + delete
on `IssueTrackerScreen`, admin-only) → **Phase 41** ✅ (deep-link parity — `toonranks://` scheme
links for existing screens + NotFound fallback in `src/navigation/linking.ts`; Universal Links and
the reset-password/verify email deep links deferred to **Phase 16**, which needs a store-live signed
build). **Phase 28.5** (admin pending titles + user role management) is deferred to much later by
product decision.

With the enhancement sweep (38–41) complete, the remaining open work is store-launch-gated:
**Phase 16** (mobile email-verification + reset-password deep links, needs Universal/App Links) and
**Phase 28.5** (admin pending titles + role management, deferred by product). See the Status Summary
at the top of `docs/CORE_APP_EXPERIENCE_TODO.md`.

Forum composer drafts use `useForumDraft` (`src/hooks/useForumDraft.ts`) backed by AsyncStorage,
with pure key/empty helpers in `src/utils/forumDrafts.ts`.

### Post-roadmap polish & admin extras (shipped after the sweep)

- **Series status badge** — colored pill (Ongoing/Complete/Hiatus/Season End/Unknown) on Home covers
  and the Series Detail hero, via `SeriesStatusBadge` + `src/utils/seriesStatus.ts`.
- **Home status filter** — server-side `status` param on `/series/rankings`; the Home filters now
  live in a collapsible **Filters bottom sheet** (`HomeFilterSheet`) alongside genre, with a
  cumulative genre list so it doesn't collapse when a filter narrows results. The type rail stays
  inline.
- **Deep-link cold-start fix** — removed the greedy `"*"` NotFound catch-all from
  `src/navigation/linking.ts` (it was hijacking normal launches into NotFound).
- **Admin edit-title** — admins get an edit pencil overlaid on each Home cover that opens
  `EditSeriesModal` (`updateSeries` → `PUT /series/{id}` multipart: title, type, status, genre,
  author, artist, optional cover). Gated by `user.role === "ADMIN"`.
- **Home card alignment** — `posterTitle` reserves a fixed two-line height
  (`typography.cardTitle.lineHeight * 2`) so the type/votes row, Compare button, and save icon line
  up across all cards whether the title wraps to one or two lines.
- **Search rank by category** — `SearchScreen` passes the active type-rail filter to
  `searchSeries(query, type)` (via `getTypeParam`) and keys the query on `activeType`, so each result
  shows its true rank **within the selected type** (e.g. a title is #6 in Manhwa, not its #12 "All"
  rank). The backend `/series/search` scopes both results and rank when `type` is provided.

Bottom-sheet pattern note: when a sheet has a fixed footer, cap the inner `ScrollView` height
(e.g. `screenHeight * 0.6`) and add `useSafeAreaInsets().bottom` padding so the footer stays on
screen — see `HomeFilterSheet` / `EditSeriesModal`.

## Product Identity

Public brand: `Toon Ranks`

Operating entity: `Nofara LLC`

Canonical website: `https://www.toonranks.com`

Backend used by mobile (stable API domain):

```text
https://api.toonranks.com
```

The app should keep `Toon Ranks` as the user-facing product name. Mention `Nofara LLC` only in
legal, trust, app settings, or policy surfaces.

## Design Direction

The mobile app should be native, focused, and content-forward:

- covers and rankings should be visually prominent
- navigation should feel predictable and quick
- screens should be optimized for repeated browsing, comparing, saving, and forum reading
- use the Toon Ranks blue as a real brand accent
- reduce the current heavy brown palette over time
- avoid web-page copy inside the app
- build app states: loading, empty, error, offline, and signed-out

Do not copy the website layout 1:1. Preserve the product model, not the web layout.

## Data And Account Assumptions

The mobile app shares the same backend accounts as the website. A user can create or use an
existing Toon Ranks account, then see the same saved data on web and mobile.

Shared data:

- login identity (JWT via web-auth bridge, refresh token for 30-day sessions)
- reading lists and left-off chapter fields
- forum threads, replies, up/down votes, and user-generated content
- rating/voting history

## Current Known Issues / Open Items

_The core product and the Phase 38–41 enhancement sweep are complete (see the Status Summary at the
top of `docs/CORE_APP_EXPERIENCE_TODO.md`). The remaining open items are:_

- **Store-launch-gated (need Apple/Google developer accounts):** iOS production build + TestFlight,
  App Store Connect & Play Console listings/screenshots/age & data-safety forms, and **Phase 16**
  (email-verification / reset-password deep links back into the app — needs Universal/App Links on a
  store-live signed build). App store store-submission has not been attempted.
- **Deferred by product decision:** **Phase 28.5** (admin pending-titles review + user role
  management).
- **Small code items still open:** forum markdown regression tests (Phase 5.5), and session
  info / "revoke all sessions" (Phase 21 — depends on a backend `DELETE /auth/sessions` that may not
  be live yet).

The older "stub" issues (ForumActivityScreen, ProfileScreen ratings, missing `/forum/me/*` API
functions, forum image uploads, app-store assets, placeholder Android package name) are all resolved.

## Safe Working Rules

- **Never commit or push without explicit instruction from the owner** (see `CONSTRAINTS.md`).
- **Always end every task with numbered emulator/device test steps (with expected outcomes), a
  one-line commit message, and a short PR description.**
- **Never work on `main` directly** — branch as `mobile-<short-desc>`.
- Keep changes small and branch-sized.
- Prefer TypeScript-safe, reusable components over large one-off screen rewrites.
- Run `npm run verify` before handing work back when dependencies are available.
- Do not wire production-destructive behavior.
- Do not introduce mobile-only data stores for data that must be shared with the website.
- Do not fork product logic unless the backend contract requires it.
- Use secure native storage for tokens. Do not store tokens in plain AsyncStorage.
- Keep user-visible text polished and app-like.

## Active Work Slice

The active roadmap is `docs/CORE_APP_EXPERIENCE_TODO.md`. Start there before choosing work.
`docs/DESIGN_FIRST_TODO.md` is historical context only.

For any auth changes, use `docs/MOBILE_AUTH_CONTRACT.md` as the source of truth before editing
backend, web frontend, or mobile auth code.
