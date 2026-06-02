import { describe, expect, it } from "vitest";

import { filterSeriesByType, getTypeParam, isSeriesInAnyList } from "./seriesBrowse";
import type { ReadingList } from "../types/readingList";
import type { RankedSeries } from "../types/series";

function makeSeries(id: number, type: RankedSeries["type"]): RankedSeries {
  return {
    id,
    title: `Series ${id}`,
    genre: "Action",
    type,
    cover_url: "",
    vote_count: 0,
    final_score: 0,
    rank: id,
  };
}

describe("getTypeParam", () => {
  it("returns undefined for All", () => {
    expect(getTypeParam("All")).toBeUndefined();
  });

  it("uppercases the type for the backend param", () => {
    expect(getTypeParam("Manga")).toBe("MANGA");
    expect(getTypeParam("Manhwa")).toBe("MANHWA");
    expect(getTypeParam("Manhua")).toBe("MANHUA");
  });
});

describe("filterSeriesByType", () => {
  const items = [
    makeSeries(1, "MANGA"),
    makeSeries(2, "MANHWA"),
    makeSeries(3, "MANHUA"),
    makeSeries(4, "MANHWA"),
  ];

  it("returns all items unchanged for All", () => {
    expect(filterSeriesByType(items, "All")).toBe(items);
  });

  it("narrows to the selected type", () => {
    expect(filterSeriesByType(items, "Manhwa").map((s) => s.id)).toEqual([2, 4]);
    expect(filterSeriesByType(items, "Manga").map((s) => s.id)).toEqual([1]);
  });

  it("returns an empty array when nothing matches", () => {
    const onlyManga = [makeSeries(1, "MANGA")];
    expect(filterSeriesByType(onlyManga, "Manhua")).toEqual([]);
  });
});

describe("isSeriesInAnyList", () => {
  const lists: ReadingList[] = [
    {
      id: 1,
      name: "Reading",
      is_public: false,
      share_token: "t1",
      items: [{ series_id: 10 }, { series_id: 11 }],
    },
    {
      id: 2,
      name: "Completed",
      is_public: true,
      share_token: "t2",
      items: [{ series_id: 20 }],
    },
  ];

  it("finds a series saved in any list", () => {
    expect(isSeriesInAnyList(lists, 11)).toBe(true);
    expect(isSeriesInAnyList(lists, 20)).toBe(true);
  });

  it("returns false when the series is in no list", () => {
    expect(isSeriesInAnyList(lists, 999)).toBe(false);
  });

  it("returns false for undefined lists", () => {
    expect(isSeriesInAnyList(undefined, 10)).toBe(false);
  });
});
