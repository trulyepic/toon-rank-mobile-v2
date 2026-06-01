import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, View } from "react-native";

import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import type { SeriesRef } from "../types/forum";
import { AppText } from "./AppText";
import { CoverImage } from "./CoverImage";

type Props = {
  seriesRefs: SeriesRef[];
};

export function ForumSeriesStrip({ seriesRefs }: Props) {
  const styles = getStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const visibleSeriesRefs = getVisibleSeriesRefs(seriesRefs);

  if (visibleSeriesRefs.length === 0) return null;

  return (
    <View style={styles.strip}>
      {visibleSeriesRefs.map((series) => {
        const seriesId = Number(series.series_id);

        return (
          <Pressable
            key={seriesId}
            onPress={() => navigation.navigate("SeriesDetail", { seriesId })}
            style={({ pressed }) => [styles.item, pressed ? styles.pressed : null]}
            accessibilityRole="button"
            accessibilityLabel={`Open ${series.title || "related title"}`}
            accessibilityHint="Opens the title detail screen"
          >
            <CoverImage
              uri={series.cover_url}
              style={styles.cover}
              fallbackIconSize={20}
            />
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
        );
      })}
    </View>
  );
}

function getVisibleSeriesRefs(seriesRefs: SeriesRef[]) {
  const seen = new Set<number>();

  return seriesRefs
    .filter((series) => {
      const seriesId = Number(series.series_id);

      if (!Number.isFinite(seriesId) || seriesId <= 0 || seen.has(seriesId)) {
        return false;
      }

      seen.add(seriesId);
      return true;
    })
    .slice(0, 3);
}

function getStyles() {
  return StyleSheet.create({
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
}
