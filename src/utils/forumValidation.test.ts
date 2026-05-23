import { describe, expect, it } from "vitest";

import { validateForumThreadDraft } from "./forumValidation";

describe("validateForumThreadDraft", () => {
  it("trims a valid forum thread draft", () => {
    expect(
      validateForumThreadDraft({
        title: "  New recommendations  ",
        body: "  Tell me what to read next.  ",
      }),
    ).toEqual({
      title: "New recommendations",
      body: "Tell me what to read next.",
    });
  });

  it("requires a title with at least three characters", () => {
    expect(validateForumThreadDraft({ title: "yo", body: "Body" })).toMatchObject({
      error: "Thread title needs at least 3 characters.",
    });
  });

  it("requires a first post body", () => {
    expect(validateForumThreadDraft({ title: "Hello", body: " " })).toMatchObject({
      error: "Write the first post before creating the thread.",
    });
  });
});
