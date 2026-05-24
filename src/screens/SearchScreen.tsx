import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { searchSeries } from "../api/series";
import {
  AppButton,
  AppText,
  CoverImage,
  EmptyState,
  LoadingState,
  ScreenShell,
  Surface,
} from "../components";
import { useCompare } from "../context/CompareContext";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing, typography } from "../theme/tokens";
import type { RankedSeries } from "../types/series";

const MIN_SEARCH_LENGTH = 2;

const typeFilters = ["All", "Manga", "Manhwa", "Manhua"] as const;
type TypeFilter = (typeof typeFilters)[number];

function getScoreTone(score: number) {
  if (score >= 8) return colors.success;
  if (score >= 7.5) return colors.accentStrong;
  if (score >= 5) return colors.warning;
  return colors.danger;
}

function SearchResultCard({
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
  const compareDisabled = !selectedForCompare && !canAddMore;
  const score = Number(item.final_score || 0);

  return (
    <View style={styles.resultCard}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.resultMainPressable,
          pressed ? styles.resultCardPressed : null,
        ]}
      >
        <View style={styles.resultImageWrap}>
          <CoverImage
            uri={item.cover_url}
            style={styles.resultImage}
            fallbackIconSize={20}
          />
          {item.rank ? (
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>#{item.rank}</Text>
            </View>
          ) : null}
          <View style={styles.scoreBadge}>
            <Text style={[styles.scoreBadgeText, { color: getScoreTone(score) }]}>
              {score.toFixed(1)}
            </Text>
          </View>
        </View>

        <View style={styles.resultContent}>
          <Text numberOfLines={2} style={styles.resultTitle}>
            {item.title}
          </Text>
          <View style={styles.resultMetaRow}>
            <Text style={styles.resultType}>{item.type}</Text>
            <Text style={styles.resultVotes}>
              {item.vote_count.toLocaleString()} votes
            </Text>
          </View>
          <Text numberOfLines={2} style={styles.resultGenre}>
            {item.genre}
          </Text>
        </View>
      </Pressable>

      <View style={styles.resultActionRow}>
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
    </View>
  );
}

export function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { canAddMore, compareItems, isSelected, toggleCompare } = useCompare();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeType, setActiveType] = useState<TypeFilter>("All");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const hasSearchQuery = debouncedQuery.length >= MIN_SEARCH_LENGTH;
  const { data, isFetching, isLoading, isError, refetch } = useQuery({
    queryKey: ["series-search", debouncedQuery],
    queryFn: () => searchSeries(debouncedQuery),
    enabled: hasSearchQuery,
  });
  const allResults = data ?? [];
  const results =
    activeType === "All"
      ? allResults
      : allResults.filter(
          (item) => item.type?.toUpperCase() === activeType.toUpperCase(),
        );
  const showSearchingOverlay = isFetching && !isLoading && allResults.length > 0;

  return (
    <ScreenShell
      title="Search"
      subtitle="Find titles, genres, creators, or formats."
      rightSlot={
        compareItems.length ? (
          <View style={styles.headerCounter}>
            <Ionicons name="git-compare-outline" size={14} color={colors.text} />
            <Text style={styles.headerCounterText}>{compareItems.length}</Text>
          </View>
        ) : null
      }
    >
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Search titles, genres, creators..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typeRail}
      >
        {typeFilters.map((filter) => {
          const selected = activeType === filter;
          return (
            <Pressable
              key={filter}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setActiveType(filter)}
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

      {isLoading ? <LoadingState message="Searching..." /> : null}

      {isError ? (
        <Surface variant="warning" radius="xl" style={styles.searchIssueCard}>
          <Ionicons name="alert-circle-outline" size={22} color={colors.warningText} />
          <View style={styles.searchIssueText}>
            <AppText variant="cardTitle">Search could not load</AppText>
            <AppText tone="warning">
              Check your connection and try again. Your last typed query is still here.
            </AppText>
          </View>
          <AppButton
            label="Retry"
            size="sm"
            variant="ghost"
            onPress={() => refetch()}
            iconLeft={<Ionicons name="refresh" size={15} color={colors.text} />}
          />
        </Surface>
      ) : null}

      {!query.trim() ? (
        <Surface style={styles.notice}>
          <Ionicons name="sparkles-outline" size={22} color={colors.accentStrong} />
          <Text style={styles.noticeTitle}>Start typing</Text>
          <Text style={styles.noticeText}>
            Try a title, genre, author, artist, or format.
          </Text>
        </Surface>
      ) : null}

      {query.trim() && debouncedQuery.length < MIN_SEARCH_LENGTH ? (
        <Surface style={styles.notice}>
          <Ionicons name="text-outline" size={22} color={colors.accentStrong} />
          <Text style={styles.noticeTitle}>Keep typing</Text>
          <Text style={styles.noticeText}>
            Enter at least {MIN_SEARCH_LENGTH} characters to search titles.
          </Text>
        </Surface>
      ) : null}

      {hasSearchQuery && !isError ? (
        <>
          {results.length > 0 ? (
            <View style={styles.resultSummary}>
              <AppText variant="caption" tone="muted">
                {activeType === "All"
                  ? `${results.length.toLocaleString()} result${results.length === 1 ? "" : "s"} for "${debouncedQuery}"`
                  : `${results.length.toLocaleString()} ${activeType} result${results.length === 1 ? "" : "s"} for "${debouncedQuery}"`}
              </AppText>
              {showSearchingOverlay ? (
                <View style={styles.refreshPill}>
                  <Ionicons name="sync" size={12} color={colors.accentStrong} />
                  <AppText variant="caption" tone="accent">
                    Updating
                  </AppText>
                </View>
              ) : null}
            </View>
          ) : null}

          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            contentContainerStyle={styles.resultsList}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            renderItem={({ item }) => (
              <SearchResultCard
                item={item}
                onPress={() => navigation.navigate("SeriesDetail", { seriesId: item.id })}
                selectedForCompare={isSelected(item.id)}
                canAddMore={canAddMore}
                onToggleCompare={() => toggleCompare(item)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                title="No matches yet"
                message={
                  activeType === "All"
                    ? `We couldn't find anything for "${debouncedQuery}". Try a broader title, genre, or creator search.`
                    : `No ${activeType} results for "${debouncedQuery}". Try a different type filter or broaden your search.`
                }
              />
            }
          />
        </>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  typeRail: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingRight: spacing.md,
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 0,
  },
  resultsList: {
    gap: spacing.sm,
  },
  resultCard: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 24,
    padding: spacing.md,
    gap: spacing.md,
  },
  resultMainPressable: {
    flexDirection: "row",
    gap: spacing.md,
  },
  resultCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  resultImageWrap: {
    position: "relative",
    overflow: "hidden",
    width: 92,
    borderRadius: 18,
    backgroundColor: "transparent",
  },
  resultImage: {
    width: "100%",
    aspectRatio: 2 / 3,
    backgroundColor: colors.surface,
  },
  resultImageFallback: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
    backgroundColor: colors.accentSoft,
  },
  resultImageFallbackText: {
    color: colors.text,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  rankBadge: {
    position: "absolute",
    left: spacing.xs,
    top: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.overlay,
    borderWidth: 1,
    borderColor: colors.overlayBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rankBadgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "800",
  },
  scoreBadge: {
    position: "absolute",
    right: spacing.xs,
    top: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scoreBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  resultContent: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
    minWidth: 0,
  },
  resultActionRow: {
    alignItems: "flex-start",
  },
  resultTitle: {
    color: colors.text,
    ...typography.cardTitle,
  },
  resultMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  resultType: {
    color: colors.accentStrong,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    fontWeight: "800",
  },
  resultVotes: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    fontWeight: "600",
  },
  resultGenre: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  compareButton: {
    marginTop: spacing.xs,
    alignSelf: "flex-start",
  },
  notice: {
    gap: spacing.xs,
  },
  searchIssueCard: {
    gap: spacing.md,
  },
  searchIssueText: {
    gap: spacing.xs,
  },
  resultSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  refreshPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  noticeTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  noticeText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
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
