import { useEffect, useRef } from "react";
import {
  Animated,
  type FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";

import { fetchRankings } from "../api/series";
import { colors, fonts, radii, spacing } from "../theme/tokens";
import type { RankedSeries } from "../types/series";
import { getTypeParam, type TitleTypeFilter } from "../utils/seriesBrowse";
import { AppText } from "./AppText";
import { CoverImage } from "./CoverImage";
import { FadeInView } from "./FadeInView";
import { PressableScale } from "./PressableScale";

const HERO_COUNT = 10;
/** How long the carousel rests on a card before auto-advancing. */
const AUTO_ADVANCE_MS = 4500;
/** How long after the user touches the carousel before auto-advance resumes. */
const AUTO_RESUME_MS = 6000;

/** The #1 crown floats with a slow bob so the podium feels alive. */
function BobbingCrown() {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  return (
    <Animated.View
      style={{
        transform: [
          { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) },
        ],
      }}
    >
      <MaterialCommunityIcons name="crown" size={30} color="#facc15" style={crownStyle} />
    </Animated.View>
  );
}

const crownStyle = {
  marginBottom: -10,
  marginLeft: 2,
  transform: [{ rotate: "-12deg" }],
  textShadowColor: "rgba(0,0,0,0.55)",
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 8,
} as const;

// Podium numeral tints — mirrors the grid's gold/silver/bronze rank badges.
const NUMERAL_TINTS: Record<number, string> = {
  1: "#facc15",
  2: "#cbd5e1",
  3: "#fb923c",
};

/**
 * The Home hero: a large snap-scrolling Top 10 carousel for the active type.
 * Netflix-style big rank numerals, bottom gradient overlay, and parallax on
 * the cover while swiping — all via the built-in Animated scroll interpolation
 * (no Reanimated; see docs/HOME_REDESIGN_PLAN.md).
 *
 * Fetches its own top-10 (score order, no genre/status filters) so grid
 * filters never empty the hero — and hero loading/errors never block the grid.
 */
export function HomeHeroCarousel({
  activeType,
  onPressItem,
}: {
  activeType: TitleTypeFilter;
  onPressItem: (item: RankedSeries) => void;
}) {
  const styles = getStyles();
  const { width: screenWidth } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;

  const cardWidth = Math.round(screenWidth * 0.68);
  const cardGap = spacing.sm;
  const snapInterval = cardWidth + cardGap;

  const heroQuery = useQuery({
    queryKey: ["hero-top10", activeType],
    queryFn: () => fetchRankings(1, HERO_COUNT, getTypeParam(activeType)),
    staleTime: 5 * 60_000,
  });

  const items = (heroQuery.data ?? []).slice(0, HERO_COUNT);

  // ── Auto-advance ───────────────────────────────────────────────────────────
  // The carousel drifts to the next card every few seconds so the hero feels
  // alive on its own; any touch pauses it, resuming after a short idle.
  const listRef = useRef<FlatList<RankedSeries> | null>(null);
  const indexRef = useRef(0);
  const lastTouchRef = useRef(0);

  useEffect(() => {
    const id = scrollX.addListener(({ value }) => {
      indexRef.current = Math.round(value / snapInterval);
    });
    return () => scrollX.removeListener(id);
  }, [scrollX, snapInterval]);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(() => {
      if (Date.now() - lastTouchRef.current < AUTO_RESUME_MS) return;
      const next = (indexRef.current + 1) % items.length;
      listRef.current?.scrollToOffset({
        offset: next * snapInterval,
        animated: true,
      });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [items.length, snapInterval]);

  // Jump back to #1 when the type filter swaps the Top 10 out.
  useEffect(() => {
    indexRef.current = 0;
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [activeType]);

  // Pulsing skeleton (matches the grid skeleton's rhythm).
  const skeletonPulse = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    if (!heroQuery.isLoading) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonPulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(skeletonPulse, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [heroQuery.isLoading, skeletonPulse]);

  if (heroQuery.isError) return null; // never block the grid

  if (heroQuery.isLoading) {
    return (
      <Animated.View
        style={[
          styles.skeleton,
          { width: cardWidth, height: cardWidth * 1.5, opacity: skeletonPulse },
        ]}
        accessibilityLabel="Loading top 10"
      />
    );
  }

  if (items.length === 0) return null;

  return (
    <View>
      <View style={styles.headerRow}>
        <AppText variant="sectionTitle">
          Top 10{activeType === "All" ? "" : ` ${activeType}`}
        </AppText>
        <AppText variant="caption" tone="muted">
          Community ranked
        </AppText>
      </View>
      <Animated.FlatList
        ref={listRef}
        data={items}
        horizontal
        keyExtractor={(item) => String(item.id)}
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        contentContainerStyle={{ gap: cardGap, paddingRight: spacing.md }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: true,
        })}
        onScrollBeginDrag={() => {
          lastTouchRef.current = Date.now();
        }}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => {
          const inputRange = [
            (index - 1) * snapInterval,
            index * snapInterval,
            (index + 1) * snapInterval,
          ];
          // Focused card stands at full size; neighbours shrink slightly.
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.94, 1, 0.94],
            extrapolate: "clamp",
          });
          // Cover drifts against the scroll for a parallax feel.
          const coverTranslate = scrollX.interpolate({
            inputRange,
            outputRange: [-cardWidth * 0.08, 0, cardWidth * 0.08],
            extrapolate: "clamp",
          });
          const score = Number(item.final_score || 0).toFixed(1);

          return (
            <FadeInView delay={index * 55} distance={16}>
              <Animated.View style={{ width: cardWidth, transform: [{ scale }] }}>
                <PressableScale
                  pressedScale={0.98}
                  onPress={() => onPressItem(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open details for ${item.title}, ranked number ${index + 1}`}
                >
                  <View style={[styles.card, { height: cardWidth * 1.5 }]}>
                    <Animated.View
                      style={[
                        StyleSheet.absoluteFill,
                        { transform: [{ translateX: coverTranslate }, { scale: 1.16 }] },
                      ]}
                    >
                      <CoverImage
                        uri={item.cover_url}
                        style={styles.cover}
                        fallbackIconSize={32}
                      />
                    </Animated.View>
                    <LinearGradient
                      colors={["transparent", "rgba(8,6,4,0.55)", "rgba(8,6,4,0.94)"]}
                      locations={[0.42, 0.7, 1]}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.rankWrap}>
                      {index === 0 ? <BobbingCrown /> : null}
                      <Text
                        style={[
                          styles.rankNumeral,
                          NUMERAL_TINTS[index + 1]
                            ? { color: NUMERAL_TINTS[index + 1] }
                            : null,
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.cardFooter}>
                      <Text numberOfLines={2} style={styles.cardTitle}>
                        {item.title}
                      </Text>
                      <View style={styles.cardMetaRow}>
                        <View style={styles.scorePill}>
                          <Text style={styles.scorePillText}>★ {score}</Text>
                        </View>
                        <Text style={styles.cardType}>{item.type}</Text>
                      </View>
                    </View>
                  </View>
                </PressableScale>
              </Animated.View>
            </FadeInView>
          );
        }}
      />
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
    headerRow: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    skeleton: {
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.surfaceRaised,
    },
    card: {
      borderRadius: radii.xl,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.surfaceRaised,
    },
    cover: {
      width: "100%",
      height: "100%",
    },
    rankWrap: {
      position: "absolute",
      left: spacing.sm,
      bottom: 64,
    },
    rankNumeral: {
      fontSize: 96,
      lineHeight: 96,
      fontFamily: fonts.heading,
      fontWeight: "800",
      color: "rgba(255,255,255,0.92)",
      textShadowColor: "rgba(0,0,0,0.55)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 10,
    },
    cardFooter: {
      position: "absolute",
      left: spacing.md,
      right: spacing.md,
      bottom: spacing.md,
      gap: spacing.xs,
    },
    cardTitle: {
      fontSize: 19,
      lineHeight: 24,
      fontFamily: fonts.heading,
      fontWeight: "800",
      color: "#ffffff",
    },
    cardMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    scorePill: {
      borderRadius: radii.pill,
      backgroundColor: "rgba(255,255,255,0.16)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.28)",
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    scorePillText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "800",
    },
    cardType: {
      color: "rgba(255,255,255,0.85)",
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.9,
    },
  });
}
