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

type Props = {
  username?: string | null;
  avatarUrl?: string | null;
  avatarPreset?: AvatarPreset | string | null;
  size?: AvatarSize;
  style?: StyleProp<ViewStyle>;
};

const sizes: Record<AvatarSize, number> = {
  sm: 30,
  md: 42,
  lg: 58,
  xl: 96,
};

export function UserAvatar({
  username,
  avatarUrl,
  avatarPreset,
  size = "md",
  style,
}: Props) {
  const dimension = sizes[size];
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
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
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
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
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
