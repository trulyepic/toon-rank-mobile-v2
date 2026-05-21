import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

import {
  AccountRequiredCard,
  AppButton,
  AppText,
  ScreenShell,
  SectionHeader,
  Surface,
  UserIdentity,
} from "../components";
import { useAuth } from "../auth/AuthContext";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";

export function ProfileScreen() {
  const { isSignedIn, user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScreenShell
      title="Profile"
      subtitle="Your public Toon Ranks identity will stay shared across web and mobile."
    >
      {!isSignedIn ? (
        <AccountRequiredCard
          title="Log in to use your profile"
          body="Your avatar, role, saved titles, votes, and forum identity all come from the same website account."
        />
      ) : null}

      <Surface variant="raised" radius="hero" shadow style={styles.hero}>
        <UserIdentity
          user={user}
          titleFallback="Guest reader"
          avatarSize="xl"
          centered
          subtitle={
            isSignedIn
              ? "Avatar and role data are synced from your Toon Ranks account."
              : "This preview shows where your shared Toon Ranks identity appears after login."
          }
        />
      </Surface>

      <View style={styles.section}>
        <SectionHeader title="Avatar editing" />
        <Surface variant="default" radius="xl" style={styles.notice}>
          <View style={styles.noticeIcon}>
            <Ionicons name="image-outline" size={20} color={colors.accentStrong} />
          </View>
          <View style={styles.noticeText}>
            <AppText variant="cardTitle">Native upload is a dedicated phase</AppText>
            <AppText tone="muted">
              Mobile currently uses the same uploaded avatar and default preset from the
              website. Native image picking, cropping, and upload will be added in the
              mobile-native-avatar-upload phase.
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
            onPress={() => navigation.navigate("ReadingLists")}
            iconLeft={<Ionicons name="bookmark-outline" size={15} color={colors.text} />}
          />
          <AppButton
            label="Forum activity"
            variant="secondary"
            onPress={() => navigation.navigate("ForumActivity")}
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
