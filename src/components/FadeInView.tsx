import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { motion } from "../theme/motion";

type Props = {
  /** Delay before the entrance starts (ms). Used to stagger grid cards. */
  delay?: number;
  /** Vertical slide distance (px). Defaults to 12. */
  distance?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

/**
 * Fades + slides its children up on first mount. Runs once per mount — pair
 * with a stable `key` (e.g. series id) so list recycling doesn't replay it.
 */
export function FadeInView({
  delay = 0,
  distance = 12,
  duration = motion.duration.base,
  style,
  children,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [opacity, translateY, delay, duration]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
