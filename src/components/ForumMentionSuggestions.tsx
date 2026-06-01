import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, View } from "react-native";

import { searchForumSeries } from "../api/forum";
import { searchUsers } from "../api/users";
import { colors, radii, spacing } from "../theme/tokens";
import type { SeriesRef } from "../types/forum";
import type { ActiveMention } from "../utils/forumMentions";
import { AppText } from "./AppText";
import { CoverImage } from "./CoverImage";
import { UserAvatar } from "./UserAvatar";

export type MentionSelection =
  | { type: "series"; series: SeriesRef }
  | { type: "user"; username: string };

type Props = {
  mention: ActiveMention | null;
  onSelect: (selection: MentionSelection) => void;
};

export function ForumMentionSuggestions({ mention, onSelect }: Props) {
  const styles = getStyles();
  const queryText = mention?.query.trim() ?? "";
  const enabled = Boolean(mention && queryText.length >= 1);

  const seriesQuery = useQuery({
    queryKey: ["forum", "series-search", queryText],
    queryFn: () => searchForumSeries(queryText),
    enabled,
  });

  const usersQuery = useQuery({
    queryKey: ["users", "search", queryText],
    queryFn: () => searchUsers(queryText, 5),
    enabled,
  });

  const seriesSuggestions = seriesQuery.data?.slice(0, 5) ?? [];
  const userSuggestions = usersQuery.data ?? [];
  const hasResults = seriesSuggestions.length > 0 || userSuggestions.length > 0;
  const isLoading = seriesQuery.isLoading || usersQuery.isLoading;

  if (!mention || queryText.length < 1) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Ionicons name="at-outline" size={14} color={colors.accentStrong} />
        <AppText variant="caption" tone="muted">
          Mention a title or user
        </AppText>
      </View>

      {isLoading ? (
        <AppText variant="caption" tone="subtle">
          Searching...
        </AppText>
      ) : null}

      {!isLoading && !hasResults ? (
        <AppText variant="caption" tone="subtle">
          No matches found.
        </AppText>
      ) : null}

      {userSuggestions.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="caption" tone="subtle" style={styles.sectionLabel}>
            USERS
          </AppText>
          {userSuggestions.map((user) => (
            <Pressable
              key={user.username}
              accessibilityRole="button"
              accessibilityLabel={`Mention @${user.username}`}
              onPress={() => onSelect({ type: "user", username: user.username })}
              style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
            >
              <UserAvatar
                username={user.username}
                avatarUrl={user.avatar_url}
                avatarPreset={user.avatar_preset}
                size="sm"
              />
              <AppText variant="caption">@{user.username}</AppText>
            </Pressable>
          ))}
        </View>
      ) : null}

      {seriesSuggestions.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="caption" tone="subtle" style={styles.sectionLabel}>
            SERIES
          </AppText>
          {seriesSuggestions.map((series) => (
            <Pressable
              key={series.series_id}
              accessibilityRole="button"
              accessibilityLabel={`Mention ${series.title || "title"}`}
              onPress={() => onSelect({ type: "series", series })}
              style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
            >
              <CoverImage
                uri={series.cover_url}
                style={styles.cover}
                fallbackIconSize={17}
              />
              <View style={styles.text}>
                <AppText variant="caption" numberOfLines={1}>
                  {series.title || "Untitled"}
                </AppText>
                <AppText variant="caption" tone="subtle">
                  {series.type || "Series"}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
    root: {
      gap: spacing.xs,
      padding: spacing.sm,
      borderRadius: radii.lg,
      backgroundColor: colors.backgroundSoft,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    section: {
      gap: 2,
    },
    sectionLabel: {
      fontSize: 10,
      letterSpacing: 0.6,
      paddingHorizontal: spacing.xs,
      paddingTop: spacing.xs,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.xs,
      borderRadius: radii.md,
    },
    pressed: {
      opacity: 0.82,
      backgroundColor: colors.surfacePressed,
    },
    cover: {
      width: 32,
      height: 42,
      borderRadius: radii.sm,
      backgroundColor: colors.surface,
    },
    text: {
      flex: 1,
      minWidth: 0,
    },
  });
}
