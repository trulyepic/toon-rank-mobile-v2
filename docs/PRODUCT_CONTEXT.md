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
- Public contact email currently used by the web project: `trulyepickstudios@gmail.com`

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

The user currently wants design first. That means the near-term job is to establish a professional,
native-feeling mobile product shell before wiring every feature.

Do not block the design phase on auth or full feature parity. Do leave clear places for auth and
account-backed content to slot in later.

## In-Scope Long-Term Mobile Features

Public:

- rankings feed
- type filters for manga/manhwa/manhua
- search
- series detail
- compare
- about/contact/policy surfaces where needed for app-store trust

Authenticated:

- login/signup
- Google OAuth if backend supports mobile-safe flow
- reading lists
- left-off chapter tracking
- forum identity
- forum threads/replies/hearts
- voting/rating
- issue reporting

Deferred or app-store-sensitive:

- contributor/admin tools
- forum media upload moderation UX
- push notifications
- app-store review metadata
- Apple/Google sign-in additions

## Current Mobile App Snapshot

The mobile app currently includes:

- Home rankings grid
- Search results
- Series detail screen
- Compare board
- More placeholder
- API client for public series endpoints
- compare state context

It does not yet include:

- auth
- secure token storage
- persisted compare/saved state
- reading-list screens
- forum screens
- voting submission
- mobile app CI/tests
- app-store assets

## Product North Star

A user should feel: "This is Toon Ranks, but built for my phone." If they use the website and then
log into the app, their account and saved data should feel continuous.
