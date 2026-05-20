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
- [x] Fix visible mojibake and encoding artifacts.
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

- [x] Polish Home ranking cards.
- [x] Add type/category filter UI concept for rankings.
- [x] Improve rank/score badge styling.
- [x] Improve Home loading/empty/error states.
- [x] Polish Search input and result cards.
- [x] Add better "no query" and "no results" states.
- [x] Ensure cover images and fallback states feel intentional.

## Phase 4: Series Detail Polish

Suggested branch: `mobile-series-detail-polish`

- [x] Rework detail header/hero for mobile.
- [x] Make score/rank/vote summary easier to scan.
- [x] Polish metadata chips.
- [x] Polish synopsis card.
- [x] Polish rating breakdown cards.
- [x] Replace disabled voting preview with signed-out/product-ready action states.
- [x] Add design placeholders for Save/List and Discussion entry points.

## Phase 5: Compare Polish

Suggested branch: `mobile-compare-polish`

- [x] Decide whether Compare remains a tab or becomes a secondary screen.
- [x] Improve selected-title header cards.
- [x] Improve horizontal swipe affordance.
- [x] Improve empty state and clear/remove actions.
- [x] Ensure comparison rows work on narrow phones.
- [x] Keep compare state local for now unless persistence is explicitly needed.

## Phase 6: Account And More Shell

Suggested branch: `mobile-account-shell`

- [x] Replace placeholder More screen with an Account/More shell.
- [x] Add signed-out card with login/signup entry points.
- [x] Add disabled or preview entries for Reading Lists, Forum Activity, Settings, Terms, Privacy.
- [x] Include product-safe operator/legal wording where appropriate.
- [x] Do not implement auth yet unless this phase explicitly expands.

## Phase 7: API Readiness Pass

Suggested branch: `mobile-api-readiness`

- [x] Review current API endpoint names against backend routes.
- [x] Add API modules for future auth, reading lists, forum, votes, and issues.
- [x] Add typed response models for account-backed data.
- [x] Add centralized API error handling.
- [x] Keep production backend URL configurable with `EXPO_PUBLIC_API_BASE_URL`.

## Phase 8: Auth Planning

Suggested branch: `mobile-auth-plan`

- [x] Document mobile auth flow against the existing backend.
- [x] Decide secure token storage package.
- [x] Plan login/signup screens.
- [x] Plan token refresh/expiry behavior if backend supports it.
- [x] Plan signed-out vs signed-in navigation states.
- [x] Confirm Google OAuth mobile path before implementation.

## Phase 9: Mobile Quality Baseline

Suggested branch: `mobile-quality-baseline`

- [x] Add linting.
- [x] Add formatting.
- [x] Add CI once mobile repo is initialized.
- [x] Add basic unit tests for helpers/components if practical.
- [x] Document local development and verification commands.

## Future Phase: Mobile Legal Polish

Suggested branch: `mobile-legal-polish`

- [x] Decide whether Terms and Privacy should remain external website links or open in an in-app browser/native legal screen.
- [x] If keeping website-hosted legal copy, prefer an in-app browser presentation so users do not feel fully kicked out of the app.
- [x] Keep website Terms and Privacy as the canonical legal source for app store and public policy links.
- [ ] Confirm Support email behavior on Android and iOS before app-store release.

## Future Phase: Account-Gated Screens

Suggested branch: `mobile-account-gated-screens`

- [x] Add signed-out account-required states for account-backed screens.
- [x] Connect Reading Lists to the existing authenticated reading-list API when a mobile session exists.
- [x] Keep Forum Activity honest until user-specific forum activity endpoints exist.
- [x] Add Settings session status and logout affordance.
- [ ] Add native editing for settings only after real persisted preferences exist.

## Future Phase: Public Forum Browsing

Suggested branch: `mobile-forum-browse`

- [x] Add a native public Forum screen backed by the existing thread list API.
- [x] Add a native thread detail screen backed by the existing thread posts API.
- [x] Link public Forum browsing from the More tab.
- [x] Render forum markdown links, inline images, and series references in native thread posts.
- [x] Link referenced series to native mobile series detail screens.
- [x] Preserve nested reply structure in native thread detail.
- [x] Render raw forum image/GIF URLs and HTML image tags in native thread posts.
- [x] Add mobile thread pagination controls for longer discussions.
- [x] Show locked and latest-updates-first thread status flags.
- [x] Keep posting, replies, and hearts read-only until mobile auth handoff is complete.
- [x] Replace manual page switching with native load-more behavior after review.
- [ ] Consider true scroll-end infinite loading if manual load-more still feels too slow on long threads.

## Future Phase: Native Issue Reporting

Suggested branch: `mobile-report-issue`

- [x] Add a native report issue screen instead of sending users to the website.
- [x] Reuse the existing anonymous `/issues/report` backend endpoint.
- [x] Support issue type, summary, details, optional email, validation, success, and error states.
- [x] Link report issue from the More tab legal/support section.
- [x] Keep screenshots deferred until native image picker permissions are chosen.
- [ ] Add contextual report entry points from series detail and forum thread screens if users ask for page-specific reporting.

## Definition Of Done For Design-First Restart

- [x] App passes `npm run typecheck`.
- [x] Main screens feel visually consistent.
- [x] No visible encoding artifacts remain.
- [x] User-facing copy sounds like a real app, not a project phase note.
- [x] Design leaves clear homes for auth, reading lists, forum, and voting.
- [x] Future agents can continue using `AGENTS.md` and these docs without needing extra context.
