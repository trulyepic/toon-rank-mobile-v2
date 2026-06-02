import { describe, expect, it } from "vitest";

import { canAddToCompare, computeNextCompare, MAX_COMPARE_ITEMS } from "./compare";
import type { RankedSeries } from "../types/series";

function makeSeries(id: number): RankedSeries {
  return {
    id,
    title: `Series ${id}`,
    genre: "Action",
    type: "MANHWA",
    cover_url: "",
    vote_count: 0,
    final_score: 0,
    rank: id,
  };
}

describe("compare tray reducer", () => {
  it("adds a new series", () => {
    const next = computeNextCompare([], makeSeries(1));
    expect(next.map((s) => s.id)).toEqual([1]);
  });

  it("removes a series that is already selected (toggle off)", () => {
    const current = [makeSeries(1), makeSeries(2)];
    const next = computeNextCompare(current, makeSeries(1));
    expect(next.map((s) => s.id)).toEqual([2]);
  });

  it("does not exceed the max count and leaves the list unchanged", () => {
    const current = [makeSeries(1), makeSeries(2), makeSeries(3), makeSeries(4)];
    expect(current).toHaveLength(MAX_COMPARE_ITEMS);
    const next = computeNextCompare(current, makeSeries(5));
    expect(next).toBe(current);
    expect(next.map((s) => s.id)).toEqual([1, 2, 3, 4]);
  });

  it("still allows removing when at max", () => {
    const current = [makeSeries(1), makeSeries(2), makeSeries(3), makeSeries(4)];
    const next = computeNextCompare(current, makeSeries(2));
    expect(next.map((s) => s.id)).toEqual([1, 3, 4]);
  });

  it("reports whether more can be added", () => {
    expect(canAddToCompare([])).toBe(true);
    expect(canAddToCompare([makeSeries(1), makeSeries(2), makeSeries(3)])).toBe(true);
    expect(
      canAddToCompare([makeSeries(1), makeSeries(2), makeSeries(3), makeSeries(4)]),
    ).toBe(false);
  });
});
