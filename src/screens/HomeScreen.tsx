import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";

import { fetchRankings, type SeriesSort } from "../api/series";
import { getMyReadingLists } from "../api/readingLists";
import {
  AppButton,
  AppText,
  CoverImage,
  EditSeriesModal,
  EmptyState,
  ErrorState,
  HomeFilterSheet,
  LoadingState,
  SaveToListSheet,
  ScreenShell,
  SeriesStatusBadge,
} from "../components";
import { useAuth } from "../auth/AuthContext";
import { useCompare } from "../context/CompareContext";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import type { RankedSeries } from "../types/series";
import {
  getTypeParam,
  isSeriesInAnyList,
  TITLE_TYPE_FILTERS,
  type TitleTypeFilter,
} from "../utils/seriesBrowse";
import { getSeriesStatusMeta, SERIES_STATUS_FILTERS } from "../utils/seriesStatus";

const HOME_RANKINGS_PAGE_SIZE = 20;

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
  showSave,
  saved,
  onSave,
  showEdit,
  onEdit,
}: {
  item: RankedSeries;
  onPress: () => void;
  selectedForCompare: boolean;
  canAddMore: boolean;
  onToggleCompare: () => void;
  showSave: boolean;
  saved: boolean;
  onSave: () => void;
  showEdit: boolean;
  onEdit: () => void;
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
          <View style={styles.statusBadge}>
            <SeriesStatusBadge status={item.status} />
          </View>
          {showEdit ? (
            <Pressable
              onPress={onEdit}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.title}`}
              style={({ pressed }) => [
                styles.editOverlayButton,
                pressed ? styles.editOverlayButtonPressed : null,
              ]}
            >
              <Ionicons name="create-outline" size={15} color={colors.text} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.posterMeta}>
          <AppText variant="caption" numberOfLines={1} style={styles.posterTitle}>
            {item.title}
          </AppText>
          <View style={styles.posterMetaRow}>
            <AppText variant="caption" tone="muted">
              {item.type}
            </AppText>
            <AppText variant="caption" tone="muted">
              {item.vote_count.toLocaleString()} votes
            </AppText>
          </View>
        </View>
      </Pressable>

      <View style={styles.cardActions}>
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
        {showSave ? (
          <Pressable
            onPress={onSave}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              saved
                ? `${item.title} is in a reading list. Manage lists`
                : `Save ${item.title} to a reading list`
            }
            style={({ pressed }) => [
              styles.saveIconButton,
              saved ? styles.saveIconButtonSaved : null,
              pressed ? styles.saveIconButtonPressed : null,
            ]}
          >
            <Ionicons
              name={saved ? "bookmark" : "bookmark-outline"}
              size={16}
              color={colors.accentStrong}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function HomeScreen() {
  const styles = getStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { canAddMore, compareItems, isSelected, toggleCompare } = useCompare();
  const { isSignedIn, user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [activeType, setActiveType] = useState<TitleTypeFilter>("All");
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState<SeriesSort>("score");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [saveSeriesId, setSaveSeriesId] = useState<number | null>(null);
  const [editSeriesItem, setEditSeriesItem] = useState<RankedSeries | null>(null);

  const rankingsQuery = useInfiniteQuery({
    queryKey: ["rankings", activeType, activeGenre, activeStatus, activeSort],
    queryFn: ({ pageParam }) =>
      fetchRankings(
        pageParam,
        HOME_RANKINGS_PAGE_SIZE,
        getTypeParam(activeType),
        activeGenre ?? undefined,
        activeStatus ?? undefined,
        activeSort,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === HOME_RANKINGS_PAGE_SIZE ? allPages.length + 1 : undefined,
  });
  const rankings = useMemo(
    () => rankingsQuery.data?.pages.flat() ?? [],
    [rankingsQuery.data?.pages],
  );
  const genres = useMemo(() => deriveGenres(rankings), [rankings]);

  // Accumulate every genre seen this session so the filter list only ever grows
  // and never collapses when an active filter narrows the loaded results.
  const [allGenres, setAllGenres] = useState<string[]>([]);
  useEffect(() => {
    setAllGenres((prev) => {
      const merged = new Set(prev);
      let changed = false;
      for (const g of genres) {
        if (!merged.has(g)) {
          merged.add(g);
          changed = true;
        }
      }
      return changed ? Array.from(merged).sort() : prev;
    });
  }, [genres]);

  const activeStatusLabel = SERIES_STATUS_FILTERS.find(
    (s) => s.value === activeStatus,
  )?.label;
  const activeFilterCount = (activeStatus ? 1 : 0) + (activeGenre ? 1 : 0);

  const readingListsQuery = useQuery({
    queryKey: ["reading-lists", "me"],
    queryFn: getMyReadingLists,
    enabled: isSignedIn,
  });

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
        {TITLE_TYPE_FILTERS.map((filter) => {
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open filters"
          onPress={() => setFiltersVisible(true)}
          style={({ pressed }) => [
            styles.filtersChip,
            activeFilterCount > 0 ? styles.filtersChipActive : null,
            pressed ? styles.segmentButtonPressed : null,
          ]}
        >
          <Ionicons name="options-outline" size={15} color={colors.text} />
          <AppText variant="caption" style={styles.filtersChipText}>
            Filters
          </AppText>
          {activeFilterCount > 0 ? (
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>

        {activeStatusLabel ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clear ${activeStatusLabel} status filter`}
            onPress={() => setActiveStatus(null)}
            style={({ pressed }) => [
              styles.activeFilterChip,
              pressed ? styles.segmentButtonPressed : null,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getSeriesStatusMeta(activeStatus)?.background },
              ]}
            />
            <AppText variant="caption" tone="primary">
              {activeStatusLabel}
            </AppText>
            <Ionicons name="close" size={13} color={colors.textMuted} />
          </Pressable>
        ) : null}

        {activeGenre ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clear ${activeGenre} genre filter`}
            onPress={() => setActiveGenre(null)}
            style={({ pressed }) => [
              styles.activeFilterChip,
              pressed ? styles.segmentButtonPressed : null,
            ]}
          >
            <AppText variant="caption" tone="primary">
              {activeGenre}
            </AppText>
            <Ionicons name="close" size={13} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </ScrollView>

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
            showSave={isSignedIn}
            saved={isSeriesInAnyList(readingListsQuery.data, item.id)}
            onSave={() => setSaveSeriesId(item.id)}
            showEdit={isAdmin}
            onEdit={() => setEditSeriesItem(item)}
          />
        )}
        ListEmptyComponent={
          !rankingsQuery.isLoading && !rankingsQuery.isError ? (
            <EmptyState
              title={
                activeStatusLabel
                  ? `No ${activeStatusLabel} titles`
                  : activeGenre
                    ? `No ${activeGenre} titles`
                    : activeType !== "All"
                      ? `No ${activeType} yet`
                      : undefined
              }
              message={
                activeStatusLabel
                  ? "Try a different status or clear the status filter."
                  : activeGenre
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

      {saveSeriesId != null ? (
        <SaveToListSheet
          seriesId={saveSeriesId}
          visible={saveSeriesId != null}
          onClose={() => setSaveSeriesId(null)}
        />
      ) : null}

      {editSeriesItem ? (
        <EditSeriesModal
          series={editSeriesItem}
          visible={editSeriesItem != null}
          onClose={() => setEditSeriesItem(null)}
          onSaved={() => setEditSeriesItem(null)}
        />
      ) : null}

      <HomeFilterSheet
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        genres={allGenres}
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        activeGenre={activeGenre}
        onGenreChange={setActiveGenre}
        activeSort={activeSort}
        onSortChange={setActiveSort}
        onReset={() => {
          setActiveStatus(null);
          setActiveGenre(null);
          setActiveSort("score");
        }}
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
      // Tighter inter-column gap (matches the profile favorites grid) so each
      // card — and its cover — is a little wider.
      gap: spacing.sm,
    },
    typeRail: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingRight: spacing.md,
    },
    filterRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingRight: spacing.md,
    },
    filtersChip: {
      minHeight: 32,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.borderSoft,
      borderWidth: 1,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.md,
    },
    filtersChipActive: {
      borderColor: colors.accentBorder,
    },
    filtersChipText: {
      fontWeight: "800",
    },
    filterCountBadge: {
      minWidth: 18,
      height: 18,
      paddingHorizontal: 5,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9,
      backgroundColor: colors.accentStrong,
    },
    filterCountText: {
      color: colors.background,
      fontSize: 11,
      fontWeight: "800",
    },
    activeFilterChip: {
      minHeight: 32,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: colors.accentSoft,
      borderColor: colors.accentBorder,
      borderWidth: 1,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.sm,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
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
      // Full-bleed cover that sits flush to the card edges (mirrors the
      // public-profile Favorite Series card): no inner padding, a single
      // rounded radius, and overflow hidden so the cover's top corners are
      // clipped to the card. The meta/actions add their own padding below.
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.surfaceRaised,
      overflow: "hidden",
    },
    posterWrap: {
      position: "relative",
      overflow: "hidden",
      backgroundColor: "transparent",
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
    statusBadge: {
      position: "absolute",
      right: spacing.sm,
      bottom: spacing.sm,
    },
    editOverlayButton: {
      position: "absolute",
      left: spacing.sm,
      bottom: spacing.sm,
      width: 30,
      height: 30,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.pill,
      backgroundColor: colors.overlay,
      borderWidth: 1,
      borderColor: colors.overlayBorder,
    },
    editOverlayButtonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.94 }],
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
    cardActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.sm,
      paddingTop: spacing.xs,
    },
    compareButton: {
      alignSelf: "flex-start",
    },
    saveIconButton: {
      width: 34,
      height: 34,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.surfaceRaised,
    },
    saveIconButtonSaved: {
      borderColor: colors.accentBorder,
      backgroundColor: colors.accentSoft,
    },
    saveIconButtonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.96 }],
    },
    posterCardPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.992 }],
    },
    posterMeta: {
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.sm,
    },
    posterTitle: {
      // Title font matches the public-profile Favorite Series card (AppText
      // "caption": 13 / lineHeight 18 / 600). Single line (numberOfLines={1}),
      // so every card's title block is exactly one line tall (18) — long titles
      // truncate with an ellipsis, and all cards stay uniformly aligned (the
      // type/votes row, Compare button, and save icon line up across columns).
      height: 18,
    },
    posterMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.xs,
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
