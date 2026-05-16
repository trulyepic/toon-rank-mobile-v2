import { useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useQueries } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { getSeriesDetail } from "../api/series";
import { ScreenShell } from "../components/ScreenShell";
import { useCompare } from "../context/CompareContext";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";

const compareLabels = [
  { key: "story", label: "Story" },
  { key: "characters", label: "Characters" },
  { key: "worldbuilding", label: "World Building" },
  { key: "art", label: "Art" },
  { key: "drama_or_fight", label: "Drama / Fighting" },
] as const;

const LABEL_COLUMN_WIDTH = 92;
const MIN_VALUE_COLUMN_WIDTH = 132;
const MIN_HEADER_COLUMN_WIDTH = 148;

function formatAverage(total?: number, count?: number) {
  if (!total || !count) return "-";
  return (total / count).toFixed(1);
}

function formatScore(score?: number | null) {
  if (score == null || Number.isNaN(Number(score))) return "-";
  return Number(score).toFixed(1);
}

function getScoreTone(score?: number | null) {
  const numericScore = Number(score || 0);
  if (numericScore >= 8) return colors.success;
  if (numericScore >= 7.5) return colors.accentStrong;
  if (numericScore >= 5) return colors.warning;
  return colors.danger;
}

function compactGenre(genre?: string) {
  if (!genre) return "-";
  return genre
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(" / ");
}

function RowLabel({ text }: { text: string }) {
  return (
    <View style={[styles.labelCell, { width: LABEL_COLUMN_WIDTH }]}>
      <Text style={styles.labelCellText}>{text}</Text>
    </View>
  );
}

function ValueCell({
  children,
  width,
  muted = false,
  accent = false,
}: {
  children: React.ReactNode;
  width: number;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <View style={[styles.valueCell, { width }]}>
      <Text
        style={[
          styles.valueCellText,
          muted ? styles.valueCellMuted : null,
          accent ? styles.valueCellAccent : null,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

export function CompareScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width: screenWidth } = useWindowDimensions();
  const { compareItems, clearCompare, toggleCompare } = useCompare();

  const detailQueries = useQueries({
    queries: compareItems.map((item) => ({
      queryKey: ["compare-series-detail", item.id],
      queryFn: () => getSeriesDetail(item.id),
    })),
  });

  const loading = detailQueries.some((query) => query.isLoading);
  const hasError = detailQueries.some((query) => query.isError);

  const comparedItems = useMemo(
    () =>
      compareItems.map((item, index) => ({
        summary: item,
        detail: detailQueries[index]?.data,
      })),
    [compareItems, detailQueries],
  );

  const availableWidth = Math.max(screenWidth - spacing.md * 2, 320);
  const innerWidth = availableWidth - spacing.md * 2;
  const gapsWidth = comparedItems.length * spacing.sm;
  const naturalColumnWidth =
    comparedItems.length > 0
      ? (innerWidth - LABEL_COLUMN_WIDTH - gapsWidth) / comparedItems.length
      : MIN_VALUE_COLUMN_WIDTH;
  const columnWidth =
    comparedItems.length <= 2
      ? Math.max(naturalColumnWidth, MIN_HEADER_COLUMN_WIDTH)
      : Math.max(naturalColumnWidth, MIN_VALUE_COLUMN_WIDTH);
  const rowWidth = LABEL_COLUMN_WIDTH + comparedItems.length * columnWidth + gapsWidth;
  const matrixWidth = rowWidth + spacing.md * 2;
  const shouldScroll = matrixWidth > availableWidth + 4;

  return (
    <ScreenShell
      title="Compare"
      subtitle="Build a side-by-side board for titles you want to judge quickly at a glance."
      rightSlot={
        compareItems.length ? (
          <Pressable onPress={clearCompare} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
        ) : null
      }
    >
      {!compareItems.length ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Pick at least two titles</Text>
          <Text style={styles.emptyText}>
            Use the Compare button on Home or Search to build a small side-by-side list here.
          </Text>
        </View>
      ) : (
        <>
          {loading ? <ActivityIndicator color={colors.accent} /> : null}

          {hasError ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                Some comparison details could not be loaded right now. Try again in a moment.
              </Text>
            </View>
          ) : null}

          <View style={styles.boardShell}>
            <View style={styles.boardHeader}>
              <View style={styles.boardHeading}>
                <Text style={styles.boardEyebrow}>Compare board</Text>
                <Text style={styles.boardTitle}>Side by side</Text>
              </View>
              <View style={styles.headerBadges}>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {compareItems.length} selected
                  </Text>
                </View>
                {shouldScroll ? (
                  <View style={styles.scrollBadge}>
                    <Ionicons name="swap-horizontal" size={14} color={colors.textMuted} />
                    <Text style={styles.scrollBadgeText}>Swipe</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={shouldScroll}
              bounces={shouldScroll}
              contentContainerStyle={styles.matrixScrollContent}
            >
              <View style={[styles.matrix, { width: matrixWidth }]}>
                <View style={styles.matrixHeaderRow}>
                  <View style={[styles.headerSpacer, { width: LABEL_COLUMN_WIDTH }]} />
                  {comparedItems.map(({ summary }) => {
                    const scoreColor = getScoreTone(summary.final_score);

                    return (
                      <View
                        key={`header-${summary.id}`}
                        style={[styles.headerCard, { width: columnWidth }]}
                      >
                        <Pressable
                          onPress={() => toggleCompare(summary)}
                          style={styles.removeIconButton}
                        >
                          <Ionicons name="close" size={14} color={colors.text} />
                        </Pressable>

                        <Pressable
                          onPress={() =>
                            navigation.navigate("SeriesDetail", { seriesId: summary.id })
                          }
                          style={({ pressed }) => [
                            styles.headerCoverWrap,
                            pressed ? styles.dimmed : null,
                          ]}
                        >
                          {summary.cover_url ? (
                            <Image source={{ uri: summary.cover_url }} style={styles.headerCover} />
                          ) : (
                            <View style={[styles.headerCover, styles.posterFallback]}>
                              <Text style={styles.posterFallbackText}>{summary.title}</Text>
                            </View>
                          )}
                        </Pressable>

                        <View style={styles.scoreRow}>
                          <Text style={styles.scoreLabel}>Rating</Text>
                          <Text style={[styles.scoreValue, { color: scoreColor }]}>
                            {formatScore(summary.final_score)}
                          </Text>
                        </View>

                      <View style={styles.headerMetaWrap}>
                        <Text numberOfLines={2} style={styles.headerTitle}>
                          {summary.title}
                        </Text>
                        <View style={styles.headerChipRow}>
                          <View style={styles.headerChip}>
                            <Text style={styles.headerChipText}>{summary.type}</Text>
                          </View>
                          {summary.status ? (
                            <View style={[styles.headerChip, styles.headerChipMuted]}>
                              <Text style={styles.headerChipMutedText}>
                                {summary.status.replace("_", " ")}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>
                    );
                  })}
                </View>

                <View style={[styles.sectionBlock, { width: matrixWidth }]}>
                  <Text style={styles.sectionTitle}>Snapshot</Text>

                  <View style={styles.dataRow}>
                    <RowLabel text="Overall" />
                    {comparedItems.map(({ summary }) => (
                      <ValueCell
                        key={`overall-${summary.id}`}
                        width={columnWidth}
                        accent
                      >
                        {formatScore(summary.final_score)}
                      </ValueCell>
                    ))}
                  </View>

                  <View style={styles.dataRow}>
                    <RowLabel text="Rank" />
                    {comparedItems.map(({ summary }) => (
                      <ValueCell key={`rank-${summary.id}`} width={columnWidth}>
                        {summary.rank ? `#${summary.rank}` : "Unranked"}
                      </ValueCell>
                    ))}
                  </View>

                  <View style={styles.dataRow}>
                    <RowLabel text="Votes" />
                    {comparedItems.map(({ summary }) => (
                      <ValueCell key={`votes-${summary.id}`} width={columnWidth}>
                        {summary.vote_count}
                      </ValueCell>
                    ))}
                  </View>

                  <View style={styles.dataRow}>
                    <RowLabel text="Genre" />
                    {comparedItems.map(({ detail, summary }) => (
                      <ValueCell key={`genre-${summary.id}`} width={columnWidth} muted>
                        {compactGenre(detail?.genre || summary.genre)}
                      </ValueCell>
                    ))}
                  </View>
                </View>

                <View style={[styles.sectionBlock, { width: matrixWidth }]}>
                  <Text style={styles.sectionTitle}>Creators</Text>

                  <View style={styles.dataRow}>
                    <RowLabel text="Author" />
                    {comparedItems.map(({ detail, summary }) => (
                      <ValueCell key={`author-${summary.id}`} width={columnWidth} muted>
                        {detail?.author || summary.author || "Unknown"}
                      </ValueCell>
                    ))}
                  </View>

                  <View style={styles.dataRow}>
                    <RowLabel text="Artist" />
                    {comparedItems.map(({ detail, summary }) => (
                      <ValueCell key={`artist-${summary.id}`} width={columnWidth} muted>
                        {detail?.artist || summary.artist || "Unknown"}
                      </ValueCell>
                    ))}
                  </View>
                </View>

                <View style={[styles.sectionBlock, { width: matrixWidth }]}>
                  <Text style={styles.sectionTitle}>Category scores</Text>

                  {compareLabels.map(({ key, label }) => (
                    <View key={key} style={styles.dataRow}>
                      <RowLabel text={label} />
                      {comparedItems.map(({ detail, summary }) => (
                        <ValueCell key={`${summary.id}-${key}`} width={columnWidth}>
                          {formatAverage(
                            detail?.[`${key}_total` as keyof typeof detail] as number | undefined,
                            detail?.[`${key}_count` as keyof typeof detail] as number | undefined,
                          )}
                        </ValueCell>
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  clearButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
  },
  notice: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 24,
    padding: spacing.md,
  },
  noticeText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  boardShell: {
    gap: spacing.md,
  },
  boardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  boardHeading: {
    gap: 4,
    flex: 1,
  },
  boardEyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    fontWeight: "700",
  },
  boardTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
  },
  headerBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countBadge: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  countBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  scrollBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scrollBadgeText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  matrixScrollContent: {
    paddingBottom: 4,
  },
  matrix: {
    gap: spacing.md,
  },
  matrixHeaderRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.sm,
  },
  headerSpacer: {
    height: 1,
  },
  headerCard: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 24,
    padding: spacing.sm,
    gap: spacing.sm,
    position: "relative",
  },
  headerCoverWrap: {
    alignSelf: "center",
    overflow: "hidden",
    width: 96,
    maxWidth: "100%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSoft,
  },
  headerCover: {
    width: "100%",
    aspectRatio: 0.76,
    backgroundColor: colors.surface,
  },
  scoreRow: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  scoreValue: {
    fontSize: 13,
    fontWeight: "800",
  },
  posterFallback: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  posterFallbackText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  removeIconButton: {
    position: "absolute",
    right: spacing.sm,
    top: spacing.sm,
    zIndex: 2,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceRaised,
  },
  headerMetaWrap: {
    gap: 8,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
  headerChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  headerChip: {
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  headerChipText: {
    color: colors.text,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    fontWeight: "800",
  },
  headerChipMuted: {
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceRaised,
  },
  headerChipMutedText: {
    color: colors.textMuted,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    fontWeight: "800",
  },
  sectionBlock: {
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.backgroundSoft,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  dataRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  labelCell: {
    minHeight: 62,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
  },
  labelCellText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  valueCell: {
    minHeight: 62,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
  },
  valueCellText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
  valueCellMuted: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  valueCellAccent: {
    color: colors.accentStrong,
  },
  dimmed: {
    opacity: 0.9,
  },
});
