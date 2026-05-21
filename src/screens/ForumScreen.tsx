import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, View } from "react-native";

import { getForumThreads } from "../api/forum";
import {
  AppButton,
  AppText,
  EmptyState,
  ErrorState,
  ForumSeriesStrip,
  LoadingState,
  RoleNameText,
  ScreenShell,
  SectionHeader,
  Surface,
  UserAvatar,
} from "../components";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import type { ForumThread } from "../types/forum";
import { formatForumCount, formatForumDate } from "../utils/forumFormatting";

function ThreadCard({ thread }: { thread: ForumThread }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const seriesLabel =
    thread.series_refs.length > 0
      ? thread.series_refs
          .slice(0, 2)
          .map((series) => series.title)
          .filter(Boolean)
          .join(" / ")
      : "General discussion";

  return (
    <Pressable
      onPress={() => navigation.navigate("ForumThread", { threadId: thread.id })}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      <Surface variant="raised" radius="xl" style={styles.threadCard}>
        <View style={styles.threadHeader}>
          <View style={styles.threadIcon}>
            <Ionicons name="chatbubble-ellipses-outline" size={19} color={colors.text} />
          </View>
          <View style={styles.threadTitleWrap}>
            <AppText variant="cardTitle">{thread.title}</AppText>
            <AppText variant="caption" tone="muted">
              {seriesLabel}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>

        <View style={styles.metaRow}>
          <UserAvatar
            username={thread.author_username || "Unknown"}
            avatarUrl={thread.author_avatar_url}
            avatarPreset={thread.author_avatar_preset}
            size="sm"
          />
          <View style={styles.metaText}>
            <RoleNameText variant="caption" role={thread.author_role}>
              {thread.author_username || "Unknown"}
            </RoleNameText>
            <AppText variant="caption" tone="muted">
              {formatForumDate(thread.last_post_at || thread.updated_at)}
            </AppText>
          </View>
        </View>

        <ForumSeriesStrip seriesRefs={thread.series_refs} />

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Ionicons name="chatbubbles-outline" size={13} color={colors.accentStrong} />
            <AppText variant="caption">
              {formatForumCount(thread.post_count, "post")}
            </AppText>
          </View>
          {thread.locked ? (
            <View style={styles.badge}>
              <Ionicons name="lock-closed-outline" size={13} color={colors.warningText} />
              <AppText variant="caption">Locked</AppText>
            </View>
          ) : null}
        </View>
      </Surface>
    </Pressable>
  );
}

export function ForumScreen() {
  const threadsQuery = useInfiniteQuery({
    queryKey: ["forum", "threads"],
    queryFn: ({ pageParam }) => getForumThreads(pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.has_next ? lastPage.page + 1 : undefined),
  });
  const pages = threadsQuery.data?.pages ?? [];
  const threads = pages.flatMap((page) => page.items);
  const totalThreads = pages[0]?.total ?? 0;
  const hasThreads = threads.length > 0;
  const hasNextPage = Boolean(threadsQuery.hasNextPage);

  return (
    <ScreenShell
      title="Forum"
      subtitle="Browse Toon Ranks discussions. Heart posts with your account; posting and replies are next."
    >
      <Surface variant="accent" radius="hero" style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="chatbubbles-outline" size={24} color={colors.text} />
        </View>
        <View style={styles.heroText}>
          <AppText variant="sectionTitle">Community discussions</AppText>
          <AppText tone="muted">
            Read public threads now. Hearts use the same website account; creating posts
            and replies will unlock in the next forum slice.
          </AppText>
        </View>
      </Surface>

      {threadsQuery.isLoading ? (
        <LoadingState message="Loading forum threads..." />
      ) : null}

      {threadsQuery.isError ? (
        <ErrorState message="Forum threads could not be loaded. Try again in a moment." />
      ) : null}

      {threadsQuery.data && !hasThreads ? (
        <EmptyState
          title="No discussions yet"
          message="Public forum threads will appear here once the community starts posting."
        />
      ) : null}

      {hasThreads ? (
        <View style={styles.section}>
          <SectionHeader
            title="Recent threads"
            body={`${formatForumCount(totalThreads, "thread")} available / ${threads.length} shown`}
          />
          <View style={styles.stack}>
            {threads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} />
            ))}
          </View>
          {hasNextPage ? (
            <AppButton
              label={threadsQuery.isFetchingNextPage ? "Loading..." : "Load more"}
              disabled={threadsQuery.isFetchingNextPage}
              onPress={() => threadsQuery.fetchNextPage()}
              iconRight={<Ionicons name="chevron-down" size={15} color={colors.text} />}
            />
          ) : (
            <AppText variant="caption" tone="subtle" align="center">
              You are caught up.
            </AppText>
          )}
        </View>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    gap: spacing.md,
  },
  heroIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  heroText: {
    flex: 1,
    gap: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  stack: {
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  threadCard: {
    gap: spacing.sm,
  },
  threadHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  threadIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  threadTitleWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  metaText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
});
