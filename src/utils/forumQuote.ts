import { previewMarkdown } from "./forumFormatting";

/** Max characters of the quoted post body to include in the attribution block. */
const QUOTE_EXCERPT_LENGTH = 200;

/**
 * Build a Markdown blockquote that attributes and excerpts a post, ready to
 * pre-fill the reply composer. Produces:
 *
 *   > **@author** wrote:
 *   > {plain-text excerpt}
 *
 * followed by a blank line so the user's cursor lands below the quote. The
 * excerpt is reduced to plain text (markdown/media stripped) and truncated.
 */
export function buildQuoteMarkdown(
  authorUsername: string | null | undefined,
  body: string,
): string {
  const author = authorUsername?.trim() || "reader";
  const excerpt = previewMarkdown(body ?? "", QUOTE_EXCERPT_LENGTH);
  const quotedExcerpt = excerpt.length > 0 ? `> ${excerpt}` : ">";
  return `> **@${author}** wrote:\n${quotedExcerpt}\n\n`;
}
