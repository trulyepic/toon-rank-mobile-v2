import type { ReactNode } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { colors, radii, spacing } from "../theme/tokens";
import { AppText } from "./AppText";

type ChipTone = "neutral" | "accent" | "muted" | "warning";

type Props = ViewProps & {
  label: string;
  tone?: ChipTone;
  iconLeft?: ReactNode;
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
