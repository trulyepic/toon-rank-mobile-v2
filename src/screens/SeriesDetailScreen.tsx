import { Alert, Image, Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { getSeriesDetail, getSeriesSummary } from "../api/series";
import { voteSeriesDetail } from "../api/votes";
import { useAuth } from "../auth/AuthContext";
import {
  AppButton,
  AppText,
  Chip,
  LoadingState,
  ScreenShell,
  SectionHeader,
  Surface,
} from "../components";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import {
  getUserVoteForCategory,
  voteCategories,
  voteCategoryDescriptions,
  type VoteCategory,
} from "../utils/voting";

type SeriesDetailRoute = RouteProp<RootStackParamList, "SeriesDetail">;
type SeriesDetailNavigation = NativeStackNavigationProp<RootStackParamList>;

function getGenreChips(genre: string | undefined) {
  if (!genre) return [];
  return genre
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function getAverage(total?: number, count?: number) {
  return count && total ? total / count : 0;
}

function getScoreTone(score: number) {
  if (score >= 8) return colors.success;
  if (score >= 7.5) return colors.accentStrong;
  if (score >= 5) return colors.warning;
  return colors.danger;
}

function MetricCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Surface
      variant={highlight ? "accent" : "default"}
      radius="lg"
      style={styles.metricCard}
    >
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <AppText variant="cardTitle" style={highlight ? styles.metricValueHighlight : null}>
        {value}
      </AppText>
    </Surface>
  );
}

function BreakdownCard({
  label,
  score,
  votes,
}: {
  label: string;
  score: number;
  votes: number;
}) {
  return (
    <Surface style={styles.breakdownCard}>
      <View style={styles.breakdownTopRow}>
        <AppText variant="cardTitle">{label}</AppText>
        <AppText variant="sectionTitle" style={{ color: getScoreTone(score) }}>
          {score > 0 ? score.toFixed(1) : "-"}
        </AppText>
      </View>
      <AppText tone="muted" variant="caption">
        {votes > 0 ? `${votes} votes` : "No votes yet"}
      </AppText>
    </Surface>
  );
}

function VoteCategoryCard({
  label,
  description,
  selectedScore,
  disabled,
  isSubmitting,
  onVote,
}: {
  label: VoteCategory;
  description: string;
  selectedScore: number | null;
  disabled: boolean;
  isSubmitting: boolean;
  onVote: (category: VoteCategory, score: number) => void;
}) {
  const hasVoted = selectedScore !== null;

  return (
    <Surface variant={hasVoted ? "accent" : "raised"} style={styles.voteCard}>
      <View style={styles.voteHeaderText}>
        <View style={styles.voteTitleRow}>
          <AppText variant="cardTitle">{label}</AppText>
          {hasVoted ? (
            <View style={styles.votedPill}>
              <Ionicons name="checkmark" size={13} color={colors.text} />
              <AppText variant="caption">{selectedScore}/10 locked</AppText>
            </View>
          ) : null}
        </View>
        <AppText tone="muted">{description}</AppText>
      </View>

      <View style={styles.scoreGrid}>
        {Array.from({ length: 10 }, (_, index) => {
          const score = index + 1;
          const isSelected = selectedScore === score;

          return (
            <Pressable
              key={score}
              disabled={disabled || hasVoted || isSubmitting}
              onPress={() => onVote(label, score)}
              style={({ pressed }) => [
                styles.scoreButton,
                isSelected ? styles.scoreButtonSelected : null,
                pressed && !disabled && !hasVoted ? styles.scoreButtonPressed : null,
                disabled || hasVoted || isSubmitting ? styles.scoreButtonDisabled : null,
              ]}
            >
              <AppText
                variant="caption"
                style={
                  isSelected ? styles.scoreButtonTextSelected : styles.scoreButtonText
                }
              >
                {score}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </Surface>
  );
}

export function SeriesDetailScreen() {
  const route = useRoute<SeriesDetailRoute>();
  const navigation = useNavigation<SeriesDetailNavigation>();
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();
  const seriesId = route.params.seriesId;
  const summaryQuery = useQuery({
    queryKey: ["series-summary", seriesId],
    queryFn: () => getSeriesSummary(seriesId),
  });
  const detailQuery = useQuery({
    queryKey: ["series-detail", seriesId],
    queryFn: () => getSeriesDetail(seriesId),
  });
  const voteMutation = useMutation({
    mutationFn: ({ category, score }: { category: VoteCategory; score: number }) =>
      voteSeriesDetail(seriesId, { category, score }),
    onSuccess: (updatedDetail) => {
      queryClient.setQueryData(["series-detail", seriesId], updatedDetail);
      void detailQuery.refetch();
      void summaryQuery.refetch();
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Your vote could not be submitted. Please try again.";
      Alert.alert("Vote not submitted", message);
    },
  });

  const isLoading = summaryQuery.isLoading || detailQuery.isLoading;
  const isMissingTitle = !isLoading && summaryQuery.isError && detailQuery.isError;
  const hasPartialError =
    !isMissingTitle && (summaryQuery.isError || detailQuery.isError);

  const summary = summaryQuery.data;
  const detail = detailQuery.data;
  const title = summary?.title || detail?.title || "Series detail";
  const type = summary?.type || detail?.type;
  const status = summary?.status || detail?.status;
  const rank = summary?.rank;
  const voteCount = summary?.vote_count ?? 0;

  const heroImage = detail?.series_cover_url || summary?.cover_url || detail?.cover_url;
  const genreChips = getGenreChips(detail?.genre || summary?.genre);

  const storyScore = getAverage(detail?.story_total, detail?.story_count);
  const characterScore = getAverage(detail?.characters_total, detail?.characters_count);
  const worldScore = getAverage(detail?.worldbuilding_total, detail?.worldbuilding_count);
  const artScore = getAverage(detail?.art_total, detail?.art_count);
  const dramaScore = getAverage(
    detail?.drama_or_fight_total,
    detail?.drama_or_fight_count,
  );
  const averageScore = Number(summary?.final_score || 0);
  const handleVote = (category: VoteCategory, score: number) => {
    if (!isSignedIn) {
      Alert.alert("Log in to vote", "Use your Toon Ranks account to rate this series.", [
        { text: "Cancel", style: "cancel" },
        { text: "Log in", onPress: () => navigation.navigate("Login") },
      ]);
      return;
    }

    voteMutation.mutate({ category, score });
  };

  return (
    <ScreenShell title={title}>
      {isLoading ? <LoadingState message="Loading title..." /> : null}

      {isMissingTitle ? (
        <Surface variant="warning" radius="xl" style={styles.retryCard}>
          <Ionicons name="alert-circle-outline" size={22} color={colors.warningText} />
          <View style={styles.retryText}>
            <AppText variant="cardTitle">Title could not be loaded</AppText>
            <AppText tone="warning">
              Check your connection and try again. We could not load the title summary or
              detail data.
            </AppText>
          </View>
          <AppButton
            label="Retry"
            onPress={() => {
              summaryQuery.refetch();
              detailQuery.refetch();
            }}
            iconLeft={<Ionicons name="refresh" size={15} color={colors.text} />}
          />
        </Surface>
      ) : null}

      {hasPartialError ? (
        <Surface variant="warning" radius="xl" style={styles.retryCard}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color={colors.warningText}
          />
          <View style={styles.retryText}>
            <AppText variant="cardTitle">Some title data is unavailable</AppText>
            <AppText tone="warning">
              The page is showing everything that loaded. Retry to refresh the missing
              pieces.
            </AppText>
          </View>
          <AppButton
            label="Retry"
            size="sm"
            variant="ghost"
            onPress={() => {
              if (summaryQuery.isError) summaryQuery.refetch();
              if (detailQuery.isError) detailQuery.refetch();
            }}
            iconLeft={<Ionicons name="refresh" size={15} color={colors.text} />}
          />
        </Surface>
      ) : null}

      {summary || detail ? (
        <>
          <View style={styles.heroShell}>
            {heroImage ? (
              <Image source={{ uri: heroImage }} style={styles.heroImage} />
            ) : (
              <View style={[styles.heroImage, styles.heroFallback]}>
                <Ionicons name="image-outline" size={28} color={colors.accentStrong} />
                <AppText variant="cardTitle" align="center">
                  {title}
                </AppText>
                <AppText tone="muted" align="center">
                  Cover art has not been added yet.
                </AppText>
              </View>
            )}
          </View>

          <View style={styles.metaPanel}>
            <View style={styles.chipRow}>
              {type ? <Chip label={type} tone="accent" /> : null}
              {status ? <Chip label={status.replace("_", " ")} tone="neutral" /> : null}
            </View>

            <View style={styles.scoreActionRow}>
              <View style={styles.scoreCard}>
                <AppText variant="label" tone="muted">
                  Rating
                </AppText>
                <AppText
                  variant="sectionTitle"
                  style={{ color: getScoreTone(averageScore) }}
                >
                  {averageScore.toFixed(1)}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {voteCount.toLocaleString()} votes
                </AppText>
              </View>

              <View style={styles.quickActions}>
                <AppButton
                  label="Save"
                  size="sm"
                  iconLeft={
                    <Ionicons name="bookmark-outline" size={14} color={colors.text} />
                  }
                />
                <AppButton
                  label="Discuss"
                  size="sm"
                  iconLeft={
                    <Ionicons name="chatbubble-outline" size={14} color={colors.text} />
                  }
                />
              </View>
            </View>
          </View>

          {genreChips.length ? (
            <View style={styles.genreRow}>
              {genreChips.map((chip) => (
                <Chip key={chip} label={chip} tone="muted" />
              ))}
            </View>
          ) : null}

          <View style={styles.metricGrid}>
            <MetricCard label="Rank" value={rank ? `#${rank}` : "Unranked"} />
            <MetricCard label="Votes" value={voteCount.toLocaleString()} />
            <MetricCard label="Author" value={detail?.author || "Unknown"} />
            <MetricCard label="Artist" value={detail?.artist || "Unknown"} />
          </View>

          <Surface style={styles.infoCard}>
            <AppText variant="label" tone="muted">
              Synopsis
            </AppText>
            <AppText style={styles.infoBody}>
              {detail?.synopsis?.trim() ||
                "Synopsis has not been added yet. The ranking summary is still available above."}
            </AppText>
          </Surface>

          <SectionHeader
            eyebrow="Rating Breakdown"
            title="How readers rate this series"
          />

          <View style={styles.breakdownGrid}>
            <BreakdownCard
              label="Story"
              score={storyScore}
              votes={detail?.vote_counts?.Story ?? 0}
            />
            <BreakdownCard
              label="Characters"
              score={characterScore}
              votes={detail?.vote_counts?.Characters ?? 0}
            />
            <BreakdownCard
              label="World Building"
              score={worldScore}
              votes={detail?.vote_counts?.["World Building"] ?? 0}
            />
            <BreakdownCard
              label="Art"
              score={artScore}
              votes={detail?.vote_counts?.Art ?? 0}
            />
            <BreakdownCard
              label="Drama / Fighting"
              score={dramaScore}
              votes={detail?.vote_counts?.["Drama / Fighting"] ?? 0}
            />
          </View>

          <View style={styles.voteSection}>
            <SectionHeader eyebrow="Community Voting" title="Rate this series" />

            <Surface
              variant={isSignedIn ? "default" : "warning"}
              style={styles.voteNotice}
            >
              <Ionicons
                name={isSignedIn ? "information-circle-outline" : "lock-closed-outline"}
                size={18}
                color={isSignedIn ? colors.accentStrong : colors.warningText}
              />
              <AppText
                tone={isSignedIn ? "muted" : "warning"}
                style={styles.voteNoticeText}
              >
                {isSignedIn
                  ? "Each category can be rated once. After you submit a score, that choice is locked in."
                  : "Log in with your Toon Ranks account to rate this series."}
              </AppText>
            </Surface>

            {voteCategories.map((label) => (
              <VoteCategoryCard
                key={label}
                label={label}
                description={voteCategoryDescriptions[label]}
                selectedScore={getUserVoteForCategory(detail, label)}
                disabled={!isSignedIn}
                isSubmitting={voteMutation.isPending}
                onVote={handleVote}
              />
            ))}
          </View>
        </>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  heroShell: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 360,
    overflow: "hidden",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceRaised,
    ...shadows.card,
  },
  heroImage: {
    width: "100%",
    aspectRatio: 3 / 2,
    backgroundColor: colors.surface,
  },
  heroFallback: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  retryCard: {
    gap: spacing.md,
  },
  retryText: {
    gap: spacing.xs,
  },
  metaPanel: {
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  genreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  scoreCard: {
    flex: 1,
    minWidth: 132,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 4,
  },
  scoreActionRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.sm,
  },
  quickActions: {
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metricCard: {
    minWidth: "47%",
    flexGrow: 1,
    gap: spacing.xs,
  },
  metricValueHighlight: {
    color: colors.text,
  },
  infoCard: {
    gap: spacing.sm,
  },
  infoBody: {
    fontSize: 16,
    lineHeight: 28,
  },
  breakdownGrid: {
    gap: spacing.sm,
  },
  breakdownCard: {
    gap: spacing.xs,
  },
  breakdownTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  voteSection: {
    gap: spacing.md,
  },
  voteNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  voteNoticeText: {
    flex: 1,
    minWidth: 0,
  },
  voteCard: {
    gap: spacing.md,
  },
  voteHeaderText: {
    gap: spacing.xs,
  },
  voteTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  votedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  scoreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  scoreButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSoft,
  },
  scoreButtonSelected: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentStrong,
  },
  scoreButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  scoreButtonDisabled: {
    opacity: 0.58,
  },
  scoreButtonText: {
    fontWeight: "900",
    color: colors.textMuted,
  },
  scoreButtonTextSelected: {
    fontWeight: "900",
    color: colors.background,
  },
});
