// Compact, Reddit-style relative timestamps for the forum.
//
// Mirrors the web helper (`toonranks-frontend/src/util/timeAgo.ts`) so the two
// platforms read identically: "just now", "5m ago", "7h ago", "3d ago",
// "2mo ago", "1y ago". No SSR on mobile, so there is no hydration concern —
// callers can render the value directly.

/** e.g. "just now", "5m ago", "7h ago", "3d ago", "2mo ago", "1y ago". */
export function timeAgo(iso?: string | null): string {
  if (!iso) return "";

  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 45) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

/** Full, human-readable timestamp (e.g. for a long-press detail or tooltip). */
export function fullTimestamp(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}
