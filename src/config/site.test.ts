import { describe, expect, it } from "vitest";

import { MOBILE_AUTH_CALLBACK_URL, WEB_AUTH_URLS, buildWebAuthUrl } from "./site";

describe("web auth URLs", () => {
  it("builds mobile login URLs with redirect and state", () => {
    const url = buildWebAuthUrl("/login", "state-123");

    expect(url).toBe(
      "https://www.toonranks.com/login?mobile=1&redirect_uri=toonranks%3A%2F%2Fauth%2Fcallback&state=state-123",
    );
  });

  it("uses the shared mobile callback URL", () => {
    expect(MOBILE_AUTH_CALLBACK_URL).toBe("toonranks://auth/callback");
    expect(WEB_AUTH_URLS.signup("abc")).toContain("state=abc");
  });
});
