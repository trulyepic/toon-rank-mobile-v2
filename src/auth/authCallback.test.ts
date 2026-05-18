import { describe, expect, it } from "vitest";

import { MOBILE_AUTH_CALLBACK_URL } from "../config/site";
import { parseAuthCallbackUrl } from "./authCallback";

describe("parseAuthCallbackUrl", () => {
  it("parses a successful callback code", () => {
    expect(
      parseAuthCallbackUrl(`${MOBILE_AUTH_CALLBACK_URL}?code=abc123&state=xyz`),
    ).toEqual({
      status: "success",
      code: "abc123",
      state: "xyz",
    });
  });

  it("parses callback errors", () => {
    expect(
      parseAuthCallbackUrl(
        `${MOBILE_AUTH_CALLBACK_URL}?error=access_denied&error_description=User%20cancelled`,
      ),
    ).toEqual({
      status: "error",
      error: "access_denied",
      description: "User cancelled",
    });
  });

  it("ignores unrelated urls", () => {
    expect(parseAuthCallbackUrl("https://www.toonranks.com/login")).toEqual({
      status: "ignored",
      reason: "wrong_url",
    });
  });

  it("ignores callbacks without an auth code", () => {
    expect(parseAuthCallbackUrl(MOBILE_AUTH_CALLBACK_URL)).toEqual({
      status: "ignored",
      reason: "missing_code",
    });
  });
});
