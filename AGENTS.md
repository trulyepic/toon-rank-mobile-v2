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

As of the last review, `npm run typecheck` passes.

The project currently is not initialized as a git repository. Before significant implementation work,
the user plans to initialize git or otherwise decide how this mobile project should be tracked.

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
npm run start
npm run android
npm run ios
npm run web
```

## Implementation Priorities

The user wants to work design-first before deep functionality.

Immediate priority:

1. Make the app look and feel like the mobile version of Toon Ranks.
2. Establish reusable design primitives and a cleaner theme.
3. Bring Home, Search, Series Detail, Compare, and More into a consistent app-store-ready direction.
4. Add an Account area design shell so login/saved-lists/forum identity have a natural future home.
5. Only then wire auth, reading lists, forum, voting, and other account features.

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

- `toon-ranks-mobile` is not yet git-initialized.
- Visible mojibake exists in UI strings, for example `Â·`.
- Many colors are hardcoded inside screens instead of using tokens.
- The current palette is usable but too brown-heavy compared with the updated Toon Ranks brand feel.
- The `More` tab is a placeholder.
- There is no Account tab/shell yet.
- There are no mobile tests or CI yet.
- App-store assets, icon, splash, bundle identifiers, privacy disclosures, and EAS build config are
  not ready.
- Authentication and persistent secure token storage are not implemented.

## Safe Working Rules

- Keep changes small and branch-sized once git exists.
- Prefer TypeScript-safe, reusable components over large one-off screen rewrites.
- Run `npm run typecheck` before handing work back.
- Do not wire production-destructive behavior.
- Do not introduce mobile-only data stores for data that must be shared with the website.
- Do not fork product logic unless the backend contract requires it.
- When adding auth later, use secure native storage. Do not store tokens in plain AsyncStorage.
- Keep user-visible text polished and app-like.

## Suggested First Work Slice

After git is initialized, start with the design foundation:

1. Clean theme tokens.
2. Add reusable primitives.
3. Fix mojibake.
4. Polish Home/Search/Detail/Compare.
5. Convert More into an Account/More shell.

See `docs/DESIGN_FIRST_TODO.md` for the active detailed TODO.
