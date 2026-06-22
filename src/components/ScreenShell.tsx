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
  /**
   * Optional content docked below the scroll view, inside the keyboard-avoiding
   * container — i.e. pinned to the bottom of the screen above the keyboard.
   * Use for a reply/compose bar that must never be hidden by the keyboard.
   */
  stickyFooter?: ReactNode;
  /**
   * When false, children are rendered in a plain flex container instead of a
   * ScrollView. Use this when the screen's body is itself a virtualized list
   * (FlatList/SectionList) so the list can own scrolling and keep its
   * virtualization — never nest a FlatList inside the default ScrollView.
   */
  scroll?: boolean;
}>;

export function ScreenShell({
  title,
  subtitle,
  rightSlot,
  children,
  scrollRef,
  stickyFooter,
  scroll = true,
}: Props) {
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
    // Non-scroll body: same insets as the scroll content (minus the bottom
    // padding, which a hosted list owns via its own contentContainerStyle).
    body: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.lg,
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
    footer: {
      borderTopWidth: 1,
      borderTopColor: colors.borderSoft,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboard}
      >
        {scroll ? (
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
        ) : (
          <View style={styles.body}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <AppText variant="screenTitle">{title}</AppText>
                {subtitle ? <AppText tone="muted">{subtitle}</AppText> : null}
              </View>
              {rightSlot ? <View>{rightSlot}</View> : null}
            </View>
            {children}
          </View>
        )}
        {stickyFooter ? <View style={styles.footer}>{stickyFooter}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
