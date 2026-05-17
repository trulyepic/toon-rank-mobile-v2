# Mobile Quality Baseline

This project has a lightweight quality baseline intended for early mobile development. It should
catch common TypeScript, lint, formatting, and helper-regression issues without requiring a device or
full native build in CI.

## Local Commands

Run all checks:

```powershell
npm run verify
```

Run checks individually:

```powershell
npm run typecheck
npm run lint
npm run format
npm run test
```

Apply formatting:

```powershell
npm run format:write
```

## CI

GitHub Actions runs on pull requests and pushes to `main`.

Jobs are intentionally separate so a PR shows which category failed:

- `Typecheck`
- `Lint`
- `Format`
- `Tests`

## Test Scope

Current tests are unit-level helper tests only. They do not launch iOS, Android, or Expo.

Good early test targets:

- formatting helpers
- score/rank utilities
- API response mapping
- auth storage helpers once auth starts
- small pure reducers or state helpers

Delay heavier component, emulator, or E2E tests until the mobile UI and auth flow stabilize.
