import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { getPublicReadingList } from "../api/readingLists";
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
} from "../components";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import type { ReadingListItem } from "../types/readingList";
import type { RankedSeries } from "../types/series";
import { formatScore } from "../utils/seriesFormatting";

type PublicReadingListRoute = RouteProp<RootStackParamList, "PublicReadingList">;
type PublicReadingListNavigation = NativeStackNavigationProp<RootStackParamList>;

function PublicTitleCard({
  item,
  summary,
  onOpen,
}: {
  item: ReadingListItem;
  summary?: RankedSeries;
  onOpen: () => void;
}) {
  return (
    <Surface variant="raised" radius="xl" style={styles.itemCard}>
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [styles.itemMain, pressed ? styles.pressed : null]}
      >
        <CoverImage uri={summary?.cover_url} style={styles.cover} fallbackIconSize={22} />

        <View style={styles.itemText}>
          <AppText variant="cardTitle" numberOfLines={2}>
            {summary?.title || `Series #${item.series_id}`}
          </AppText>
          <AppText variant="caption" tone="accent">
            {summary?.type || "TITLE"}
            {summary?.final_score ? ` / ${formatScore(summary.final_score)}` : ""}
          </AppText>
          {item.left_off_chapter ? (
            <AppText tone="muted" numberOfLines={1}>
              Left off: Ch. {item.left_off_chapter}
            </AppText>
          ) : null}
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    </Surface>
  );
}

export function PublicReadingListScreen() {
  const route = useRoute<PublicReadingListRoute>();
  const navigation = useNavigation<PublicReadingListNavigation>();
  const { token } = route.params;

  const listQuery = useQuery({
    queryKey: ["public-reading-list", token],
    queryFn: () => getPublicReadingList(token),
    retry: false,
  });

  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data]);

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

  const listName = listQuery.data?.name ?? "Shared list";
  const ownerUsername = listQuery.data?.owner_username;

  const isNotFound =
    listQuery.isError &&
    listQuery.error &&
    "status" in (listQuery.error as { status?: number }) &&
    ((listQuery.error as { status?: number }).status === 404 ||
      (listQuery.error as { status?: number }).status === 403);

  return (
    <ScreenShell
      title={listName}
      subtitle={ownerUsername ? `Shared by ${ownerUsername}` : "Shared reading list"}
    >
      <AppButton
        label="Back"
        variant="ghost"
        size="sm"
        iconLeft={<Ionicons name="arrow-back" size={15} color={colors.text} />}
        onPress={() => navigation.goBack()}
      />

      {listQuery.isLoading ? <LoadingState message="Loading shared list..." /> : null}

      {listQuery.isError && isNotFound ? (
        <ErrorState message="This list is private or no longer available." />
      ) : null}

      {listQuery.isError && !isNotFound ? (
        <ErrorState message="This list could not be loaded. Try again in a moment." />
      ) : null}

      {listQuery.data && items.length === 0 ? (
        <EmptyState
          title="No titles yet"
          message="This reading list has no saved titles."
        />
      ) : null}

      <View style={styles.stack}>
        {items.map((item) => (
          <PublicTitleCard
            key={item.series_id}
            item={item}
            summary={summariesById.get(item.series_id)}
            onOpen={() =>
              navigation.navigate("SeriesDetail", { seriesId: item.series_id })
            }
          />
        ))}
      </View>
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
  itemText: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
