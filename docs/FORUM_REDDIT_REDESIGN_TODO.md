# Forum Reddit-Style Redesign — Mobile Parity TODO

Status: **in progress**. Owner gave the go-ahead.

Progress:

- [x] **§2 OP badge** — done (branch `mobile-forum-redesign-todo`, merged).
- [x] **§3 Relative timestamps** — done (added `src/utils/timeAgo.ts` + tests).
- [x] **§1 / §4 / §8 Flat comments + connector rails + flat OP** — done (branch
      `forum-flat-comments-rails`). Flat comments, parent-owned rail + curved elbow,
      flat full-width OP with "Original post" pill. §4 (unified body) was already
      satisfied — OP and replies share one `ForumMarkdown` size. §11 action overflow
      (Reply beside votes as plain text, Quote moved into the `…` sheet) folded in here
      since it touched the same action row.
- [x] **§5 Collapse / expand + rail press-to-collapse** — done (branch
      `forum-flat-comments-rails`). Also re-did the rail as ONE continuous measured
      SVG path (see §1 note). **Adds `react-native-svg` — needs a native rebuild.**
- [x] **§6 Indentation cap** — done (branch `forum-flat-comments-rails`). Past
      depth 4, child indent shrinks (24px vs 40px) and the rail curve target follows.
- [x] **§7 Personalized tabs (Discover / Following / Bookmarked)** — done. Native top
      tab strip on `ForumScreen` (signed-in only; Discover default). New
      `ForumPersonalFeed` component renders followed threads + bookmarked posts;
      bookmarked rows use the native `ForumMarkdown` renderer with an "Image" badge.
      Counts via lightweight `(1, 1)` requests; follow/bookmark toggles invalidate
      `["forum","me"]`. API wrappers already existed.
- [~] FlatList virtualization of the reply tree — **intentionally not done.** It
  conflicts with the measured continuous rail (a parent measures ALL its direct
  children via `onLayout` to draw one SVG path; virtualization unmounts offscreen
  rows, so the rail would break) and with scroll-to-post (`measureLayout` against
  the single `ScrollView`). The thread **already paginates** (20 posts/page via
  `useInfiniteQuery` + "Load more"), so the render is bounded and the Home-list
  lag scenario does not apply. Revisit only if a real long-thread perf problem
  shows up — and then likely virtualize at the top-level-reply granularity, not
  the whole tree. Logged here so it's a deliberate decision, not an oversight.
- [~] §9 Composer placement — **skipped on mobile** (native docked bottom composer stays).
- [~] §10 Flat reply box — **mostly N/A on mobile** (single native docked composer already).

The web frontend (`toonranks-frontend`) shipped a Reddit-style forum redesign on
branch `frontend-forum-reddit-redesign`. This doc is the spec for bringing the
same changes to this React Native / Expo app, translated to mobile patterns. The
backend is shared, so all the data already exists — this is a UI/UX port, not new
APIs.

Latest web parity updates to include in the mobile port:

- `/forum` now labels the saved-posts tab **Bookmarked** instead of Saved.
- Following and Bookmarked tabs show item counts in the tab label.
- Bookmarked rows render markdown previews instead of raw markdown text. Image
  markdown should render as a native image/thumbnail and show a small `Image`
  indicator on the row.
- Thread replies use Reddit/YouTube-style branch rails: a parent-owned vertical
  rail, a curved elbow into each child row, and the elbow should visually land on
  the child user's avatar/icon area.
- Latest rail refinement: draw the branch as one continuous parent-owned path
  with slight curves into each direct reply. The visible line must stop at the
  last reply's curve, with no trailing straight rail below the final child.
- Rails remain interactive: tapping/pressing the rail collapses the connected
  branch, and the rail should visibly brighten on hover/focus/press where the
  platform supports it.
- Expanded comments show the collapse `-` control in the action-row/rail area.
  Collapsed comments must still show a visible `+` control so the branch can be
  reopened.
- Secondary actions are tucked behind an overflow `...` menu to keep the reply
  rows clean.
- Reply actions are plain text controls placed beside the vote control, not
  bordered pills. Inline reply editors open below the action row without an outer
  card/border.
- Comment rows should not show a hover/touch background wash; keep the thread
  flat and let rails/actions provide interaction feedback.

> Reminder of repo rules (see `CLAUDE.md` / `CONSTRAINTS.md`): branch first as
> `<desc>` (no `mobile-` prefix), use the theme tokens in `src/theme/` (no hardcoded colors),
> API calls go through `src/api/`, run `npm run verify` before handoff, and end
> with numbered emulator/device test steps.

## Where this lives in the app

- `src/screens/ForumScreen.tsx` — forum index (thread list). Gets the tabs.
- `src/screens/ForumThreadScreen.tsx` — a single thread + replies. Gets the
  comment-tree redesign, OP badge, relative time, collapse.
- `src/api/` (e.g. `forum.ts`) — confirm/add wrappers for the follow + bookmark
  endpoints used by the personalized tabs.
- `src/theme/` — reuse existing tokens for the new rail/badge/tab colors.

---

## 1. Reddit-style flat reply tree ✅ DONE (continuous SVG rail) / ⚠️ FlatList deferred

> Implemented in `ForumThreadScreen.tsx`. First pass used two `View`s per child
> (straight line + bordered elbow) which read as two disjoint rails. **Reworked to
> match the web**: the avatar now lives in a left "rail column" and a single
> `react-native-svg` `Path` per node draws ONE continuous rail — a vertical spine
> plus a quadratic `Q` curve into each direct child's avatar centre, ending at the
> last child (no tail). Child centres are measured at runtime via `onLayout` (reply
> heights vary). The recursive node component is `CommentNode`; geometry is in the
> `RAIL_*` constants. **This adds `react-native-svg` — the app needs a native
> rebuild (`npm run android`), not just a JS reload.**
>
> **Deferred:** virtualizing the tree with a real `FlatList` (recursive tree + one
> `ScrollView` for sticky composer / scroll-to-post — needs flattening into a
> depth-tagged list).

**Web change:** replaced heavy per-reply cards with flat, compact comments. The
current web version uses Reddit/YouTube-style branch rails instead of a simple
colored card border: each parent owns the vertical rail for its child branch, and
each child has a curved elbow connector that touches/lands on the child's avatar
area. Comment vertical spacing is tight.

**Mobile TODO:**

Latest rail requirements from the web branch:

- Each comment is flat: small avatar + username + meta on one row, body below,
  compact action row, no big card.
- Draw the rail as a parent-owned vertical line for children.
- Draw a rounded elbow/curve from the parent rail into each child comment. The
  curve should visually touch the child avatar/user-icon area, matching Reddit's
  relationship cue.
- Prefer a single measured/path-based rail implementation over separate border
  segments so the parent rail and child elbows read as one continuous line.
- Stop the rail at the final child connector. Do not leave a dangling straight
  segment below the last visible reply.
- Preserve press feedback on the rail path (pressed/hover/focus color state)
  even if the drawing layer itself is not the touch target.
- Verify the curve still aligns when avatars are custom images, anonymous
  placeholders, OP badges, and long usernames are present.

- Render the reply tree with a **`FlatList`** (not a `ScrollView` + `.map`) so it
  stays virtualized — see the lesson in `CORE_APP_EXPERIENCE_TODO` about the Home
  list lag; the same applies here for long threads.
- Each comment: small avatar + username + meta on one row, body below, a compact
  action row. No big card; do not use a card border as the relationship rail.
- Nesting: indent each level with left padding + a 1px left border (the connector
  line). Keep the indent step small (≈10–12px) for narrow screens.

## 2. OP badge ✅ DONE

> Implemented in `ForumThreadScreen.tsx`: a tiny accent "OP" pill renders next to
> the author name on the original post and on any reply by the same author.
> `opUsername` is threaded down `ReplyTree`; it is `null` (badge suppressed) when
> the OP is anonymous. Uses theme tokens — no hardcoded colors.

**Web change:** a small blue "OP" pill shows next to the thread author's name on
the original post and on any reply they authored. Suppressed when the OP is
anonymous (`author_username` is null).

**Mobile TODO:**

- Pass the original poster's username down the reply tree (the thread's first
  post author). Show an `OP` chip when `post.author_username === opUsername`.
- Reuse the existing chip/badge component if one exists; otherwise a tiny pill
  with theme accent colors.

## 3. Relative timestamps ✅ DONE

> Implemented: `src/utils/timeAgo.ts` (`timeAgo` + `fullTimestamp`, mirroring the
> web thresholds) with `src/utils/timeAgo.test.ts`. Wired into the thread + reply
> meta rows and the OP hero author row; replaced `formatForumDate` there.

**Web change:** switched verbose absolute timestamps to compact relative ones
("7h ago", "3d ago", "2mo ago"), with the full date available on hover. Helper
lives in `src/util/timeAgo.ts` on web.

**Mobile TODO:**

- Add an equivalent `timeAgo(iso)` helper under `src/utils/` (pure function;
  mirror the web thresholds: just now / m / h / d / mo / y).
- Use it in the thread + reply meta rows. (No SSR on mobile, so no
  hydration-mismatch concern — simpler than web.)

## 4. Unified body text size ✅ DONE (already satisfied)

> On mobile the OP and every reply already render through the same `ForumMarkdown`
> component at one size — there was never depth-based sizing to undo. Confirmed
> during the §1 rewrite.

**Web change:** all comment bodies **and the original post** render at ~14px with
~1.5 line-height (originally the tree mixed 16px and 14px by depth). The OP is no
longer larger than the comments — it's distinguished by layout instead (see §8).

**Mobile TODO:**

- Pick one body text size for all replies and the original post (match the app's
  existing body token, ~14–15px) with comfortable line-height. Drive sizes from
  `src/theme/` typography, not inline numbers.

## 5. Collapse / expand comments ✅ DONE

> Implemented in `CommentNode`: per-node `collapsed` state. Tapping the rail
> (a full-height transparent `Pressable` over the SVG line) collapses the branch;
> the rail brightens (`accentStrong`) while pressed. Collapsing hides only the
> **replies** — the parent comment stays fully visible (body + actions) — with a
> `+` button under the avatar and "(N replies)" in the meta row (`countDescendants`)
> to re-expand. Expanding re-measures and redraws the rail.

**Web change:** a `[–]` / `[+]` toggle on each comment. Collapsing folds the
comment to a single line, hides its body + actions + entire subtree, and shows a
descendant count, e.g. "+ username · 26d ago (2 replies)".

**Mobile TODO:**

- Latest web parity: expanded comments place the collapse `-` in the
  rail/action-row area, similar to Reddit. Collapsed comments must leave a visible
  `+` control on the rail/header area so the hidden branch can be reopened.
- Per-comment local `collapsed` state. Tapping the toggle (or the meta row)
  collapses. When collapsed, render only the meta row + "(N replies)" and skip
  rendering children.
- Compute the descendant count from the parent→children map (a small recursive
  helper, same as web's `countDescendants`).
- Make the touch target comfortable (≥32px) — bigger than the web click target.

## 6. Deep-nesting indentation cap

**Web change:** past depth 6, the accumulating indent is capped so deep threads
don't run off-screen; the connector rail still conveys nesting.

**Mobile TODO:**

- Even more important on phones. Cap the indent earlier (consider depth ≈ 4–5).
- Past the cap, stop adding horizontal indent (keep the rail), or consider a
  "Continue thread" affordance later if/when per-comment deep links exist.

## 7. Personalized forum tabs (Discover / Following / Bookmarked)

Latest web parity requirements:

- Use **Bookmarked** copy everywhere the mobile UI refers to saved forum posts.
- Show counts next to Following and Bookmarked tabs. Use lightweight first-page
  requests/page metadata if the API exposes totals; avoid fetching full lists just
  to count.
- Bookmarked post snippets must render markdown safely through the native forum
  markdown renderer. Do not show raw `![](...)` image markdown in the row.
- If a bookmarked post contains image markdown or an image URL, render a small
  native image/thumbnail where appropriate and show a compact `Image` badge on
  the row.

**Web change:** on `/forum`, logged-in users get three tabs:

- **Discover** (default, also what logged-out users see) — the existing public
  thread list with search/sort/categories. **Unchanged and still the default
  landing** so anonymous + new visitors and SEO get the public feed.
- **Following** — threads the user follows, from `GET /forum/me/following`.
- **Saved** — posts the user bookmarked, from `GET /forum/me/bookmarks`.

Both personalized tabs reuse existing follow (`toggleThreadFollow`,
`viewer_is_following`) and bookmark (`togglePostBookmark`,
`viewer_has_bookmarked`) data — no new backend. Each tab has loading, error, and
empty states (empty state explains how to follow/bookmark).

**Mobile TODO:**

- Add a top tab strip on `ForumScreen` (horizontal, scrollable, thumb-reachable).
  Show the personalized tabs only when signed in (`useAuth`). Default to
  **Discover** for everyone.
- Confirm/add `src/api/` wrappers for `/forum/me/following` and
  `/forum/me/bookmarks` (and the toggle endpoints if not already present).
- Build a `ForumPersonalFeed`-equivalent: Following renders thread rows
  (title, reply count, "active Xh ago", unread dot); Saved renders post rows
  (author, time, 2-line snippet) that deep-link into the thread (and ideally
  scroll to the post).
- Empty states with a one-line hint, matching web copy.

**Product guardrail (important):** keep **Discover as the default**. Do NOT make a
personalized feed the forced landing — anonymous/new users and discovery/SEO need
the public list first. Personalization is an opt-in layer, not a gate.

## 8. Original post: flatten + at-a-glance distinction ✅ DONE

> Implemented: the OP renders via `PostCard` with `isOriginalPost`, flat and
> full-width (no rail), distinguished by an "Original post" pill, the OP badge, a
> `md` avatar, and a `cardTitle` author name — no heavy tinted panel. Replies carry
> the left rails; the OP does not.

**Web change:** the original post used to be a heavy card (gradient header, an
"Opening discussion" filler heading, a rounded inner card). It's now a flat post
that matches the comments. To still make the OP obvious at a glance — Reddit-style
but native to Toon Ranks — the distinction comes from three light cues, not a
colored panel:

- an "Original post" pill + the "OP" badge on the author,
- the OP renders flat/full-width while comments carry the colored left rails, and
- the reply composer sits directly beneath the OP (see §9), separating it from the
  comment tree.

(An earlier attempt used a blue tinted panel; it felt too heavy and was dropped.)

**Mobile TODO:**

- Render the OP as a flat post (no big card), consistent with the comment styling,
  with an "Original post" / "OP" marker.
- Reproduce the at-a-glance distinction with native cues: OP full-width (no thread
  rail) vs. railed comments, plus the composer directly below it. Avoid a heavy
  tinted background.

## 9. Reply composer placement (top, under the OP) ❌ SKIP ON MOBILE

> **Not porting this.** It's a web layout pattern. Mobile already uses the
> native pattern — a composer **docked to the bottom of the screen**
> (`ScreenShell` `stickyFooter`: the "Write a reply…" / "Log in to reply" bar that
> expands into the full composer). That matches Reddit/Apollo/YouTube mobile and is
> thumb-reachable. Moving an "Add a comment" box to the top under the OP would be
> less native, so the docked bottom composer stays as-is.

**Web change:** the main "Join the conversation" reply box moved from the bottom of
the thread to **directly under the original post**, above the comments (the Reddit
pattern). It doubles as the visual divider between the OP and the responses. New
top-level comments still append to the list below.

**Mobile TODO:**

- Place the primary reply affordance near the top, right under the OP. On a phone
  this is likely a compact "Add a comment" row that opens the full composer (bottom
  sheet or inline expand) rather than an always-open box, to save vertical space.
  Keep new comments appending to the list below.

## 10. Simplified, flat reply box ✅ MOSTLY N/A ON MOBILE

> Mobile already has a **single** native docked composer (no per-reply card
> variants to unify, no drop-shadow card to remove) with a flat themed input. The
> only part that could still apply is optionally collapsing the formatting toolbar
> behind a small toggle to keep the expanded composer cleaner — low priority, not
> required. No structural work needed here.

**Web change:** the reply editor was simplified two ways:

- **Formatting tools hidden by default.** The markdown toolbar, image/GIF, list,
  and the markdown hint are collapsed behind a small "Aa Formatting" toggle; the
  box defaults to just a text field + Post button. Users reveal tools on demand.
- **Flat styling.** Removed the heavy card wrapper, drop-shadow, and bordered
  header. The box is a single clean rounded field matching the forum's inputs, with
  a small label above it. (The old `compact` visual variant was retired so every
  reply box — main, inline, nested — looks identical.)

**Mobile TODO:**

- Default the composer to a minimal text field + Post action; put formatting
  helpers (image, mention, list, markdown) behind a toggle / overflow so the box
  stays clean. Drafts still autosave (AsyncStorage is fine for drafts).
- Use one flat field style from `src/theme/` for every reply box so they're uniform
  with the rest of the forum.

## 11. Compact reply action overflow

**Web change:** the reply action row keeps high-frequency actions visible and
moves secondary actions into a `...` overflow menu. This keeps deeply nested
threads readable.

**Mobile TODO:**

- Keep the core actions visible: vote controls/count, bookmark state if available,
  and Reply.
- Place Reply immediately beside the vote control as a plain text action,
  matching the web branch. Avoid bordered Reply pills.
- Move lower-frequency actions behind an overflow button/menu: Quote, Edit,
  Delete, Report, and any admin-only actions that do not need to be always
  visible.
- Preserve permissions: owner/admin actions only appear for users who can perform
  them.
- Ensure the overflow menu is reachable at each nesting depth and does not cover
  the branch rail in a confusing way.

---

## Suggested sequencing for the mobile port

1. `timeAgo` util + relative timestamps (cheap, isolated).
2. OP badge.
3. Flat comment styling + connector-rail nesting (virtualized FlatList), including
   the flat original post (§1, §8).
4. Collapse/expand + indentation cap.
5. Reply composer placement under the OP + the simplified/flat reply box (§9, §10).
6. Personalized tabs (Following / Saved) — verify the API wrappers first.

Updated sequencing addendum from the latest web branch:

- Treat curved branch rails, collapse/reopen controls, and action overflow as
  part of the same `ForumThreadScreen` redesign slice.
- Personal tabs should ship as Following / Bookmarked, with counts and
  markdown/image bookmarked previews.

## Regression checks to add before handoff

- Collapse a nested branch, confirm the body/subtree disappears, then tap the
  visible `+` and confirm it reopens.
- Confirm the expanded `-` sits in the Reddit-like rail/action position.
- Confirm each curved elbow touches the intended child avatar/icon at multiple
  depths, and the rail ends naturally at the final curve with no hanging tail.
- Confirm rail press/hover/focus feedback is visible while keeping the path
  continuous.
- Confirm Reply is beside votes, uses no border, and opens a borderless inline
  editor below the row.
- Confirm comments do not show a hover/background wash.
- Confirm deep nesting stays readable on a narrow phone viewport and indentation
  caps correctly.
- Confirm overflow actions remain available for owner/admin/non-owner cases.
- Confirm Bookmarked previews render markdown/images without raw markdown leaking.
- Confirm Following and Bookmarked tab counts match endpoint totals and update
  after follow/bookmark toggles.

Each step is its own `<desc>` branch (no `mobile-` prefix) with emulator test steps. Bump the
app version only when the owner says a build is being made.
