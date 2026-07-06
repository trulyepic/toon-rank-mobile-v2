import { LayoutAnimation, Platform, UIManager } from "react-native";

/**
 * Shared motion vocabulary — one place for durations and spring characters so
 * animations feel consistent across screens (see docs/HOME_REDESIGN_PLAN.md,
 * Phase 3 "motion audit").
 */
export const motion = {
  duration: {
    fast: 150,
    base: 260,
    slow: 400,
  },
  /** Animated.spring configs (built-in Animated API). */
  spring: {
    /** Firm press-down: quick, no overshoot. */
    press: { speed: 40, bounciness: 0 },
    /** Springy release: a touch of overshoot for tactility. */
    release: { speed: 24, bounciness: 7 },
    /** Gentle settle for indicators/sheets. */
    gentle: { speed: 14, bounciness: 6 },
  },
} as const;

// LayoutAnimation is opt-in on old-architecture Android.
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Animate the next layout change (e.g. the grid refilling after a filter
 * change) with a consistent ease. Call immediately before the state update.
 */
export function animateNextLayout() {
  LayoutAnimation.configureNext(
    LayoutAnimation.create(
      motion.duration.base,
      LayoutAnimation.Types.easeInEaseOut,
      LayoutAnimation.Properties.opacity,
    ),
  );
}
