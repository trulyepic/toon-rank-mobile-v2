# Home Screen Redesign — "Ranked Showcase"

Goal: make Home feel beautiful and dynamic — motion with purpose (150–300 ms,
springs over linear), a hero that showcases the Top 10, and a grid that feels
tactile. No urgency to ship; each phase lands on its own branch and gets a
device-test pass before the next starts.

## Design vision

1. **Hero: Top 10 carousel** — large snap-scrolling covers with a bottom
   gradient overlay, big display rank numerals (Netflix-style), title + score
   over the gradient, subtle parallax. The centerpiece.
2. **"All rankings" grid below** — the current grid, kept, but animated:
   staggered entrance, spring press feedback, smooth filter transitions,
   gold/silver/bronze top-3 badges.
3. **Motion everywhere it matters, nowhere it doesn't** — collapsing header,
   sliding type-rail indicator, shimmer skeletons, light haptics.

## Technical constraint (decided during Phase 1)

`app.json` has `newArchEnabled: false`. Expo SDK 54 bundles
**react-native-reanimated 4**, which **requires the New Architecture** — so
Reanimated is NOT used in Phase 1. Phase 1 animations use React Native's
built-in `Animated` API (zero new native dependencies except `expo-haptics`).

Before Phase 2, decide one of:

- **(a) Enable New Architecture** (`newArchEnabled: true`) + Reanimated 4 —
  the forward-looking path, but needs a full device regression pass (auth,
  sheets, orientation, image picker), or
- **(b) Pin Reanimated 3.x** on the old architecture — less future-proof, or
- **(c) Keep building on built-in `Animated`** — no native risk; scroll-driven
  hero effects are doable with `Animated.event` but springier gesture work is
  more limited.

Recommendation at time of writing: (a), tested well — it unlocks Phases 2–3
properly and the app is small enough to regression-test in one pass.

---

## Phase 1 — Foundation + grid polish (branch: `home-redesign-phase1`)

- [x] Cover fade-in — already present in `CoverImage` (expo-image
      `transition={150}`); bumped to 250 ms for a softer feel.
- [x] Spring press feedback — new `PressableScale` component (scale 0.97 with
      spring-back, built-in `Animated`); used by Home grid cards.
- [x] Staggered card entrance — new `FadeInView` component (fade + 12 px
      slide-up on first mount, per-card delay within each loaded page).
- [x] Shimmer skeleton — new `HomeGridSkeleton` (pulsing poster placeholders)
      replaces the "Loading rankings..." text state on first load.
- [x] Top-3 rank treatment — gold / silver / bronze rank badges (#1–#3) on
      grid cards.
- [x] Haptics — `expo-haptics`: light impact when a card's long-press action
      sheet opens and when a series is saved/bookmarked.

## Phase 2 — Hero Top 10 carousel (done on `home-redesign-phase1` with Phase 1)

- [x] Decide the Reanimated / New Architecture question — resolved as option
      (c) for this phase: the carousel's parallax/scale is scroll-position
      interpolation, which the built-in `Animated` API handles natively. The
      New-Architecture decision is deferred to Phase 3 (gesture-driven
      collapsing header is where Reanimated starts to matter).
- [x] `HomeHeroCarousel`: horizontally snapping Top 10 of the active type —
      68%-width covers, bottom gradient overlay (expo-linear-gradient),
      large rank numeral, title + score pill + type over the gradient.
- [x] Parallax on the cover while swiping; focused-card scale emphasis
      (neighbours rest at 0.94, focused card at 1.0).
- [x] Grid gets an "All rankings" section header beneath the hero.
- [x] Hero respects the active type filter (Top 10 manga/manhwa/manhua) via
      its own score-ordered query — grid genre/status filters don't affect it.
- [x] Loading/error states for the hero that never block the grid (skeleton
      block while loading; hero hides entirely on error).

## Phase 3 — Connective tissue (done on `home-redesign-phase1` with Phases 1–2)

- [x] Collapsing header — implemented as: type rail + filter row are now
      **permanently pinned** above the list (always visible — resolves the
      UX trade-off below in the user's favour), while the hero scrolls away
      beneath them with a scroll-linked fade + parallax lag + slight shrink
      (native-driver `Animated` interpolation on the grid's scroll position).
- [x] Animated type rail — an accent dot glides under the active chip
      (chip positions measured `onLayout`, gentle spring).
- [x] Filter-change layout animation — `animateNextLayout()` (LayoutAnimation)
      fires on every type/status/genre/sort change and reset, so the grid
      re-flows smoothly instead of swapping instantly.
- [~] Cover-color tinting — **deferred**: needs `react-native-image-colors`
  (a native module → new build + the New-Architecture decision). Revisit
  alongside enabling `newArchEnabled` for a future phase.
- [x] Filter sheet spring-up entrance (sheet springs up 48 px while the modal
      fades); empty states fade in via `FadeInView`.
- [x] Motion audit — `theme/motion.ts` defines shared durations + spring
      characters; `PressableScale`, `FadeInView`, the rail dot, and the filter
      sheet all draw from it. It also centralises the Android
      LayoutAnimation opt-in.

## Phase 4 — Living-hero + dynamic touches (done on `home-redesign-phase1`)

Extra motion after a review pass — making things move on their own, not only
in response to touch. Still all built-in `Animated` (no new native deps).

- [x] Hero auto-advance — the carousel drifts to the next Top-10 card every
      4.5 s; any drag pauses it, resuming after 6 s idle. Resets to #1 when the
      type filter changes.
- [x] Bobbing crown — the #1 crown floats up/down on a slow loop.
- [x] Hero card entrance — carousel cards stagger in (fade + slide) on load.
- [x] Pulsing hero skeleton — the loading placeholder now pulses like the grid
      skeleton (was static).
- [x] Pull-to-refresh — refreshes the grid and invalidates the hero Top-10,
      with a light haptic.
- [x] Animated pagination — three bouncing dots (`LoadingDots`) replace the
      "Loading..." button text while the next page fetches.
- [x] Scroll-to-top on type switch — so the fresh grid's staggered entrance is
      seen from the top.
- [x] Compare-counter pop — the header compare badge springs when its count
      changes.

## UX trade-off accepted

~~The hero pushes the filters below it; they pin on scroll (Phase 3).~~
Resolved better than planned: the rails ended up permanently pinned above the
list, so filter-and-browse users never scroll for them at all, and the hero
still opens the screen right beneath.
