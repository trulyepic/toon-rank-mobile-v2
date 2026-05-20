# Toon Ranks Mobile Core App Experience TODO

This TODO takes priority over polish-only work. The app should first feel reliable for browsing,
opening titles, and understanding auth limits before adding secondary conveniences.

## Phase 1: Title Loading Completeness

Suggested branch: `mobile-core-title-loading`

- [x] Audit title-loading paths across Home, Search, Compare, Series Detail, and forum title links.
- [x] Fix Home type filters so Manga, Manhwa, and Manhua load from backend type filters instead of only filtering the first overall ranking pages locally.
- [x] Add native load-more behavior for Home rankings so larger title sets can be browsed without pretending the first page is complete.
- [ ] Review Search result limits and add pagination if the backend exposes it.
- [ ] Confirm every title card opens Series Detail reliably.
- [ ] Confirm Forum referenced titles open Series Detail reliably.

## Phase 2: Title Detail Reliability

Suggested branch: `mobile-core-title-detail`

- [x] Add clearer retry behavior for Series Detail summary/detail fetch failures.
- [x] Keep summary-visible data available if detail fetch fails.
- [x] Make missing cover/synopsis/creator data look intentional.
- [ ] Confirm detail page works when opened from Home, Search, Compare, and Forum.

## Phase 3: Search Reliability

Suggested branch: `mobile-core-search-reliability`

- [ ] Confirm backend search response size and ordering.
- [ ] Add minimum query length or helpful guidance if needed.
- [ ] Add better loading state when switching quickly between searches.
- [ ] Ensure compare and detail navigation work from search results.

## Phase 4: Auth Contract Planning For Real Login

Suggested branch: `mobile-core-auth-contract`

- [ ] Define backend/web/mobile callback contract for native login/signup.
- [ ] Decide whether mobile keeps CAPTCHA web handoff or gets a native-safe verification path.
- [ ] Document exact backend endpoints and payloads needed by mobile.
- [ ] Do not claim login works until the app receives and stores a real mobile session.

## Phase 5: Real Mobile Login/Signup

Suggested branch: `mobile-core-auth-implementation`

- [ ] Implement token/code exchange after backend/web contract exists.
- [ ] Store session with SecureStore.
- [ ] Restore session on app launch.
- [ ] Connect logout, account screens, reading lists, votes, and forum identity to the real session.
