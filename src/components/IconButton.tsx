import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, radii } from "../theme/tokens";

type IconName = ComponentProps<typeof Ionicons>["name"];

type Props = Omit<PressableProps, "style"> & {
  icon: IconName;
  label: string;
  selected?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  label,
  selected = false,
  size = 40,
  disabled,
  style,
  ...props
}: Props) {
  const styles = StyleSheet.create({
    base: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.surfaceRaised,
    },
    selected: {
      borderColor: colors.accentBorder,
      backgroundColor: colors.accent,
    },
    pressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    disabled: {
      opacity: 0.48,
    },
  });

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : null,
        { width: size, height: size },
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Ionicons name={icon} size={18} color={colors.text} />
    </Pressable>
  );
}

