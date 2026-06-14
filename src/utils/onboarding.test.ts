import { describe, expect, it, vi } from "vitest";

import { hasSeenOnboarding, markOnboardingSeen, ONBOARDING_SEEN_KEY } from "./onboarding";

vi.mock("@react-native-async-storage/async-storage", () => {
  const store = new Map<string, string>();

  return {
    default: {
      getItem: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve();
      }),
      __store: store,
    },
  };
});

describe("onboarding storage", () => {
  it("starts unseen until marked", async () => {
    const AsyncStorage = await import("@react-native-async-storage/async-storage");
    (AsyncStorage.default as unknown as { __store: Map<string, string> }).__store.clear();

    await expect(hasSeenOnboarding()).resolves.toBe(false);

    await markOnboardingSeen();

    await expect(hasSeenOnboarding()).resolves.toBe(true);
    expect(AsyncStorage.default.setItem).toHaveBeenCalledWith(
      ONBOARDING_SEEN_KEY,
      "true",
    );
  });
});
