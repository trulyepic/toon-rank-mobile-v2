import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { RouteProp, useRoute } from "@react-navigation/native";

import { getSeriesDetail, getSeriesSummary } from "../api/series";
import { ScreenShell } from "../components/ScreenShell";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";

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
  "Drama / Fighting": "For drama: emotional depth. For action: excitement and choreography.",
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
    <View style={[styles.metricCard, highlight ? styles.metricCardHighlight : null]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, highlight ? styles.metricValueHighlight : null]}>
        {value}
      </Text>
    </View>
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
    <View style={styles.breakdownCard}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={styles.breakdownScore}>{score > 0 ? score.toFixed(1) : "-"}</Text>
      <Text style={styles.breakdownVotes}>
        {votes > 0 ? `${votes} votes` : "No votes yet"}
      </Text>
    </View>
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
    <View style={styles.voteCard}>
      <View style={styles.voteCardHeader}>
        <View style={styles.voteHeaderText}>
          <Text style={styles.voteTitle}>{label}</Text>
          <Text style={styles.voteDescription}>{description}</Text>
        </View>
        <View style={styles.votePillRow}>
          {Array.from({ length: 10 }, (_, index) => (
            <View key={index} style={styles.votePill}>
              <Text style={styles.votePillText}>{index + 1}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
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
  const isError = summaryQuery.isError || detailQuery.isError;

  const summary = summaryQuery.data;
  const detail = detailQuery.data;

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

  return (
    <ScreenShell
      title={summary?.title || detail?.title || "Series detail"}
      subtitle="Scan the cover, rank, scores, synopsis, and reader voting breakdown."
    >
      {isLoading ? <ActivityIndicator color={colors.accent} /> : null}

      {isError ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            We couldn&apos;t load this title right now. Check your connection and try again.
          </Text>
        </View>
      ) : null}

      {summary && detail ? (
        <>
          {heroImage ? (
            <View style={styles.heroShell}>
              <Image source={{ uri: heroImage }} style={styles.heroImage} />
            </View>
          ) : null}

          <View style={styles.titleRow}>
            <View style={styles.titleCol}>
              <View style={styles.chipRow}>
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>{summary.type}</Text>
                </View>
                {summary.status ? (
                  <View style={[styles.metaChip, styles.statusChip]}>
                    <Text style={styles.metaChipText}>
                      {summary.status.replace("_", " ")}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.seriesTitle}>{summary.title}</Text>

              {genreChips.length ? (
                <View style={styles.genreRow}>
                  {genreChips.map((chip) => (
                    <View key={chip} style={styles.genreChip}>
                      <Text style={styles.genreChipText}>{chip}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.avgCard}>
              <Text style={styles.avgLabel}>Avg. rating</Text>
              <Text style={styles.avgScore}>
                {Number(summary.final_score || 0).toFixed(1)}
              </Text>
              <Text style={styles.avgCaption}>out of 10</Text>
            </View>
          </View>

          <View style={styles.metricGrid}>
            <MetricCard
              label="Rank"
              value={summary.rank ? `#${summary.rank}` : "Unranked"}
            />
            <MetricCard label="Votes" value={summary.vote_count.toLocaleString()} />
            <MetricCard label="Author" value={detail.author || "Unknown"} />
            <MetricCard label="Artist" value={detail.artist || "Unknown"} />
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Synopsis</Text>
            <Text style={styles.infoBody}>
              {detail.synopsis?.trim() || "Synopsis coming soon."}
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>Rating Breakdown</Text>
            <Text style={styles.sectionTitle}>How readers rate this series</Text>
          </View>

          <View style={styles.breakdownGrid}>
            <BreakdownCard
              label="Story"
              score={storyScore}
              votes={detail.vote_counts?.Story ?? 0}
            />
            <BreakdownCard
              label="Characters"
              score={characterScore}
              votes={detail.vote_counts?.Characters ?? 0}
            />
            <BreakdownCard
              label="World Building"
              score={worldScore}
              votes={detail.vote_counts?.["World Building"] ?? 0}
            />
            <BreakdownCard
              label="Art"
              score={artScore}
              votes={detail.vote_counts?.Art ?? 0}
            />
            <BreakdownCard
              label="Drama / Fighting"
              score={dramaScore}
              votes={detail.vote_counts?.["Drama / Fighting"] ?? 0}
            />
          </View>

          <View style={styles.voteSection}>
            <View style={styles.voteSectionHeader}>
              <Text style={styles.sectionEyebrow}>Community Voting</Text>
              <Text style={styles.sectionTitle}>Rate this series</Text>
            </View>

            <View style={styles.voteNotice}>
              <Text style={styles.voteNoticeText}>
                Sign-in voting will use the same categories and one-vote-per-category flow
                as Toon Ranks on the web.
              </Text>
            </View>

            {(Object.entries(voteCategoryDescriptions) as [VoteCategory, string][]).map(
              ([label, description]) => (
                <VotePreviewCard
                  key={label}
                  label={label}
                  description={description}
                />
              ),
            )}
          </View>
        </>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  notice: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  noticeText: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  heroShell: {
    overflow: "hidden",
    borderRadius: radii.hero,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  heroImage: {
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: colors.surface,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  titleCol: {
    flex: 1,
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metaChip: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusChip: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  metaChipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  seriesTitle: {
    color: colors.text,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "800",
  },
  genreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  genreChip: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  genreChipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  avgCard: {
    width: 132,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 24,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  avgLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    fontWeight: "700",
  },
  avgScore: {
    color: colors.text,
    fontSize: 36,
    fontWeight: "800",
  },
  avgCaption: {
    color: colors.textMuted,
    fontSize: 13,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metricCard: {
    minWidth: "47%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: spacing.md,
    gap: spacing.xs,
  },
  metricCardHighlight: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    fontWeight: "700",
  },
  metricValue: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },
  metricValueHighlight: {
    color: colors.text,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: spacing.md,
    gap: spacing.sm,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  infoBody: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 28,
  },
  sectionHeader: {
    gap: spacing.xs,
  },
  sectionEyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.3,
    fontWeight: "700",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
  },
  breakdownGrid: {
    gap: spacing.sm,
  },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: spacing.md,
    gap: 4,
  },
  breakdownLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  breakdownScore: {
    color: colors.accentStrong,
    fontSize: 28,
    fontWeight: "800",
  },
  breakdownVotes: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  voteSection: {
    gap: spacing.md,
  },
  voteSectionHeader: {
    gap: spacing.xs,
  },
  voteNotice: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    backgroundColor: colors.warningSurface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  voteNoticeText: {
    color: colors.warningText,
    fontSize: 14,
    lineHeight: 22,
  },
  voteCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: spacing.md,
  },
  voteCardHeader: {
    gap: spacing.md,
  },
  voteHeaderText: {
    gap: spacing.xs,
  },
  voteTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  voteDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  votePillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  votePill: {
    width: 38,
    height: 38,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  votePillText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
});
