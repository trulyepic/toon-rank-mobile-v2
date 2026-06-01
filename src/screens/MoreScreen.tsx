import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  AppButton,
  AppText,
  RoleNameText,
  ScreenShell,
  SectionHeader,
  Surface,
  UserIdentity,
} from "../components";
import { useAuth } from "../auth/AuthContext";
import { LEGAL_URLS, SITE_ORIGIN, SUPPORT_EMAIL } from "../config/site";
import { THEME_META, type ThemeName } from "../theme/tokens";
import { useTheme } from "../theme/ThemeContext";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import { openInAppBrowser, openSupportEmail } from "../utils/externalLinks";

type RowTone = "default" | "disabled";

type MenuRowProps = {
  icon: ComponentProps<typeof Ionicons>["name"];
  iconColor?: string;
  title: string;
  subtitle: string;
  tone?: RowTone;
  onPress?: () => void;
};

const supportRows: MenuRowProps[] = [
  {
    icon: "document-text-outline",
    iconColor: "#64748b",
    title: "Terms",
    subtitle: "Account, voting, forum, and acceptable-use rules.",
  },
  {
    icon: "shield-checkmark-outline",
    iconColor: "#64748b",
    title: "Privacy",
    subtitle: "How Toon Ranks handles account and activity data.",
  },
  {
    icon: "bug-outline",
    iconColor: "#f97316",
    title: "Report an Issue",
    subtitle: "Send bugs, content problems, and suggestions.",
  },
  {
    icon: "list-outline",
    iconColor: "#3b82f6",
    title: "Issue Tracker",
    subtitle: "View reported bugs, feature requests, and current status.",
  },
  {
    icon: "mail-outline",
    iconColor: "#22c55e",
    title: "Support",
    subtitle: SUPPORT_EMAIL,
  },
];

function MenuRow({
  icon,
  iconColor,
  title,
  subtitle,
  tone = "default",
  onPress,
}: MenuRowProps) {
  const styles = getStyles();
  const disabled = tone === "disabled";
  const resolvedColor = disabled ? colors.textSubtle : (iconColor ?? colors.accentStrong);
  const content = (
    <>
      <View
        style={[
          styles.rowIcon,
          disabled ? styles.rowIconDisabled : null,
          !disabled && iconColor
            ? { backgroundColor: `${iconColor}18`, borderColor: `${iconColor}40` }
            : null,
        ]}
      >
        <Ionicons name={icon} size={19} color={resolvedColor} />
      </View>
      <View style={styles.rowText}>
        <AppText variant="cardTitle" tone={disabled ? "muted" : "primary"}>
          {title}
        </AppText>
        <AppText tone={disabled ? "subtle" : "muted"}>{subtitle}</AppText>
      </View>
      <Ionicons
        name={disabled ? "lock-closed-outline" : "chevron-forward"}
        size={18}
        color={disabled ? colors.textSubtle : colors.textMuted}
      />
    </>
  );

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => (pressed ? styles.pressed : null)}
      >
        <Surface variant="raised" radius="lg" style={styles.row}>
          {content}
        </Surface>
      </Pressable>
    );
  }

  return (
    <Surface
      variant={disabled ? "default" : "raised"}
      radius="lg"
      style={[styles.row, disabled ? styles.rowDisabled : null]}
    >
      {content}
    </Surface>
  );
}

export function MoreScreen() {
  const styles = getStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isSignedIn, logout, status, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const isLoadingAuth = status === "loading";
  const supportRowsWithActions: MenuRowProps[] = supportRows.map((row) => {
    if (row.title === "Terms") {
      return { ...row, onPress: () => openInAppBrowser(LEGAL_URLS.terms) };
    }

    if (row.title === "Privacy") {
      return { ...row, onPress: () => openInAppBrowser(LEGAL_URLS.privacy) };
    }

    if (row.title === "Report an Issue") {
      return { ...row, onPress: () => navigation.navigate("ReportIssue") };
    }

    if (row.title === "Issue Tracker") {
      return { ...row, onPress: () => navigation.navigate("IssueTracker") };
    }

    return { ...row, onPress: () => openSupportEmail(SUPPORT_EMAIL) };
  });
  const accountRows: MenuRowProps[] = [
    {
      icon: "trophy-outline",
      iconColor: "#f59e0b",
      title: "Rankers",
      subtitle: "Cred Points, posts, and series ratings.",
      onPress: () => navigation.navigate("Leaderboard"),
    },
    {
      icon: "bookmark-outline",
      iconColor: "#3b82f6",
      title: "Reading Lists",
      subtitle: "Saved, planned, reading, and completed titles.",
      onPress: () => navigation.navigate("ReadingLists"),
    },
    {
      icon: "chatbubbles-outline",
      iconColor: "#a855f7",
      title: "Forum Activity",
      subtitle: "Threads, replies, and discussion history.",
      onPress: () => navigation.navigate("ForumActivity"),
    },
    {
      icon: "person-circle-outline",
      iconColor: "#22c55e",
      title: "Profile",
      subtitle: "Username, account details, and public identity.",
      onPress: () => navigation.navigate("Profile"),
    },
    {
      icon: "settings-outline",
      iconColor: "#64748b",
      title: "Settings",
      subtitle: "Preferences, notifications, and app behavior.",
      onPress: () => navigation.navigate("Settings"),
    },
  ];

  return (
    <ScreenShell title="More" subtitle="Account, support, and app information.">
      {isSignedIn ? (
        <View style={styles.accountIntro}>
          <AppText variant="label" tone="muted">
            Account
          </AppText>
          <View style={styles.welcomeLine}>
            <AppText variant="sectionTitle">Welcome, </AppText>
            <RoleNameText variant="sectionTitle" role={user?.role}>
              {user?.username || "Reader"}
            </RoleNameText>
          </View>
          <AppText tone="muted">
            Your mobile session is connected to the same Toon Ranks account used on the
            website.
          </AppText>
        </View>
      ) : (
        <SectionHeader
          eyebrow="Account"
          title="Sync your Toon Ranks"
          body="Sign in later to sync your Toon Ranks activity across web and mobile."
        />
      )}

      <Surface variant="accent" radius="xl" style={styles.signInCard}>
        {isSignedIn ? (
          <UserIdentity
            user={user}
            avatarSize="lg"
            avatarVariant="portrait"
            subtitle="Your mobile session is connected to the same Toon Ranks account used on the website."
          />
        ) : (
          <View style={styles.signInContent}>
            <View style={styles.signInIcon}>
              <Ionicons name="person-outline" size={24} color={colors.text} />
            </View>
            <View style={styles.signInText}>
              <AppText variant="sectionTitle">Your Toon Ranks account</AppText>
              <AppText tone="muted">
                Mobile will use the same account, saved titles, forum activity, and voting
                history as the website.
              </AppText>
            </View>
          </View>
        )}
        <View style={styles.buttonRow}>
          {isSignedIn ? (
            <AppButton
              label="Log out"
              variant="ghost"
              onPress={logout}
              iconLeft={<Ionicons name="log-out-outline" size={15} color={colors.text} />}
            />
          ) : (
            <>
              <AppButton
                label={isLoadingAuth ? "Checking..." : "Log in"}
                disabled={isLoadingAuth}
                onPress={() => navigation.navigate("Login")}
                iconLeft={
                  <Ionicons name="log-in-outline" size={15} color={colors.text} />
                }
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
            </>
          )}
        </View>
      </Surface>

      <View style={styles.section}>
        <SectionHeader title="Account tools" />
        <View style={styles.rowStack}>
          {accountRows.map((row) => (
            <MenuRow key={row.title} {...row} />
          ))}
        </View>
      </View>

      {isSignedIn && user?.role === "ADMIN" ? (
        <View style={styles.section}>
          <SectionHeader title="Admin tools" />
          <View style={styles.rowStack}>
            <MenuRow
              icon="flag-outline"
              iconColor="#ef4444"
              title="Report Queue"
              subtitle="Review and action flagged forum posts."
              onPress={() => navigation.navigate("AdminReportQueue")}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Help & support" />
        <View style={styles.rowStack}>
          <MenuRow
            icon="information-circle-outline"
            iconColor="#06b6d4"
            title="About Toon Ranks"
            subtitle="App version, Instagram, and contact info."
            onPress={() => navigation.navigate("About")}
          />
          <MenuRow
            icon="bar-chart-outline"
            iconColor="#f59e0b"
            title="How Rankings Work"
            subtitle="Rating categories, scoring, and Cred Points."
            onPress={() => navigation.navigate("HowRankingsWork")}
          />
          <MenuRow
            icon="globe-outline"
            iconColor="#3b82f6"
            title="Open Website"
            subtitle="Visit the full Toon Ranks site in your browser."
            onPress={() => openInAppBrowser(SITE_ORIGIN)}
          />
          {supportRowsWithActions.map((row) => (
            <MenuRow key={row.title} {...row} />
          ))}
        </View>
      </View>

      {/* Theme picker */}
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

      <View style={styles.footer}>
        <AppText tone="subtle" align="center">
          Toon Ranks is operated by Nofara LLC.
        </AppText>
        <AppText variant="caption" tone="subtle" align="center">
          Copyright 2026 Toon Ranks
        </AppText>
      </View>
    </ScreenShell>
  );
}

function getStyles() {
  return StyleSheet.create({
  signInCard: {
    gap: spacing.md,
  },
  accountIntro: {
    gap: spacing.xs,
  },
  welcomeLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
  },
  signInContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  signInIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  signInText: {
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
  rowStack: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rowDisabled: {
    opacity: 0.78,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  rowIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  rowIconDisabled: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.borderSoft,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
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
  footer: {
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
});
}
