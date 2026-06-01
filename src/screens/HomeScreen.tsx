import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";

import { fetchRankings } from "../api/series";
import {
  AppButton,
  AppText,
  CoverImage,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenShell,
} from "../components";
import { useCompare } from "../context/CompareContext";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, shadows, spacing, typography } from "../theme/tokens";
import type { RankedSeries, SeriesType } from "../types/series";

const titleTypeFilters = ["All", "Manga", "Manhwa", "Manhua"] as const;
type TitleTypeFilter = (typeof titleTypeFilters)[number];
const HOME_RANKINGS_PAGE_SIZE = 20;

function getTypeParam(filter: TitleTypeFilter): SeriesType | undefined {
  return filter === "All" ? undefined : (filter.toUpperCase() as SeriesType);
}

/** Derive a sorted, deduplicated list of genres from all loaded rankings. */
function deriveGenres(items: RankedSeries[]): string[] {
  const seen = new Set<string>();
  const genres: string[] = [];
  for (const item of items) {
    if (!item.genre) continue;
    // Genres may be stored as "Action, Fantasy" — split and treat each separately.
    for (const raw of item.genre.split(",")) {
      const g = raw.trim();
      if (!g) continue;
      // Normalise to title-case for display (e.g. "action" → "Action").
      const display = g.charAt(0).toUpperCase() + g.slice(1).toLowerCase();
      if (!seen.has(display)) {
        seen.add(display);
        genres.push(display);
      }
    }
  }
  return genres.sort();
}

function getScoreTone(score: number) {
  if (score >= 8) return colors.success;
  if (score >= 7.5) return colors.accentStrong;
  if (score >= 5) return colors.warning;
  return colors.danger;
}

function HomeCard({
  item,
  onPress,
  selectedForCompare,
  canAddMore,
  onToggleCompare,
}: {
  item: RankedSeries;
  onPress: () => void;
  selectedForCompare: boolean;
  canAddMore: boolean;
  onToggleCompare: () => void;
}) {
  const styles = getStyles();
  const score = Number(item.final_score || 0).toFixed(1);
  const compareDisabled = !selectedForCompare && !canAddMore;

  return (
    <View style={styles.posterCard}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => (pressed ? styles.posterCardPressed : null)}
        accessibilityRole="button"
        accessibilityLabel={`Open details for ${item.title}`}
      >
        <View style={styles.posterWrap}>
          <CoverImage
            uri={item.cover_url}
            style={styles.posterImage}
            fallbackIconSize={20}
          />
          {item.rank ? (
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>#{item.rank}</Text>
            </View>
          ) : null}
          <View style={styles.scoreBadge}>
            <Text style={[styles.scoreBadgeText, { color: getScoreTone(Number(score)) }]}>
              {score}
            </Text>
          </View>
        </View>

        <View style={styles.posterMeta}>
          <Text numberOfLines={2} style={styles.posterTitle}>
            {item.title}
          </Text>
          <View style={styles.posterMetaRow}>
            <Text style={styles.posterType}>{item.type}</Text>
            <Text style={styles.posterVotes}>
              {item.vote_count.toLocaleString()} votes
            </Text>
          </View>
        </View>
      </Pressable>

      <AppButton
        onPress={onToggleCompare}
        size="sm"
        disabled={compareDisabled}
        selected={selectedForCompare}
        label={selectedForCompare ? "Selected" : compareDisabled ? "Max 4" : "Compare"}
        iconLeft={
          <Ionicons
            name={selectedForCompare ? "checkmark" : "git-compare-outline"}
            size={14}
            color={colors.text}
          />
        }
        style={styles.compareButton}
      />
    </View>
  );
}

export function HomeScreen() {
  const styles = getStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { canAddMore, compareItems, isSelected, toggleCompare } = useCompare();
  const [activeType, setActiveType] = useState<TitleTypeFilter>("All");
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

  const rankingsQuery = useInfiniteQuery({
    queryKey: ["rankings", activeType, activeGenre],
    queryFn: ({ pageParam }) =>
      fetchRankings(
        pageParam,
        HOME_RANKINGS_PAGE_SIZE,
        getTypeParam(activeType),
        activeGenre ?? undefined,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === HOME_RANKINGS_PAGE_SIZE ? allPages.length + 1 : undefined,
  });
  const rankings = rankingsQuery.data?.pages.flat() ?? [];
  const genres = deriveGenres(rankings);

  return (
    <ScreenShell
      title="Toon Ranks"
      rightSlot={
        compareItems.length ? (
          <View style={styles.headerCounter}>
            <Ionicons name="git-compare-outline" size={14} color={colors.text} />
            <Text style={styles.headerCounterText}>{compareItems.length}</Text>
          </View>
        ) : null
      }
    >
      {rankingsQuery.isLoading ? <LoadingState message="Loading rankings..." /> : null}
      {rankingsQuery.isError ? (
        <ErrorState message="Rankings failed to load. Check your connection and try again in a moment." />
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typeRail}
      >
        {titleTypeFilters.map((filter) => {
          const selected = activeType === filter;

          return (
            <Pressable
              key={filter}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                setActiveType(filter);
                setActiveGenre(null);
              }}
              style={({ pressed }) => [
                styles.segmentButton,
                selected ? styles.segmentButtonActive : null,
                pressed ? styles.segmentButtonPressed : null,
              ]}
            >
              {selected ? <View style={styles.typeDot} /> : null}
              <AppText
                variant="caption"
                tone={selected ? "primary" : "muted"}
                style={styles.typeButtonText}
              >
                {filter}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {genres.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreRail}
        >
          {genres.map((genre) => {
            const selected = activeGenre === genre;
            return (
              <Pressable
                key={genre}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setActiveGenre(selected ? null : genre)}
                style={({ pressed }) => [
                  styles.genrePill,
                  selected ? styles.genrePillActive : null,
                  pressed ? styles.segmentButtonPressed : null,
                ]}
              >
                <AppText variant="caption" tone={selected ? "primary" : "muted"}>
                  {genre}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <FlatList
        data={rankings}
        keyExtractor={(item) => String(item.id)}
        scrollEnabled={false}
        numColumns={2}
        columnWrapperStyle={styles.columnWrap}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <HomeCard
            item={item}
            onPress={() => navigation.navigate("SeriesDetail", { seriesId: item.id })}
            selectedForCompare={isSelected(item.id)}
            canAddMore={canAddMore}
            onToggleCompare={() => toggleCompare(item)}
          />
        )}
        ListEmptyComponent={
          !rankingsQuery.isLoading && !rankingsQuery.isError ? (
            <EmptyState
              title={
                activeGenre
                  ? `No ${activeGenre} titles`
                  : activeType !== "All"
                    ? `No ${activeType} yet`
                    : undefined
              }
              message={
                activeGenre
                  ? "Try a different genre or clear the genre filter."
                  : activeType !== "All"
                    ? "Try another type filter or check back after more titles are ranked."
                    : "No rankings are available yet. Check back soon for ranked titles."
              }
            />
          ) : null
        }
        ListFooterComponent={
          rankings.length ? (
            <View style={styles.listFooter}>
              {rankingsQuery.hasNextPage ? (
                <AppButton
                  label={rankingsQuery.isFetchingNextPage ? "Loading..." : "Load more"}
                  disabled={rankingsQuery.isFetchingNextPage}
                  onPress={() => rankingsQuery.fetchNextPage()}
                  iconRight={
                    <Ionicons name="chevron-down" size={15} color={colors.text} />
                  }
                />
              ) : (
                <AppText variant="caption" tone="subtle" align="center">
                  {activeGenre
                    ? `All ${activeGenre} titles loaded.`
                    : activeType === "All"
                      ? "You are caught up."
                      : `All loaded for ${activeType}.`}
                </AppText>
              )}
            </View>
          ) : null
        }
      />
    </ScreenShell>
  );
}

function getStyles() {
  return StyleSheet.create({
    listContent: {
      gap: spacing.md,
    },
    listFooter: {
      paddingTop: spacing.sm,
    },
    columnWrap: {
      gap: spacing.md,
    },
    typeRail: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingRight: spacing.md,
    },
    genreRail: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingRight: spacing.md,
    },
    genrePill: {
      minHeight: 32,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.backgroundSoft,
      borderColor: colors.borderSoft,
      borderWidth: 1,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.sm,
    },
    genrePillActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accentBorder,
    },
    segmentButton: {
      minHeight: 38,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: spacing.xs,
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.borderSoft,
      borderWidth: 1,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.md,
    },
    segmentButtonActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accentBorder,
    },
    segmentButtonPressed: {
      opacity: 0.88,
    },
    typeButtonText: {
      fontWeight: "800",
    },
    typeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accentStrong,
    },
    posterCard: {
      flex: 1,
      minWidth: 0,
      gap: spacing.sm,
      padding: 6,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.surfaceRaised,
    },
    posterWrap: {
      position: "relative",
      overflow: "hidden",
      borderRadius: radii.xl,
      backgroundColor: "transparent",
      ...shadows.card,
    },
    posterImage: {
      width: "100%",
      aspectRatio: 2 / 3,
      backgroundColor: colors.surface,
    },
    posterFallback: {
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.md,
      backgroundColor: colors.accentSoft,
    },
    posterFallbackText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
      textAlign: "center",
    },
    rankBadge: {
      position: "absolute",
      left: spacing.sm,
      top: spacing.sm,
      borderRadius: radii.pill,
      backgroundColor: colors.overlay,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    rankBadgeText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "800",
    },
    scoreBadge: {
      position: "absolute",
      right: spacing.sm,
      top: spacing.sm,
      borderRadius: radii.pill,
      backgroundColor: colors.backgroundSoft,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    scoreBadgeText: {
      fontSize: 12,
      fontWeight: "800",
    },
    compareButton: {
      marginTop: spacing.xs,
      alignSelf: "flex-start",
    },
    posterCardPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.992 }],
    },
    posterMeta: {
      gap: spacing.xs,
      paddingHorizontal: spacing.xs,
    },
    posterTitle: {
      color: colors.text,
      ...typography.cardTitle,
    },
    posterMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.xs,
    },
    posterType: {
      color: colors.accentStrong,
      fontSize: 11,
      lineHeight: 16,
      textTransform: "uppercase",
      letterSpacing: 0.7,
      fontWeight: "800",
    },
    posterVotes: {
      color: colors.textMuted,
      fontSize: 11,
      lineHeight: 16,
      textTransform: "uppercase",
      letterSpacing: 0.7,
      fontWeight: "600",
    },
    headerCounter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: radii.pill,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    headerCounterText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "800",
    },
  });
}
