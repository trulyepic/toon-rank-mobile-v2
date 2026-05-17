# Toon Ranks Mobile Phase 1 TODO

This file is the original early Phase 1 checklist. For the current design-first restart, use
`docs/DESIGN_FIRST_TODO.md` as the active TODO and keep this file as historical context.

## Goals

- Build the real native app foundation first.
- Reuse the existing backend and public data flows.
- Avoid auth-blocked work until platform setup is ready.

## Stack

- Expo
- React Native
- TypeScript
- React Navigation
- Axios
- TanStack Query

## Phase 1 Deliverables

- [ ] Expo app foundation
- [ ] Shared folder structure
- [ ] Environment config for backend base URL
- [ ] API client for public endpoints
- [ ] App theme/tokens
- [ ] Root navigation shell
- [ ] Bottom tabs
- [ ] Home / rankings screen
- [ ] Search screen
- [ ] Series detail screen
- [ ] Compare screen
- [ ] Placeholder More screen

## Public Backend Features To Reuse First

- [ ] rankings
- [ ] search
- [ ] series summary
- [ ] series detail
- [ ] compare-related public data

## Phase 1 UX Notes

- [ ] mobile-first search flow
- [ ] native-feeling navigation
- [ ] app-specific card layouts
- [ ] avoid copying web layout 1:1

## Deferred To Phase 2

- [ ] auth
- [ ] voting submission
- [ ] reading list management
- [ ] forum creation/replies
- [ ] contributor workflows
- [ ] admin workflows

## Immediate Next Steps

- [ ] install Expo dependencies
- [ ] boot app locally
- [ ] wire rankings endpoint into Home screen
- [ ] wire search endpoint into Search screen
