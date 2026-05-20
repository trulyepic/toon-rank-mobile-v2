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
- the same forum identity, posts, replies, hearts, and media rules
- the same voting/rating model

The app is not a web wrapper. It should feel like a real native mobile application built with Expo
and React Native.

## Current State

The mobile project is early WIP but already has a meaningful foundation:

- Expo app scaffold
- TypeScript
- React Navigation stack and bottom tabs
- TanStack Query
- Axios API client
- shared theme tokens
- Home, Search, Series Detail, Compare, and More screens
- local compare state
- public API calls pointed at the existing Railway backend

As of the last review, `npm run verify` passes. The project is tracked in git and uses small
phase-sized branches.

## Related Projects

Sibling directories in the same workspace:

- `F:\ma-review-project\man-review`
  Production web frontend for Toon Ranks.
- `F:\ma-review-project\man-review-backend`
  Production backend API shared by web and mobile.
- `F:\ma-review-project\toon-ranks-mobile`
  Native mobile app WIP.

Do not assume the mobile app has its own backend. The intended architecture is shared backend, shared
user data, native mobile frontend.

## Current Stack

- Expo
- React Native
- TypeScript
- React Navigation
- TanStack Query
- Axios
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

The first design-first restart has already produced the native shell, shared UI primitives, public
browsing screens, public forum browsing, native issue reporting, auth storage scaffolding, and a
web-auth bridge shell. The current priority is no longer broad design polish.

Immediate priority:

1. Make mobile authentication real by coordinating backend, web frontend, and mobile callback work.
2. Once mobile has a stored Toon Ranks session, connect account-backed actions in this order:
   voting, reading lists, forum hearts/posts, profile/avatar/account surfaces.
3. Keep public browsing reliable, but do not let small search/filter polish outrank shared-account
   parity.
4. Preserve one shared identity and data model across website and mobile.
5. Move to app-store readiness only after the core account-backed product loop works.

## Product Identity

Public brand: `Toon Ranks`

Operating entity: `Nofara LLC`

Canonical website: `https://www.toonranks.com`

Backend currently used by mobile:

```text
https://man-review-backend-production.up.railway.app
```

The app should keep `Toon Ranks` as the user-facing product name. Mention `Nofara LLC` only in legal,
trust, app settings, or policy surfaces when those are added.

## Design Direction

The mobile app should be native, focused, and content-forward:

- covers and rankings should be visually prominent
- navigation should feel predictable and quick
- screens should be optimized for repeated browsing, comparing, saving, and forum reading
- use the Toon Ranks blue as a real brand accent
- reduce the current heavy brown palette over time
- avoid web-page copy inside the app
- avoid explanatory "future phase" text in user-facing screens once design polish begins
- build app states: loading, empty, error, offline, and signed-out

Do not copy the website layout 1:1. Preserve the product model, not the web layout.

## Data And Account Assumptions

The mobile app should eventually use the same backend accounts as the website. A user should be able
to create or use an existing Toon Ranks account, then see the same saved data on web and mobile.

Expected shared data:

- login identity
- reading lists
- saved items / left-off chapter fields
- forum threads, replies, hearts, and user-generated content
- rating/voting history where supported

Auth is deferred for the design-first pass, but all design decisions should leave room for account
state.

## Current Known Issues

- Mobile login/signup screens can open the web auth flow, but the website/backend do not yet return a
  usable mobile session to the app.
- Auth storage and context exist, but a normal user cannot currently sign in to the native app.
- Voting, reading-list editing, forum hearts/posts, and account identity surfaces depend on real
  mobile auth before they should be considered complete.
- App-store assets, icon, splash, bundle identifiers, privacy disclosures, and EAS build config are
  not ready.

## Safe Working Rules

- Keep changes small and branch-sized once git exists.
- Prefer TypeScript-safe, reusable components over large one-off screen rewrites.
- Run `npm run verify` before handing work back when dependencies are available.
- Do not wire production-destructive behavior.
- Do not introduce mobile-only data stores for data that must be shared with the website.
- Do not fork product logic unless the backend contract requires it.
- When adding auth later, use secure native storage. Do not store tokens in plain AsyncStorage.
- Keep user-visible text polished and app-like.

## Active Work Slice

The active roadmap is now `docs/CORE_APP_EXPERIENCE_TODO.md`. Start there before choosing work.
`docs/DESIGN_FIRST_TODO.md` is useful historical context, but it is no longer the primary source of
truth for next steps.

For the next real authentication work, use `docs/MOBILE_AUTH_CONTRACT.md` as the source of truth
before editing backend, web frontend, or mobile auth code.
