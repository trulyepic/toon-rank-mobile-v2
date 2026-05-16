import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";

import { fetchRankings } from "../api/series";
import { AppButton, EmptyState, ErrorState, LoadingState, ScreenShell } from "../components";
import { useCompare } from "../context/CompareContext";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, shadows, spacing, typography } from "../theme/tokens";
import type { RankedSeries } from "../types/series";

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
  const score = Number(item.final_score || 0).toFixed(1);
  const compareDisabled = !selectedForCompare && !canAddMore;

  return (
    <View style={styles.posterCard}>
      <Pressable style={({ pressed }) => [pressed ? styles.posterCardPressed : null]} onPress={onPress}>
        <View style={styles.posterWrap}>
          {item.cover_url ? (
            <Image source={{ uri: item.cover_url }} style={styles.posterImage} />
          ) : (
            <View style={[styles.posterImage, styles.posterFallback]}>
              <Text style={styles.posterFallbackText}>{item.title}</Text>
            </View>
          )}

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
          <Text style={styles.posterSubtitle}>
            {item.type} / {item.vote_count.toLocaleString()} votes
          </Text>
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
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { canAddMore, compareItems, isSelected, toggleCompare } = useCompare();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["rankings"],
    queryFn: () => fetchRankings(),
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
      {isLoading ? <LoadingState message="Loading rankings..." /> : null}
      {isError ? (
        <ErrorState message="Rankings failed to load. Check your connection and try again in a moment." />
      ) : null}

      <FlatList
        data={data ?? []}
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
          !isLoading && !isError ? (
            <EmptyState message="No rankings are available yet. Check back soon for ranked titles." />
          ) : null
        }
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  listContent: {
    gap: spacing.md,
  },
  columnWrap: {
    gap: spacing.md,
  },
  posterCard: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  posterCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.992 }],
  },
  posterWrap: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceRaised,
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
    borderColor: colors.overlayBorder,
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
    backgroundColor: colors.overlay,
    borderWidth: 1,
    borderColor: colors.overlayBorder,
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
  posterMeta: {
    gap: 4,
    paddingHorizontal: 2,
  },
  posterTitle: {
    color: colors.text,
    ...typography.cardTitle,
  },
  posterSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
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
