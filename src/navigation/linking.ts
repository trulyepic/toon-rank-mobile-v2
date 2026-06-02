import type { LinkingOptions } from "@react-navigation/native";

import type { RootStackParamList } from "./RootNavigator";

/**
 * Deep-link configuration for the `toonranks://` custom scheme.
 *
 * Scope (Phase 41): scheme-based links for the screens that already exist
 * natively, plus a NotFound fallback for anything unmatched. Universal Links /
 * App Links (https links opening the app) and the password-reset email link are
 * intentionally deferred to Phase 16, since they require the app to be live in
 * the stores with apple-app-site-association / assetlinks.json served from
 * toonranks.com before they can be verified end-to-end.
 *
 * Numeric path params are coerced with `parse` so screens receive real numbers
 * (React Navigation otherwise passes path/query params as strings). The forum
 * post anchor is supported via a `?postId=` query param, e.g.
 * `toonranks://forum/12?postId=34`.
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["toonranks://"],
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
      NotFound: "*",
    },
  },
};
