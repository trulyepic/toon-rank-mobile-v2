import Ionicons from "@expo/vector-icons/Ionicons";
import { useRef, useState, type ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, radii } from "../theme/tokens";

/**
 * Horizontal ScrollView that overlays a small chevron pill on the right edge
 * while more content sits off-screen, so users can tell a strip scrolls.
 * The hint disappears once the user reaches the end (and never shows when the
 * content already fits).
 */
export function HintScrollRow({
  children,
  contentContainerStyle,
  style,
  keyboardShouldPersistTaps,
}: {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: "always" | "never" | "handled";
}) {
  const styles = getStyles();
  const [hintVisible, setHintVisible] = useState(false);
  const layoutWidth = useRef(0);
  const contentWidth = useRef(0);
  const scrollX = useRef(0);

  const updateHint = () => {
    const overflows = contentWidth.current > layoutWidth.current + 4;
    const atEnd = scrollX.current + layoutWidth.current >= contentWidth.current - 8;
    setHintVisible(overflows && !atEnd);
  };

  return (
    <View style={[styles.wrap, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        scrollEventThrottle={32}
        onLayout={(event) => {
          layoutWidth.current = event.nativeEvent.layout.width;
          updateHint();
        }}
        onContentSizeChange={(width) => {
          contentWidth.current = width;
          updateHint();
        }}
        onScroll={(event) => {
          scrollX.current = event.nativeEvent.contentOffset.x;
          updateHint();
        }}
        contentContainerStyle={contentContainerStyle}
      >
        {children}
      </ScrollView>
      {hintVisible ? (
        <View pointerEvents="none" style={styles.hint}>
          {/* Small raised pill so the chevron reads as UI, not content. */}
          <View style={styles.hintPill}>
            <Ionicons name="chevron-forward" size={13} color={colors.textMuted} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
    wrap: {
      position: "relative",
    },
    hint: {
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      justifyContent: "center",
    },
    hintPill: {
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      borderRadius: radii.pill,
      padding: 2,
    },
  });
}
