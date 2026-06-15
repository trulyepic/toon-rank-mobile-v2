# Toon Ranks — Mobile (CLAUDE.md)

AI coding assistant entry point. Read this before touching any code.

> ⚠️ **Read `CONSTRAINTS.md` first.** It defines the non-negotiable workflow rules:
> never commit/push without explicit instruction, always end every task with numbered
> **emulator/device test steps** + a commit message + a PR description, one branch per task.
>
> **`AGENTS.md` is the deepest product/context reference** — read it for the full
> roadmap, feature state, design direction, and working rules. This file is the quick start.

---

## What this project is

Toon Ranks Mobile is the native (Expo / React Native) app-store version of Toon Ranks —
a community ranking platform for manga, manhwa, and manhua. It shares the **same production
backend and user data** as the website (`toonranks-frontend`).

Key facts:

- Expo 54 / React Native 0.81, TypeScript
- React Navigation (native stack + bottom tabs)
- TanStack Query for server-state caching
- Axios API client (`src/api/client.ts`) with auth header injection
- Auth via web-auth bridge → mobile code → JWT, tokens in `expo-secure-store`
- It is **not** a web wrapper — preserve the product model, not the web layout
- No separate mobile backend — shared backend at `https://api.toonranks.com`

---

## Repo layout

```
App.tsx                 — app root (providers, navigation container)
src/
  api/                  — Axios client + per-domain API wrappers (series, forum, votes, etc.)
  auth/                 — AuthContext, secure storage, web-auth bridge, session events
  components/           — reusable UI primitives (AppText, AppButton, Chip, Surface, etc.)
  config/               — env (EXPO_PUBLIC_API_BASE_URL) + branding constants
  context/              — local React contexts (CompareContext)
  hooks/                — custom hooks (e.g. useForumDraft)
  navigation/           — RootNavigator, TabsNavigator, deep-link config (linking.ts)
  screens/              — one file per screen
  theme/                — design tokens (colors, spacing, radii, typography, shadows)
  types/                — shared TypeScript types
  utils/                — pure helpers (seriesStatus, forumDrafts, etc.)
docs/                   — architecture, auth contract, roadmap, design direction
```

---

## Commands

```powershell
npm run start        # Expo dev server
npm run android      # build + run on Android device/emulator
npm run ios          # build + run on iOS (Mac only)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run format       # prettier --check
npm run test         # vitest run
npm run verify       # typecheck + lint + format + test  ← run before handoff
```

The owner typically runs on a **connected physical device**, not the cloud. Always give
concrete emulator/device test steps.

---

## Critical rules — read before writing any code

> Full workflow constraints are in `CONSTRAINTS.md`; full product rules in `AGENTS.md`.
> The short version:

1. **Never commit or push without explicit instruction from the owner.** Finishing a task does not mean you commit. Wait to be told.
2. **Always end every task with:** numbered emulator/device test steps (each with an expected outcome), a one-line commit message, and a short GitHub PR description. No exceptions.
3. **Never work directly on `main`.** Branch as `mobile-<short-desc>`.
4. **Shared backend, shared data.** Never add a mobile-only store for data that must sync with the website (reading lists, forum, votes, identity).
5. **Tokens go in `expo-secure-store`** — never plain AsyncStorage. (AsyncStorage is fine for non-sensitive things like forum composer drafts.)
6. **Auth changes:** `docs/MOBILE_AUTH_CONTRACT.md` is the source of truth — read it before editing any auth code.
7. **Use the theme tokens** in `src/theme/` — never hardcode colors/spacing. Styles are built per-screen via `getStyles()` reading the active theme.
8. **API calls go through `src/api/`** wrappers — never call axios directly from a screen.
9. **Keep changes small and branch-sized** — reusable components over big screen rewrites.
10. **Run `npm run verify`** before handing work back.
11. **Bump the app version for anything that ships.** No OTA updates exist here, so every
    change reaches users only via a new store build, and Play rejects a reused
    `versionCode`. When a branch's change will ship, bump `android.versionCode` (+1),
    `ios.buildNumber` (+1), and `version` (semver) together in `app.json`. This is a
    per-release step, not per-edit. See `CONSTRAINTS.md` constraint 7 for the full rule.

---

## Bottom-sheet pattern note

When a sheet has a fixed footer, cap the inner `ScrollView` height (e.g. `screenHeight * 0.6`)
and add `useSafeAreaInsets().bottom` padding so the footer stays on screen — see
`HomeFilterSheet` / `EditSeriesModal`.

---

## Where to find things

| Need                                         | Look here                          |
| -------------------------------------------- | ---------------------------------- |
| Full product context, roadmap, feature state | `AGENTS.md`                        |
| Workflow + handoff rules                     | `CONSTRAINTS.md`                   |
| App structure, file-by-file                  | `docs/ARCHITECTURE.md`             |
| Auth flow (the source of truth)              | `docs/MOBILE_AUTH_CONTRACT.md`     |
| Active roadmap / what to work on             | `docs/CORE_APP_EXPERIENCE_TODO.md` |
| Design direction                             | `docs/DESIGN_DIRECTION.md`         |

---

## Related repos

| Repo                 | Purpose                               | Deployment                         |
| -------------------- | ------------------------------------- | ---------------------------------- |
| `toon-ranks-mobile`  | **This repo** — Expo/React Native app | EAS → Google Play (closed testing) |
| `toonranks-backend`  | FastAPI REST API (shared)             | Railway                            |
| `toonranks-frontend` | Vite/React web app                    | AWS Amplify                        |
