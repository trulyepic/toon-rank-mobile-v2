import type { SeriesDetailData } from "../types/series";

export const MIN_PUBLIC_VOTE_COUNT = 100;

export function shouldShowVoteCount(voteCount?: number | null) {
  const numericCount = Number(voteCount);
  return Number.isFinite(numericCount) && numericCount >= MIN_PUBLIC_VOTE_COUNT;
}

export function formatAverage(total?: number, count?: number) {
  if (!total || !count) return "-";
  return (total / count).toFixed(1);
}

export function formatScore(score?: number | null) {
  if (score == null || Number.isNaN(Number(score))) return "-";
  return Number(score).toFixed(1);
}

export function compactGenre(genre?: string, limit = 4) {
  if (!genre) return "-";
  return genre
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, limit)
    .join(" / ");
}

export function hasExternalContext(
  detail?: Pick<
    SeriesDetailData,
    "external_source" | "external_score" | "external_popularity"
  > | null,
) {
  return Boolean(
    detail?.external_source?.trim() &&
    (detail.external_score != null || detail.external_popularity != null),
  );
}
