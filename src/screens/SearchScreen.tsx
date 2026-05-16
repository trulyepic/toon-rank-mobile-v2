import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
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
import { ScreenShell } from "../components/ScreenShell";
import { useCompare } from "../context/CompareContext";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import type { RankedSeries } from "../types/series";

function SearchResultCard({
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
  return (
    <View style={styles.resultCard}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.resultMainPressable, pressed ? styles.resultCardPressed : null]}
      >
        <View style={styles.resultImageWrap}>
          {item.cover_url ? (
            <Image source={{ uri: item.cover_url }} style={styles.resultImage} />
          ) : (
            <View style={[styles.resultImage, styles.resultImageFallback]}>
              <Text numberOfLines={3} style={styles.resultImageFallbackText}>
                {item.title}
              </Text>
            </View>
          )}
          {item.rank ? (
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>#{item.rank}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.resultContent}>
          <Text numberOfLines={2} style={styles.resultTitle}>
            {item.title}
          </Text>
          <Text style={styles.resultMeta}>
            {item.type} · {Number(item.final_score || 0).toFixed(1)}
          </Text>
          <Text numberOfLines={2} style={styles.resultGenre}>
            {item.genre}
          </Text>
        </View>
      </Pressable>

      <View style={styles.resultActionRow}>
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
    </View>
  );
}

export function SearchScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { compareItems, isSelected, toggleCompare } = useCompare();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching, isError } = useQuery({
    queryKey: ["series-search", debouncedQuery],
    queryFn: () => searchSeries(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  return (
    <ScreenShell
      title="Search"
      subtitle="Find titles by name, genre, creator, or type using the same public search data as Toon Ranks."
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

      {isFetching ? <ActivityIndicator color={colors.accent} /> : null}

      {isError ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Search failed to load. Once the backend is reachable, matching titles
            will appear here as you type.
          </Text>
        </View>
      ) : null}

      {!debouncedQuery ? (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Start typing</Text>
          <Text style={styles.noticeText}>
            Type a title, genre, author, artist, or format and we&apos;ll show
            matching covers you can tap straight into.
          </Text>
        </View>
      ) : null}

      {debouncedQuery && !isFetching && !isError ? (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={false}
          contentContainerStyle={styles.resultsList}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <SearchResultCard
              item={item}
              onPress={() =>
                navigation.navigate("SeriesDetail", { seriesId: item.id })
              }
              selectedForCompare={isSelected(item.id)}
              onToggleCompare={() => toggleCompare(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>No matches yet</Text>
              <Text style={styles.noticeText}>
                We couldn&apos;t find anything for "{debouncedQuery}". Try a broader
                title, genre, or creator search.
              </Text>
            </View>
          }
        />
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "#4a362d",
    backgroundColor: "#241b17",
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
    backgroundColor: "#241b17",
    borderWidth: 1,
    borderColor: "#45332a",
    borderRadius: 24,
    padding: spacing.sm,
    gap: spacing.sm,
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
    borderWidth: 1,
    borderColor: "#47342b",
    backgroundColor: "#211714",
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
    backgroundColor: "rgba(18, 14, 12, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rankBadgeText: {
    color: colors.text,
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
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
  },
  resultMeta: {
    color: "#88a7ff",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    fontWeight: "700",
  },
  resultGenre: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  compareButton: {
    marginTop: spacing.xs,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "#4a362d",
    backgroundColor: "#1f1714",
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
  notice: {
    backgroundColor: "#221916",
    borderColor: "#45332a",
    borderWidth: 1,
    borderRadius: 24,
    padding: spacing.md,
    gap: spacing.xs,
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
