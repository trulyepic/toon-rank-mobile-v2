import Ionicons from "@expo/vector-icons/Ionicons";
import { Linking, Pressable, StyleSheet, View } from "react-native";

import { AppText, ScreenShell, Surface } from "../components";
import { SITE_ORIGIN, SOCIAL_URLS, SUPPORT_EMAIL } from "../config/site";
import { openSupportEmail } from "../utils/externalLinks";
import { colors, radii, spacing } from "../theme/tokens";

const APP_VERSION = "1.0.0";

function LinkRow({
  icon,
  label,
  color,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.linkRow, pressed ? styles.pressed : null]}
    >
      <Ionicons name={icon} size={16} color={color} />
      <AppText style={[styles.link, { color }]}>{label}</AppText>
    </Pressable>
  );
}

export function AboutScreen() {
  return (
    <ScreenShell title="About" subtitle="Toon Ranks — the community rankings app.">
      {/* Hero */}
      <Surface variant="accent" radius="hero" style={styles.hero}>
        <View style={styles.logoWrap}>
          <AppText style={styles.logoEmoji}>⭐</AppText>
        </View>
        <View style={styles.heroText}>
          <AppText variant="sectionTitle">Toon Ranks</AppText>
          <AppText tone="muted">Version {APP_VERSION} · Mobile</AppText>
        </View>
      </Surface>

      {/* What is it */}
      <Surface variant="raised" radius="xl" style={styles.card}>
        <AppText variant="cardTitle">📖 What is Toon Ranks?</AppText>
        <AppText tone="muted">
          A community platform for ranking and discussing manhwa, manga, and manhua. Rate
          series by art, story, characters, and world-building, follow the leaderboard,
          and join the forum — synced across web and mobile.
        </AppText>
      </Surface>

      {/* Operated by */}
      <Surface variant="raised" radius="xl" style={styles.card}>
        <AppText variant="cardTitle">🏢 Operated by</AppText>
        <AppText tone="muted">Nofara LLC</AppText>
        <AppText tone="muted" style={styles.subtle}>
          © 2026 Toon Ranks. All rights reserved.
        </AppText>
      </Surface>

      {/* Social & Contact */}
      <Surface variant="raised" radius="xl" style={styles.card}>
        <AppText variant="cardTitle">🔗 Follow & get in touch</AppText>
        <LinkRow
          icon="logo-instagram"
          label="@toonranks on Instagram"
          color="#E1306C"
          onPress={() => Linking.openURL(SOCIAL_URLS.instagram)}
        />
        <LinkRow
          icon="mail-outline"
          label={SUPPORT_EMAIL}
          color={colors.accentStrong}
          onPress={() => openSupportEmail(SUPPORT_EMAIL)}
        />
        <LinkRow
          icon="globe-outline"
          label="www.toonranks.com"
          color={colors.accentStrong}
          onPress={() => Linking.openURL(SITE_ORIGIN)}
        />
      </Surface>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  logoWrap: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.xl,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  logoEmoji: {
    fontSize: 30,
  },
  heroText: {
    flex: 1,
    gap: spacing.xs,
  },
  card: {
    gap: spacing.sm,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  link: {
    textDecorationLine: "underline",
  },
  subtle: {
    fontSize: 12,
  },
  pressed: {
    opacity: 0.75,
  },
});
