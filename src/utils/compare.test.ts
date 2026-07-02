import { describe, expect, it } from "vitest";

import {
  canAddToCompare,
  computeNextCompare,
  MAX_COMPARE_ITEMS,
  winnersFor,
} from "./compare";
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

describe("winnersFor", () => {
  it("marks the single highest value", () => {
    expect(winnersFor([7.2, 8.9, 6.1])).toEqual([false, true, false]);
  });

  it("marks all tied leaders", () => {
    expect(winnersFor([8.5, 8.5, 6])).toEqual([true, true, false]);
  });

  it("marks nothing when every value ties", () => {
    expect(winnersFor([7, 7, 7])).toEqual([false, false, false]);
  });

  it("marks nothing with fewer than two comparable values", () => {
    expect(winnersFor([8])).toEqual([false]);
    expect(winnersFor([8, null, null])).toEqual([false, false, false]);
    expect(winnersFor([])).toEqual([]);
  });

  it("ignores null gaps but still compares the rest", () => {
    expect(winnersFor([null, 9, 7.5])).toEqual([false, true, false]);
  });
});
