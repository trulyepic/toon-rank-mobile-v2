import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";

import { AppText, ScreenShell, SectionHeader, Surface } from "../components";
import { colors, radii, spacing } from "../theme/tokens";

const listStates = [
  {
    icon: "library-outline" as const,
    title: "Reading",
    body: "Titles you are actively following will appear here.",
  },
  {
    icon: "time-outline" as const,
    title: "Plan to read",
    body: "Keep future reads close without mixing them into current progress.",
  },
  {
    icon: "checkmark-done-outline" as const,
    title: "Completed",
    body: "Finished titles and chapter notes will sync from your web lists.",
  },
];

export function ReadingListsScreen() {
  return (
    <ScreenShell
      title="Reading Lists"
      subtitle="Saved titles and chapter progress will mirror your Toon Ranks website account."
    >
      <Surface variant="accent" radius="hero" style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="bookmark-outline" size={24} color={colors.text} />
        </View>
        <View style={styles.heroText}>
          <AppText variant="sectionTitle">Library shell</AppText>
          <AppText tone="muted">
            This screen is ready for the same saved list data used on the web.
            The next pass can connect list fetch, item progress, and public
            sharing.
          </AppText>
        </View>
      </Surface>

      <View style={styles.section}>
        <SectionHeader title="List sections" />
        <View style={styles.stack}>
          {listStates.map((item) => (
            <Surface key={item.title} variant="raised" radius="xl" style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name={item.icon} size={19} color={colors.accentStrong} />
              </View>
              <View style={styles.rowText}>
                <AppText variant="cardTitle">{item.title}</AppText>
                <AppText tone="muted">{item.body}</AppText>
              </View>
            </Surface>
          ))}
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    gap: spacing.md,
  },
  heroIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  heroText: {
    flex: 1,
    gap: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  stack: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rowIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
  },
});
