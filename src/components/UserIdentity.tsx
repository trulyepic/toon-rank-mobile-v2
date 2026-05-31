import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { spacing } from "../theme/tokens";
import type { AuthUser } from "../types/account";
import { AppText } from "./AppText";
import { RoleNameText } from "./RoleNameText";
import { UserAvatar } from "./UserAvatar";

type Props = {
  user?: AuthUser | null;
  titleFallback?: string;
  subtitle?: string;
  avatarSize?: "sm" | "md" | "lg" | "xl";
  avatarVariant?: "circle" | "portrait";
  avatarAccessory?: ReactNode;
  centered?: boolean;
};

export function UserIdentity({
  user,
  titleFallback = "Guest reader",
  subtitle,
  avatarSize = "md",
  avatarVariant = "circle",
  avatarAccessory,
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
          variant={avatarVariant}
        />
        {avatarAccessory ? (
          <View pointerEvents="box-none" style={styles.avatarAccessory}>
            {avatarAccessory}
          </View>
        ) : null}
      </View>
      <View style={[styles.text, centered ? styles.centeredText : null]}>
        <RoleNameText
          variant={avatarSize === "xl" ? "sectionTitle" : "cardTitle"}
          align={centered ? "center" : "left"}
          role={user?.role}
        >
          {username}
        </RoleNameText>
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
    position: "relative",
  },
  avatarAccessory: {
    bottom: -2,
    position: "absolute",
    right: -2,
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
