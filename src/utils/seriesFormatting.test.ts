import { describe, expect, it } from "vitest";

import { compactGenre, formatAverage, formatScore } from "./seriesFormatting";

describe("series formatting", () => {
  it("formats numeric scores to one decimal place", () => {
    expect(formatScore(8)).toBe("8.0");
    expect(formatScore("9.25" as unknown as number)).toBe("9.3");
  });

  it("returns a dash for missing or invalid scores", () => {
    expect(formatScore(null)).toBe("-");
    expect(formatScore(undefined)).toBe("-");
    expect(formatScore(Number.NaN)).toBe("-");
  });

  it("formats averages only when total and count exist", () => {
    expect(formatAverage(18, 2)).toBe("9.0");
    expect(formatAverage(0, 2)).toBe("-");
    expect(formatAverage(18, 0)).toBe("-");
  });

  it("compacts comma-separated genres for comparison rows", () => {
    expect(compactGenre("Action, Fantasy, Drama, Supernatural, Mystery")).toBe(
      "Action / Fantasy / Drama / Supernatural",
    );
    expect(compactGenre(" Action , , Fantasy ")).toBe("Action / Fantasy");
    expect(compactGenre()).toBe("-");
  });
});
