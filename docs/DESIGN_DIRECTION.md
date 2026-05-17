# Mobile Design Direction

## Design Goal

Make Toon Ranks feel like a polished native mobile app for ranking, comparing, saving, and discussing
manga, manhwa, and manhua.

The app should feel related to the website, but not like the website squeezed onto a phone.

## Current Visual Baseline

Current app design:

- dark background
- card-based content
- poster-forward ranking grid
- blue accents
- warm brown surfaces

This is a usable start, but it needs refinement before app-store readiness.

## Main Design Problems To Fix

- Palette is too brown-heavy and does not yet lean enough into the Toon Ranks blue identity.
- Many colors are hardcoded inside screen styles.
- Several user-facing strings describe implementation phases instead of product value.
- More tab is only a placeholder.
- There is no Account design shell.
- Empty/error/loading states are plain and inconsistent.
- Components are not reusable enough yet.

## Desired Visual Tone

The mobile app should feel:

- clean
- focused
- energetic but not noisy
- native
- cover-art-forward
- readable in dark mode
- built for repeated browsing

Avoid:

- marketing-page layouts
- large explanatory text blocks
- placeholder phase language
- overusing warm brown surfaces
- tiny tap targets
- screens that rely on web-style dense tables

## Color Direction

Keep dark mode as the primary baseline, but rebalance it:

- background: near-black with subtle warmth
- surfaces: restrained dark neutral
- primary accent: Toon Ranks blue
- secondary accents: rating/status colors only where meaningful
- text: high-contrast off-white
- muted text: readable gray, not muddy brown

Current blue reference:

```text
#315fdc
```

Potential design work:

- add `primary`, `primarySoft`, `surface`, `surfaceRaised`, `surfacePressed`
- add `textPrimary`, `textSecondary`, `textTertiary`
- add semantic colors for success/warning/danger
- add overlay colors for poster badges

## Typography Direction

React Native default typography is acceptable initially, but text hierarchy should be consistent:

- screen title
- section title
- card title
- metadata label
- body copy
- small captions

Avoid viewport-scaled font sizes. Use stable sizes and line heights. Text should never overflow
buttons or compact cards.

## Navigation Direction

Current tabs:

- Home
- Search
- Compare
- More

Likely future tabs:

- Home
- Search
- Lists
- Forum
- Account

Compare can remain a tab during Phase 1 if it is a central differentiator, but it may later become a
screen reached from Home/Search/Series Detail.

## Screen Intent

### Home

Purpose: browse ranked titles quickly.

Needs:

- strong poster grid/list
- filters or segmented controls for type
- rank and score badges
- clear save/compare affordances
- skeleton/empty/error states

### Search

Purpose: find titles fast.

Needs:

- search input with native focus behavior
- recent searches or suggested categories later
- compact list items
- easy navigation to detail
- compare/save actions

### Series Detail

Purpose: inspect one title deeply.

Needs:

- hero/cover treatment
- score/rank summary
- metadata chips
- synopsis
- rating breakdown
- save/list action entry point
- forum/discussion entry point later
- signed-out voting state later

### Compare

Purpose: judge selected titles side-by-side.

Needs:

- works on narrow screens
- clear selected-title headers
- swipe affordance if horizontal
- compact score/category rows
- remove/clear actions

### Account/More

Purpose: hold identity and app settings.

Needs:

- signed-out design
- signed-in profile summary later
- reading lists entry
- forum activity entry
- settings/legal links
- operator/legal surface when needed

## Reusable Components To Add

High priority:

- `AppText`
- `AppButton`
- `IconButton`
- `Chip`
- `Surface`
- `SeriesPosterCard`
- `SeriesListItem`
- `EmptyState`
- `ErrorState`
- `LoadingState`
- `SectionHeader`

Medium priority:

- `ScoreBadge`
- `RankBadge`
- `MetricCard`
- `AccountHeader`
- `ActionRow`
- `SegmentedControl`

## Copy Direction

Use product copy, not implementation copy.

Avoid:

```text
Voting comes in the next mobile phase when account support is ready.
Once the backend is reachable...
This holds future account features...
```

Prefer:

```text
Sign in to rate this series.
No rankings found right now.
Your saved lists will appear here after you sign in.
```

## Design-First Acceptance Criteria

Before deep functionality starts, the app should:

- pass `npm run typecheck`
- have no visible mojibake
- have consistent theme tokens
- use reusable UI components for common surfaces
- have polished Home/Search/Detail/Compare/Account shells
- show intentional loading/empty/error states
- look coherent on small and large phone widths
