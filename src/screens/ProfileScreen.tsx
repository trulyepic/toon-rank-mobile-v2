import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";

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
import { setAvatarPreset, uploadAvatar } from "../api/auth";
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

async function pickAvatarImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      "Photo access required",
      "Allow Toon Ranks to access your photo library in Settings to set a profile photo.",
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: "images",
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets.length) return null;

  return result.assets[0];
}

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

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const asset = await pickAvatarImage();
      if (!asset) return null;
      const mimeType = asset.mimeType ?? "image/jpeg";
      return uploadAvatar(asset.uri, mimeType);
    },
    onSuccess: (data) => {
      if (!data) return;
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
        <>
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
                const isActive = currentPreset === preset && !user?.avatar_url;
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

          <View style={styles.section}>
            <SectionHeader title="Custom photo" />
            <Surface variant="raised" radius="xl" style={styles.uploadCard}>
              <View style={styles.uploadIcon}>
                <Ionicons name="image-outline" size={22} color={colors.accentStrong} />
              </View>
              <View style={styles.uploadText}>
                <AppText variant="cardTitle">Upload a photo</AppText>
                <AppText tone="muted">
                  Choose a square photo from your library. It will be cropped and stored
                  as your Toon Ranks avatar.
                </AppText>
              </View>
              <AppButton
                label={uploadMutation.isPending ? "Uploading…" : "Choose photo"}
                variant="secondary"
                disabled={uploadMutation.isPending}
                onPress={() => uploadMutation.mutate()}
                iconLeft={
                  uploadMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Ionicons name="cloud-upload-outline" size={15} color={colors.text} />
                  )
                }
              />
              {uploadMutation.isError ? (
                <AppText tone="danger">
                  Upload failed. Check your connection and try again.
                </AppText>
              ) : null}
            </Surface>
          </View>
        </>
      ) : null}

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
  uploadCard: {
    gap: spacing.md,
  },
  uploadIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  uploadText: {
    gap: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
