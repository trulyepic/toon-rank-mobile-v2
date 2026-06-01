import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pressable, StyleSheet, View } from "react-native";

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";
import { useAuth } from "../auth/AuthContext";
import { NOTIF_COUNT_KEY } from "../hooks/useNotificationCount";
import {
  AccountRequiredCard,
  AppButton,
  AppText,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenShell,
  Surface,
} from "../components";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import type { NotificationOut } from "../types/notification";

type NotificationsNav = NativeStackNavigationProp<RootStackParamList>;

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function kindIcon(
  kind: NotificationOut["kind"],
): React.ComponentProps<typeof Ionicons>["name"] {
  switch (kind) {
    case "THREAD_REPLY":
      return "chatbubble-outline";
    case "THREAD_FOLLOW_REPLY":
      return "notifications-outline";
    case "POST_MENTION":
      return "at-outline";
  }
}

function NotificationRow({
  notification,
  onPress,
}: {
  notification: NotificationOut;
  onPress: () => void;
}) {
  const styles = getStyles();
  const isUnread = !notification.is_read;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        isUnread ? styles.unreadRow : null,
        pressed ? styles.rowPressed : null,
      ]}
    >
      {isUnread ? <View style={styles.unreadDot} /> : <View style={styles.readSpacer} />}
      <View style={styles.rowIcon}>
        <Ionicons
          name={kindIcon(notification.kind)}
          size={18}
          color={isUnread ? colors.accentStrong : colors.textMuted}
        />
      </View>
      <View style={styles.rowBody}>
        <AppText variant="caption" numberOfLines={2}>
          {notification.actor_username ? (
            <AppText variant="caption" style={styles.actor}>
              {notification.actor_username}{" "}
            </AppText>
          ) : null}
          {notification.summary ?? "New notification"}
        </AppText>
        <AppText variant="caption" tone="subtle">
          {relativeTime(notification.created_at)}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
    </Pressable>
  );
}

export function NotificationsScreen() {
  const styles = getStyles();
  const { isSignedIn } = useAuth();
  const navigation = useNavigation<NotificationsNav>();
  const queryClient = useQueryClient();

  const notificationsQuery = useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: ({ pageParam }) => getNotifications(pageParam as number),
    getNextPageParam: (lastPage) => (lastPage.has_next ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    enabled: isSignedIn,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<{ pages: { items: NotificationOut[] }[] }>(
        ["notifications"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
            })),
          };
        },
      );
      void queryClient.invalidateQueries({ queryKey: NOTIF_COUNT_KEY });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.setQueryData<{ pages: { items: NotificationOut[] }[] }>(
        ["notifications"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((n) => ({ ...n, is_read: true })),
            })),
          };
        },
      );
      void queryClient.invalidateQueries({ queryKey: NOTIF_COUNT_KEY });
    },
  });

  const notifications = notificationsQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const unreadCount = notificationsQuery.data?.pages[0]?.unread_count ?? 0;

  const handlePress = (notification: NotificationOut) => {
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.thread_id) {
      navigation.navigate("ForumThread", {
        threadId: notification.thread_id,
        ...(notification.post_id ? { postId: notification.post_id } : {}),
      });
    }
  };

  return (
    <ScreenShell
      title="Notifications"
      subtitle="Replies, mentions, and activity on threads you follow."
    >
      {!isSignedIn ? (
        <AccountRequiredCard
          title="Log in to see notifications"
          body="Sign in to receive notifications for replies, mentions, and followed threads."
        />
      ) : (
        <>
          {unreadCount > 0 ? (
            <AppButton
              label={markAllMutation.isPending ? "Marking all read…" : "Mark all as read"}
              variant="secondary"
              disabled={markAllMutation.isPending}
              iconLeft={
                <Ionicons name="checkmark-done-outline" size={15} color={colors.text} />
              }
              onPress={() => markAllMutation.mutate()}
            />
          ) : null}

          {notificationsQuery.isLoading ? (
            <LoadingState message="Loading notifications…" />
          ) : notificationsQuery.isError ? (
            <ErrorState message="Could not load notifications. Try again." />
          ) : notifications.length === 0 ? (
            <EmptyState
              title="No notifications yet"
              message="Replies, mentions, and followed thread activity will appear here."
            />
          ) : (
            <>
              <Surface variant="raised" radius="xl" style={styles.list}>
                {notifications.map((n, idx) => (
                  <View key={n.id}>
                    {idx > 0 ? <View style={styles.divider} /> : null}
                    <NotificationRow notification={n} onPress={() => handlePress(n)} />
                  </View>
                ))}
              </Surface>
              {notificationsQuery.hasNextPage ? (
                <AppButton
                  label={notificationsQuery.isFetchingNextPage ? "Loading…" : "Load more"}
                  variant="secondary"
                  disabled={notificationsQuery.isFetchingNextPage}
                  onPress={() => void notificationsQuery.fetchNextPage()}
                />
              ) : null}
            </>
          )}
        </>
      )}
    </ScreenShell>
  );
}

function getStyles() {
  return StyleSheet.create({
    list: {
      overflow: "hidden",
      gap: 0,
      padding: 0,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingRight: spacing.md,
    },
    unreadRow: {
      backgroundColor: "rgba(99, 102, 241, 0.07)",
    },
    rowPressed: {
      opacity: 0.75,
    },
    unreadDot: {
      width: 7,
      height: 7,
      borderRadius: radii.pill,
      backgroundColor: colors.accentStrong,
      marginLeft: spacing.sm,
      flexShrink: 0,
    },
    readSpacer: {
      width: 7,
      marginLeft: spacing.sm,
    },
    rowIcon: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.md,
      backgroundColor: colors.accent,
      borderWidth: 1,
      borderColor: colors.accentBorder,
      flexShrink: 0,
    },
    rowBody: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    actor: {
      fontWeight: "700",
      color: colors.text,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderSoft,
      marginLeft: spacing.md + 7 + spacing.sm + 32 + spacing.sm,
    },
  });
}
