import { describe, expect, it } from "vitest";

import { canTriageIssues } from "./issueAdmin";

describe("canTriageIssues", () => {
  it("allows admins", () => {
    expect(canTriageIssues("ADMIN")).toBe(true);
  });

  it("denies non-admin roles", () => {
    expect(canTriageIssues("GENERAL")).toBe(false);
    expect(canTriageIssues("CONTRIBUTOR")).toBe(false);
  });

  it("denies signed-out / unknown roles", () => {
    expect(canTriageIssues(null)).toBe(false);
    expect(canTriageIssues(undefined)).toBe(false);
  });
});
