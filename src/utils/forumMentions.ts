import type { SeriesRef } from "../types/forum";

export type ActiveMention = {
  query: string;
  start: number;
  end: number;
};

export function getActiveForumMention(text: string): ActiveMention | null {
  const lastAt = text.lastIndexOf("@");

  if (lastAt < 0) return null;

  const beforeAt = text[lastAt - 1];

  if (beforeAt && !/\s|\(|\[|{|,/.test(beforeAt)) return null;

  const afterAt = text.slice(lastAt + 1);
  const lineBreakIndex = afterAt.search(/[\n\r]/);
  const end = lineBreakIndex >= 0 ? lastAt + 1 + lineBreakIndex : text.length;
  const mentionText = text.slice(lastAt + 1, end);

  if (/[!?:;()[\]{}]/.test(mentionText)) return null;
  if (mentionText.length > 64) return null;

  return {
    query: mentionText.trimStart(),
    start: lastAt,
    end,
  };
}

export function insertForumMention(
  text: string,
  mention: ActiveMention,
  series: SeriesRef,
) {
  const title = series.title?.trim();
  const seriesId = series.series_id;

  if (!title || !seriesId) return text;

  const prefix = text.slice(0, mention.start);
  const suffix = text.slice(mention.end);
  const needsTrailingSpace = suffix.length > 0 && !suffix.startsWith(" ");

  return `${prefix}[${title}](series:${seriesId})${needsTrailingSpace ? " " : ""}${suffix}`;
}

export function extractForumSeriesIds(text: string) {
  const ids = new Set<number>();
  const matcher = /(?:series:\s*|\/series\/)(\d+)/gi;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(text)) !== null) {
    const id = Number.parseInt(match[1] ?? "", 10);

    if (Number.isFinite(id) && id > 0) {
      ids.add(id);
    }
  }

  return [...ids];
}
