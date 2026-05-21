import Ionicons from "@expo/vector-icons/Ionicons";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";

import { getForumThreadPosts } from "../api/forum";
import {
  AppText,
  AppButton,
  EmptyState,
  ErrorState,
  ForumMarkdown,
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
import type { ForumPost } from "../types/forum";
import { formatForumCount, formatForumDate } from "../utils/forumFormatting";

type ForumThreadRoute = RouteProp<RootStackParamList, "ForumThread">;
const POSTS_PAGE_SIZE = 20;

function PostCard({
  post,
  depth = 0,
  label,
}: {
  post: ForumPost;
  depth?: number;
  label: string;
}) {
  return (
    <Surface
      variant="raised"
      radius="xl"
      style={[
        styles.postCard,
        depth > 0 ? styles.replyCard : null,
        depth > 0 ? { marginLeft: Math.min(depth, 4) * 14 } : null,
      ]}
    >
      <View style={styles.postHeader}>
        <UserAvatar
          username={post.author_username || "Reader"}
          avatarUrl={post.author_avatar_url}
          avatarPreset={post.author_avatar_preset}
          size="md"
        />
        <View style={styles.postAuthor}>
          <View style={styles.authorLine}>
            <RoleNameText variant="cardTitle" role={post.author_role}>
              {post.author_username || "Unknown reader"}
            </RoleNameText>
            <View style={styles.replyLabel}>
              <AppText variant="caption">{label}</AppText>
            </View>
          </View>
          <AppText variant="caption" tone="muted">
            {formatForumDate(post.created_at)}
          </AppText>
        </View>
      </View>

      <ForumMarkdown markdown={post.content_markdown} />

      <ForumSeriesStrip seriesRefs={post.series_refs} />

      <View style={styles.postFooter}>
        <View style={styles.badge}>
          <Ionicons name="heart-outline" size={13} color={colors.accentStrong} />
          <AppText variant="caption">
            {formatForumCount(post.heart_count, "heart")}
          </AppText>
        </View>
        {post.parent_id ? (
          <View style={styles.badge}>
            <Ionicons
              name="return-up-forward-outline"
              size={13}
              color={colors.textMuted}
            />
            <AppText variant="caption" tone="muted">
              Reply
            </AppText>
          </View>
        ) : null}
      </View>
    </Surface>
  );
}

function ReplyTree({
  post,
  byParent,
  depth,
  topIndex,
}: {
  post: ForumPost;
  byParent: Record<number, ForumPost[]>;
  depth: number;
  topIndex: number;
}) {
  const children = byParent[post.id] || [];
  const label = depth === 0 ? `Reply ${topIndex}` : "Nested reply";

  return (
    <View style={styles.replyBranch}>
      <PostCard post={post} depth={depth} label={label} />
      {children.map((child) => (
        <ReplyTree
          key={child.id}
          post={child}
          byParent={byParent}
          depth={depth + 1}
          topIndex={topIndex}
        />
      ))}
    </View>
  );
}

export function ForumThreadScreen() {
  const route = useRoute<ForumThreadRoute>();
  const { threadId } = route.params;
  const postsQuery = useInfiniteQuery({
    queryKey: ["forum", "thread", threadId],
    queryFn: ({ pageParam }) => getForumThreadPosts(threadId, pageParam, POSTS_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.has_next ? lastPage.page + 1 : undefined),
  });
  const pages = postsQuery.data?.pages ?? [];
  const thread = pages[0]?.thread;
  const posts = pages
    .flatMap((page) => page.posts)
    .filter(
      (post, index, allPosts) =>
        allPosts.findIndex((candidate) => candidate.id === post.id) === index,
    );
  const totalReplies = pages[0]?.total_top_level ?? 0;
  const totalPages = pages[0]?.total_pages ?? 1;
  const originalPost = posts[0];
  const replies = posts.slice(1);
  const byParent = replies.reduce<Record<number, ForumPost[]>>((acc, post) => {
    if (post.parent_id) {
      acc[post.parent_id] = [...(acc[post.parent_id] || []), post];
    }
    return acc;
  }, {});
  const topLevelReplies = replies.filter((post) => !post.parent_id);

  return (
    <ScreenShell
      title="Thread"
      subtitle="Read-only forum view. Posting and hearts will unlock after mobile login is connected."
    >
      {postsQuery.isLoading ? <LoadingState message="Loading thread..." /> : null}

      {postsQuery.isError ? (
        <ErrorState message="This discussion could not be loaded. Try again in a moment." />
      ) : null}

      {thread ? (
        <Surface variant="accent" radius="hero" style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.text} />
          </View>
          <View style={styles.heroText}>
            <AppText variant="sectionTitle">{thread.title}</AppText>
            <View style={styles.startedByLine}>
              <AppText tone="muted">Started by</AppText>
              <RoleNameText variant="caption" role={thread.author_role}>
                {thread.author_username || "Unknown"}
              </RoleNameText>
              <AppText tone="muted">
                / {formatForumCount(thread.post_count, "post")} / Last active{" "}
                {formatForumDate(thread.last_post_at || thread.updated_at)}
              </AppText>
            </View>
            <View style={styles.threadFlags}>
              {thread.locked ? (
                <View style={[styles.threadFlag, styles.lockedFlag]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={13}
                    color={colors.warningText}
                  />
                  <AppText variant="caption" style={styles.warningText}>
                    Locked
                  </AppText>
                </View>
              ) : null}
              {thread.latest_first ? (
                <View style={styles.threadFlag}>
                  <Ionicons
                    name="information-circle-outline"
                    size={13}
                    color={colors.accentStrong}
                  />
                  <AppText variant="caption">Latest updates first</AppText>
                </View>
              ) : null}
            </View>
          </View>
        </Surface>
      ) : null}

      {thread ? <ForumSeriesStrip seriesRefs={thread.series_refs} /> : null}

      {originalPost ? (
        <View style={styles.section}>
          <SectionHeader title="Original post" />
          <PostCard post={originalPost} label="Original" />
        </View>
      ) : null}

      {postsQuery.data && posts.length === 0 ? (
        <EmptyState
          title="No posts yet"
          message="Posts for this discussion will appear here once available."
        />
      ) : null}

      {postsQuery.data && topLevelReplies.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader
            title="Replies"
            body={`${formatForumCount(totalReplies, "top-level reply", "top-level replies")} / ${topLevelReplies.length} shown`}
          />
          <View style={styles.stack}>
            {topLevelReplies.map((post, index) => (
              <ReplyTree
                key={post.id}
                post={post}
                byParent={byParent}
                depth={0}
                topIndex={index + 1}
              />
            ))}
          </View>
          {postsQuery.hasNextPage ? (
            <AppButton
              label={
                postsQuery.isFetchingNextPage
                  ? "Loading..."
                  : thread?.latest_first
                    ? "Load older updates"
                    : "Load more replies"
              }
              disabled={postsQuery.isFetchingNextPage}
              onPress={() => postsQuery.fetchNextPage()}
              iconRight={<Ionicons name="chevron-down" size={15} color={colors.text} />}
            />
          ) : totalPages > 1 ? (
            <AppText variant="caption" tone="subtle" align="center">
              All replies are loaded.
            </AppText>
          ) : null}
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
  startedByLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.xs,
  },
  threadFlags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  threadFlag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  lockedFlag: {
    backgroundColor: colors.warningSurface,
    borderColor: colors.warningBorder,
  },
  warningText: {
    color: colors.warningText,
  },
  section: {
    gap: spacing.sm,
  },
  stack: {
    gap: spacing.sm,
  },
  postCard: {
    gap: spacing.sm,
  },
  replyCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accentBorder,
  },
  replyBranch: {
    gap: spacing.sm,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  postAuthor: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  authorLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.xs,
  },
  replyLabel: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  postFooter: {
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
