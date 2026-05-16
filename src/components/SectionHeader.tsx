import { StyleSheet, View } from "react-native";

import { spacing } from "../theme/tokens";
import { AppText } from "./AppText";

type Props = {
  eyebrow?: string;
  title: string;
  body?: string;
};

export function SectionHeader({ eyebrow, title, body }: Props) {
  return (
    <View style={styles.wrap}>
      {eyebrow ? (
        <AppText variant="label" tone="muted">
          {eyebrow}
        </AppText>
      ) : null}
      <AppText variant="sectionTitle">{title}</AppText>
      {body ? <AppText tone="muted">{body}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
});
