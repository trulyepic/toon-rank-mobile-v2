import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";

import { AppText, ScreenShell, Surface } from "../components";
import { colors, radii, spacing } from "../theme/tokens";

type CategoryInfo = {
  emoji: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  iconBg: string;
  name: string;
  description: string;
};

const CATEGORIES: CategoryInfo[] = [
  {
    emoji: "🎨",
    icon: "brush-outline",
    iconColor: "#a855f7",
    iconBg: "rgba(168,85,247,0.12)",
    name: "Art",
    description:
      "Panel composition, character design, backgrounds, and visual consistency across chapters.",
  },
  {
    emoji: "📖",
    icon: "book-outline",
    iconColor: "#3b82f6",
    iconBg: "rgba(59,130,246,0.12)",
    name: "Story",
    description:
      "Plot structure, pacing, originality, and how satisfying the narrative progression feels.",
  },
  {
    emoji: "👥",
    icon: "people-outline",
    iconColor: "#22c55e",
    iconBg: "rgba(34,197,94,0.12)",
    name: "Characters",
    description:
      "Depth and development of the cast — personality, growth arcs, and memorability.",
  },
  {
    emoji: "🌍",
    icon: "globe-outline",
    iconColor: "#f59e0b",
    iconBg: "rgba(245,158,11,0.12)",
    name: "World Building",
    description:
      "How rich and consistent the setting is — lore, rules, factions, and atmosphere.",
  },
];

export function HowRankingsWorkScreen() {
  return (
    <ScreenShell
      title="How Rankings Work"
      subtitle="Understanding the Toon Ranks rating system."
    >
      {/* Hero */}
      <Surface variant="accent" radius="hero" style={styles.hero}>
        <AppText style={styles.heroEmoji}>🏆</AppText>
        <View style={styles.heroText}>
          <AppText variant="sectionTitle">Community-powered rankings</AppText>
          <AppText tone="muted">
            Every score comes from real community votes — no editors, no algorithms.
          </AppText>
        </View>
      </Surface>

      {/* How scoring works */}
      <Surface variant="raised" radius="xl" style={styles.card}>
        <AppText variant="cardTitle">⚡ How scoring works</AppText>
        <AppText tone="muted">
          Rate each series across four categories on a scale of{" "}
          <AppText style={styles.highlight}>1–10</AppText>. Scores are{" "}
          <AppText style={styles.highlight}>locked after voting</AppText> to keep rankings
          stable. The overall rank is the average across all community votes.
        </AppText>
      </Surface>

      {/* Four categories */}
      <Surface variant="raised" radius="xl" style={styles.card}>
        <AppText variant="cardTitle">The four rating categories</AppText>
        {CATEGORIES.map((cat) => (
          <View key={cat.name} style={styles.categoryRow}>
            <View style={[styles.categoryIcon, { backgroundColor: cat.iconBg }]}>
              <AppText style={styles.categoryEmoji}>{cat.emoji}</AppText>
            </View>
            <View style={styles.categoryText}>
              <AppText variant="cardTitle" style={{ color: cat.iconColor }}>
                {cat.name}
              </AppText>
              <AppText tone="muted">{cat.description}</AppText>
            </View>
          </View>
        ))}
      </Surface>

      {/* Cred Points */}
      <Surface variant="raised" radius="xl" style={styles.card}>
        <AppText variant="cardTitle">💎 Cred Points &amp; Leaderboard</AppText>
        <AppText tone="muted">
          Every vote, reply, and thread earns you{" "}
          <AppText style={styles.highlight}>Cred Points (CP)</AppText>. Your CP total
          determines your rank on the community leaderboard. The more you participate, the
          higher you climb.
        </AppText>
      </Surface>

      {/* One vote rule */}
      <Surface variant="raised" radius="xl" style={styles.card}>
        <AppText variant="cardTitle">🔒 One vote per category</AppText>
        <AppText tone="muted">
          You can rate each of the four categories{" "}
          <AppText style={styles.highlight}>once per series</AppText>. Votes are permanent
          — think carefully before you submit.
        </AppText>
      </Surface>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  heroEmoji: {
    fontSize: 36,
    lineHeight: 44,
  },
  heroText: {
    flex: 1,
    gap: spacing.xs,
  },
  card: {
    gap: spacing.sm,
  },
  highlight: {
    fontWeight: "700",
    color: colors.text,
  },
  categoryRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  categoryIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    flexShrink: 0,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryText: {
    flex: 1,
    gap: 2,
  },
});
