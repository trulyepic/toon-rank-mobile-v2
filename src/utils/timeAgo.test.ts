import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fullTimestamp, timeAgo } from "./timeAgo";

const NOW = new Date("2026-06-29T12:00:00.000Z").getTime();
const ago = (ms: number) => new Date(NOW - ms).toISOString();

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("timeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for anything under 45 seconds", () => {
    expect(timeAgo(ago(0))).toBe("just now");
    expect(timeAgo(ago(44 * SECOND))).toBe("just now");
  });

  it("rolls up through minutes, hours, days, months, years", () => {
    expect(timeAgo(ago(5 * MINUTE))).toBe("5m ago");
    expect(timeAgo(ago(7 * HOUR))).toBe("7h ago");
    expect(timeAgo(ago(3 * DAY))).toBe("3d ago");
    expect(timeAgo(ago(60 * DAY))).toBe("2mo ago");
    expect(timeAgo(ago(400 * DAY))).toBe("1y ago");
  });

  it("clamps future timestamps to 'just now' instead of negatives", () => {
    expect(timeAgo(ago(-5 * MINUTE))).toBe("just now");
  });

  it("returns an empty string for missing or invalid input", () => {
    expect(timeAgo(null)).toBe("");
    expect(timeAgo(undefined)).toBe("");
    expect(timeAgo("not-a-date")).toBe("");
  });
});

describe("fullTimestamp", () => {
  it("formats a valid ISO string and ignores invalid input", () => {
    expect(fullTimestamp("2026-06-29T12:00:00.000Z")).not.toBe("");
    expect(fullTimestamp("nope")).toBe("");
    expect(fullTimestamp(null)).toBe("");
  });
});
