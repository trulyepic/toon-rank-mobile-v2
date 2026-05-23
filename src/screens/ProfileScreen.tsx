import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

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
import { setAvatarPreset } from "../api/auth";
import type { AvatarPreset } from "../types/account";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import { avatarPresetColors, normalizeAvatarPreset } from "../utils/avatar";

const PRESETS: AvatarPreset[] = ["blue", "emerald", "amber"];

const PRESET_LABELS: Record<AvatarPreset, string> = {
  blue: "Blue",
  emerald: "Emerald",
  amber: "Amber",
};

export function ProfileScreen() {
  const { isSignedIn, user, updateUser } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currentPreset = normalizeAvatarPreset(user?.avatar_preset);

  const presetMutation = useMutation({
    mutationFn: (preset: string) => setAvatarPreset(preset),
    onSuccess: (data) => {
      void updateUser({
        avatar_url: data.avatar_url,
        avatar_preset: data.avatar_preset as AvatarPreset,
      });
    },
  });

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

      {isSignedIn ? (
        <View style={styles.section}>
          <SectionHeader title="Avatar preset" />
          {user?.avatar_url ? (
            <AppText tone="muted" style={styles.presetNote}>
              Selecting a preset will replace your uploaded photo.
            </AppText>
          ) : null}
          <Surface variant="raised" radius="xl" style={styles.presetRow}>
            {PRESETS.map((preset) => {
              const pc = avatarPresetColors[preset];
              const isActive = currentPreset === preset;
              const isLoading =
                presetMutation.isPending && presetMutation.variables === preset;

              return (
                <Pressable
                  key={preset}
                  onPress={() => {
                    if (!isActive && !presetMutation.isPending) {
                      presetMutation.mutate(preset);
                    }
                  }}
                  disabled={isActive || presetMutation.isPending}
                  accessibilityRole="button"
                  accessibilityLabel={`${PRESET_LABELS[preset]} avatar preset${isActive ? ", selected" : ""}`}
                  accessibilityState={{ selected: isActive }}
                  style={({ pressed }) => [
                    styles.swatchWrap,
                    pressed && !isActive ? styles.pressed : null,
                  ]}
                >
                  <View
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: pc.background,
                        borderColor: pc.border,
                      },
                      isActive && styles.swatchActive,
                    ]}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : isActive ? (
                      <Ionicons name="checkmark" size={22} color="#fff" />
                    ) : null}
                  </View>
                  <AppText
                    variant="caption"
                    tone={isActive ? "accent" : "muted"}
                    align="center"
                  >
                    {PRESET_LABELS[preset]}
                  </AppText>
                </Pressable>
              );
            })}
          </Surface>
          {presetMutation.isError ? (
            <AppText tone="danger" style={styles.presetNote}>
              Could not update preset. Please try again.
            </AppText>
          ) : null}
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Custom photo" />
        <Surface variant="default" radius="xl" style={styles.notice}>
          <View style={styles.noticeIcon}>
            <Ionicons name="image-outline" size={20} color={colors.accentStrong} />
          </View>
          <View style={styles.noticeText}>
            <AppText variant="cardTitle">Upload coming in a future update</AppText>
            <AppText tone="muted">
              Native image picking, cropping, and upload will be added in the next avatar
              phase. You can manage your photo from the website in the meantime.
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
  presetRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.md,
  },
  swatchWrap: {
    alignItems: "center",
    gap: spacing.xs,
  },
  swatch: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchActive: {
    borderWidth: 4,
  },
  presetNote: {
    paddingHorizontal: spacing.xs,
  },
  pressed: {
    opacity: 0.8,
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
