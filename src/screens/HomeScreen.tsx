import {
  ActivityIndicator,
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
import { ScreenShell } from "../components/ScreenShell";
import { useCompare } from "../context/CompareContext";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import type { RankedSeries } from "../types/series";

function getScoreTone(score: number) {
  if (score >= 8) return colors.success;
  if (score >= 7.5) return "#5f88ff";
  if (score >= 5) return colors.warning;
  return "#eb6a5a";
}

function HomeCard({
  item,
  onPress,
  selectedForCompare,
  onToggleCompare,
}: {
  item: RankedSeries;
  onPress: () => void;
  selectedForCompare: boolean;
  onToggleCompare: () => void;
}) {
  const score = Number(item.final_score || 0).toFixed(1);

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
            {item.type} · {item.vote_count.toLocaleString()} votes
          </Text>
        </View>
      </Pressable>

      <Pressable
        onPress={onToggleCompare}
        style={[
          styles.compareButton,
          selectedForCompare ? styles.compareButtonActive : null,
        ]}
      >
        <Ionicons
          name={selectedForCompare ? "checkmark" : "git-compare-outline"}
          size={14}
          color={colors.text}
        />
        <Text style={styles.compareButtonText}>
          {selectedForCompare ? "Selected" : "Compare"}
        </Text>
      </Pressable>
    </View>
  );
}

export function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { compareItems, isSelected, toggleCompare } = useCompare();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["rankings"],
    queryFn: () => fetchRankings(),
  });

  return (
    <ScreenShell
      title="Toon Ranks"
      subtitle="Browse the same ranked titles and cover art that power the website."
      rightSlot={
        compareItems.length ? (
          <View style={styles.headerCounter}>
            <Ionicons name="git-compare-outline" size={14} color={colors.text} />
            <Text style={styles.headerCounterText}>{compareItems.length}</Text>
          </View>
        ) : null
      }
    >
      {isLoading ? <ActivityIndicator color={colors.accent} /> : null}
      {isError ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Rankings failed to load. Once the backend is reachable, this screen
            becomes the mobile browse surface.
          </Text>
        </View>
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
            onToggleCompare={() => toggleCompare(item)}
          />
        )}
        ListEmptyComponent={
          !isLoading && !isError ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                No rankings yet. Once the backend responds, titles will appear
                here as a visual browsing grid.
              </Text>
            </View>
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
    borderColor: "#47342b",
    backgroundColor: "#211714",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
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
    backgroundColor: "rgba(18, 14, 12, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
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
    backgroundColor: "rgba(18, 14, 12, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radii.pill,
    backgroundColor: "#1f1714",
    borderWidth: 1,
    borderColor: "#4a362d",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  compareButtonActive: {
    backgroundColor: "#315fdc",
    borderColor: "#6d93ff",
  },
  compareButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  posterMeta: {
    gap: 4,
    paddingHorizontal: 2,
  },
  posterTitle: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
  },
  posterSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    fontWeight: "600",
  },
  notice: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  noticeText: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  headerCounter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radii.pill,
    backgroundColor: "#241b17",
    borderWidth: 1,
    borderColor: "#4a362d",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerCounterText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
});
