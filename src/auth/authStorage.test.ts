import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearStoredAuthSession,
  getStoredAuthSession,
  setStoredAuthSession,
} from "./authStorage";

const secureStore = vi.hoisted(() => {
  const store = new Map<string, string>();

  return {
    store,
    getItemAsync: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItemAsync: vi.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: vi.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
  };
});

vi.mock("expo-secure-store", () => ({
  getItemAsync: secureStore.getItemAsync,
  setItemAsync: secureStore.setItemAsync,
  deleteItemAsync: secureStore.deleteItemAsync,
}));

describe("auth storage", () => {
  beforeEach(() => {
    secureStore.store.clear();
    vi.clearAllMocks();
  });

  it("stores and restores an auth session", async () => {
    await setStoredAuthSession({
      token: "token-123",
      user: { id: 1, username: "reader", role: "GENERAL" },
    });

    await expect(getStoredAuthSession()).resolves.toEqual({
      token: "token-123",
      user: { id: 1, username: "reader", role: "GENERAL" },
    });
  });

  it("returns null when token or user is missing", async () => {
    await expect(getStoredAuthSession()).resolves.toBeNull();
  });

  it("clears invalid user json", async () => {
    secureStore.store.set("toonranks.authToken", "token-123");
    secureStore.store.set("toonranks.authUser", "{bad json");

    await expect(getStoredAuthSession()).resolves.toBeNull();
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith("toonranks.authToken");
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith("toonranks.authUser");
  });

  it("clears a stored session", async () => {
    await setStoredAuthSession({
      token: "token-123",
      user: { id: 1, username: "reader", role: "GENERAL" },
    });

    await clearStoredAuthSession();

    await expect(getStoredAuthSession()).resolves.toBeNull();
  });
});
