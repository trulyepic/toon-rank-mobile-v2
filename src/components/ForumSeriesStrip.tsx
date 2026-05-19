import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image, Pressable, StyleSheet, View } from "react-native";

import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import type { SeriesRef } from "../types/forum";
import { AppText } from "./AppText";

type Props = {
  seriesRefs: SeriesRef[];
};

export function ForumSeriesStrip({ seriesRefs }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (seriesRefs.length === 0) return null;

  return (
    <View style={styles.strip}>
      {seriesRefs.slice(0, 3).map((series) => (
        <Pressable
          key={series.series_id}
          onPress={() =>
            navigation.navigate("SeriesDetail", { seriesId: series.series_id })
          }
          style={({ pressed }) => [styles.item, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel={`Open ${series.title || "related title"}`}
        >
          {series.cover_url ? (
            <Image
              source={{ uri: series.cover_url }}
              accessibilityLabel={`${series.title || "Related title"} cover`}
              style={styles.cover}
            />
          ) : (
            <View style={[styles.cover, styles.coverFallback]}>
              <Ionicons name="book-outline" size={20} color={colors.textMuted} />
            </View>
          )}
          <View style={styles.itemText}>
            <AppText variant="caption" numberOfLines={1}>
              {series.title || "Untitled"}
            </AppText>
            {series.type ? (
              <AppText variant="caption" tone="subtle">
                {series.type}
              </AppText>
            ) : null}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
    gap: spacing.xs,
    padding: spacing.xs,
    paddingRight: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  cover: {
    width: 34,
    height: 46,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  coverFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    maxWidth: 148,
    gap: 1,
  },
});
