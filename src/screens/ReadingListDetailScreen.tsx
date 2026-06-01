import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getReadingListItemsPaged,
  removeReadingListItem,
  updateReadingListItem,
} from "../api/readingLists";
import { getSeriesSummary } from "../api/series";
import {
  AppButton,
  AppText,
  CoverImage,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenShell,
  Surface,
  ChipButton,
} from "../components";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import type { ReadingListItem } from "../types/readingList";
import type { RankedSeries, SeriesType } from "../types/series";
import { formatScore } from "../utils/seriesFormatting";

type ReadingListDetailRoute = RouteProp<RootStackParamList, "ReadingListDetail">;
type ReadingListDetailNavigation = NativeStackNavigationProp<RootStackParamList>;

type EditingItem = {
  seriesId: number;
  value: string;
} | null;

type TypeFilter = "" | SeriesType;
type StatusFilter = "" | "ONGOING" | "COMPLETE" | "HIATUS" | "SEASON_END" | "UNKNOWN";
type SortOption =
  | "DEFAULT"
  | "RANK_ASC"
  | "RANK_DESC"
  | "STARS_DESC"
  | "STARS_ASC"
  | "VOTES_DESC"
  | "VOTES_ASC"
  | "TITLE_ASC"
  | "TITLE_DESC";

type ListItemWithSummary = {
  item: ReadingListItem;
  summary?: RankedSeries;
};

const TYPE_FILTERS: { label: string; value: TypeFilter }[] = [
  { label: "All", value: "" },
  { label: "Manga", value: "MANGA" },
  { label: "Manhwa", value: "MANHWA" },
  { label: "Manhua", value: "MANHUA" },
];

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "Any", value: "" },
  { label: "Ongoing", value: "ONGOING" },
  { label: "Complete", value: "COMPLETE" },
  { label: "Hiatus", value: "HIATUS" },
  { label: "Season End", value: "SEASON_END" },
  { label: "Unknown", value: "UNKNOWN" },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Default", value: "DEFAULT" },
  { label: "Rank up", value: "RANK_ASC" },
  { label: "Rank down", value: "RANK_DESC" },
  { label: "Score high", value: "STARS_DESC" },
  { label: "Score low", value: "STARS_ASC" },
  { label: "Votes high", value: "VOTES_DESC" },
  { label: "Votes low", value: "VOTES_ASC" },
  { label: "Title A-Z", value: "TITLE_ASC" },
  { label: "Title Z-A", value: "TITLE_DESC" },
];

function normalizeStatus(status?: string | null): StatusFilter {
  const normalized = (status || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (
    normalized === "ONGOING" ||
    normalized === "COMPLETE" ||
    normalized === "HIATUS" ||
    normalized === "SEASON_END"
  ) {
    return normalized;
  }
  return "UNKNOWN";
}

function getScoreWindow(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const score = Number(trimmed);
  if (!Number.isFinite(score)) return null;
  const decimalPlaces = trimmed.includes(".") ? trimmed.split(".")[1]?.length || 0 : 0;
  const step = decimalPlaces > 0 ? 1 / 10 ** decimalPlaces : 1;
  return {
    min: score,
    max: score + step,
  };
}

function compareNumber(
  a: number | null | undefined,
  b: number | null | undefined,
  direction: "asc" | "desc",
) {
  const aMissing = a === null || a === undefined || Number.isNaN(a);
  const bMissing = b === null || b === undefined || Number.isNaN(b);
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return direction === "asc" ? a - b : b - a;
}

function sortListItems(items: ListItemWithSummary[], sortBy: SortOption) {
  if (sortBy === "DEFAULT") return items;
  const sorted = [...items];

  sorted.sort((a, b) => {
    if (sortBy === "RANK_ASC") {
      return compareNumber(a.summary?.rank, b.summary?.rank, "asc");
    }
    if (sortBy === "RANK_DESC") {
      return compareNumber(a.summary?.rank, b.summary?.rank, "desc");
    }
    if (sortBy === "STARS_ASC") {
      return compareNumber(a.summary?.final_score, b.summary?.final_score, "asc");
    }
    if (sortBy === "STARS_DESC") {
      return compareNumber(a.summary?.final_score, b.summary?.final_score, "desc");
    }
    if (sortBy === "VOTES_ASC") {
      return compareNumber(a.summary?.vote_count, b.summary?.vote_count, "asc");
    }
    if (sortBy === "VOTES_DESC") {
      return compareNumber(a.summary?.vote_count, b.summary?.vote_count, "desc");
    }
    const aTitle = a.summary?.title || `Series #${a.item.series_id}`;
    const bTitle = b.summary?.title || `Series #${b.item.series_id}`;
    const titleCompare = aTitle.localeCompare(bTitle);
    return sortBy === "TITLE_ASC" ? titleCompare : -titleCompare;
  });

  return sorted;
}

function SavedTitleCard({
  item,
  summary,
  onOpen,
  onEditChapter,
  onRemove,
}: {
  item: ReadingListItem;
  summary?: RankedSeries;
  onOpen: () => void;
  onEditChapter: () => void;
  onRemove: () => void;
}) {
  const styles = getStyles();
  return (
    <Surface variant="raised" radius="xl" style={styles.itemCard}>
      <Pressable onPress={onOpen} style={styles.itemMain}>
        <CoverImage uri={summary?.cover_url} style={styles.cover} fallbackIconSize={22} />

        <View style={styles.itemText}>
          <AppText variant="cardTitle" numberOfLines={2}>
            {summary?.title || `Series #${item.series_id}`}
          </AppText>
          <AppText variant="caption" tone="accent">
            {summary?.type || "TITLE"}
            {summary?.final_score ? ` / ${formatScore(summary.final_score)}` : ""}
          </AppText>
          <AppText tone="muted" numberOfLines={1}>
            {item.left_off_chapter
              ? `Left off: Ch. ${item.left_off_chapter}`
              : "No chapter saved"}
          </AppText>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <View style={styles.itemActions}>
        <AppButton label="Chapter" size="sm" variant="ghost" onPress={onEditChapter} />
        <AppButton label="Remove" size="sm" variant="danger" onPress={onRemove} />
      </View>
    </Surface>
  );
}

export function ReadingListDetailScreen() {
  const styles = getStyles();
  const route = useRoute<ReadingListDetailRoute>();
  const navigation = useNavigation<ReadingListDetailNavigation>();
  const queryClient = useQueryClient();
  const { listId, listName } = route.params;
  const [editingItem, setEditingItem] = useState<EditingItem>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [sortBy, setSortBy] = useState<SortOption>("DEFAULT");
  const [minStars, setMinStars] = useState("");

  const itemsQuery = useInfiniteQuery({
    queryKey: ["reading-list-items", listId],
    queryFn: ({ pageParam }) => getReadingListItemsPaged(listId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const hasMore = Boolean(lastPage.has_next ?? lastPage.has_more);
      return hasMore ? lastPage.page + 1 : undefined;
    },
  });
  const items = useMemo(
    () => itemsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [itemsQuery.data],
  );
  const summaryQueries = useQueries({
    queries: items.map((item) => ({
      queryKey: ["series-summary", item.series_id],
      queryFn: () => getSeriesSummary(item.series_id),
      enabled: items.length > 0,
    })),
  });

  const summariesById = useMemo(() => {
    const entries = summaryQueries
      .map((query, index) => {
        const seriesId = items[index]?.series_id;
        return seriesId && query.data ? [seriesId, query.data] : null;
      })
      .filter(Boolean) as [number, RankedSeries][];
    return new Map(entries);
  }, [items, summaryQueries]);

  const activeFilterCount = useMemo(() => {
    return [
      typeFilter,
      statusFilter,
      sortBy !== "DEFAULT" ? sortBy : "",
      minStars.trim(),
    ].filter(Boolean).length;
  }, [minStars, sortBy, statusFilter, typeFilter]);

  const visibleItems = useMemo(() => {
    const scoreWindow = getScoreWindow(minStars);
    const withSummaries = items.map((item) => ({
      item,
      summary: summariesById.get(item.series_id),
    }));

    const filtered = withSummaries.filter(({ summary }) => {
      if (typeFilter && summary?.type !== typeFilter) return false;
      if (statusFilter && normalizeStatus(summary?.status) !== statusFilter) return false;
      if (scoreWindow) {
        const score = summary?.final_score;
        if (score === undefined || score < scoreWindow.min || score >= scoreWindow.max) {
          return false;
        }
      }
      return true;
    });

    return sortListItems(filtered, sortBy);
  }, [items, minStars, sortBy, statusFilter, summariesById, typeFilter]);

  const filtersAreActive = activeFilterCount > 0;

  const resetFilters = () => {
    setTypeFilter("");
    setStatusFilter("");
    setSortBy("DEFAULT");
    setMinStars("");
  };

  const invalidateLists = () => {
    void queryClient.invalidateQueries({ queryKey: ["reading-lists", "me"] });
    void queryClient.invalidateQueries({ queryKey: ["reading-list-items", listId] });
  };

  const updateMutation = useMutation({
    mutationFn: ({ seriesId, value }: { seriesId: number; value: string }) =>
      updateReadingListItem(listId, seriesId, {
        left_off_chapter: value.trim() || null,
      }),
    onSuccess: () => {
      setEditingItem(null);
      invalidateLists();
    },
    onError: (error) => {
      Alert.alert(
        "Chapter not saved",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: (seriesId: number) => removeReadingListItem(listId, seriesId),
    onSuccess: invalidateLists,
    onError: (error) => {
      Alert.alert(
        "Title not removed",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    },
  });

  return (
    <ScreenShell title={listName} subtitle="Saved titles from your Toon Ranks account.">
      <AppButton
        label="Back to lists"
        variant="ghost"
        size="sm"
        iconLeft={<Ionicons name="arrow-back" size={15} color={colors.text} />}
        onPress={() => navigation.goBack()}
      />

      {itemsQuery.isLoading ? <LoadingState message="Loading saved titles..." /> : null}

      {itemsQuery.isError ? (
        <ErrorState message="This reading list could not be loaded. Try again in a moment." />
      ) : null}

      {itemsQuery.data && items.length === 0 ? (
        <EmptyState title="No saved titles" message="Add titles from Series Detail." />
      ) : null}

      {items.length > 0 ? (
        <Surface radius="xl" style={styles.filterPanel}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: filtersOpen }}
            onPress={() => setFiltersOpen((current) => !current)}
            style={styles.filterHeader}
          >
            <View style={styles.filterTitleRow}>
              <Ionicons
                name={filtersOpen ? "options" : "options-outline"}
                size={18}
                color={colors.accentStrong}
              />
              <AppText variant="cardTitle">Sort & Filter</AppText>
              {activeFilterCount > 0 ? (
                <View style={styles.filterCountBadge}>
                  <AppText variant="caption">{activeFilterCount}</AppText>
                </View>
              ) : null}
            </View>
            <Ionicons
              name={filtersOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>

          {filtersOpen ? (
            <View style={styles.filterBody}>
              <View style={styles.filterGroup}>
                <AppText variant="caption" tone="muted">
                  Type
                </AppText>
                <View style={styles.chipWrap}>
                  {TYPE_FILTERS.map((option) => (
                    <ChipButton
                      key={option.label}
                      label={option.label}
                      selected={typeFilter === option.value}
                      onPress={() => setTypeFilter(option.value)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <AppText variant="caption" tone="muted">
                  Status
                </AppText>
                <View style={styles.chipWrap}>
                  {STATUS_FILTERS.map((option) => (
                    <ChipButton
                      key={option.label}
                      label={option.label}
                      selected={statusFilter === option.value}
                      onPress={() => setStatusFilter(option.value)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <AppText variant="caption" tone="muted">
                  Sort
                </AppText>
                <View style={styles.chipWrap}>
                  {SORT_OPTIONS.map((option) => (
                    <ChipButton
                      key={option.value}
                      label={option.label}
                      selected={sortBy === option.value}
                      onPress={() => setSortBy(option.value)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <AppText variant="caption" tone="muted">
                  Score window
                </AppText>
                <View style={styles.scoreFilterRow}>
                  <TextInput
                    value={minStars}
                    onChangeText={setMinStars}
                    keyboardType="decimal-pad"
                    placeholder="Example: 8.5"
                    placeholderTextColor={colors.textSubtle}
                    style={styles.scoreInput}
                  />
                  <AppButton
                    label="Reset"
                    size="sm"
                    variant="ghost"
                    disabled={!filtersAreActive}
                    onPress={resetFilters}
                  />
                </View>
                <AppText variant="caption" tone="muted">
                  Enter 8 for scores from 8.0 to 8.9, or 8.5 for 8.5 only.
                </AppText>
              </View>
            </View>
          ) : null}
        </Surface>
      ) : null}

      {filtersAreActive && itemsQuery.hasNextPage ? (
        <Surface radius="lg" style={styles.filterNote}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.accentStrong}
          />
          <AppText tone="muted" style={styles.filterNoteText}>
            Load all items first to sort accurately.
          </AppText>
        </Surface>
      ) : null}

      {items.length > 0 && visibleItems.length === 0 ? (
        <EmptyState
          title="No matches"
          message="Reset filters or load more items to broaden this list."
        />
      ) : null}

      <View style={styles.stack}>
        {visibleItems.map(({ item, summary }) => (
          <SavedTitleCard
            key={item.series_id}
            item={item}
            summary={summary}
            onOpen={() =>
              navigation.navigate("SeriesDetail", {
                seriesId: item.series_id,
              })
            }
            onEditChapter={() =>
              setEditingItem({
                seriesId: item.series_id,
                value: item.left_off_chapter ?? "",
              })
            }
            onRemove={() =>
              Alert.alert("Remove title?", "This removes the title from this list.", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Remove",
                  style: "destructive",
                  onPress: () => removeMutation.mutate(item.series_id),
                },
              ])
            }
          />
        ))}
      </View>

      {itemsQuery.hasNextPage && !filtersAreActive ? (
        <AppButton
          label={itemsQuery.isFetchingNextPage ? "Loading..." : "Load more"}
          disabled={itemsQuery.isFetchingNextPage}
          onPress={() => itemsQuery.fetchNextPage()}
        />
      ) : null}

      <Modal transparent visible={editingItem !== null} animationType="fade">
        <View style={styles.modalBackdrop}>
          <Surface radius="xl" style={styles.modalCard}>
            <AppText variant="sectionTitle">Left-off chapter</AppText>
            <AppText tone="muted">
              Track the chapter you last reached for this title.
            </AppText>
            <TextInput
              value={editingItem?.value ?? ""}
              onChangeText={(value) =>
                setEditingItem((current) => (current ? { ...current, value } : current))
              }
              placeholder="Example: 42"
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <AppButton
                label="Cancel"
                variant="ghost"
                onPress={() => setEditingItem(null)}
              />
              <AppButton
                label={updateMutation.isPending ? "Saving..." : "Save"}
                selected
                disabled={!editingItem || updateMutation.isPending}
                onPress={() => {
                  if (!editingItem) return;
                  updateMutation.mutate({
                    seriesId: editingItem.seriesId,
                    value: editingItem.value,
                  });
                }}
              />
            </View>
          </Surface>
        </View>
      </Modal>
    </ScreenShell>
  );
}

function getStyles() {
  return StyleSheet.create({
    stack: {
      gap: spacing.sm,
    },
    filterPanel: {
      gap: spacing.md,
    },
    filterHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    filterTitleRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      minWidth: 0,
    },
    filterCountBadge: {
      minWidth: 28,
      minHeight: 28,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.accentBorder,
      backgroundColor: colors.accentSoft,
    },
    filterBody: {
      gap: spacing.md,
    },
    filterGroup: {
      gap: spacing.sm,
    },
    chipWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    scoreFilterRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    scoreInput: {
      flex: 1,
      minHeight: 48,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      borderRadius: radii.lg,
      paddingHorizontal: spacing.md,
      color: colors.text,
      backgroundColor: colors.backgroundSoft,
      fontSize: 16,
      fontWeight: "800",
    },
    filterNote: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    filterNoteText: {
      flex: 1,
    },
    itemCard: {
      gap: spacing.md,
    },
    itemMain: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    cover: {
      width: 64,
      height: 86,
      borderRadius: radii.md,
      backgroundColor: colors.backgroundSoft,
    },
    coverFallback: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    itemText: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    itemActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      padding: spacing.lg,
      backgroundColor: "rgba(0,0,0,0.62)",
    },
    modalCard: {
      gap: spacing.md,
    },
    input: {
      minHeight: 54,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      borderRadius: radii.lg,
      paddingHorizontal: spacing.md,
      color: colors.text,
      backgroundColor: colors.backgroundSoft,
      fontSize: 17,
      fontWeight: "700",
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
  });
}
