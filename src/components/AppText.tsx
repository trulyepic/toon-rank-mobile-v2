import type { PropsWithChildren } from "react";
import { StyleSheet, Text, type TextProps, type TextStyle } from "react-native";

import { colors, typography } from "../theme/tokens";

type AppTextVariant =
  | "screenTitle"
  | "sectionTitle"
  | "cardTitle"
  | "body"
  | "label"
  | "caption";

type AppTextTone = "primary" | "muted" | "subtle" | "accent" | "danger" | "warning";

type Props = PropsWithChildren<
  TextProps & {
    variant?: AppTextVariant;
    tone?: AppTextTone;
    align?: TextStyle["textAlign"];
  }
>;

const toneStyles: Record<AppTextTone, TextStyle> = {
  primary: { color: colors.text },
  muted: { color: colors.textMuted },
  subtle: { color: colors.textSubtle },
  accent: { color: colors.accentStrong },
  danger: { color: colors.danger },
  warning: { color: colors.warningText },
};

export function AppText({
  variant = "body",
  tone = "primary",
  align,
  style,
  children,
  ...props
}: Props) {
  return (
    <Text
      {...props}
      style={[
        styles.base,
        styles[variant],
        toneStyles[tone],
        align ? { textAlign: align } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    letterSpacing: 0,
  },
  screenTitle: typography.screenTitle,
  sectionTitle: typography.sectionTitle,
  cardTitle: typography.cardTitle,
  body: typography.body,
  label: {
    ...typography.label,
    textTransform: "uppercase",
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
});
