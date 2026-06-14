import type { LinkingOptions } from "@react-navigation/native";

import type { RootStackParamList } from "./RootNavigator";

/**
 * Deep-link configuration for the `toonranks://` custom scheme and the
 * canonical `https://www.toonranks.com` Android App Links host.
 *
 * Scope (Phase 41 + Phase 42): scheme-based links cover the screens that
 * already exist natively. Android App Links are now prepared for the canonical
 * production host; domain verification still requires `assetlinks.json` with
 * the Google Play App Signing SHA-256 fingerprint served by the web frontend.
 * iOS Universal Links and password-reset/verification email handoff remain
 * deferred until the Apple app is live.
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
      PublicProfile: "profile/:username",
      PublicReadingList: "lists/:token",
      Leaderboard: "leaderboard",
      IssueTracker: "issues",
      ReportIssue: "report-issue",
    },
  },
};
