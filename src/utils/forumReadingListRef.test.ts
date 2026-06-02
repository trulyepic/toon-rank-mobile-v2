import { describe, expect, it } from "vitest";

import { buildReadingListRef } from "./forumReadingListRef";

describe("buildReadingListRef", () => {
  it("builds a markdown link to the shared list", () => {
    expect(buildReadingListRef("My favorites", "abc123")).toBe(
      "[My favorites](/lists/abc123)",
    );
  });

  it("trims the list name", () => {
    expect(buildReadingListRef("  Weekly reads  ", "tok")).toBe(
      "[Weekly reads](/lists/tok)",
    );
  });

  it("falls back to a default label when the name is blank", () => {
    expect(buildReadingListRef("   ", "tok")).toBe("[Reading list](/lists/tok)");
  });
});
