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

  if (normalized === "ADMIN") return "#f3cf89";
  if (normalized === "CONTRIBUTOR") return "#7fb1ff";

  return "#f7f9fc";
}
