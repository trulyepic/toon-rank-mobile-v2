# Toon Ranks Mobile Design-First TODO

This TODO starts after the mobile project is git-initialized. The goal is to polish the native app
experience before wiring full authenticated functionality.

## Phase 0: Repo And Baseline

- [x] Initialize git for `toon-ranks-mobile` or confirm its target repository.
- [x] Add a mobile `.gitignore` if one does not exist.
- [x] Commit the current WIP baseline before feature work.
- [x] Run `npm run typecheck` and record the baseline result.
- [x] Decide branch naming convention for mobile work.

## Phase 1: Design Foundation

Suggested branch: `mobile-design-foundation`

- [x] Clean and expand `src/theme/tokens.ts`.
- [x] Reduce hardcoded colors in screens.
- [x] Align brand accent with Toon Ranks blue.
- [x] Add stable typography tokens.
- [x] Add shared shadow/elevation/border tokens where useful.
- [x] Fix visible mojibake such as `Â·`.
- [x] Replace phase-oriented placeholder copy with product copy.

## Phase 2: Reusable UI Primitives

Suggested branch: `mobile-ui-primitives`

- [x] Add reusable `AppText`.
- [x] Add reusable `AppButton`.
- [x] Add reusable `IconButton`.
- [x] Add reusable `Chip`.
- [x] Add reusable `Surface`.
- [x] Add reusable `SectionHeader`.
- [x] Add reusable `EmptyState`.
- [x] Add reusable `ErrorState`.
- [x] Add reusable `LoadingState`.
- [x] Update existing screens to use these primitives gradually.

## Phase 3: Home And Search Polish

Suggested branch: `mobile-home-search-polish`

- [ ] Polish Home ranking cards.
- [ ] Add type/category filter UI concept for rankings.
- [ ] Improve rank/score badge styling.
- [ ] Improve Home loading/empty/error states.
- [ ] Polish Search input and result cards.
- [ ] Add better "no query" and "no results" states.
- [ ] Ensure cover images and fallback states feel intentional.

## Phase 4: Series Detail Polish

Suggested branch: `mobile-series-detail-polish`

- [ ] Rework detail header/hero for mobile.
- [ ] Make score/rank/vote summary easier to scan.
- [ ] Polish metadata chips.
- [ ] Polish synopsis card.
- [ ] Polish rating breakdown cards.
- [ ] Replace disabled voting preview with signed-out/product-ready action states.
- [ ] Add design placeholders for Save/List and Discussion entry points.

## Phase 5: Compare Polish

Suggested branch: `mobile-compare-polish`

- [ ] Decide whether Compare remains a tab or becomes a secondary screen.
- [ ] Improve selected-title header cards.
- [ ] Improve horizontal swipe affordance.
- [ ] Improve empty state and clear/remove actions.
- [ ] Ensure comparison rows work on narrow phones.
- [ ] Keep compare state local for now unless persistence is explicitly needed.

## Phase 6: Account And More Shell

Suggested branch: `mobile-account-shell`

- [ ] Replace placeholder More screen with an Account/More shell.
- [ ] Add signed-out card with login/signup entry points.
- [ ] Add disabled or preview entries for Reading Lists, Forum Activity, Settings, Terms, Privacy.
- [ ] Include product-safe operator/legal wording where appropriate.
- [ ] Do not implement auth yet unless this phase explicitly expands.

## Phase 7: API Readiness Pass

Suggested branch: `mobile-api-readiness`

- [ ] Review current API endpoint names against backend routes.
- [ ] Add API modules for future auth, reading lists, forum, votes, and issues.
- [ ] Add typed response models for account-backed data.
- [ ] Add centralized API error handling.
- [ ] Keep production backend URL configurable with `EXPO_PUBLIC_API_BASE_URL`.

## Phase 8: Auth Planning

Suggested branch: `mobile-auth-plan`

- [ ] Document mobile auth flow against the existing backend.
- [ ] Decide secure token storage package.
- [ ] Plan login/signup screens.
- [ ] Plan token refresh/expiry behavior if backend supports it.
- [ ] Plan signed-out vs signed-in navigation states.
- [ ] Confirm Google OAuth mobile path before implementation.

## Phase 9: Mobile Quality Baseline

Suggested branch: `mobile-quality-baseline`

- [ ] Add linting.
- [ ] Add formatting.
- [ ] Add CI once mobile repo is initialized.
- [ ] Add basic unit tests for helpers/components if practical.
- [ ] Document local development and verification commands.

## Definition Of Done For Design-First Restart

- [ ] App passes `npm run typecheck`.
- [ ] Main screens feel visually consistent.
- [ ] No visible encoding artifacts remain.
- [ ] User-facing copy sounds like a real app, not a project phase note.
- [ ] Design leaves clear homes for auth, reading lists, forum, and voting.
- [ ] Future agents can continue using `AGENTS.md` and these docs without needing extra context.
