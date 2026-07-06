import { useRef } from "react";
import { Animated, Pressable } from "react-native";
import type { PressableProps, StyleProp, ViewStyle } from "react-native";

import { motion } from "../theme/motion";

type Props = PressableProps & {
  /** Scale while pressed. Defaults to 0.97. */
  pressedScale?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

/**
 * Pressable that springs down to `pressedScale` on press-in and springs back
 * on release — tactile feedback using the built-in Animated API (no Reanimated;
 * see docs/HOME_REDESIGN_PLAN.md for the architecture constraint).
 */
export function PressableScale({
  pressedScale = 0.97,
  style,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        Animated.spring(scale, {
          toValue: pressedScale,
          useNativeDriver: true,
          ...motion.spring.press,
        }).start();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          ...motion.spring.release,
        }).start();
        onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
