import { forwardRef, type PropsWithChildren } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { colors, radii, shadows, spacing } from "../theme/tokens";

type SurfaceVariant = "default" | "raised" | "accent" | "warning" | "transparent";
type SurfaceRadius = "md" | "lg" | "xl" | "hero";
type SurfacePadding = "none" | "sm" | "md" | "lg";

type Props = PropsWithChildren<
  ViewProps & {
    variant?: SurfaceVariant;
    radius?: SurfaceRadius;
    padding?: SurfacePadding;
    shadow?: boolean;
  }
>;

export const Surface = forwardRef<View, Props>(function Surface(
  {
    variant = "default",
    radius = "lg",
    padding = "md",
    shadow = false,
    style,
    children,
    ...props
  }: Props,
  ref,
) {
  const styles = StyleSheet.create({
    base: {
      borderWidth: 1,
    },
    default: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    raised: {
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.borderSoft,
    },
    accent: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    warning: {
      backgroundColor: colors.warningSurface,
      borderColor: colors.warningBorder,
    },
    transparent: {
      backgroundColor: "transparent",
      borderColor: "transparent",
    },
  });

  return (
    <View
      ref={ref}
      {...props}
      style={[
        styles.base,
        styles[variant],
        radiusStyles[radius],
        paddingStyles[padding],
        shadow ? shadows.card : null,
        style,
      ]}
    >
      {children}
    </View>
  );
});

const radiusStyles = StyleSheet.create({
  md: { borderRadius: radii.md },
  lg: { borderRadius: radii.lg },
  xl: { borderRadius: radii.xl },
  hero: { borderRadius: radii.hero },
});

const paddingStyles = StyleSheet.create({
  none: { padding: 0 },
  sm: { padding: spacing.sm },
  md: { padding: spacing.md },
  lg: { padding: spacing.lg },
});

