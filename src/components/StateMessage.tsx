import { ActivityIndicator, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { colors, spacing } from "../theme/tokens";
import { AppText } from "./AppText";
import { Surface } from "./Surface";

type StateTone = "neutral" | "danger" | "accent";

type Props = {
  title?: string;
  message: string;
  tone?: StateTone;
};

function StateMessage({ title, message, tone = "neutral" }: Props) {
  const icon =
    tone === "danger"
      ? "alert-circle-outline"
      : tone === "accent"
        ? "sparkles-outline"
        : "information-circle-outline";

  return (
    <Surface variant={tone === "accent" ? "accent" : "default"} style={styles.card}>
      <Ionicons
        name={icon}
        size={20}
        color={tone === "danger" ? colors.danger : colors.accentStrong}
      />
      {title ? <AppText variant="cardTitle">{title}</AppText> : null}
      <AppText tone="muted">{message}</AppText>
    </Surface>
  );
}

export function EmptyState(props: Omit<Props, "tone">) {
  return <StateMessage {...props} tone="neutral" />;
}

export function ErrorState(props: Omit<Props, "tone">) {
  return <StateMessage {...props} tone="danger" />;
}

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <Surface style={styles.loadingCard}>
      <ActivityIndicator color={colors.accent} />
      <AppText tone="muted">{message}</AppText>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
  },
  loadingCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
});
