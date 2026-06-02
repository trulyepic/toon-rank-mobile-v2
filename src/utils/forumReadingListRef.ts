/**
 * Build the Markdown reference inserted into a forum post when a user shares one
 * of their reading lists. Matches the web composer's format:
 * `[List name](/lists/{share_token})`. The mobile forum renderer
 * (`ForumMarkdown`) and the web renderer both turn this into a tappable link to
 * the shared list.
 */
export function buildReadingListRef(name: string, token: string): string {
  const label = name.trim() || "Reading list";
  return `[${label}](/lists/${token})`;
}
