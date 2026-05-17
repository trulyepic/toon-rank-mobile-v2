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
