import { describe, expect, it } from "vitest";

import {
  extractForumSeriesIds,
  getActiveForumMention,
  insertForumMention,
} from "./forumMentions";

describe("forum mention helpers", () => {
  it("detects an active mention after @", () => {
    expect(getActiveForumMention("Try @Ber")).toEqual({
      query: "Ber",
      start: 4,
      end: 8,
    });
  });

  it("ignores email-style @ characters", () => {
    expect(getActiveForumMention("reader@example.com")).toBeNull();
  });

  it("inserts a selected series title", () => {
    const mention = getActiveForumMention("Try @Ber")!;

    expect(
      insertForumMention("Try @Ber", mention, {
        series_id: 1,
        title: "Berserk",
      }),
    ).toBe("Try [Berserk](series:1)");
  });

  it("extracts unique series ids from forum markdown links", () => {
    expect(
      extractForumSeriesIds(
        "Try [Berserk](series:1), [Solo](series:3), and /series/1 again.",
      ),
    ).toEqual([1, 3]);
  });
});
