import { describe, expect, it } from "vitest";

import {
  EMPTY_REPLY_DRAFT,
  EMPTY_THREAD_DRAFT,
  isReplyDraftEmpty,
  isThreadDraftEmpty,
  newThreadDraftKey,
  replyDraftKey,
} from "./forumDrafts";

describe("forum draft keys", () => {
  it("uses a stable key for the new-thread composer", () => {
    expect(newThreadDraftKey()).toBe("forum-draft:thread:new");
  });

  it("scopes reply drafts by thread and parent post", () => {
    expect(replyDraftKey(42, 7)).toBe("forum-draft:reply:42:7");
  });

  it("uses a root slot for top-level replies", () => {
    expect(replyDraftKey(42, null)).toBe("forum-draft:reply:42:root");
  });

  it("produces distinct keys per thread", () => {
    expect(replyDraftKey(1, null)).not.toBe(replyDraftKey(2, null));
  });
});

describe("isThreadDraftEmpty", () => {
  it("treats the empty draft as empty", () => {
    expect(isThreadDraftEmpty(EMPTY_THREAD_DRAFT)).toBe(true);
  });

  it("treats whitespace-only title and body as empty", () => {
    expect(isThreadDraftEmpty({ title: "   ", body: "\n\t ", categoryId: null })).toBe(
      true,
    );
  });

  it("is not empty when the title has content", () => {
    expect(isThreadDraftEmpty({ title: "Hello", body: "", categoryId: null })).toBe(
      false,
    );
  });

  it("is not empty when the body has content", () => {
    expect(isThreadDraftEmpty({ title: "", body: "Some text", categoryId: null })).toBe(
      false,
    );
  });

  it("ignores categoryId when deciding emptiness", () => {
    expect(isThreadDraftEmpty({ title: "", body: "", categoryId: 5 })).toBe(true);
  });
});

describe("isReplyDraftEmpty", () => {
  it("treats the empty reply as empty", () => {
    expect(isReplyDraftEmpty(EMPTY_REPLY_DRAFT)).toBe(true);
  });

  it("treats whitespace-only body as empty", () => {
    expect(isReplyDraftEmpty({ body: "   \n" })).toBe(true);
  });

  it("is not empty when the body has content", () => {
    expect(isReplyDraftEmpty({ body: "Nice post" })).toBe(false);
  });
});
