import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearSessionExpiredListenersForTests,
  subscribeToSessionExpired,
} from "../auth/sessionEvents";
import { api, setApiAuthToken } from "./client";

describe("api client auth failures", () => {
  beforeEach(() => {
    clearSessionExpiredListenersForTests();
    setApiAuthToken(null);
    vi.restoreAllMocks();
  });

  it("notifies session-expired listeners for authenticated 401 responses", async () => {
    const listener = vi.fn();
    subscribeToSessionExpired(listener);
    setApiAuthToken("token-123");
    api.defaults.adapter = () =>
      Promise.reject({
        isAxiosError: true,
        config: { headers: { Authorization: "Bearer token-123" } },
        response: { status: 401, data: { detail: "Not authenticated" } },
      });

    await expect(api.get("/reading-lists")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    });
    expect(listener).toHaveBeenCalledOnce();
  });

  it("does not notify for unauthenticated 401 responses", async () => {
    const listener = vi.fn();
    subscribeToSessionExpired(listener);
    api.defaults.adapter = () =>
      Promise.reject({
        isAxiosError: true,
        config: { headers: {} },
        response: { status: 401, data: { detail: "Invalid login" } },
      });

    await expect(api.post("/auth/login")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    });
    expect(listener).not.toHaveBeenCalled();
  });

  it("does not notify recursively when mobile refresh fails", async () => {
    const listener = vi.fn();
    subscribeToSessionExpired(listener);
    setApiAuthToken("token-123");
    api.defaults.adapter = () =>
      Promise.reject({
        isAxiosError: true,
        config: {
          url: "/auth/mobile-refresh",
          headers: { Authorization: "Bearer token-123" },
        },
        response: { status: 401, data: { detail: "Invalid refresh token" } },
      });

    await expect(api.post("/auth/mobile-refresh")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    });
    expect(listener).not.toHaveBeenCalled();
  });
});
