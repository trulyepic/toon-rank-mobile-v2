import { StyleSheet } from "react-native";

import { spacing } from "../theme/tokens";
import { AppText } from "./AppText";
import { Surface } from "./Surface";

export function PlaceholderCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <Surface style={styles.card}>
      <AppText variant="cardTitle">{title}</AppText>
      <AppText tone="muted">{body}</AppText>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
});
