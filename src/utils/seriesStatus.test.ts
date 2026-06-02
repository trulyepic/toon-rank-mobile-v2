import { describe, expect, it } from "vitest";

import { getSeriesStatusMeta } from "./seriesStatus";

describe("getSeriesStatusMeta", () => {
  it("maps known statuses to label + colors", () => {
    expect(getSeriesStatusMeta("ONGOING")?.label).toBe("Ongoing");
    expect(getSeriesStatusMeta("COMPLETE")?.label).toBe("Complete");
    expect(getSeriesStatusMeta("HIATUS")?.label).toBe("Hiatus");
    expect(getSeriesStatusMeta("SEASON_END")?.label).toBe("Season End");
    expect(getSeriesStatusMeta("UNKNOWN")?.label).toBe("Unknown");
  });

  it("returns distinct background colors per status", () => {
    const colors = ["ONGOING", "COMPLETE", "HIATUS", "SEASON_END", "UNKNOWN"].map(
      (s) => getSeriesStatusMeta(s)?.background,
    );
    expect(new Set(colors).size).toBe(colors.length);
  });

  it("normalizes casing and spaces", () => {
    expect(getSeriesStatusMeta("ongoing")?.label).toBe("Ongoing");
    expect(getSeriesStatusMeta("season end")?.label).toBe("Season End");
  });

  it("returns null for empty or unknown values", () => {
    expect(getSeriesStatusMeta(null)).toBeNull();
    expect(getSeriesStatusMeta(undefined)).toBeNull();
    expect(getSeriesStatusMeta("")).toBeNull();
    expect(getSeriesStatusMeta("NONSENSE")).toBeNull();
  });
});
