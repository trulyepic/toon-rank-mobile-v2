import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { Image, Pressable, StyleSheet, View } from "react-native";

import { searchForumSeries } from "../api/forum";
import { colors, radii, spacing } from "../theme/tokens";
import type { SeriesRef } from "../types/forum";
import type { ActiveMention } from "../utils/forumMentions";
import { AppText } from "./AppText";

type Props = {
  mention: ActiveMention | null;
  onSelect: (series: SeriesRef) => void;
};

export function ForumMentionSuggestions({ mention, onSelect }: Props) {
  const queryText = mention?.query.trim() ?? "";
  const suggestionsQuery = useQuery({
    queryKey: ["forum", "series-search", queryText],
    queryFn: () => searchForumSeries(queryText),
    enabled: Boolean(mention && queryText.length >= 1),
  });
  const suggestions = suggestionsQuery.data?.slice(0, 5) ?? [];

  if (!mention || queryText.length < 1) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Ionicons name="at-outline" size={14} color={colors.accentStrong} />
        <AppText variant="caption" tone="muted">
          Mention a title
        </AppText>
      </View>

      {suggestionsQuery.isLoading ? (
        <AppText variant="caption" tone="subtle">
          Searching titles...
        </AppText>
      ) : null}

      {!suggestionsQuery.isLoading && suggestions.length === 0 ? (
        <AppText variant="caption" tone="subtle">
          No matching titles yet.
        </AppText>
      ) : null}

      {suggestions.map((series) => (
        <Pressable
          key={series.series_id}
          accessibilityRole="button"
          accessibilityLabel={`Mention ${series.title || "title"}`}
          onPress={() => onSelect(series)}
          style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
        >
          {series.cover_url ? (
            <Image
              source={{ uri: series.cover_url }}
              accessibilityLabel={`${series.title || "Title"} cover`}
              style={styles.cover}
            />
          ) : (
            <View style={[styles.cover, styles.coverFallback]}>
              <Ionicons name="book-outline" size={17} color={colors.textMuted} />
            </View>
          )}
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
  );
}

const styles = StyleSheet.create({
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
  coverFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
});
