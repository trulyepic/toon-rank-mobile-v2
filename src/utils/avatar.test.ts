import { describe, expect, it } from "vitest";

import {
  getAvatarInitials,
  interpolateRoleColor,
  normalizeAvatarPreset,
  roleColor,
  roleGradientColors,
} from "./avatar";

describe("avatar helpers", () => {
  it("normalizes missing or unknown avatar presets", () => {
    expect(normalizeAvatarPreset("emerald")).toBe("emerald");
    expect(normalizeAvatarPreset("unknown")).toBe("blue");
    expect(normalizeAvatarPreset(null)).toBe("blue");
  });

  it("builds compact initials from usernames", () => {
    expect(getAvatarInitials("kin-admin")).toBe("KI");
    expect(getAvatarInitials("mad princess")).toBe("MP");
    expect(getAvatarInitials("")).toBe("?");
  });

  it("maps account roles to shared identity colors", () => {
    expect(roleColor("ADMIN")).toBe("#f8b76f");
    expect(roleColor("CONTRIBUTOR")).toBe("#8bd8ff");
    expect(roleColor("GENERAL")).toBe("#f7f9fc");
  });

  it("uses website-inspired gradient stops for elevated roles", () => {
    expect(roleGradientColors("ADMIN")).toEqual(["#facc15", "#fdba74", "#fda4af"]);
    expect(roleGradientColors("CONTRIBUTOR")).toEqual(["#93c5fd", "#7dd3fc", "#a5f3fc"]);
    expect(roleGradientColors("GENERAL")).toEqual(["#f7f9fc"]);
  });

  it("interpolates role gradient colors across text", () => {
    expect(interpolateRoleColor(["#000000", "#ffffff"], 0, 3)).toBe("#000000");
    expect(interpolateRoleColor(["#000000", "#ffffff"], 1, 3)).toBe("#808080");
    expect(interpolateRoleColor(["#000000", "#ffffff"], 2, 3)).toBe("#ffffff");
  });
});
