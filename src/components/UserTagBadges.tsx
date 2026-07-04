import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";

import { colors, radii } from "../theme/tokens";
import { AppText } from "./AppText";

/**
 * Small identity/activity tags shown right after a username, mirroring the
 * website's UserTags so both platforms read the same at a glance:
 *
 * - Admin      (role)             — runs the place
 * - Curator    (CONTRIBUTOR role) — submits series to the catalog
 * - Critic     (10+ series rated) — backbone of the rankings
 * - Chatterbox (25+ forum posts)  — keeps the forum alive
 *
 * Role tags render wherever the payload exposes `role`. Activity tags render
 * only where the API already provides the stats (leaderboard, public profile)
 * — never guessed client-side. The crown RankerBadge and the thread "OP" pill
 * complete the set.
 */

const CRITIC_MIN_RATED = 10;
const CHATTERBOX_MIN_POSTS = 25;

type TagSpec = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  surface: string;
  border: string;
  text: string;
};

function tagsFor({
  role,
  seriesRated,
  postCount,
}: {
  role?: string | null;
  seriesRated?: number;
  postCount?: number;
}): TagSpec[] {
  const tags: TagSpec[] = [];
  const normalized = String(role || "").toUpperCase();

  if (normalized === "ADMIN") {
    tags.push({
      key: "admin",
      label: "Admin",
      icon: "shield-checkmark",
      surface: colors.warningSurface,
      border: colors.warningBorder,
      text: colors.warningText,
    });
  } else if (normalized === "CONTRIBUTOR") {
    tags.push({
      key: "curator",
      label: "Curator",
      icon: "sparkles",
      surface: colors.infoSurface,
      border: colors.infoBorder,
      text: colors.infoText,
    });
  }

  if ((seriesRated ?? 0) >= CRITIC_MIN_RATED) {
    tags.push({
      key: "critic",
      label: "Critic",
      icon: "star",
      surface: colors.successSurface,
      border: colors.successBorder,
      text: colors.success,
    });
  }

  if ((postCount ?? 0) >= CHATTERBOX_MIN_POSTS) {
    tags.push({
      key: "chatterbox",
      label: "Chatterbox",
      icon: "chatbubbles",
      surface: colors.accentSoft,
      border: colors.accentBorder,
      text: colors.accentStrong,
    });
  }

  return tags;
}

export function UserTagBadges({
  role,
  seriesRated,
  postCount,
}: {
  role?: string | null;
  seriesRated?: number;
  postCount?: number;
}) {
  const styles = getStyles();
  const tags = tagsFor({ role, seriesRated, postCount });
  if (tags.length === 0) return null;

  return (
    <View style={styles.root}>
      {tags.map((tag) => (
        <View
          key={tag.key}
          accessibilityRole="text"
          accessibilityLabel={`${tag.label} badge`}
          style={[styles.pill, { backgroundColor: tag.surface, borderColor: tag.border }]}
        >
          <Ionicons name={tag.icon} size={9} color={tag.text} />
          <AppText style={[styles.label, { color: tag.text }]}>{tag.label}</AppText>
        </View>
      ))}
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
    root: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 4,
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: radii.sm,
      borderWidth: 1,
    },
    label: {
      fontSize: 9,
      lineHeight: 13,
      fontWeight: "800",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
  });
}
