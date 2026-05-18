import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";

import { AppText, ScreenShell, SectionHeader, Surface } from "../components";
import { colors, radii, spacing } from "../theme/tokens";

const settingsRows = [
  {
    icon: "moon-outline" as const,
    title: "Appearance",
    body: "The mobile app currently uses the dark Toon Ranks palette.",
  },
  {
    icon: "notifications-outline" as const,
    title: "Notifications",
    body: "Future reminders for replies, saved titles, and account events.",
  },
  {
    icon: "shield-checkmark-outline" as const,
    title: "Account safety",
    body: "Session, sign-out, and verification controls will be expanded here.",
  },
];

export function SettingsScreen() {
  return (
    <ScreenShell
      title="Settings"
      subtitle="Preferences and account controls for the native mobile app."
    >
      <View style={styles.section}>
        <SectionHeader title="Preferences" />
        <View style={styles.stack}>
          {settingsRows.map((item) => (
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
