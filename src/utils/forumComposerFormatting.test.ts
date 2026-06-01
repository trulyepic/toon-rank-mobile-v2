import { describe, expect, it } from "vitest";

import { applyForumFormat } from "./forumComposerFormatting";

describe("applyForumFormat", () => {
  it("wraps selected text", () => {
    expect(applyForumFormat("hello world", { start: 6, end: 11 }, "bold").text).toBe(
      "hello **world**",
    );
  });

  it("inserts a placeholder when no text is selected", () => {
    const result = applyForumFormat("", { start: 0, end: 0 }, "italic");

    expect(result.text).toBe("*italic text*");
    expect(result.selection).toEqual({ start: 1, end: 12 });
  });

  it("prefixes selected lines for lists", () => {
    expect(applyForumFormat("one\ntwo", { start: 0, end: 7 }, "unorderedList").text).toBe(
      "- one\n- two",
    );
  });

  it("inserts spoiler details markup", () => {
    expect(applyForumFormat("secret", { start: 0, end: 6 }, "spoiler").text).toBe(
      "<details><summary>Spoiler</summary>\n\nsecret\n\n</details>",
    );
  });
});
