# Release Process (Android, EAS)

The single source of truth for building and shipping the mobile app. When the owner asks
"how do I build / release", answer from this file. Version-number rules live in
`CONSTRAINTS.md` #7 and are summarized in step 2 — don't restate them differently.

Builds run on **expo.dev (EAS Build)**, account `toonranks`, project `toonranks-mobile`.
The owner runs the commands from the `toon-ranks-mobile` folder in PowerShell.

---

## Build profiles (`eas.json`)

| Profile       | Command                                              | Produces              | Use for                                     |
| ------------- | ---------------------------------------------------- | --------------------- | ------------------------------------------- |
| `production`  | `eas build --platform android --profile production`  | `.aab` (app bundle)   | Google Play uploads                         |
| `preview`     | `eas build --platform android --profile preview`     | `.apk`                | Sideloading a release-like build to a phone |
| `development` | `eas build --platform android --profile development` | `.apk` with dev tools | Day-to-day development (see below)          |

- `appVersionSource` is `"local"`: EAS uses the numbers in `app.json` exactly as written. It
  does **not** auto-increment.
- Public `EXPO_PUBLIC_*` values for `preview`/`production` live in each profile's `env`
  block. The "No environment variables ... found on EAS" line in build output is expected.

---

## Shipping a production build — step by step

1. **Be on `main` with everything merged.** EAS packages the project from git, so
   uncommitted or unmerged work is not in the build.
   ```bash
   git switch main
   git pull
   ```
2. **Version numbers** (`app.json`): bump `version` (semver), `android.versionCode` (+1) and
   `ios.buildNumber` (+1) together — but only when the owner says a build is being made, and
   not if a staged bump is already waiting. Full rule: `CONSTRAINTS.md` #7. Play rejects a
   reused `versionCode`; skipping a number is harmless.
3. **Run the checks:** `npm run verify`
4. **Build:**
   ```bash
   eas build --platform android --profile production
   ```
   When it finishes, the terminal prints the `.aab` download link (also on expo.dev → Builds).
5. **Upload to Google Play** — either download the `.aab` and upload it in Play Console
   (the owner's usual route), or:
   ```bash
   eas submit --platform android --latest
   ```
   `submit.production` in `eas.json` is empty, so the first `eas submit` asks for the Play
   track and a Google service-account key.
6. **Release notes** — paste into Play Console (format below), then roll out.
7. Install from the testing track and smoke-test the change on a real phone.

Keep the CLI current — EAS prints a notice when a newer version exists:

```bash
npm install -g eas-cli
```

---

## Release notes format (Play Console)

Play Console wraps notes in language tags and allows **500 characters per language**.
Write for players, not developers: what they'll notice, no ticket names or internal terms.
List what changed **since the last store build** — check with
`git log --oneline <last-bump-commit>..main`, where the last bump commit is the most recent
commit that changed `app.json`'s `versionCode` (`git log --oneline -- app.json`).

```
<en-US>
What's new:
• <user-visible change, one line>
• <user-visible change, one line>
• Bug fixes and performance improvements.
</en-US>
```

---

## Development builds, not Expo Go

`expo-dev-client` is installed, so development uses **our own app with a developer menu**
(a "development build"), not the generic Expo Go app. Expo Go only contains Expo's bundled
native modules and can behave differently from the shipped app. Without `expo-dev-client`,
EAS prints "Detected that your app uses Expo Go for development" during production builds.

- `npm run android` — builds and installs the development app on the connected phone.
- `npm run start` — starts the dev server; the installed development app connects to it.
- Shake the phone to open the developer menu (Reload, etc.).
- No cable? Build an installable development app once with
  `eas build --platform android --profile development`, install it, then use `npm run start`.

The developer menu exists only in development builds; production/preview builds are
unaffected.

---

## Known, non-blocking build output

- "Computing the project fingerprint is taking longer than expected" — harmless; it can be
  skipped with the env var `EAS_SKIP_AUTO_FINGERPRINT=1`, but there's no need to.
- `npx expo-doctor` reported 9 outdated packages (as of 2026-10-07). Not a release blocker;
  upgrading them is a separate task (`npx expo install --check`).
