import { StyleSheet, View } from "react-native";

import { spacing } from "../theme/tokens";
import type { AuthUser } from "../types/account";
import { roleColor } from "../utils/avatar";
import { AppText } from "./AppText";
import { UserAvatar } from "./UserAvatar";

type Props = {
  user?: AuthUser | null;
  titleFallback?: string;
  subtitle?: string;
  avatarSize?: "sm" | "md" | "lg" | "xl";
  centered?: boolean;
};

export function UserIdentity({
  user,
  titleFallback = "Guest reader",
  subtitle,
  avatarSize = "md",
  centered = false,
}: Props) {
  const username = user?.username || titleFallback;
  const role = user?.role || "SIGNED OUT";

  return (
    <View style={[styles.container, centered ? styles.centered : null]}>
      <View style={styles.avatarWrap}>
        <UserAvatar
          username={username}
          avatarUrl={user?.avatar_url}
          avatarPreset={user?.avatar_preset}
          size={avatarSize}
        />
      </View>
      <View style={[styles.text, centered ? styles.centeredText : null]}>
        <AppText
          variant={avatarSize === "xl" ? "sectionTitle" : "cardTitle"}
          align={centered ? "center" : "left"}
          style={{ color: roleColor(user?.role) }}
        >
          {username}
        </AppText>
        <AppText variant="label" tone="muted" align={centered ? "center" : "left"}>
          {role}
        </AppText>
        {subtitle ? (
          <AppText tone="muted" align={centered ? "center" : "left"}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  centered: {
    flexDirection: "column",
  },
  avatarWrap: {
    padding: 0,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  centeredText: {
    alignItems: "center",
    flex: 0,
  },
});
