import type { LinkingOptions } from "@react-navigation/native";

import type { RootStackParamList } from "./RootNavigator";

/**
 * Deep-link configuration for the `toonranks://` custom scheme and the
 * canonical `https://www.toonranks.com` Android App Links host.
 *
 * Scope (Phase 41 + Phase 42): scheme-based links cover the screens that
 * already exist natively. Android App Links target the canonical production
 * host; domain verification is backed by `assetlinks.json` (with the Google
 * Play App Signing SHA-256 fingerprint) served by the web frontend at
 * `/.well-known/assetlinks.json`. Password-reset/verification email handoff
 * remains deferred until the Apple app is live.
 *
 * iOS: `associatedDomains` (`applinks:www.toonranks.com`) is now declared in
 * `app.json` as mobile-side prep, but Universal Links stay non-functional until
 * (a) the web host serves `/.well-known/apple-app-site-association` and (b) the
 * iOS app is live. Until then this config is inert and harmless.
 *
 * The public-profile path is `user/:username` to match the canonical web URL
 * (`https://www.toonranks.com/user/:username`) and the Android App Link intent
 * filter (`pathPrefix: "/user"`). It was previously `profile/:username`, which
 * never resolved for App Links.
 *
 * Numeric path params are coerced with `parse` so screens receive real numbers
 * (React Navigation otherwise passes path/query params as strings). The forum
 * post anchor is supported via a `?postId=` query param, e.g.
 * `toonranks://forum/12?postId=34`.
 *
 * Note: there is intentionally NO `"*"` catch-all route. A greedy wildcard
 * hijacks normal cold starts (the dev/launch URL matches nothing and would
 * resolve to NotFound), so unknown links are simply ignored — the app opens
 * normally. `NotFoundScreen` still exists and is reachable via in-app
 * navigation.
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["toonranks://", "https://www.toonranks.com"],
  config: {
    screens: {
      SeriesDetail: { path: "series/:seriesId", parse: { seriesId: Number } },
      ForumThread: {
        path: "forum/:threadId",
        parse: { threadId: Number, postId: Number },
      },
      PublicProfile: "user/:username",
      PublicReadingList: "lists/:token",
      Leaderboard: "leaderboard",
      IssueTracker: "issues",
      ReportIssue: "report-issue",
    },
  },
};
