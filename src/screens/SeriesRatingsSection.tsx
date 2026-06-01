import Ionicons from "@expo/vector-icons/Ionicons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, View } from "react-native";

import { getMySeriesVotes } from "../api/votes";
import {
  AppButton,
  AppText,
  CoverImage,
  EmptyState,
  ErrorState,
  LoadingState,
  Surface,
} from "../components";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import type { CategoryVote, MySeriesVote } from "../types/series";

type SeriesRatingsNav = NativeStackNavigationProp<RootStackParamList>;

const PAGE_SIZE = 10;

const SHORT_LABEL: Record<string, string> = {
  Story: "Story",
  Characters: "Chars",
  "World Building": "World",
  Art: "Art",
  "Drama / Fighting": "Drama",
};

function scoreColor(score: number): string {
  if (score >= 8) return colors.success;
  if (score >= 6) return colors.warning;
  return colors.danger;
}

function scoreBg(score: number): string {
  if (score >= 8) return "rgba(14, 167, 106, 0.14)";
  if (score >= 6) return "rgba(232, 162, 58, 0.14)";
  return "rgba(235, 106, 90, 0.14)";
}

function ScorePill({ vote }: { vote: CategoryVote }) {
  const label = SHORT_LABEL[vote.category] ?? vote.category;
  const fg = scoreColor(vote.score);
  const bg = scoreBg(vote.score);
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: fg + "55" }]}>
      <AppText style={[styles.pillLabel, { color: fg }]}>{label}</AppText>
      <AppText style={[styles.pillScore, { color: fg }]}>{vote.score}</AppText>
    </View>
  );
}

function SeriesRatingCard({ item }: { item: MySeriesVote }) {
  const navigation = useNavigation<SeriesRatingsNav>();
  const title = item.title ?? `Series #${item.series_id}`;

  return (
    <Pressable
      onPress={() => navigation.navigate("SeriesDetail", { seriesId: item.series_id })}
      style={({ pressed }) => [pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`View ${title}`}
    >
      <Surface variant="raised" radius="xl" style={styles.card}>
        {/* Cover thumbnail */}
        <CoverImage uri={item.cover_url} style={styles.cover} fallbackIconSize={20} />

        {/* Info column */}
        <View style={styles.info}>
          <AppText variant="cardTitle" numberOfLines={2} style={styles.title}>
            {title}
          </AppText>
          {item.type || item.status ? (
            <View style={styles.metaRow}>
              {item.type ? (
                <View style={styles.typeBadge}>
                  <AppText style={styles.typeText}>{item.type}</AppText>
                </View>
              ) : null}
              {item.status ? (
                <AppText tone="muted" style={styles.statusText} numberOfLines={1}>
                  {item.status}
                </AppText>
              ) : null}
            </View>
          ) : null}
          {item.votes.length > 0 ? (
            <View style={styles.pills}>
              {item.votes.map((v) => (
                <ScorePill key={v.category} vote={v} />
              ))}
            </View>
          ) : null}
        </View>

        <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
      </Surface>
    </Pressable>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function SeriesRatingsSection() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const query = useInfiniteQuery({
    queryKey: ["series", "me", "votes"],
    queryFn: ({ pageParam }) => getMySeriesVotes(pageParam as number, PAGE_SIZE),
    getNextPageParam: (lastPage) => (lastPage.has_next ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  if (query.isLoading) {
    return <LoadingState message="Loading your ratings…" />;
  }

  if (query.isError) {
    return <ErrorState message="Could not load ratings. Try again in a moment." />;
  }

  if (items.length === 0) {
    return (
      <EmptyState message="You haven't rated any series yet. Score categories from any series page." />
    );
  }

  return (
    <View style={styles.root}>
      <Pressable
        onPress={() => navigation.navigate("HowRankingsWork")}
        style={({ pressed }) => [styles.infoRow, pressed ? styles.infoRowPressed : null]}
      >
        <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
        <AppText variant="caption" tone="muted">
          Scores are locked after voting · 1–10 per category
        </AppText>
        <Ionicons name="chevron-forward" size={13} color={colors.textMuted} />
      </Pressable>
      <View style={styles.list}>
        {items.map((item) => (
          <SeriesRatingCard key={item.series_id} item={item} />
        ))}
      </View>
      {query.hasNextPage ? (
        <AppButton
          label={query.isFetchingNextPage ? "Loading…" : "Load more"}
          variant="secondary"
          disabled={query.isFetchingNextPage}
          onPress={() => void query.fetchNextPage()}
        />
      ) : null}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.75,
  },
  // Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cover: {
    width: 48,
    height: 66,
    borderRadius: radii.sm,
    overflow: "hidden",
    flexShrink: 0,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  typeBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.accentBorder + "55",
  },
  typeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.accentStrong,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 11,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  pillScore: {
    fontSize: 11,
    fontWeight: "800",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  infoRowPressed: {
    opacity: 0.7,
  },
});
