import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, radii, spacing } from "../theme/tokens";
import { AppText } from "./AppText";

type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type AppButtonSize = "sm" | "md";

type Props = Omit<PressableProps, "style"> & {
  label: string;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({
  label,
  variant = "secondary",
  size = "md",
  iconLeft,
  iconRight,
  selected = false,
  disabled,
  style,
  ...props
}: Props) {
  const resolvedVariant = selected ? "primary" : variant;

  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        variantStyles[resolvedVariant],
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      {iconLeft}
      <AppText variant="caption" style={styles.label}>
        {label}
      </AppText>
      {iconRight}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  md: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  label: {
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.48,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accentBorder,
  },
  secondary: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: colors.borderSoft,
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
});
