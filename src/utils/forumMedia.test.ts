import { describe, expect, it } from "vitest";

import { appendForumMediaMarkdown } from "./forumMediaMarkdown";

describe("appendForumMediaMarkdown", () => {
  it("appends an image markdown block after existing text", () => {
    expect(appendForumMediaMarkdown("hello", "https://cdn.example.com/a.png")).toBe(
      "hello\n\n![image](https://cdn.example.com/a.png)",
    );
  });

  it("trims trailing whitespace before adding the image block", () => {
    expect(appendForumMediaMarkdown("hello\n\n", "https://cdn.example.com/a.gif")).toBe(
      "hello\n\n![image](https://cdn.example.com/a.gif)",
    );
  });
});
