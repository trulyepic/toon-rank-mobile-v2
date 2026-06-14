import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { AppButton } from "../components/AppButton";
import { AppText } from "../components/AppText";
import { colors, radii, shadows, spacing } from "../theme/tokens";

const { width } = Dimensions.get("window");
const SLIDE_WIDTH = width;

type Slide = {
  icon: keyof typeof Ionicons.glyphMap;
  eyebrow: string;
  title: string;
  body: string;
};

const slides: Slide[] = [
  {
    icon: "podium-outline",
    eyebrow: "Rank and rate",
    title: "Find titles and climb the ranks.",
    body: "Browse manga, manhwa, and manhua with community scores, rating categories, and Rankers/Cred Points that spotlight active contributors.",
  },
  {
    icon: "bookmark-outline",
    eyebrow: "Track your reading",
    title: "Keep your lists and app style with you.",
    body: "Save planned, reading, and completed titles from your Toon Ranks account, then choose a theme that fits how you browse.",
  },
  {
    icon: "chatbubbles-outline",
    eyebrow: "Join the discussion",
    title: "Talk series with the community.",
    body: "Read forum threads, reply from mobile, and keep your identity synced between the app and the website.",
  },
];

type Props = {
  onComplete: () => void;
};

export function OnboardingScreen({ onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const isLast = index === slides.length - 1;

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / SLIDE_WIDTH);
    if (nextIndex !== index) setIndex(nextIndex);
  }

  function goToSlide(nextIndex: number) {
    setIndex(nextIndex);
    scrollRef.current?.scrollTo({ x: nextIndex * SLIDE_WIDTH, animated: true });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/adaptive-icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Pressable onPress={onComplete} hitSlop={12}>
          <AppText variant="caption" tone="muted">
            Skip
          </AppText>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.pager}
        contentContainerStyle={styles.track}
      >
        {slides.map((slide, slideIndex) => (
          <View key={slide.title} style={styles.slide}>
            <LinearGradient
              colors={[colors.accent, colors.surfaceRaised]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.iconBubble}>
                <Ionicons name={slide.icon} size={38} color={colors.text} />
              </View>
              <AppText variant="label" tone="accent">
                {slide.eyebrow}
              </AppText>
              <AppText variant="screenTitle" align="center" style={styles.title}>
                {slide.title}
              </AppText>
              <AppText tone="muted" align="center" style={styles.body}>
                {slide.body}
              </AppText>
            </LinearGradient>
            <AppText tone="subtle" align="center" style={styles.slideCounter}>
              {slideIndex + 1} of {slides.length}
            </AppText>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((slide, dotIndex) => (
            <Pressable
              key={slide.eyebrow}
              accessibilityRole="button"
              accessibilityLabel={`Show onboarding slide ${dotIndex + 1}`}
              onPress={() => goToSlide(dotIndex)}
              style={[styles.dot, dotIndex === index ? styles.dotActive : null]}
            />
          ))}
        </View>
        <View style={styles.actions}>
          {index > 0 ? (
            <AppButton
              label="Back"
              variant="ghost"
              onPress={() => goToSlide(index - 1)}
            />
          ) : null}
          <AppButton
            label={isLast ? "Start ranking" : "Next"}
            variant="primary"
            onPress={isLast ? onComplete : () => goToSlide(index + 1)}
            style={styles.primaryAction}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logo: {
    height: 58,
    width: 58,
    borderRadius: radii.md,
  },
  pager: {
    flex: 1,
    marginHorizontal: -spacing.md,
  },
  track: {
    alignItems: "center",
  },
  slide: {
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    width: SLIDE_WIDTH,
  },
  heroCard: {
    alignItems: "center",
    borderColor: colors.accentBorder,
    borderRadius: radii.hero,
    borderWidth: 1,
    gap: spacing.md,
    minHeight: 430,
    justifyContent: "center",
    padding: spacing.xl,
    width: "100%",
    ...shadows.card,
  },
  iconBubble: {
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 86,
    justifyContent: "center",
    marginBottom: spacing.sm,
    width: 86,
  },
  title: {
    maxWidth: 310,
  },
  body: {
    fontSize: 16,
    lineHeight: 25,
    maxWidth: 315,
  },
  slideCounter: {
    fontSize: 12,
  },
  footer: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  dots: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
  dot: {
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    height: 9,
    width: 9,
  },
  dotActive: {
    backgroundColor: colors.accentStrong,
    width: 26,
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
  primaryAction: {
    minWidth: 170,
  },
});
