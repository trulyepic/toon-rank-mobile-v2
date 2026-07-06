import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { colors, radii, spacing } from "../theme/tokens";

const SKELETON_CARDS = 6;

/**
 * Pulsing placeholder grid shown while the Home rankings load — same 2-column
 * poster layout as the real cards so content doesn't jump when data arrives.
 */
export function HomeGridSkeleton() {
  const styles = getStyles();
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.grid} accessibilityLabel="Loading rankings">
      {Array.from({ length: SKELETON_CARDS }, (_, i) => (
        <Animated.View key={i} style={[styles.card, { opacity: pulse }]}>
          <View style={styles.poster} />
          <View style={styles.meta}>
            <View style={styles.lineWide} />
            <View style={styles.lineNarrow} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    card: {
      flexBasis: "48%",
      flexGrow: 1,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.surfaceRaised,
      overflow: "hidden",
    },
    poster: {
      width: "100%",
      aspectRatio: 2 / 3,
      backgroundColor: colors.surface,
    },
    meta: {
      padding: spacing.sm,
      gap: spacing.xs,
    },
    lineWide: {
      height: 12,
      width: "80%",
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
    },
    lineNarrow: {
      height: 10,
      width: "45%",
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
    },
  });
}
