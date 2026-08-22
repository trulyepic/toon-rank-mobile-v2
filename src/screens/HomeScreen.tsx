import {
  Animated,
  type FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";

import { animateNextLayout, motion } from "../theme/motion";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
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
  FadeInView,
  HomeFilterSheet,
  HomeGridSkeleton,
  HomeHeroCarousel,
  LoadingDots,
  PressableScale,
  SectionHeader,
  SaveToListSheet,
  ScreenShell,
  SeriesCardActionsSheet,
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

// Gold / silver / bronze rank-badge treatment for the podium spots.
const TOP_RANK_STYLES: Record<number, { backgroundColor: string; borderColor: string }> =
  {
    1: { backgroundColor: "rgba(202,138,4,0.92)", borderColor: "#facc15" },
    2: { backgroundColor: "rgba(100,116,139,0.92)", borderColor: "#cbd5e1" },
    3: { backgroundColor: "rgba(154,52,18,0.92)", borderColor: "#fb923c" },
  };

// Handlers take the item (instead of per-item closures) so HomeScreen can pass
// the same useCallback references to every card — keeping props referentially
// stable is what lets memo() actually skip re-renders across the grid.
const HomeCard = memo(function HomeCard({
  item,
  index,
  onPressItem,
  onOpenActionsItem,
  showSave,
  saved,
  onSaveItem,
}: {
  item: RankedSeries;
  index: number;
  onPressItem: (item: RankedSeries) => void;
  onOpenActionsItem: (item: RankedSeries) => void;
  showSave: boolean;
  saved: boolean;
  onSaveItem: (item: RankedSeries) => void;
}) {
  const styles = getStyles();
  const score = Number(item.final_score || 0).toFixed(1);
  const onOpenActions = () => onOpenActionsItem(item);
  const topRankStyle = item.rank ? TOP_RANK_STYLES[item.rank] : undefined;
  // Stagger within the freshly loaded page only, so later pages don't wait
  // out the full list's worth of delays.
  const entranceDelay = (index % HOME_RANKINGS_PAGE_SIZE) * 40;

  return (
    <FadeInView delay={entranceDelay} style={styles.posterCard}>
      <PressableScale
        onPress={() => onPressItem(item)}
        onLongPress={onOpenActions}
        delayLongPress={250}
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
            <View style={[styles.rankBadge, topRankStyle]}>
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
          <Pressable
            onPress={onOpenActions}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`More actions for ${item.title}`}
            style={({ pressed }) => [
              styles.actionsOverlayButton,
              pressed ? styles.actionsOverlayButtonPressed : null,
            ]}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.posterMeta}>
          <AppText variant="caption" numberOfLines={1} style={styles.posterTitle}>
            {item.title}
          </AppText>
          <View style={styles.posterMetaRow}>
            <AppText variant="caption" tone="muted">
              {item.type}
            </AppText>
            {showSave ? (
              <Pressable
                onPress={() => onSaveItem(item)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={
                  saved
                    ? `${item.title} is in a reading list. Manage lists`
                    : `Save ${item.title} to a reading list`
                }
                style={({ pressed }) => (pressed ? styles.saveIconPressed : null)}
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
      </PressableScale>
    </FadeInView>
  );
});

export function HomeScreen() {
  const styles = getStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { canAddMore, compareItems, isSelected, toggleCompare } = useCompare();
  const { isSignedIn, user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const canSubmitTitle = user?.role === "CONTRIBUTOR" || isAdmin;
  const [activeType, setActiveType] = useState<TitleTypeFilter>("All");
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState<SeriesSort>("score");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [saveSeriesId, setSaveSeriesId] = useState<number | null>(null);
  const [editSeriesItem, setEditSeriesItem] = useState<RankedSeries | null>(null);
  // Series whose action sheet (Compare / Save / Edit) is open, or null.
  const [actionsItem, setActionsItem] = useState<RankedSeries | null>(null);

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
  const readingLists = readingListsQuery.data;

  // Stable, item-taking handlers so the memoized HomeCard's props keep the same
  // identity between renders (inline closures here would re-render every card
  // whenever any Home state changed — e.g. opening a sheet).
  const handlePressItem = useCallback(
    (item: RankedSeries) => navigation.navigate("SeriesDetail", { seriesId: item.id }),
    [navigation],
  );
  const handleOpenActionsItem = useCallback((item: RankedSeries) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActionsItem(item);
  }, []);
  const handleSaveItem = useCallback((item: RankedSeries) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaveSeriesId(item.id);
  }, []);
  const renderHomeCard = useCallback(
    ({ item, index }: { item: RankedSeries; index: number }) => (
      <HomeCard
        item={item}
        index={index}
        onPressItem={handlePressItem}
        onOpenActionsItem={handleOpenActionsItem}
        showSave={isSignedIn}
        saved={isSeriesInAnyList(readingLists, item.id)}
        onSaveItem={handleSaveItem}
      />
    ),
    [handlePressItem, handleOpenActionsItem, handleSaveItem, isSignedIn, readingLists],
  );

  // ── Scroll-linked hero exit ────────────────────────────────────────────────
  // As the grid scrolls, the hero fades, lags behind (parallax), and shrinks
  // slightly — while the type/filter rails stay pinned above the list.
  const scrollY = useRef(new Animated.Value(0)).current;
  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 320],
    outputRange: [1, 0.1],
    extrapolate: "clamp",
  });
  const heroTranslate = scrollY.interpolate({
    inputRange: [0, 320],
    outputRange: [0, 90],
    extrapolate: "clamp",
  });
  const heroScale = scrollY.interpolate({
    inputRange: [0, 320],
    outputRange: [1, 0.96],
    extrapolate: "clamp",
  });

  // ── Sliding type-rail indicator ────────────────────────────────────────────
  // A small accent dot glides under the active chip (chip positions are
  // measured onLayout since labels have different widths).
  const chipLayouts = useRef<
    Partial<Record<TitleTypeFilter, { x: number; width: number }>>
  >({});
  const railDotX = useRef(new Animated.Value(0)).current;
  const [railDotVisible, setRailDotVisible] = useState(false);
  const moveRailDot = useCallback(
    (filter: TitleTypeFilter) => {
      const layout = chipLayouts.current[filter];
      if (!layout) return;
      setRailDotVisible(true);
      Animated.spring(railDotX, {
        toValue: layout.x + layout.width / 2 - 3,
        useNativeDriver: true,
        ...motion.spring.gentle,
      }).start();
    },
    [railDotX],
  );
  useEffect(() => {
    moveRailDot(activeType);
  }, [activeType, moveRailDot]);

  // ── Pull-to-refresh ────────────────────────────────────────────────────────
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Promise.all([
        rankingsQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ["hero-top10"] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, rankingsQuery]);

  // ── Scroll to top when the type filter changes ─────────────────────────────
  // So the fresh grid's staggered entrance is actually seen from the top.
  const listRef = useRef<FlatList<RankedSeries> | null>(null);
  const firstTypeRun = useRef(true);
  useEffect(() => {
    if (firstTypeRun.current) {
      firstTypeRun.current = false;
      return;
    }
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [activeType]);

  // ── Compare-counter pop ────────────────────────────────────────────────────
  const compareCount = compareItems.length;
  const counterScale = useRef(new Animated.Value(1)).current;
  const firstCounterRun = useRef(true);
  useEffect(() => {
    if (firstCounterRun.current) {
      firstCounterRun.current = false;
      return;
    }
    if (compareCount === 0) return;
    counterScale.setValue(0.6);
    Animated.spring(counterScale, {
      toValue: 1,
      useNativeDriver: true,
      ...motion.spring.release,
    }).start();
  }, [compareCount, counterScale]);

  return (
    <ScreenShell
      title="Toon Ranks"
      scroll={false}
      rightSlot={
        canSubmitTitle || compareCount ? (
          <View style={styles.headerActions}>
            {canSubmitTitle ? (
              <AppButton
                label="Submit"
                size="sm"
                onPress={() => navigation.navigate("SubmitSeries")}
                iconLeft={<Ionicons name="add" size={15} color={colors.text} />}
              />
            ) : null}
            {compareCount ? (
              <Animated.View
                style={[styles.headerCounter, { transform: [{ scale: counterScale }] }]}
              >
                <Ionicons name="git-compare-outline" size={14} color={colors.text} />
                <Text style={styles.headerCounterText}>{compareCount}</Text>
              </Animated.View>
            ) : null}
          </View>
        ) : null
      }
    >
      {/* Pinned rails: always visible while the hero scrolls away beneath. */}
      <View style={styles.pinnedRails}>
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
                onLayout={(e) => {
                  chipLayouts.current[filter] = {
                    x: e.nativeEvent.layout.x,
                    width: e.nativeEvent.layout.width,
                  };
                  if (selected) moveRailDot(filter);
                }}
                onPress={() => {
                  animateNextLayout();
                  setActiveType(filter);
                  setActiveGenre(null);
                }}
                style={({ pressed }) => [
                  styles.segmentButton,
                  selected ? styles.segmentButtonActive : null,
                  pressed ? styles.segmentButtonPressed : null,
                ]}
              >
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
          {railDotVisible ? (
            <Animated.View
              pointerEvents="none"
              style={[styles.railDot, { transform: [{ translateX: railDotX }] }]}
            />
          ) : null}
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
              onPress={() => {
                animateNextLayout();
                setActiveStatus(null);
              }}
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
              onPress={() => {
                animateNextLayout();
                setActiveGenre(null);
              }}
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
      </View>

      <Animated.FlatList
        ref={listRef}
        data={rankings}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.columnWrap}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accentStrong}
            colors={[colors.accentStrong]}
          />
        }
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (rankingsQuery.hasNextPage && !rankingsQuery.isFetchingNextPage) {
            void rankingsQuery.fetchNextPage();
          }
        }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Animated.View
              style={{
                opacity: heroOpacity,
                transform: [{ translateY: heroTranslate }, { scale: heroScale }],
              }}
            >
              <HomeHeroCarousel activeType={activeType} onPressItem={handlePressItem} />
            </Animated.View>

            <SectionHeader title="All rankings" />

            {rankingsQuery.isLoading ? <HomeGridSkeleton /> : null}
            {rankingsQuery.isError ? (
              <ErrorState message="Rankings failed to load. Check your connection and try again in a moment." />
            ) : null}
          </View>
        }
        renderItem={renderHomeCard}
        ListEmptyComponent={
          !rankingsQuery.isLoading && !rankingsQuery.isError ? (
            <FadeInView>
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
            </FadeInView>
          ) : null
        }
        ListFooterComponent={
          rankings.length ? (
            <View style={styles.listFooter}>
              {rankingsQuery.isFetchingNextPage ? (
                <LoadingDots />
              ) : rankingsQuery.hasNextPage ? (
                <AppButton
                  label="Load more"
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

      {actionsItem ? (
        <SeriesCardActionsSheet
          visible={actionsItem != null}
          onClose={() => setActionsItem(null)}
          title={actionsItem.title}
          selectedForCompare={isSelected(actionsItem.id)}
          canAddMore={canAddMore}
          compareCount={compareItems.length}
          showEdit={isAdmin}
          onToggleCompare={() => toggleCompare(actionsItem)}
          onEdit={() => setEditSeriesItem(actionsItem)}
        />
      ) : null}

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
        onStatusChange={(status) => {
          animateNextLayout();
          setActiveStatus(status);
        }}
        activeGenre={activeGenre}
        onGenreChange={(genre) => {
          animateNextLayout();
          setActiveGenre(genre);
        }}
        activeSort={activeSort}
        onSortChange={(sort) => {
          animateNextLayout();
          setActiveSort(sort);
        }}
        onReset={() => {
          animateNextLayout();
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
    list: {
      flex: 1,
    },
    listContent: {
      gap: spacing.md,
      paddingBottom: spacing.xl,
    },
    listHeader: {
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    pinnedRails: {
      gap: spacing.sm,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    railDot: {
      position: "absolute",
      left: 0,
      bottom: 0,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accentStrong,
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
      // Room for the sliding indicator dot beneath the chips.
      paddingBottom: 10,
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
    actionsOverlayButton: {
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
    actionsOverlayButtonPressed: {
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
    posterMeta: {
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
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
    saveIconPressed: {
      opacity: 0.6,
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
