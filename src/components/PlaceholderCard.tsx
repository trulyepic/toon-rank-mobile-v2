import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing } from "../theme/tokens";

export function PlaceholderCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  body: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
});
