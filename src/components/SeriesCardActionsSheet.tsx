import { Modal, Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radii, spacing } from "../theme/tokens";
import { MAX_COMPARE_ITEMS } from "../utils/compare";
import { AppText } from "./AppText";
import { Surface } from "./Surface";

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Series title, shown in the sheet header. */
  title: string;
  selectedForCompare: boolean;
  canAddMore: boolean;
  /** How many series are currently in the Compare set. */
  compareCount: number;
  showEdit: boolean;
  onToggleCompare: () => void;
  onEdit: () => void;
};

/**
 * Per-card action sheet for the Home grid. Keeps the cards visually clean
 * (cover + title + type, like the public-profile favorite card) by moving the
 * Compare / Save / Edit actions off the card footer and into this sheet,
 * opened from the card's ⋯ button or a long-press.
 */
export function SeriesCardActionsSheet({
  visible,
  onClose,
  title,
  selectedForCompare,
  canAddMore,
  compareCount,
  showEdit,
  onToggleCompare,
  onEdit,
}: Props) {
  const styles = getStyles();
  const insets = useSafeAreaInsets();
  const compareDisabled = !selectedForCompare && !canAddMore;

  function run(action: () => void) {
    action();
    onClose();
  }

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropFill} onPress={onClose} />
        <Surface
          radius="xl"
          style={[styles.sheet, { paddingBottom: spacing.md + insets.bottom }]}
        >
          <View style={styles.header}>
            <AppText variant="sectionTitle" numberOfLines={1} style={styles.headerTitle}>
              {title}
            </AppText>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close actions"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ActionRow
            icon={selectedForCompare ? "checkmark-circle" : "git-compare-outline"}
            label={
              selectedForCompare
                ? `Remove from Compare (${compareCount}/${MAX_COMPARE_ITEMS})`
                : compareDisabled
                  ? `Compare list full (${MAX_COMPARE_ITEMS}/${MAX_COMPARE_ITEMS})`
                  : `Add to Compare (${compareCount}/${MAX_COMPARE_ITEMS})`
            }
            active={selectedForCompare}
            disabled={compareDisabled}
            onPress={() => run(onToggleCompare)}
          />

          {showEdit ? (
            <ActionRow
              icon="create-outline"
              label="Edit series"
              onPress={() => run(onEdit)}
            />
          ) : null}
        </Surface>
      </View>
    </Modal>
  );
}

function ActionRow({
  icon,
  label,
  active = false,
  disabled = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const styles = getStyles();
  const tint = disabled ? colors.textMuted : active ? colors.accentStrong : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        active ? styles.rowActive : null,
        pressed && !disabled ? styles.rowPressed : null,
        disabled ? styles.rowDisabled : null,
      ]}
    >
      <Ionicons name={icon} size={20} color={tint} />
      <AppText variant="cardTitle" style={{ color: tint }}>
        {label}
      </AppText>
    </Pressable>
  );
}

function getStyles() {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    backdropFill: {
      flex: 1,
    },
    sheet: {
      gap: spacing.sm,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      marginBottom: spacing.xs,
    },
    headerTitle: {
      flex: 1,
      minWidth: 0,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.backgroundSoft,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    rowActive: {
      borderColor: colors.accentBorder,
      backgroundColor: colors.accentSoft,
    },
    rowPressed: {
      opacity: 0.85,
    },
    rowDisabled: {
      opacity: 0.5,
    },
  });
}
