import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WebBrowserAuthSessionResult } from "expo-web-browser";

import { exchangeMobileAuthCode } from "../api/auth";
import { MOBILE_AUTH_CALLBACK_URL } from "../config/site";
import { openWebAuthBridge } from "./webAuthBridge";

vi.mock("expo-web-browser", () => ({
  openAuthSessionAsync: vi.fn(),
}));

vi.mock("../api/auth", () => ({
  exchangeMobileAuthCode: vi.fn(),
}));

const { openAuthSessionAsync } = await import("expo-web-browser");

describe("openWebAuthBridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exchanges a successful callback code for a session", async () => {
    vi.mocked(openAuthSessionAsync).mockResolvedValue({
      type: "success",
      url: `${MOBILE_AUTH_CALLBACK_URL}?code=abc&state=state-123`,
    });
    vi.mocked(exchangeMobileAuthCode).mockResolvedValue({
      access_token: "jwt",
      refresh_token: "refresh-jwt",
      user: {
        id: 1,
        username: "reader",
        role: "GENERAL",
        avatar_preset: "blue",
      },
    });

    await expect(
      openWebAuthBridge("https://www.toonranks.com/login", "state-123"),
    ).resolves.toEqual({
      status: "success",
      session: {
        access_token: "jwt",
        refresh_token: "refresh-jwt",
        user: {
          id: 1,
          username: "reader",
          role: "GENERAL",
          avatar_preset: "blue",
        },
      },
    });
    expect(exchangeMobileAuthCode).toHaveBeenCalledWith("abc");
  });

  it("rejects stale callback state", async () => {
    vi.mocked(openAuthSessionAsync).mockResolvedValue({
      type: "success",
      url: `${MOBILE_AUTH_CALLBACK_URL}?code=abc&state=old`,
    });

    await expect(
      openWebAuthBridge("https://www.toonranks.com/login", "new"),
    ).resolves.toEqual({
      status: "error",
      message: "The sign-in return link was stale. Please try again.",
    });
    expect(exchangeMobileAuthCode).not.toHaveBeenCalled();
  });

  it("maps email verification callbacks to check_email", async () => {
    vi.mocked(openAuthSessionAsync).mockResolvedValue({
      type: "success",
      url: `${MOBILE_AUTH_CALLBACK_URL}?error=email_verification_required&error_description=Verify%20first`,
    });

    await expect(
      openWebAuthBridge("https://www.toonranks.com/signup", "state-123"),
    ).resolves.toEqual({
      status: "check_email",
      message: "Verify first",
    });
  });

  it("returns cancelled when the browser session is dismissed", async () => {
    vi.mocked(openAuthSessionAsync).mockResolvedValue({
      type: "cancel",
    } as WebBrowserAuthSessionResult);

    await expect(
      openWebAuthBridge("https://www.toonranks.com/login", "state-123"),
    ).resolves.toEqual({ status: "cancelled" });
  });
});
