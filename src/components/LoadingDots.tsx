import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { colors, spacing } from "../theme/tokens";

/**
 * Three softly bouncing dots — an animated stand-in for "Loading..." text
 * (e.g. while the next rankings page is fetching).
 */
export function LoadingDots() {
  const values = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    const loops = values.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(v, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 320, useNativeDriver: true }),
          Animated.delay((2 - i) * 140),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [values]);

  return (
    <View style={styles.row} accessibilityLabel="Loading more">
      {values.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
              transform: [
                {
                  translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentStrong,
  },
});
