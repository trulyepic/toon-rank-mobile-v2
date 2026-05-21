import {
  Image,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { AppText } from "./AppText";
import type { AvatarPreset } from "../types/account";
import {
  avatarPresetColors,
  getAvatarInitials,
  normalizeAvatarPreset,
} from "../utils/avatar";

type AvatarSize = "sm" | "md" | "lg" | "xl";
type AvatarVariant = "circle" | "portrait";

type Props = {
  username?: string | null;
  avatarUrl?: string | null;
  avatarPreset?: AvatarPreset | string | null;
  size?: AvatarSize;
  variant?: AvatarVariant;
  style?: StyleProp<ViewStyle>;
};

const sizes: Record<AvatarSize, number> = {
  sm: 30,
  md: 42,
  lg: 58,
  xl: 96,
};

const portraitSizes: Record<
  AvatarSize,
  { width: number; height: number; radius: number }
> = {
  sm: { width: 34, height: 44, radius: 12 },
  md: { width: 48, height: 62, radius: 16 },
  lg: { width: 76, height: 96, radius: 22 },
  xl: { width: 92, height: 118, radius: 26 },
};

export function UserAvatar({
  username,
  avatarUrl,
  avatarPreset,
  size = "md",
  variant = "circle",
  style,
}: Props) {
  const dimension = sizes[size];
  const avatarFrame =
    variant === "portrait"
      ? portraitSizes[size]
      : { width: dimension, height: dimension, radius: dimension / 2 };
  const preset = normalizeAvatarPreset(avatarPreset);
  const presetColors = avatarPresetColors[preset];

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        accessibilityLabel={`${username || "User"} avatar`}
        style={[
          styles.base,
          {
            width: avatarFrame.width,
            height: avatarFrame.height,
            borderRadius: avatarFrame.radius,
            borderColor: presetColors.border,
          },
          style as StyleProp<ImageStyle>,
        ]}
      />
    );
  }

  return (
    <View
      accessibilityLabel={`${username || "User"} avatar`}
      style={[
        styles.base,
        styles.fallback,
        {
          width: avatarFrame.width,
          height: avatarFrame.height,
          borderRadius: avatarFrame.radius,
          backgroundColor: presetColors.background,
          borderColor: presetColors.border,
        },
        style,
      ]}
    >
      <AppText
        variant={size === "xl" ? "sectionTitle" : "caption"}
        style={[styles.initials, { color: presetColors.text }]}
      >
        {getAvatarInitials(username)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    overflow: "hidden",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontWeight: "900",
  },
});
