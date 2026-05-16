import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type ViewProps,
} from "react-native";

import { colors, radii, spacing } from "../theme/tokens";
import { AppText } from "./AppText";

type ChipTone = "neutral" | "accent" | "muted" | "warning";

type Props = ViewProps & {
  label: string;
  tone?: ChipTone;
  iconLeft?: ReactNode;
};

type ChipButtonProps = Omit<PressableProps, "style"> & {
  label: string;
  selected?: boolean;
  iconLeft?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, tone = "neutral", iconLeft, style, ...props }: Props) {
  return (
    <View {...props} style={[styles.base, toneStyles[tone], style]}>
      {iconLeft}
      <AppText variant="label" style={styles.text}>
        {label}
      </AppText>
    </View>
  );
}

export function ChipButton({
  label,
  selected = false,
  iconLeft,
  style,
  ...props
}: ChipButtonProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.base,
        selected ? toneStyles.accent : toneStyles.neutral,
        pressed ? styles.pressed : null,
        style,
      ]}
    >
      {iconLeft}
      <AppText variant="label" tone={selected ? "primary" : "muted"} style={styles.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    fontSize: 11,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});

const toneStyles = StyleSheet.create({
  neutral: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
  },
  accent: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  muted: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  warning: {
    backgroundColor: colors.warningSurface,
    borderColor: colors.warningBorder,
  },
});
