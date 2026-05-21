import type { AvatarPreset } from "../types/account";

export const DEFAULT_AVATAR_PRESET: AvatarPreset = "blue";

export const avatarPresetColors: Record<
  AvatarPreset,
  { background: string; border: string; text: string }
> = {
  blue: {
    background: "#315fdc",
    border: "#6d93ff",
    text: "#f7f9fc",
  },
  emerald: {
    background: "#0ea76a",
    border: "#6ee7b7",
    text: "#f7f9fc",
  },
  amber: {
    background: "#e8a23a",
    border: "#f3cf89",
    text: "#101216",
  },
};

export function normalizeAvatarPreset(preset?: string | null): AvatarPreset {
  return preset && preset in avatarPresetColors
    ? (preset as AvatarPreset)
    : DEFAULT_AVATAR_PRESET;
}

export function getAvatarInitials(username?: string | null): string {
  const trimmed = username?.trim();
  if (!trimmed) return "?";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  const initials =
    parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : trimmed.slice(0, 2);

  return initials.toUpperCase();
}

export function roleColor(role?: string | null): string {
  const normalized = String(role || "").toUpperCase();

  if (normalized === "ADMIN") return "#f8b76f";
  if (normalized === "CONTRIBUTOR") return "#8bd8ff";

  return "#f7f9fc";
}

export function roleGradientColors(role?: string | null): string[] {
  const normalized = String(role || "").toUpperCase();

  if (normalized === "ADMIN") return ["#facc15", "#fdba74", "#fda4af"];
  if (normalized === "CONTRIBUTOR") return ["#93c5fd", "#7dd3fc", "#a5f3fc"];

  return [roleColor(role)];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  return `#${[r, g, b]
    .map((value) => Math.round(value).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function interpolateRoleColor(
  colors: string[],
  index: number,
  total: number,
): string {
  if (colors.length === 0) return roleColor();
  if (colors.length === 1 || total <= 1) return colors[0];

  const progress = index / (total - 1);
  const scaled = progress * (colors.length - 1);
  const startIndex = Math.floor(scaled);
  const endIndex = Math.min(startIndex + 1, colors.length - 1);
  const localProgress = scaled - startIndex;
  const start = hexToRgb(colors[startIndex]);
  const end = hexToRgb(colors[endIndex]);

  return rgbToHex({
    r: start.r + (end.r - start.r) * localProgress,
    g: start.g + (end.g - start.g) * localProgress,
    b: start.b + (end.b - start.b) * localProgress,
  });
}
