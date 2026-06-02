import type { RankedSeries } from "../types/series";

export const MAX_COMPARE_ITEMS = 4;

/**
 * Pure reducer for the compare tray. Toggling a series that is already present
 * removes it; toggling a new series adds it unless the max has been reached, in
 * which case the list is returned unchanged (the UI shows a disabled "Max N"
 * state so the cap never fails silently).
 */
export function computeNextCompare(
  current: RankedSeries[],
  series: RankedSeries,
  max: number = MAX_COMPARE_ITEMS,
): RankedSeries[] {
  const exists = current.some((item) => item.id === series.id);
  if (exists) {
    return current.filter((item) => item.id !== series.id);
  }
  if (current.length >= max) {
    return current;
  }
  return [...current, series];
}

/** Whether another title can still be added to the compare tray. */
export function canAddToCompare(
  current: RankedSeries[],
  max: number = MAX_COMPARE_ITEMS,
): boolean {
  return current.length < max;
}
