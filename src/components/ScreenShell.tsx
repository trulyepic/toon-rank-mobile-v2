import type { PropsWithChildren, ReactNode, RefObject } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "../theme/tokens";
import { AppText } from "./AppText";

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  scrollRef?: RefObject<ScrollView | null>;
}>;

export function ScreenShell({ title, subtitle, rightSlot, children, scrollRef }: Props) {
  const styles = StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboard: {
      flex: 1,
    },
    content: {
      padding: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing.md,
    },
    headerText: {
      flex: 1,
      gap: spacing.xs,
    },
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboard}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <AppText variant="screenTitle">{title}</AppText>
              {subtitle ? <AppText tone="muted">{subtitle}</AppText> : null}
            </View>
            {rightSlot ? <View>{rightSlot}</View> : null}
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
