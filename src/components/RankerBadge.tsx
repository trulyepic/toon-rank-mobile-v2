import { StyleSheet, View } from "react-native";

import { AppText } from "./AppText";
import { colors, radii, spacing } from "../theme/tokens";

type Props = {
  rank?: number | null;
};

const rankColors: Record<number, string> = {
  1: "#facc15",
  2: "#d1d5db",
  3: "#f59e0b",
};

export function RankerBadge({ rank }: Props) {
  if (!rank || rank > 10) return null;

  const isPodium = rank <= 3;
  const tint = rankColors[rank] ?? colors.accentStrong;

  return (
    <View
      style={[styles.badge, isPodium ? styles.podiumBadge : null, { borderColor: tint }]}
    >
      <AppText variant="caption" style={[styles.badgeText, { color: tint }]}>
        {isPodium ? `◆ #${rank}` : `#${rank}`}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    backgroundColor: colors.backgroundSoft,
  },
  podiumBadge: {
    backgroundColor: "rgba(250, 204, 21, 0.09)",
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 14,
  },
});
