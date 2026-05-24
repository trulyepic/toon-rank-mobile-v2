# Toon Ranks Mobile — Asset Spec

Drop the following files into this folder before running an EAS production build.
The dev build will fail to launch if these files are missing, so add them before running `npm run android` again.

---

## Required files

### `icon.png`

- **Size**: 1024 × 1024 px
- **Format**: PNG, no transparency (alpha channel will be ignored or cause rejection)
- **Used for**: iOS App Store icon, Android launcher icon base layer, Expo splash fallback
- **Notes**: Keep the design centred with safe margins (~10%) so it looks good when masked to a circle (Android) or rounded square (iOS)

### `adaptive-icon.png`

- **Size**: 1024 × 1024 px
- **Format**: PNG, transparency allowed (this is the foreground layer only)
- **Used for**: Android adaptive icon foreground — the system applies the mask shape
- **Background colour**: already set to `#17110f` in `app.json`
- **Notes**: Keep the actual logo within the inner 66% (the "safe zone") so no part gets clipped on any mask shape

### `splash.png`

- **Size**: 1284 × 2778 px (iPhone 15 Pro Max native resolution — scales down correctly to all sizes)
- **Format**: PNG
- **Used for**: the loading/launch screen shown while the JS bundle loads
- **Background colour**: already set to `#17110f` in `app.json` — fill the entire canvas with this colour and centre the logo
- **Notes**: `resizeMode: contain` is set, so the image will be letterboxed on screens with different ratios. Design for the logo to be centred and legible at any size.

---

## Recommended workflow

1. Add the three files above to this folder
2. Run `npm run android` to confirm the dev build picks them up
3. Run `npx eas build --platform android --profile preview` to produce an APK for internal testing
4. Run `npx eas build --platform android --profile production` for the Play Store AAB

---

## EAS first-time setup

Before running any `eas build` command you need a free Expo account:

```bash
npm install -g eas-cli
eas login
eas build:configure   # links this project to your Expo account
```

Then submit:

```bash
eas submit --platform android --profile production
```
