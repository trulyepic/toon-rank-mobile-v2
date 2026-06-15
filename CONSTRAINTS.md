# AI Assistant Constraints — Toon Ranks Mobile

These rules apply to every AI assistant working in this repository without exception.
They are repeated in `CLAUDE.md`, `AGENTS.md`, and `.cursorrules` — if you are reading
any of those files, these constraints still apply.

---

## Workflow — how work gets shipped

```
AI creates feature branch
        │
        ▼
AI does the work on that branch
        │
        ▼
AI hands off:
  1. Numbered EMULATOR / device test steps with expected outcomes
  2. Short commit message
  3. Short GitHub PR description
        │
        ▼
Owner reviews — ONLY commits and pushes when explicitly told to
        │
        ▼
Owner merges the branch
        │
        ▼
Builds (EAS) and store releases happen separately and manually
  └─ ONLY when the owner says a build is being made do you bump the
     app version (see constraint 7) — never at merge
```

---

## Hard constraints

### 1. Never commit or push without explicit instruction

Do not run `git commit`, `git push`, `git merge`, or open a PR unless the owner
explicitly says "commit", "push", or "commit and push". Completing a task does
**not** imply permission to commit. Always wait to be asked.

### 2. Always end every task with a handoff

When you finish work on a branch, always end your response with:

**Emulator / device test steps** — numbered steps the owner can follow on a
connected device or emulator, each with the **expected outcome**. The owner runs
on a physical device, so steps must be concrete. Include:

- Which screen to open and how to get there
- What to tap / scroll / input
- What the expected visible result is

Example:

```
1. Run `npm run android` (or `npm run start` and open on the connected device)
2. Open the Home tab
3. Find a row with a one-line title next to a two-line title
4. Expected: the type/votes row, Compare button, and save icon align across both cards
```

**Commit message** — one line, imperative, under 72 characters:

```
fix(home): reserve two-line title height so card meta and actions align
```

**GitHub PR description** — short summary + test plan checklist:

```
## Summary
- One sentence per change

## Test plan
- [ ] Concrete, checkable outcomes
```

### 3. One branch per task

Never mix unrelated changes on the same branch. If you notice something else that
needs fixing while working, flag it as a follow-up, do not fix it inline.

### 4. Never work directly on `main`

All work goes on a feature branch named `mobile-<short-desc>`. The owner merges
after reviewing.

### 5. Run `npm run verify` before handing back

When dependencies are available, run `npm run verify` (typecheck + lint + format +
test) before the handoff. If you cannot run it, say so explicitly.

### 6. Ask before assuming on anything ambiguous

If a requirement is unclear, ask one focused question before writing code. Do not
make assumptions and build the wrong thing.

### 7. Bump the app version only when the owner says a build is being made

This project has **no over-the-air updates** (no `expo-updates` / `runtimeVersion`),
and `eas.json` uses `appVersionSource: "local"` — so EAS does **not** auto-increment
versions, and **every** change (even pure-JS) reaches users only through a new native
build uploaded to the store. Google Play **rejects** a reused `versionCode`.

**Trigger:** bump **only when the owner explicitly says they ran / are about to run a
build** (e.g. "I ran a build", "cutting a release"). Do **not** bump on merge, on
handoff, or "to be safe" — merging does not produce a build. Many merged branches
accumulate and then ship together under a **single** bump when that build is cut. If you
are unsure whether a build is happening, leave the version untouched and say so in the
handoff. (The number in `app.json` is the next build's number, which may already be one
ahead of the live store build — see below.)

When the owner does signal a build, update **all three** fields in `app.json` together
so the build is store-ready:

| Field                   | Rule                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `android.versionCode`   | **+1** integer. Required by Play — must be strictly higher than the last upload.                                                                              |
| `ios.buildNumber`       | **+1**, kept in sync with `versionCode` (string). Matters once iOS ships.                                                                                     |
| `version` (user-facing) | Bump semver (e.g. `1.0.2` → `1.0.3`) for any user-visible change. Optional for build-only/internal fixes, but keep it moving so releases are distinguishable. |

The number in `app.json` is the **next** build's number, and it may already be one
ahead of the live store build because a bump was staged but not yet built. In that case
do **not** bump again — that staged number is consumed by the next build. (Example: as
of this writing `app.json` is `versionCode 4` while the store still serves `3`; build 4
has not been cut, so it stays `4` until the owner runs that build.) Only after the owner
says a build was made does the _following_ shippable change move to the next integer.
Never assume — check `app.json` and Play Console if unsure.

> Robustness option (not yet adopted): switching `eas.json` to
> `appVersionSource: "remote"` with `autoIncrement` makes EAS bump `versionCode`
> automatically on each production build, removing the manual step. Until that change
> is made, the manual bump above is mandatory.

---

## Mobile-specific guardrails (see AGENTS.md for the full list)

- **Shared backend only** — never introduce a mobile-only data store for data that
  must be shared with the website (reading lists, forum, votes, identity).
- **Tokens** — use `expo-secure-store`, never plain AsyncStorage.
- **Auth changes** — `docs/MOBILE_AUTH_CONTRACT.md` is the source of truth; read it
  before editing any auth code (mobile, backend, or web).
- **Native, not a web wrapper** — preserve the product model, not the website
  layout. No web-page copy inside the app.
- **Keep changes small and branch-sized** — prefer reusable components over large
  one-off screen rewrites.

---

## Branch naming

`mobile-<short-desc>`

Examples: `mobile-home-card-alignment`, `mobile-forum-draft-persist`, `mobile-status-badge`
