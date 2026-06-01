import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { colors, radii, spacing } from "../theme/tokens";
import type { ForumFormatAction } from "../utils/forumComposerFormatting";
import { AppText } from "./AppText";

type ToolbarAction = {
  key: ForumFormatAction;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

type Props = {
  disabled?: boolean;
  onFormat: (action: ForumFormatAction) => void;
  onPickAttachment?: () => void;
};

const ACTIONS: ToolbarAction[] = [
  { key: "bold", label: "B" },
  { key: "italic", label: "I" },
  { key: "strike", label: "S" },
  { key: "link", label: "Link", icon: "link-outline" },
  { key: "inlineCode", label: "Code" },
  { key: "quote", label: "Quote", icon: "chatbox-ellipses-outline" },
  { key: "unorderedList", label: "List", icon: "list-outline" },
  { key: "orderedList", label: "1." },
  { key: "codeBlock", label: "Block" },
  { key: "spoiler", label: "Spoiler", icon: "eye-off-outline" },
];

export function ForumComposerToolbar({
  disabled = false,
  onFormat,
  onPickAttachment,
}: Props) {
  const styles = getStyles();
  return (
    <View style={styles.toolbarWrap}>
      <ScrollView
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolbarContent}
      >
        {ACTIONS.map((action) => (
          <Pressable
            key={action.key}
            accessibilityRole="button"
            accessibilityLabel={`Apply ${action.label} formatting`}
            disabled={disabled}
            onPress={() => onFormat(action.key)}
            style={({ pressed }) => [
              styles.toolButton,
              disabled ? styles.disabled : null,
              pressed && !disabled ? styles.pressed : null,
            ]}
          >
            {action.icon ? (
              <Ionicons name={action.icon} size={15} color={colors.text} />
            ) : null}
            <AppText
              variant="caption"
              style={[
                styles.toolLabel,
                action.key === "bold" ? styles.boldLabel : null,
                action.key === "italic" ? styles.italicLabel : null,
                action.key === "strike" ? styles.strikeLabel : null,
              ]}
            >
              {action.label}
            </AppText>
          </Pressable>
        ))}
        {onPickAttachment ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Attach image or GIF"
            disabled={disabled}
            onPress={onPickAttachment}
            style={({ pressed }) => [
              styles.toolButton,
              styles.mediaButton,
              disabled ? styles.disabled : null,
              pressed && !disabled ? styles.pressed : null,
            ]}
          >
            <Ionicons name="image-outline" size={15} color={colors.text} />
            <AppText variant="caption" style={styles.toolLabel}>
              Image/GIF
            </AppText>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
    toolbarWrap: {
      marginVertical: spacing.sm,
    },
    toolbarContent: {
      gap: spacing.xs,
      paddingRight: spacing.md,
    },
    toolButton: {
      minHeight: 38,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    mediaButton: {
      borderColor: colors.accentBorder,
      backgroundColor: colors.accentSoft,
    },
    toolLabel: {
      fontWeight: "900",
    },
    boldLabel: {
      fontWeight: "900",
    },
    italicLabel: {
      fontStyle: "italic",
    },
    strikeLabel: {
      textDecorationLine: "line-through",
    },
    pressed: {
      opacity: 0.86,
      transform: [{ scale: 0.98 }],
    },
    disabled: {
      opacity: 0.48,
    },
  });
}
