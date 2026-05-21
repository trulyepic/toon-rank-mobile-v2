import { describe, expect, it } from "vitest";

import { getAvatarInitials, normalizeAvatarPreset, roleColor } from "./avatar";

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
    expect(roleColor("ADMIN")).toBe("#f3cf89");
    expect(roleColor("CONTRIBUTOR")).toBe("#7fb1ff");
    expect(roleColor("GENERAL")).toBe("#f7f9fc");
  });
});
