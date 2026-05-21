import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";

import {
  AccountRequiredCard,
  AppText,
  RoleNameText,
  ScreenShell,
  SectionHeader,
  Surface,
} from "../components";
import { useAuth } from "../auth/AuthContext";
import { colors, radii, spacing } from "../theme/tokens";

const activityItems = [
  {
    icon: "chatbubble-ellipses-outline" as const,
    title: "Threads",
    body: "Your started discussions will be grouped here.",
  },
  {
    icon: "return-up-forward-outline" as const,
    title: "Replies",
    body: "Recent replies and conversations will be easy to revisit.",
  },
  {
    icon: "heart-outline" as const,
    title: "Reactions",
    body: "Liked posts and activity signals can live here once connected.",
  },
];

export function ForumActivityScreen() {
  const { isSignedIn, user } = useAuth();

  return (
    <ScreenShell
      title="Forum Activity"
      subtitle="A native home for discussions tied to the same account identity as the website."
    >
      {!isSignedIn ? (
        <AccountRequiredCard
          title="Log in to see your forum trail"
          body="Your threads, replies, reactions, avatar, and role will use the same Toon Ranks account as the website."
        />
      ) : null}

      <Surface variant="accent" radius="hero" style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="chatbubbles-outline" size={24} color={colors.text} />
        </View>
        <View style={styles.heroText}>
          {isSignedIn ? (
            <View style={styles.activityTitleLine}>
              <RoleNameText variant="sectionTitle" role={user?.role}>
                {user?.username || "Reader"}
              </RoleNameText>
              <AppText variant="sectionTitle"> activity</AppText>
            </View>
          ) : (
            <AppText variant="sectionTitle">Community trail</AppText>
          )}
          <AppText tone="muted">
            {isSignedIn
              ? "This screen is ready for user-specific threads, replies, and reactions once those mobile endpoints are expanded."
              : "Forum identity, avatars, and roles are shared with the website. Sign in later to make this screen personal."}
          </AppText>
        </View>
      </Surface>

      <View style={styles.section}>
        <SectionHeader title="Activity sections" />
        <View style={styles.stack}>
          {activityItems.map((item) => (
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
  activityTitleLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
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
