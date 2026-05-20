import { Image, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { RouteProp, useRoute } from "@react-navigation/native";

import { getSeriesDetail, getSeriesSummary } from "../api/series";
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

type SeriesDetailRoute = RouteProp<RootStackParamList, "SeriesDetail">;

type VoteCategory =
  | "Story"
  | "Characters"
  | "World Building"
  | "Art"
  | "Drama / Fighting";

const voteCategoryDescriptions: Record<VoteCategory, string> = {
  Story: "Evaluate how engaging and well-paced the plot is.",
  Characters: "Rate the uniqueness, depth, and development of the characters.",
  "World Building": "Is the universe immersive, consistent, and imaginative?",
  Art: "Judge the quality of the artwork, paneling, and style.",
  "Drama / Fighting":
    "For drama: emotional depth. For action: excitement and choreography.",
};

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

function VotePreviewCard({
  label,
  description,
}: {
  label: VoteCategory;
  description: string;
}) {
  return (
    <Surface variant="raised" style={styles.voteCard}>
      <View style={styles.voteHeaderText}>
        <AppText variant="cardTitle">{label}</AppText>
        <AppText tone="muted">{description}</AppText>
      </View>
      <View style={styles.voteScalePreview}>
        <View style={styles.voteScaleFill} />
      </View>
    </Surface>
  );
}

export function SeriesDetailScreen() {
  const route = useRoute<SeriesDetailRoute>();
  const summaryQuery = useQuery({
    queryKey: ["series-summary", route.params.seriesId],
    queryFn: () => getSeriesSummary(route.params.seriesId),
  });
  const detailQuery = useQuery({
    queryKey: ["series-detail", route.params.seriesId],
    queryFn: () => getSeriesDetail(route.params.seriesId),
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

            <Surface variant="warning" style={styles.voteNotice}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.warningText} />
              <AppText tone="warning">
                Sign in to vote, save titles, and join discussion when account support is
                connected.
              </AppText>
            </Surface>

            {(Object.entries(voteCategoryDescriptions) as [VoteCategory, string][]).map(
              ([label, description]) => (
                <VotePreviewCard key={label} label={label} description={description} />
              ),
            )}
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
  voteCard: {
    gap: spacing.md,
  },
  voteHeaderText: {
    gap: spacing.xs,
  },
  voteScalePreview: {
    height: 8,
    overflow: "hidden",
    borderRadius: radii.pill,
    backgroundColor: colors.backgroundSoft,
  },
  voteScaleFill: {
    width: "65%",
    height: "100%",
    borderRadius: radii.pill,
    backgroundColor: colors.accentStrong,
  },
});
