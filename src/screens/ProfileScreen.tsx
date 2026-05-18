import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";

import {
  AppButton,
  AppText,
  ScreenShell,
  SectionHeader,
  Surface,
  UserAvatar,
} from "../components";
import { useAuth } from "../auth/AuthContext";
import { colors, radii, spacing } from "../theme/tokens";
import { roleColor } from "../utils/avatar";

export function ProfileScreen() {
  const { isSignedIn, user } = useAuth();

  return (
    <ScreenShell
      title="Profile"
      subtitle="Your public Toon Ranks identity will stay shared across web and mobile."
    >
      <Surface variant="raised" radius="hero" shadow style={styles.hero}>
        <View style={styles.avatarWrap}>
          <UserAvatar
            username={user?.username || "Guest"}
            avatarUrl={user?.avatar_url}
            avatarPreset={user?.avatar_preset}
            size="xl"
          />
        </View>

        <View style={styles.profileText}>
          <AppText
            variant="sectionTitle"
            align="center"
            style={{ color: roleColor(user?.role) }}
          >
            {user?.username || "Guest reader"}
          </AppText>
          <AppText variant="label" tone="muted" align="center">
            {user?.role || "SIGNED OUT"}
          </AppText>
          <AppText tone="muted" align="center">
            {isSignedIn
              ? "Avatar and role data are synced from your Toon Ranks account. Mobile editing will be added after the web avatar flow settles."
              : "Sign in to use your website profile, saved titles, ratings, and forum identity on mobile."}
          </AppText>
        </View>
      </Surface>

      <View style={styles.section}>
        <SectionHeader title="Avatar controls" />
        <Surface variant="default" radius="xl" style={styles.notice}>
          <View style={styles.noticeIcon}>
            <Ionicons name="image-outline" size={20} color={colors.accentStrong} />
          </View>
          <View style={styles.noticeText}>
            <AppText variant="cardTitle">Coming from web first</AppText>
            <AppText tone="muted">
              The mobile app will reuse the same uploaded avatar and defaults. Native
              image picking and crop controls are planned after the UI shell is complete.
            </AppText>
          </View>
        </Surface>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Account shortcuts" />
        <View style={styles.actions}>
          <AppButton
            label="Reading lists"
            variant="secondary"
            iconLeft={<Ionicons name="bookmark-outline" size={15} color={colors.text} />}
          />
          <AppButton
            label="Forum activity"
            variant="secondary"
            iconLeft={
              <Ionicons name="chatbubbles-outline" size={15} color={colors.text} />
            }
          />
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    gap: spacing.md,
  },
  avatarWrap: {
    padding: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  profileText: {
    gap: spacing.xs,
    alignItems: "center",
  },
  section: {
    gap: spacing.sm,
  },
  notice: {
    flexDirection: "row",
    gap: spacing.md,
  },
  noticeIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  noticeText: {
    flex: 1,
    gap: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
