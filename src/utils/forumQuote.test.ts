import { describe, expect, it } from "vitest";

import { buildQuoteMarkdown } from "./forumQuote";

describe("buildQuoteMarkdown", () => {
  it("builds an attribution + excerpt blockquote ending in a blank line", () => {
    const result = buildQuoteMarkdown("alice", "This is my post.");
    expect(result).toBe("> **@alice** wrote:\n> This is my post.\n\n");
  });

  it("falls back to 'reader' when the author is missing", () => {
    expect(buildQuoteMarkdown(null, "hi")).toBe("> **@reader** wrote:\n> hi\n\n");
    expect(buildQuoteMarkdown("   ", "hi")).toBe("> **@reader** wrote:\n> hi\n\n");
  });

  it("strips markdown emphasis to plain text in the excerpt", () => {
    const result = buildQuoteMarkdown("bob", "**bold** and _italic_ and `code`");
    expect(result).toBe("> **@bob** wrote:\n> bold and italic and code\n\n");
  });

  it("truncates long bodies to a 200-char excerpt", () => {
    const longBody = "a".repeat(300);
    const result = buildQuoteMarkdown("cara", longBody);
    // 200 chars + trailing ellipsis from previewMarkdown
    expect(result).toContain("> **@cara** wrote:\n");
    expect(result.endsWith("...\n\n")).toBe(true);
    const excerptLine = result.split("\n")[1];
    // "> " prefix + 200 chars + "..."
    expect(excerptLine.length).toBe(2 + 200 + 3);
  });

  it("handles an empty body with a bare quote marker", () => {
    expect(buildQuoteMarkdown("dan", "")).toBe("> **@dan** wrote:\n>\n\n");
  });

  it("renders a series reference as its label only, dropping the link target", () => {
    const result = buildQuoteMarkdown("erin", "I love [Solo Leveling](series:209)!");
    expect(result).toBe("> **@erin** wrote:\n> I love Solo Leveling!\n\n");
  });

  it("drops embedded image markdown from the excerpt", () => {
    const result = buildQuoteMarkdown("finn", "Look ![cover](https://x/c.png) nice");
    expect(result).toBe("> **@finn** wrote:\n> Look nice\n\n");
  });
});
