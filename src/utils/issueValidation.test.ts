import { describe, expect, it } from "vitest";

import { getReportIssueValidationError, isValidOptionalEmail } from "./issueValidation";

describe("isValidOptionalEmail", () => {
  it("accepts an empty optional email", () => {
    expect(isValidOptionalEmail("")).toBe(true);
    expect(isValidOptionalEmail("   ")).toBe(true);
  });

  it("validates a provided email address", () => {
    expect(isValidOptionalEmail("reader@example.com")).toBe(true);
    expect(isValidOptionalEmail("reader.example.com")).toBe(false);
  });
});

describe("getReportIssueValidationError", () => {
  it("requires a title", () => {
    expect(
      getReportIssueValidationError({
        title: "",
        description: "The filter does not update.",
        email: "",
      }),
    ).toBe("Add a short summary so we know what to look at.");
  });

  it("requires details", () => {
    expect(
      getReportIssueValidationError({
        title: "Filter bug",
        description: "",
        email: "",
      }),
    ).toBe("Add a few details so the issue can be reproduced.");
  });

  it("accepts a valid report", () => {
    expect(
      getReportIssueValidationError({
        title: "Filter bug",
        description: "The Manhwa filter still shows all titles.",
        email: "reader@example.com",
      }),
    ).toBeNull();
  });
});
