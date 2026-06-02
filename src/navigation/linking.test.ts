import { describe, expect, it } from "vitest";

import { linking } from "./linking";

type ScreenConfig =
  | string
  | { path?: string; parse?: Record<string, (value: string) => unknown> };

function screen(name: string): ScreenConfig {
  const screens = (linking.config?.screens ?? {}) as Record<string, ScreenConfig>;
  return screens[name];
}

function pathOf(name: string): string | undefined {
  const s = screen(name);
  return typeof s === "string" ? s : s?.path;
}

describe("deep link config", () => {
  it("registers the toonranks scheme", () => {
    expect(linking.prefixes).toContain("toonranks://");
  });

  it("maps the high-value routes to stable paths", () => {
    expect(pathOf("SeriesDetail")).toBe("series/:seriesId");
    expect(pathOf("ForumThread")).toBe("forum/:threadId");
    expect(pathOf("PublicProfile")).toBe("profile/:username");
    expect(pathOf("PublicReadingList")).toBe("lists/:token");
    expect(pathOf("Leaderboard")).toBe("leaderboard");
    expect(pathOf("IssueTracker")).toBe("issues");
    expect(pathOf("ReportIssue")).toBe("report-issue");
  });

  it("does NOT register a wildcard catch-all (it would hijack cold starts)", () => {
    const screens = (linking.config?.screens ?? {}) as Record<string, ScreenConfig>;
    const paths = Object.values(screens).map((s) =>
      typeof s === "string" ? s : s?.path,
    );
    expect(paths).not.toContain("*");
    expect(screens.NotFound).toBeUndefined();
  });

  it("coerces numeric series id from the path string to a number", () => {
    const s = screen("SeriesDetail");
    const parse = typeof s === "object" ? s.parse : undefined;
    expect(parse?.seriesId?.("209")).toBe(209);
  });

  it("coerces forum thread and post ids to numbers", () => {
    const s = screen("ForumThread");
    const parse = typeof s === "object" ? s.parse : undefined;
    expect(parse?.threadId?.("12")).toBe(12);
    expect(parse?.postId?.("34")).toBe(34);
  });
});
