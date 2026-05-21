import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  AppButton,
  AppText,
  ScreenShell,
  SectionHeader,
  Surface,
  UserIdentity,
} from "../components";
import { useAuth } from "../auth/AuthContext";
import { LEGAL_URLS, SUPPORT_EMAIL } from "../config/site";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import { openInAppBrowser, openSupportEmail } from "../utils/externalLinks";

type RowTone = "default" | "disabled";

type MenuRowProps = {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  tone?: RowTone;
  onPress?: () => void;
};

const supportRows: MenuRowProps[] = [
  {
    icon: "document-text-outline",
    title: "Terms",
    subtitle: "Account, voting, forum, and acceptable-use rules.",
  },
  {
    icon: "shield-checkmark-outline",
    title: "Privacy",
    subtitle: "How Toon Ranks handles account and activity data.",
  },
  {
    icon: "bug-outline",
    title: "Report an Issue",
    subtitle: "Send bugs, content problems, and suggestions.",
  },
  {
    icon: "mail-outline",
    title: "Support",
    subtitle: SUPPORT_EMAIL,
  },
];

function MenuRow({ icon, title, subtitle, tone = "default", onPress }: MenuRowProps) {
  const disabled = tone === "disabled";
  const content = (
    <>
      <View style={[styles.rowIcon, disabled ? styles.rowIconDisabled : null]}>
        <Ionicons
          name={icon}
          size={19}
          color={disabled ? colors.textSubtle : colors.accentStrong}
        />
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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isSignedIn, logout, status, user } = useAuth();
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

    return { ...row, onPress: () => openSupportEmail(SUPPORT_EMAIL) };
  });
  const accountRows: MenuRowProps[] = [
    {
      icon: "bookmark-outline",
      title: "Reading Lists",
      subtitle: "Saved, planned, reading, and completed titles.",
      onPress: () => navigation.navigate("ReadingLists"),
    },
    {
      icon: "chatbubbles-outline",
      title: "Forum Activity",
      subtitle: "Threads, replies, and discussion history.",
      onPress: () => navigation.navigate("ForumActivity"),
    },
    {
      icon: "person-circle-outline",
      title: "Profile",
      subtitle: "Username, account details, and public identity.",
      onPress: () => navigation.navigate("Profile"),
    },
    {
      icon: "settings-outline",
      title: "Settings",
      subtitle: "Preferences, notifications, and app behavior.",
      onPress: () => navigation.navigate("Settings"),
    },
  ];
  const communityRows: MenuRowProps[] = [
    {
      icon: "chatbubble-ellipses-outline",
      title: "Forum",
      subtitle: "Browse public discussions and title threads.",
      onPress: () => navigation.navigate("Forum"),
    },
  ];

  return (
    <ScreenShell title="More" subtitle="Account, support, and app information.">
      <SectionHeader
        eyebrow="Account"
        title={isSignedIn ? `Welcome, ${user?.username}` : "Sync your Toon Ranks"}
        body={
          isSignedIn
            ? "Your mobile session is connected to the same Toon Ranks account used on the website."
            : "Sign in later to sync your Toon Ranks activity across web and mobile."
        }
      />

      <Surface variant="accent" radius="xl" style={styles.signInCard}>
        {isSignedIn ? (
          <UserIdentity
            user={user}
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

      <View style={styles.section}>
        <SectionHeader title="Community" />
        <View style={styles.rowStack}>
          {communityRows.map((row) => (
            <MenuRow key={row.title} {...row} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Legal and support" />
        <View style={styles.rowStack}>
          {supportRowsWithActions.map((row) => (
            <MenuRow key={row.title} {...row} />
          ))}
        </View>
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

const styles = StyleSheet.create({
  signInCard: {
    gap: spacing.md,
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
  footer: {
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
});
