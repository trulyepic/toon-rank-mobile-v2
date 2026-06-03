import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import {
  AppButton,
  AppText,
  ScreenShell,
  SectionHeader,
  Surface,
  UserIdentity,
} from "../components";
import { useAuth } from "../auth/AuthContext";
import { deleteAccount } from "../api/auth";
import { WEB_AUTH_URLS } from "../config/site";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing, THEME_META, type ThemeName } from "../theme/tokens";
import { useTheme } from "../theme/ThemeContext";
import { openInAppBrowser } from "../utils/externalLinks";

export function SettingsScreen() {
  const styles = getStyles();
  const { isSignedIn, logout, status, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isLoadingAuth = status === "loading";

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      await logout();
    },
    onError: () => {
      Alert.alert(
        "Could not delete account",
        "Something went wrong. Please try again or contact support.",
      );
    },
  });

  function handleDeleteAccount() {
    Alert.alert(
      "Delete account",
      "This will permanently delete your Toon Ranks account, reading lists, votes, and forum posts. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  }

  return (
    <ScreenShell
      title="Settings"
      subtitle="Preferences and account controls for the native mobile app."
    >
      <Surface variant="accent" radius="hero" style={styles.sessionCard}>
        {isSignedIn ? (
          <UserIdentity
            user={user}
            subtitle="This device is connected to your Toon Ranks account."
          />
        ) : (
          <View style={styles.signedOutContent}>
            <View style={styles.sessionIcon}>
              <Ionicons name="person-outline" size={24} color={colors.text} />
            </View>
            <View style={styles.sessionText}>
              <AppText variant="sectionTitle">Signed out</AppText>
              <AppText tone="muted">
                {isLoadingAuth
                  ? "Checking for a saved mobile session."
                  : "Log in or sign up to sync votes, reading lists, profile identity, and forum activity."}
              </AppText>
            </View>
          </View>
        )}

        {isSignedIn ? (
          <AppButton
            label="Log out"
            variant="ghost"
            onPress={logout}
            iconLeft={<Ionicons name="log-out-outline" size={15} color={colors.text} />}
          />
        ) : (
          <View style={styles.buttonRow}>
            <AppButton
              label={isLoadingAuth ? "Checking..." : "Log in"}
              disabled={isLoadingAuth}
              onPress={() => navigation.navigate("Login")}
              iconLeft={<Ionicons name="log-in-outline" size={15} color={colors.text} />}
            />
            <AppButton
              label="Sign up"
              variant="ghost"
              disabled={isLoadingAuth}
              onPress={() => navigation.navigate("Signup")}
              iconLeft={
                <Ionicons name="person-add-outline" size={15} color={colors.text} />
              }
            />
          </View>
        )}
      </Surface>

      <View style={styles.section}>
        <SectionHeader title="Appearance" />
        <Surface variant="raised" radius="xl" style={styles.themePicker}>
          <AppText variant="caption" tone="muted">
            Choose your colour theme
          </AppText>
          <View style={styles.themeOptions}>
            {(Object.keys(THEME_META) as ThemeName[]).map((name) => {
              const meta = THEME_META[name];
              const active = theme === name;
              return (
                <Pressable
                  key={name}
                  accessibilityRole="button"
                  accessibilityLabel={`${meta.label} theme`}
                  onPress={() => void setTheme(name)}
                  style={({ pressed }) => [
                    styles.themeOption,
                    active ? styles.themeOptionActive : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <View style={[styles.themeSwatch, { backgroundColor: meta.swatch }]} />
                  <AppText
                    variant="caption"
                    style={active ? { color: meta.swatch, fontWeight: "700" } : undefined}
                  >
                    {meta.label}
                  </AppText>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={14} color={meta.swatch} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
          <AppText variant="caption" tone="subtle">
            Accent colours update instantly. Restart the app to fully apply background
            changes.
          </AppText>
        </Surface>
      </View>

      {isSignedIn ? (
        <View style={styles.section}>
          <SectionHeader title="Account" />
          <Surface variant="raised" radius="xl" style={styles.accountCard}>
            <AppButton
              label="Change password"
              variant="secondary"
              onPress={() => openInAppBrowser(WEB_AUTH_URLS.forgotPassword)}
              iconLeft={
                <Ionicons name="lock-closed-outline" size={15} color={colors.text} />
              }
            />
            <View style={styles.divider} />
            <AppButton
              label={deleteMutation.isPending ? "Deleting account..." : "Delete account"}
              variant="ghost"
              disabled={deleteMutation.isPending}
              onPress={handleDeleteAccount}
              iconLeft={<Ionicons name="trash-outline" size={15} color={colors.danger} />}
            />
          </Surface>
        </View>
      ) : null}
    </ScreenShell>
  );
}

function getStyles() {
  return StyleSheet.create({
    sessionCard: {
      gap: spacing.md,
    },
    signedOutContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    sessionIcon: {
      width: 52,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.pill,
      backgroundColor: colors.accent,
      borderWidth: 1,
      borderColor: colors.accentBorder,
    },
    sessionText: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    buttonRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    section: {
      gap: spacing.sm,
    },
    themePicker: {
      gap: spacing.sm,
    },
    themeOptions: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    themeOption: {
      flex: 1,
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: radii.lg,
      borderWidth: 1.5,
      borderColor: colors.borderSoft,
    },
    themeOptionActive: {
      borderColor: colors.accentStrong,
      backgroundColor: colors.accentSoft,
    },
    themeSwatch: {
      width: 28,
      height: 28,
      borderRadius: radii.pill,
    },
    pressed: {
      opacity: 0.86,
      transform: [{ scale: 0.99 }],
    },
    accountCard: {
      gap: spacing.sm,
    },
    divider: {
      height: 1,
      backgroundColor: colors.borderSoft,
    },
  });
}
