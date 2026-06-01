import { useMemo } from "react";
import {
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
import {
  AppButton,
  AppText,
  CoverImage,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  ScreenShell,
  Surface,
} from "../components";
import { useCompare } from "../context/CompareContext";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import { compactGenre, formatAverage, formatScore } from "../utils/seriesFormatting";

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

function getScoreTone(score?: number | null) {
  const numericScore = Number(score || 0);
  if (numericScore >= 8) return colors.success;
  if (numericScore >= 7.5) return colors.accentStrong;
  if (numericScore >= 5) return colors.warning;
  return colors.danger;
}

function RowLabel({ text }: { text: string }) {
  const styles = getStyles();
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
  const styles = getStyles();
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
  const styles = getStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
      rightSlot={
        compareItems.length ? (
          <AppButton label="Clear" size="sm" variant="ghost" onPress={clearCompare} />
        ) : null
      }
    >
      {!compareItems.length ? (
        <EmptyState
          title="Pick titles to compare"
          message="Use Compare on Home or Search to build a side-by-side board."
        />
      ) : (
        <>
          {loading ? <LoadingState message="Loading comparison..." /> : null}

          {hasError ? (
            <ErrorState message="Some comparison details could not be loaded right now. Try again in a moment." />
          ) : null}

          <View style={styles.boardShell}>
            <View style={styles.boardHeader}>
              <View style={styles.boardHeading}>
                <AppText variant="label" tone="muted">
                  Compare board
                </AppText>
                <AppText variant="sectionTitle">Side by side</AppText>
              </View>
              <View style={styles.headerBadges}>
                <Surface variant="accent" radius="md" padding="sm">
                  <AppText variant="caption">{compareItems.length} selected</AppText>
                </Surface>
                {shouldScroll ? (
                  <View style={styles.scrollBadge}>
                    <Ionicons name="swap-horizontal" size={14} color={colors.textMuted} />
                    <AppText variant="caption" tone="muted">
                      Swipe
                    </AppText>
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
                        <IconButton
                          label={`Remove ${summary.title}`}
                          icon="close"
                          onPress={() => toggleCompare(summary)}
                          style={styles.removeIconButton}
                          size={28}
                        />

                        <Pressable
                          onPress={() =>
                            navigation.navigate("SeriesDetail", { seriesId: summary.id })
                          }
                          style={({ pressed }) => [
                            styles.headerCoverWrap,
                            pressed ? styles.dimmed : null,
                          ]}
                        >
                          <CoverImage
                            uri={summary.cover_url}
                            style={styles.headerCover}
                            fallbackIconSize={24}
                          />
                        </Pressable>

                        <View style={styles.scoreRow}>
                          <Text style={styles.scoreLabel}>Rating</Text>
                          <Text style={[styles.scoreValue, { color: scoreColor }]}>
                            {formatScore(summary.final_score)}
                          </Text>
                        </View>

                        <Pressable
                          onPress={() =>
                            navigation.navigate("SeriesDetail", { seriesId: summary.id })
                          }
                          style={({ pressed }) => [
                            styles.headerMetaWrap,
                            pressed ? styles.dimmed : null,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Open ${summary.title}`}
                          accessibilityHint="Opens the title detail screen"
                        >
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
                        </Pressable>
                      </View>
                    );
                  })}
                </View>

                <Surface style={[styles.sectionBlock, { width: matrixWidth }]}>
                  <AppText variant="cardTitle">Snapshot</AppText>

                  <View style={styles.dataRow}>
                    <RowLabel text="Overall" />
                    {comparedItems.map(({ summary }) => (
                      <ValueCell key={`overall-${summary.id}`} width={columnWidth} accent>
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
                </Surface>

                <Surface style={[styles.sectionBlock, { width: matrixWidth }]}>
                  <AppText variant="cardTitle">Creators</AppText>

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
                </Surface>

                <Surface style={[styles.sectionBlock, { width: matrixWidth }]}>
                  <AppText variant="cardTitle">Category scores</AppText>

                  {compareLabels.map(({ key, label }) => (
                    <View key={key} style={styles.dataRow}>
                      <RowLabel text={label} />
                      {comparedItems.map(({ detail, summary }) => (
                        <ValueCell key={`${summary.id}-${key}`} width={columnWidth}>
                          {formatAverage(
                            detail?.[`${key}_total` as keyof typeof detail] as
                              | number
                              | undefined,
                            detail?.[`${key}_count` as keyof typeof detail] as
                              | number
                              | undefined,
                          )}
                        </ValueCell>
                      ))}
                    </View>
                  ))}
                </Surface>
              </View>
            </ScrollView>
          </View>
        </>
      )}
    </ScreenShell>
  );
}

function getStyles() {
  return StyleSheet.create({
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
  headerBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
}
