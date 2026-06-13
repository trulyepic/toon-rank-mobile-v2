import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { SeriesSort } from "../api/series";
import { colors, radii, spacing } from "../theme/tokens";
import { getSeriesStatusMeta, SERIES_STATUS_FILTERS } from "../utils/seriesStatus";
import { AppButton } from "./AppButton";
import { AppText } from "./AppText";
import { Surface } from "./Surface";

const SORT_OPTIONS: { value: SeriesSort; label: string }[] = [
  { value: "score", label: "Score" },
  { value: "votes", label: "Most Voted" },
  { value: "newest", label: "Newest" },
  { value: "title", label: "A–Z" },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  genres: string[];
  activeStatus: string | null;
  onStatusChange: (status: string | null) => void;
  activeGenre: string | null;
  onGenreChange: (genre: string | null) => void;
  activeSort: SeriesSort;
  onSortChange: (sort: SeriesSort) => void;
  onReset: () => void;
};

/**
 * Bottom-sheet of secondary Home filters (status + genre). Keeps the primary
 * type rail uncluttered on the Home screen while still exposing refinement
 * filters one tap away — the same collapse pattern used on the reading-list
 * detail screen.
 */
export function HomeFilterSheet({
  visible,
  onClose,
  genres,
  activeStatus,
  onStatusChange,
  activeGenre,
  onGenreChange,
  activeSort,
  onSortChange,
  onReset,
}: Props) {
  const styles = getStyles();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  // Cap the scrollable pill area so the header and Reset/Done footer always stay
  // on screen no matter how many genres there are.
  const maxScrollHeight = screenHeight * 0.55;
  const hasActive = !!activeStatus || !!activeGenre || activeSort !== "score";

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropFill} onPress={onClose} />
        <Surface
          radius="xl"
          style={[styles.sheet, { paddingBottom: spacing.md + insets.bottom }]}
        >
          <View style={styles.header}>
            <AppText variant="sectionTitle">Filters</AppText>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close filters"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            style={[styles.scrollView, { maxHeight: maxScrollHeight }]}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
          >
            <AppText variant="label" tone="muted">
              Sort
            </AppText>
            <View style={styles.pillWrap}>
              {SORT_OPTIONS.map((option) => {
                const selected = activeSort === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => onSortChange(option.value)}
                    style={({ pressed }) => [
                      styles.pill,
                      selected ? styles.pillActive : null,
                      pressed ? styles.pillPressed : null,
                    ]}
                  >
                    <AppText variant="caption" tone={selected ? "primary" : "muted"}>
                      {option.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <AppText variant="label" tone="muted" style={styles.genreHeading}>
              Status
            </AppText>
            <View style={styles.pillWrap}>
              {SERIES_STATUS_FILTERS.map((status) => {
                const selected = activeStatus === status.value;
                const dotColor = getSeriesStatusMeta(status.value)?.background;
                return (
                  <Pressable
                    key={status.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => onStatusChange(selected ? null : status.value)}
                    style={({ pressed }) => [
                      styles.pill,
                      selected ? styles.pillActive : null,
                      pressed ? styles.pillPressed : null,
                    ]}
                  >
                    {dotColor ? (
                      <View style={[styles.dot, { backgroundColor: dotColor }]} />
                    ) : null}
                    <AppText variant="caption" tone={selected ? "primary" : "muted"}>
                      {status.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            {genres.length > 0 ? (
              <>
                <AppText variant="label" tone="muted" style={styles.genreHeading}>
                  Genre
                </AppText>
                <View style={styles.pillWrap}>
                  {genres.map((genre) => {
                    const selected = activeGenre === genre;
                    return (
                      <Pressable
                        key={genre}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => onGenreChange(selected ? null : genre)}
                        style={({ pressed }) => [
                          styles.pill,
                          selected ? styles.pillActive : null,
                          pressed ? styles.pillPressed : null,
                        ]}
                      >
                        <AppText variant="caption" tone={selected ? "primary" : "muted"}>
                          {genre}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <AppButton
              label="Reset"
              variant="ghost"
              disabled={!hasActive}
              onPress={onReset}
            />
            <AppButton label="Done" selected onPress={onClose} />
          </View>
        </Surface>
      </View>
    </Modal>
  );
}

function getStyles() {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    backdropFill: {
      flex: 1,
    },
    sheet: {
      maxHeight: "80%",
      gap: spacing.md,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    scrollView: {
      flexShrink: 1,
    },
    scroll: {
      gap: spacing.sm,
      paddingBottom: spacing.sm,
    },
    genreHeading: {
      marginTop: spacing.md,
    },
    pillWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    pill: {
      minHeight: 36,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: colors.backgroundSoft,
      borderColor: colors.borderSoft,
      borderWidth: 1,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.md,
    },
    pillActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accentBorder,
    },
    pillPressed: {
      opacity: 0.85,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.sm,
    },
  });
}
