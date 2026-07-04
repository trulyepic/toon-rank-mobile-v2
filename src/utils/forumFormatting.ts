export function formatForumDate(value?: string | null) {
  if (!value) return "Unknown date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatForumCount(
  count: number,
  singular: string,
  plural = `${singular}s`,
) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function previewMarkdown(content: string, maxLength = 180) {
  const normalized = plainTextMarkdown(content);

  if (normalized.length <= maxLength) return normalized;

  return `${normalized.slice(0, maxLength).trim()}...`;
}

/**
 * Remove backslash escapes that markdown serializers add to plain text
 * (e.g. the web rich-text editor saves "2 * 3" as "2 \* 3"). The website
 * unescapes these when rendering; we must do the same.
 */
export function unescapeMarkdown(content: string) {
  return content.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~\\])/g, "$1");
}

export function plainTextMarkdown(content: string) {
  return (
    unescapeMarkdown(content)
      // Collapse spoilers without leaking their hidden content.
      .replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi, " Spoiler ")
      // Strip any other inline HTML tags (e.g. <sup>), keeping inner text.
      .replace(/<[^>]+>/g, " ")
      .replace(/```[\s\S]*?```/g, " ")
      // Drop image markdown entirely (e.g. ![alt](url)).
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      // Reduce links/series references to their label text only, so the link
      // target (e.g. "series:209") does not leak into the plain-text preview.
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[#>*_`[\]()]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}
