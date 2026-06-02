import { StyleSheet, Text, View } from "react-native";

import { radii, spacing } from "../theme/tokens";
import { getSeriesStatusMeta } from "../utils/seriesStatus";

type Props = {
  status: string | null | undefined;
  /** "sm" overlays a cover (compact); "md" sits inline beside other chips. */
  size?: "sm" | "md";
};

/**
 * Small solid-colour status pill for a series (Ongoing / Complete / Hiatus /
 * Season End / Unknown), matching the website card badge. Renders nothing when
 * the status is missing or unrecognised. `size="sm"` is for overlaying a cover
 * image; `size="md"` matches the size of the inline chips on the detail page.
 */
export function SeriesStatusBadge({ status, size = "sm" }: Props) {
  const meta = getSeriesStatusMeta(status);
  if (!meta) return null;

  return (
    <View
      style={[
        styles.badge,
        size === "md" ? styles.badgeMd : styles.badgeSm,
        { backgroundColor: meta.background },
      ]}
    >
      <Text
        style={[
          styles.label,
          size === "md" ? styles.labelMd : styles.labelSm,
          { color: meta.text },
        ]}
        numberOfLines={1}
      >
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
    // Soft shadow so the pill stays legible over any cover art.
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  badgeSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeMd: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  label: {
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  labelSm: {
    fontSize: 10,
    lineHeight: 13,
  },
  labelMd: {
    fontSize: 11,
    lineHeight: 15,
  },
});
