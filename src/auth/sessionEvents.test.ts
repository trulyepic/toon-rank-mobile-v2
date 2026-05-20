import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearSessionExpiredListenersForTests,
  notifySessionExpired,
  subscribeToSessionExpired,
} from "./sessionEvents";

describe("session expired events", () => {
  beforeEach(() => {
    clearSessionExpiredListenersForTests();
  });

  it("notifies subscribed listeners", () => {
    const listener = vi.fn();

    subscribeToSessionExpired(listener);
    notifySessionExpired();

    expect(listener).toHaveBeenCalledOnce();
  });

  it("stops notifying unsubscribed listeners", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToSessionExpired(listener);

    unsubscribe();
    notifySessionExpired();

    expect(listener).not.toHaveBeenCalled();
  });
});
