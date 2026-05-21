import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
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
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenShell,
  Surface,
} from "../components";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import type { ReadingListItem } from "../types/readingList";
import type { RankedSeries } from "../types/series";
import { formatScore } from "../utils/seriesFormatting";

type ReadingListDetailRoute = RouteProp<RootStackParamList, "ReadingListDetail">;
type ReadingListDetailNavigation = NativeStackNavigationProp<RootStackParamList>;

type EditingItem = {
  seriesId: number;
  value: string;
} | null;

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
  return (
    <Surface variant="raised" radius="xl" style={styles.itemCard}>
      <Pressable onPress={onOpen} style={styles.itemMain}>
        {summary?.cover_url ? (
          <Image source={{ uri: summary.cover_url }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverFallback]}>
            <Ionicons name="image-outline" size={22} color={colors.accentStrong} />
          </View>
        )}

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
  const route = useRoute<ReadingListDetailRoute>();
  const navigation = useNavigation<ReadingListDetailNavigation>();
  const queryClient = useQueryClient();
  const { listId, listName } = route.params;
  const [editingItem, setEditingItem] = useState<EditingItem>(null);

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

      <View style={styles.stack}>
        {items.map((item) => (
          <SavedTitleCard
            key={item.series_id}
            item={item}
            summary={summariesById.get(item.series_id)}
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

      {itemsQuery.hasNextPage ? (
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

const styles = StyleSheet.create({
  stack: {
    gap: spacing.sm,
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
