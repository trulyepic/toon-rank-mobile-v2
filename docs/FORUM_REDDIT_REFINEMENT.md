# Forum Reddit-Style Refinement (Mobile)

Branch: `forum-reddit-refinement`
Scope: `src/screens/ForumScreen.tsx` (the forum front page / Discover feed).

This is the mobile application of the refinement documented in
`toonranks-frontend/docs/FORUM_REDDIT_REFINEMENT.md` (§3 "Design decisions to
carry into mobile"). Same product decisions, mobile-native building blocks.

## What changed vs. the web checklist

| Web decision               | Mobile implementation                                                                                                                                                                                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Feed, not cards         | `ThreadCard` (heavy raised Surface per thread, 42px icon tile, chevron, badge row) replaced by `ThreadRow`: all rows live inside **one** `Surface padding="none"` container with hairline dividers. Icon tile, chevron, and series-label caption removed. Roughly 2× threads per screen.                                                    |
| 2. Meta order              | Row now reads `avatar author · time-ago` (+ Pinned/Locked/category chips) **above** the title, with a right-aligned reply chip (chat icon + count). Reply count = `max(0, post_count − 1)` — the OP is not a reply, so an unanswered thread shows `0`, not "1 posts".                                                                       |
| 3. Relative time           | `timeAgo()` (`src/utils/timeAgo.ts`, mirrors web) instead of the absolute `formatForumDate()` in the list. Absolute dates remain fine inside the thread screen.                                                                                                                                                                             |
| 4. Actions behind overflow | The always-visible admin "Pin/Unpin" badge became a "⋯" button in the row's right rail. It triggers the existing native `Alert` confirm (Pin/Unpin + Cancel) — the mobile counterpart of the web kebab dropdown.                                                                                                                            |
| 5. One toolbar             | The big "Community discussions" hero Surface is gone (ScreenShell already provides title + subtitle; signed-out users get a one-line hint instead). Sort chips and category chips merged into **one** horizontally scrollable strip with a thin divider between the groups. "N available / M shown" section body simplified to "N threads". |
| 6. State persistence       | Sort choice persists in `AsyncStorage` (`forum_sort`, non-sensitive → AsyncStorage is correct per CONSTRAINTS) and is restored on mount. Search was already debounced 300 ms. Category stays session-only (tab state persists while the app lives).                                                                                         |
| 7. Pinned = one signal     | Amber left accent + subtle row tint + small "Pinned" chip. The pin icon tile and duplicate signals removed.                                                                                                                                                                                                                                 |
| 8. Series pills capped     | Already handled — `ForumSeriesStrip` caps at 3 unique refs. Unchanged.                                                                                                                                                                                                                                                                      |
| 9. OP excerpt (deferred)   | Still deferred; needs the backend threads-list API to return an excerpt. `previewMarkdown()` in `src/utils/forumFormatting.ts` is ready to render it when available.                                                                                                                                                                        |

## Follow-up pass (same branch)

A second review after the first pass extended the refinement:

- **Reply-count off-by-one fixed** in the thread screen hero
  (`ForumThreadScreen`) and the Following tab (`ForumPersonalFeed`):
  `post_count` includes the OP, so both now show `max(0, post_count − 1)`.
- **Personal feeds paginate.** Following/Bookmarked were page-1-only (anything
  past 20 items was silently hidden). Both now use `useInfiniteQuery` with a
  "Load more" button driven by `has_next`.
- **Personal feed rows flattened** into the same single-Surface,
  hairline-divided container as the Discover feed.
- **Thread hero actions behind an overflow.** The visible Edit / Delete /
  Lock / Latest-first / Pin button row became a single "⋯ Thread actions"
  trigger that opens a bottom-sheet Modal (same `sheetBackdrop`/`actionSheet`/
  `sheetRow` styles as the per-post "…" sheet). Delete keeps its confirm;
  Pin keeps its Alert confirm.

The web counterpart of this pass is on `toonranks-frontend` branch
`forum-refinement-followups`.

## Not touched

- `CategoryManagerModal`, notifications button, New-thread flow, the reply
  tree/composer on the thread screen.
- `formatForumDate` stays in `forumFormatting.ts` — other screens still use it.

## Verification

`npm run verify` clean (typecheck, eslint, prettier, 24 test files / 105 tests).
Device test steps are listed in the task handoff / PR description.
