# Toon Ranks Mobile Agent Guide

This file is the first stop for any AI agent or developer working in the Toon Ranks mobile project.
The goal is to preserve product context so the user does not have to re-explain the mobile app every
time work resumes.

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

Current priority update: Phases 1-23 of `docs/CORE_APP_EXPERIENCE_TODO.md` are complete. Phase 24 is in progress for public profiles and pinned favorites. After Phase 24, continue with Phase 25 reading-list filtering. The older Phase 10 notes below are historical and should not be treated as current work.

Phases 1–9 of `docs/CORE_APP_EXPERIENCE_TODO.md` are complete. The active priority is Phase 10.

1. **Forum activity screen (Phase 10b)** — wire `ForumActivityScreen` to the three `/forum/me/*` endpoints (threads, posts, votes) replacing the current static placeholder.
2. **Series ratings on profile (Phase 10c)** — add a "Series ratings" section to `ProfileScreen` using `GET /series-details/me/votes`.
3. **API layer additions (Phase 10a)** — `getMyForumThreads`, `getMyForumPosts`, `getMyForumVotes`, `getMySeriesVotes` are not yet in the API layer and must be added before 10b/10c.

See `docs/CORE_APP_EXPERIENCE_TODO.md` Phase 10 for the full checklist.

## Product Identity

Public brand: `Toon Ranks`

Operating entity: `Nofara LLC`

Canonical website: `https://www.toonranks.com`

Backend used by mobile (Railway deployment URL — unchanged by repo rename):

```text
https://man-review-backend-production.up.railway.app
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

## Current Known Issues

- `ForumActivityScreen` is a complete stub — no live data, no API calls. Phase 10b addresses this.
- `ProfileScreen` has no series ratings section. Phase 10b/10c addresses this.
- The API layer (`src/api/`) is missing `getMyForumThreads`, `getMyForumPosts`, `getMyForumVotes`, and `getMySeriesVotes`. Phase 10a addresses this.
- App-store assets (icon, splash) still need to be dropped into `assets/`. EAS build config exists but store submission has not been attempted.
- `com.anonymous.toonranksmobile` is the placeholder Android package name and must be replaced before store submission.
- Forum image uploads are not yet built (noted in `ForumCreateThreadScreen` and `ForumThreadScreen` UI copy).
- Regression tests for markdown rendering are not yet written (Phase 5.5 left item).

## Safe Working Rules

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
