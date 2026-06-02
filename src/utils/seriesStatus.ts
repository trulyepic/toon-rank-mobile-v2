/**
 * Display metadata for a series publication status, mirroring the web card
 * badge. Returns null when there is no meaningful status so callers can hide the
 * badge entirely. Colours are solid badge backgrounds with white text, matching
 * the website's ManCard pill.
 */
export type SeriesStatusMeta = {
  label: string;
  background: string;
  text: string;
};

const STATUS_META: Record<string, SeriesStatusMeta> = {
  ONGOING: { label: "Ongoing", background: "#0ea76a", text: "#ffffff" },
  COMPLETE: { label: "Complete", background: "#2f6df0", text: "#ffffff" },
  HIATUS: { label: "Hiatus", background: "#e8a23a", text: "#1b1206" },
  SEASON_END: { label: "Season End", background: "#7c5cff", text: "#ffffff" },
  UNKNOWN: { label: "Unknown", background: "#6b7280", text: "#ffffff" },
};

export function getSeriesStatusMeta(
  status: string | null | undefined,
): SeriesStatusMeta | null {
  if (!status) return null;
  const key = status.trim().toUpperCase().replace(/\s+/g, "_");
  return STATUS_META[key] ?? null;
}

/** Status values offered as Home filters (UNKNOWN is intentionally omitted). */
export const SERIES_STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "Ongoing", value: "ONGOING" },
  { label: "Complete", value: "COMPLETE" },
  { label: "Hiatus", value: "HIATUS" },
  { label: "Season End", value: "SEASON_END" },
];
