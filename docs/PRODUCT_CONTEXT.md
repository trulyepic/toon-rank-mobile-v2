# Toon Ranks Mobile Product Context

## One-Sentence Purpose

Toon Ranks Mobile is the native app-store companion to Toon Ranks, giving users a mobile-first way to
browse, compare, rate, save, and discuss manga, manhwa, and manhua using the same backend and account
data as the website.

## What Toon Ranks Is

Toon Ranks ranks manga, manhwa, and manhua through reader voting and structured series metadata. The
website already supports public browsing, search, series details, comparison, accounts, reading lists,
issue reporting, and forum activity. The mobile app should become the native version of that product,
not a separate product.

## Brand And Legal Context

- User-facing brand: Toon Ranks
- Legal/operator entity: Nofara LLC
- Website canonical origin: `https://www.toonranks.com`
- Public contact email: `trulyepickstudios@gmail.com`

Use `Toon Ranks` in navigation, headings, app copy, and store-facing product language. Use
`Nofara LLC` only in legal/policy/settings surfaces.

## Target User Experience

Users should be able to:

- open the app and immediately browse ranked titles
- search for a title, genre, author, artist, or format
- inspect a series detail screen with ratings, synopsis, cover art, metadata, and category scores
- compare selected titles side by side
- sign in with the same account they use on the website
- see and manage their existing reading lists
- continue tracking left-off chapters
- read and participate in forum discussions
- vote/rate using the same categories as the website

## Product Parity Goal

The goal is website parity in capability, but not layout parity.

The mobile app should preserve:

- same data
- same account identity
- same ranking concepts
- same voting categories
- same reading-list behavior
- same forum content model

The mobile app should change:

- navigation patterns
- information density
- card layouts
- touch targets
- loading/empty/error treatment
- native app affordances

## Phase Philosophy

Work is broken into branch-sized phases documented in `docs/CORE_APP_EXPERIENCE_TODO.md`.
Each phase should be small enough to review in a single PR and should leave the app in a working
state. After each phase, document what changed, what to verify, and the commit/PR message.

Do not block a phase on work that belongs in a later phase. Leave clear affordances for
upcoming features rather than building placeholders that mislead users.

## In-Scope Long-Term Mobile Features

Public:

- rankings feed
- type filters for manga/manhwa/manhua
- search
- series detail
- compare
- about/contact/policy surfaces where needed for app-store trust

Authenticated:

- login/signup (via web-auth bridge with CAPTCHA)
- reading lists and left-off chapter tracking
- forum identity — threads, replies, up/down votes
- voting/rating per category
- forgot-password entry point using the existing website flow
- issue reporting

Deferred or app-store-sensitive:

- contributor/admin tools
- forum media upload (image/GIF picker)
- push notifications
- Apple/Google sign-in additions (requires additional backend and store review steps)

## Current Mobile App Snapshot (as of Phase 5 / 5.5 work)

The mobile app now includes a full working product foundation:

**Public browsing:**

- Home rankings grid with type filters and load-more
- Search with query results
- Series Detail with summary, metadata, voting UI, and save/list entry points
- Compare board (local state)
- Forum: thread list, thread detail with nested replies, pagination, locked/latest-first flags

**Auth and sessions:**

- Login/signup via web-auth bridge (website CAPTCHA → mobile code → JWT)
- Refresh-token session durability (~30 days)
- Forgot-password entry point (opens website reset flow)
- Session expiry handling on 401/403

**Account-backed features:**

- Series voting (1-10 per category, locked after vote)
- Reading lists (view, detail, add, remove, edit left-off chapter, create list)
- Forum reply composer with reply-to-reply (parent_id) support
- Forum up/down votes
- Create thread with series reference picker
- Native issue reporting (anonymous or authenticated, no screenshots yet)

**Remaining work (in priority order):**

- Forum owner/admin edit and delete post controls
- Forum markdown rendering parity (bold, italic, lists, blockquotes, inline code)
- Avatar preset selection; native avatar upload/crop (Phase 6 / 6.5)
- Issue reporting screenshots and contextual entry points (Phase 7)
- Search and browse completeness (Phase 8)
- App-store readiness — bundle IDs, icons, splash, EAS build (Phase 9)

## Product North Star

A user should feel: "This is Toon Ranks, but built for my phone." If they use the website and then
log into the app, their account and saved data should feel continuous.
