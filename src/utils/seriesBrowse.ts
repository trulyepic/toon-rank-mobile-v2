import type { ReadingList } from "../types/readingList";
import type { RankedSeries, SeriesType } from "../types/series";

export const TITLE_TYPE_FILTERS = ["All", "Manga", "Manhwa", "Manhua"] as const;
export type TitleTypeFilter = (typeof TITLE_TYPE_FILTERS)[number];

/**
 * Map a UI type-filter chip to the backend `type` query param. "All" returns
 * undefined so the rankings endpoint is queried unfiltered.
 */
export function getTypeParam(filter: TitleTypeFilter): SeriesType | undefined {
  return filter === "All" ? undefined : (filter.toUpperCase() as SeriesType);
}

/**
 * Client-side type filter used by Search (where results come back unfiltered
 * and are narrowed in memory). "All" returns the list unchanged.
 */
export function filterSeriesByType<T extends Pick<RankedSeries, "type">>(
  items: T[],
  filter: TitleTypeFilter,
): T[] {
  if (filter === "All") return items;
  return items.filter((item) => item.type?.toUpperCase() === filter.toUpperCase());
}

/** Whether the given series already appears in any of the user's reading lists. */
export function isSeriesInAnyList(
  lists: ReadingList[] | undefined,
  seriesId: number,
): boolean {
  return (
    lists?.some((list) => list.items.some((item) => item.series_id === seriesId)) ?? false
  );
}
