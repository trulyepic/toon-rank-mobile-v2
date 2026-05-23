import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { createForumPost, getForumThreadPosts, setForumPostVote } from "../api/forum";
import { useAuth } from "../auth/AuthContext";
import {
  AppText,
  AppButton,
  EmptyState,
  ErrorState,
  ForumMentionSuggestions,
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
import type {
  ForumPost,
  ForumThreadPostsPage,
  ForumVote,
  ForumVoteResponse,
} from "../types/forum";
import { formatForumCount, formatForumDate } from "../utils/forumFormatting";
import {
  extractForumSeriesIds,
  getActiveForumMention,
  insertForumMention,
} from "../utils/forumMentions";

type ForumThreadRoute = RouteProp<RootStackParamList, "ForumThread">;
type ForumThreadNavigation = NativeStackNavigationProp<RootStackParamList>;
const POSTS_PAGE_SIZE = 20;
const REPLY_MAX_LENGTH = 2000;

type PendingVote = {
  postId: number;
  vote: ForumVote | null;
};

function PostCard({
  post,
  depth = 0,
  label,
  pendingVote,
  onVote,
  canReply,
  onStartReply,
}: {
  post: ForumPost;
  depth?: number;
  label: string;
  pendingVote: ForumVote | null;
  onVote: (post: ForumPost, vote: ForumVote) => void;
  canReply: boolean;
  onStartReply: (post: ForumPost) => void;
}) {
  const viewerVote = getViewerVote(post);
  const isVoting = pendingVote !== null;
  const upvotes = getUpvoteCount(post);
  const downvotes = getDownvoteCount(post);

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
        <View style={styles.voteGroup}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              viewerVote === "UPVOTE" ? "Remove upvote from post" : "Upvote post"
            }
            disabled={isVoting}
            onPress={() => onVote(post, "UPVOTE")}
            style={({ pressed }) => [
              styles.voteButton,
              viewerVote === "UPVOTE" ? styles.activeUpvoteButton : null,
              isVoting ? styles.disabledBadge : null,
              pressed && !isVoting ? styles.pressedBadge : null,
            ]}
          >
            <Ionicons
              name={viewerVote === "UPVOTE" ? "thumbs-up" : "thumbs-up-outline"}
              size={14}
              color={viewerVote === "UPVOTE" ? colors.success : colors.text}
            />
            <AppText variant="caption">{upvotes}</AppText>
          </Pressable>
          <View style={styles.voteDivider} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              viewerVote === "DOWNVOTE" ? "Remove downvote from post" : "Downvote post"
            }
            disabled={isVoting}
            onPress={() => onVote(post, "DOWNVOTE")}
            style={({ pressed }) => [
              styles.voteButton,
              viewerVote === "DOWNVOTE" ? styles.activeDownvoteButton : null,
              isVoting ? styles.disabledBadge : null,
              pressed && !isVoting ? styles.pressedBadge : null,
            ]}
          >
            <Ionicons
              name={viewerVote === "DOWNVOTE" ? "thumbs-down" : "thumbs-down-outline"}
              size={14}
              color={viewerVote === "DOWNVOTE" ? colors.danger : colors.text}
            />
            <AppText variant="caption">{downvotes}</AppText>
          </Pressable>
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
        {canReply ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Reply to ${post.author_username || "this post"}`}
            onPress={() => onStartReply(post)}
            style={({ pressed }) => [
              styles.replyAction,
              pressed ? styles.pressedBadge : null,
            ]}
          >
            <Ionicons name="return-up-forward-outline" size={13} color={colors.text} />
            <AppText variant="caption">Reply</AppText>
          </Pressable>
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
  pendingVote,
  onVote,
  canReply,
  onStartReply,
}: {
  post: ForumPost;
  byParent: Record<number, ForumPost[]>;
  depth: number;
  topIndex: number;
  pendingVote: PendingVote | null;
  onVote: (post: ForumPost, vote: ForumVote) => void;
  canReply: boolean;
  onStartReply: (post: ForumPost) => void;
}) {
  const children = byParent[post.id] || [];
  const label = depth === 0 ? `Reply ${topIndex}` : "Nested reply";

  return (
    <View style={styles.replyBranch}>
      <PostCard
        post={post}
        depth={depth}
        label={label}
        pendingVote={pendingVote?.postId === post.id ? pendingVote.vote : null}
        onVote={onVote}
        canReply={canReply}
        onStartReply={onStartReply}
      />
      {children.map((child) => (
        <ReplyTree
          key={child.id}
          post={child}
          byParent={byParent}
          depth={depth + 1}
          topIndex={topIndex}
          pendingVote={pendingVote}
          onVote={onVote}
          canReply={canReply}
          onStartReply={onStartReply}
        />
      ))}
    </View>
  );
}

export function ForumThreadScreen() {
  const route = useRoute<ForumThreadRoute>();
  const navigation = useNavigation<ForumThreadNavigation>();
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();
  const [replyText, setReplyText] = useState("");
  const [replyTarget, setReplyTarget] = useState<ForumPost | null>(null);
  const { threadId } = route.params;
  const queryKey = ["forum", "thread", threadId] as const;
  const activeMention = getActiveForumMention(replyText);
  const postsQuery = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => getForumThreadPosts(threadId, pageParam, POSTS_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.has_next ? lastPage.page + 1 : undefined),
  });
  const voteMutation = useMutation({
    mutationFn: ({ postId, vote }: PendingVote) =>
      setForumPostVote(threadId, postId, vote),
    onSuccess: (response, variables) => {
      queryClient.setQueryData<InfiniteData<ForumThreadPostsPage>>(
        queryKey,
        (current) => {
          if (!current) return current;

          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              posts: page.posts.map((post) =>
                post.id === variables.postId
                  ? applyVoteResponseToPost(post, response)
                  : post,
              ),
            })),
          };
        },
      );
    },
    onError: (error) => {
      Alert.alert(
        "Vote not saved",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    },
  });
  const replyMutation = useMutation({
    mutationFn: ({
      contentMarkdown,
      parentId,
    }: {
      contentMarkdown: string;
      parentId?: number | null;
    }) =>
      createForumPost(threadId, {
        content_markdown: contentMarkdown,
        parent_id: parentId ?? null,
        series_ids: extractForumSeriesIds(contentMarkdown),
      }),
    onSuccess: async (createdPost) => {
      setReplyText("");
      setReplyTarget(null);
      queryClient.setQueryData<InfiniteData<ForumThreadPostsPage>>(
        queryKey,
        (current) => {
          if (!current) return current;

          return {
            ...current,
            pages: current.pages.map((page, pageIndex) => {
              if (pageIndex !== 0) return page;
              if (page.posts.some((post) => post.id === createdPost.id)) return page;

              return {
                ...page,
                thread: {
                  ...page.thread,
                  post_count: page.thread.post_count + 1,
                  last_post_at: createdPost.created_at,
                },
                posts: [...page.posts, createdPost],
                total_top_level: createdPost.parent_id
                  ? page.total_top_level
                  : page.total_top_level + 1,
              };
            }),
          };
        },
      );
      void queryClient.invalidateQueries({ queryKey: ["forum", "threads"] });
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      Alert.alert(
        "Reply not posted",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    },
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
  const canReplyToThread = Boolean(thread && !thread.locked);
  const trimmedReply = replyText.trim();
  const canSubmitReply =
    isSignedIn &&
    canReplyToThread &&
    trimmedReply.length > 0 &&
    trimmedReply.length <= REPLY_MAX_LENGTH &&
    !replyMutation.isPending;

  const handleVote = (post: ForumPost, vote: ForumVote) => {
    if (!isSignedIn) {
      Alert.alert("Log in to vote on posts", "Use your Toon Ranks account to react.", [
        { text: "Cancel", style: "cancel" },
        { text: "Log in", onPress: () => navigation.navigate("Login") },
      ]);
      return;
    }

    voteMutation.mutate({
      postId: post.id,
      vote: getViewerVote(post) === vote ? null : vote,
    });
  };
  const handleSubmitReply = () => {
    if (!isSignedIn) {
      Alert.alert(
        "Log in to reply",
        "Use your Toon Ranks account to join the discussion.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log in", onPress: () => navigation.navigate("Login") },
        ],
      );
      return;
    }

    if (!canReplyToThread) {
      Alert.alert("Thread is locked", "This discussion is no longer accepting replies.");
      return;
    }

    if (!trimmedReply) {
      Alert.alert("Write a reply first", "Add a message before posting.");
      return;
    }

    if (trimmedReply.length > REPLY_MAX_LENGTH) {
      Alert.alert(
        "Reply is too long",
        `Keep replies under ${REPLY_MAX_LENGTH.toLocaleString()} characters.`,
      );
      return;
    }

    replyMutation.mutate({
      contentMarkdown: trimmedReply,
      parentId: replyTarget?.id ?? null,
    });
  };
  const handleStartReply = (post: ForumPost) => {
    if (!isSignedIn) {
      Alert.alert(
        "Log in to reply",
        "Use your Toon Ranks account to join the discussion.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log in", onPress: () => navigation.navigate("Login") },
        ],
      );
      return;
    }

    if (!canReplyToThread) {
      Alert.alert("Thread is locked", "This discussion is no longer accepting replies.");
      return;
    }

    setReplyTarget(post);
  };

  return (
    <ScreenShell
      title="Thread"
      subtitle="Read public discussions, vote, and reply with your Toon Ranks account."
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
          <PostCard
            post={originalPost}
            label="Original"
            pendingVote={
              voteMutation.isPending && voteMutation.variables?.postId === originalPost.id
                ? voteMutation.variables.vote
                : null
            }
            onVote={handleVote}
            canReply={canReplyToThread}
            onStartReply={handleStartReply}
          />
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
                pendingVote={
                  voteMutation.isPending ? (voteMutation.variables ?? null) : null
                }
                onVote={handleVote}
                canReply={canReplyToThread}
                onStartReply={handleStartReply}
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

      {thread ? (
        <Surface variant="raised" radius="xl" style={styles.replyComposer}>
          <View style={styles.composerHeader}>
            <View style={styles.composerTitle}>
              <Ionicons
                name={thread.locked ? "lock-closed-outline" : "return-up-forward-outline"}
                size={18}
                color={thread.locked ? colors.warningText : colors.accentStrong}
              />
              <AppText variant="cardTitle">
                {thread.locked
                  ? "Thread locked"
                  : replyTarget
                    ? "Reply to post"
                    : "Reply in thread"}
              </AppText>
            </View>
            <AppText
              variant="caption"
              tone={replyText.length > REPLY_MAX_LENGTH ? "danger" : "subtle"}
            >
              {replyText.length}/{REPLY_MAX_LENGTH}
            </AppText>
          </View>

          {thread.locked ? (
            <AppText tone="muted">
              This discussion is locked, so new replies are disabled on mobile and web.
            </AppText>
          ) : isSignedIn ? (
            <>
              {replyTarget ? (
                <View style={styles.replyTargetCard}>
                  <View style={styles.replyTargetText}>
                    <AppText variant="caption" tone="muted">
                      Replying to
                    </AppText>
                    <RoleNameText variant="caption" role={replyTarget.author_role}>
                      {`@${replyTarget.author_username || "reader"}`}
                    </RoleNameText>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear reply target"
                    onPress={() => setReplyTarget(null)}
                    style={({ pressed }) => [
                      styles.clearReplyTarget,
                      pressed ? styles.pressedBadge : null,
                    ]}
                  >
                    <Ionicons name="close" size={16} color={colors.text} />
                  </Pressable>
                </View>
              ) : null}
              <TextInput
                autoCapitalize="sentences"
                autoCorrect
                multiline
                textAlignVertical="top"
                value={replyText}
                onChangeText={setReplyText}
                placeholder={
                  replyTarget
                    ? `Reply to ${replyTarget.author_username || "this post"}...`
                    : "Write a reply..."
                }
                placeholderTextColor={colors.textSubtle}
                style={styles.replyInput}
              />
              <ForumMentionSuggestions
                mention={activeMention}
                onSelect={(series) => {
                  setReplyText((current) =>
                    activeMention
                      ? insertForumMention(current, activeMention, series).slice(
                          0,
                          REPLY_MAX_LENGTH,
                        )
                      : current,
                  );
                }}
              />
              <View style={styles.composerActions}>
                <AppText variant="caption" tone="muted" style={styles.composerHint}>
                  Markdown is supported. Type @ to reference a series. Image uploads are
                  next.
                </AppText>
                <AppButton
                  label={replyMutation.isPending ? "Posting..." : "Post reply"}
                  disabled={!canSubmitReply}
                  onPress={handleSubmitReply}
                  iconLeft={
                    replyMutation.isPending ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <Ionicons name="send-outline" size={15} color={colors.text} />
                    )
                  }
                />
              </View>
            </>
          ) : (
            <View style={styles.signInPrompt}>
              <AppText tone="muted" style={styles.signInPromptText}>
                Log in with your Toon Ranks account to post a reply.
              </AppText>
              <AppButton
                label="Log in"
                onPress={() => navigation.navigate("Login")}
                iconLeft={
                  <Ionicons name="log-in-outline" size={15} color={colors.text} />
                }
              />
            </View>
          )}
        </Surface>
      ) : null}
    </ScreenShell>
  );
}

function applyVoteResponseToPost(
  post: ForumPost,
  response: ForumVoteResponse,
): ForumPost {
  return {
    ...post,
    upvote_count: response.upvote_count,
    downvote_count: response.downvote_count,
    viewer_vote: response.vote,
    heart_count: response.upvote_count,
    viewer_has_hearted: response.vote === "UPVOTE",
  };
}

function getViewerVote(post: ForumPost): ForumVote | null {
  if (post.viewer_vote) {
    return post.viewer_vote;
  }

  return post.viewer_has_hearted ? "UPVOTE" : null;
}

function getUpvoteCount(post: ForumPost) {
  return post.upvote_count ?? post.heart_count ?? 0;
}

function getDownvoteCount(post: ForumPost) {
  return post.downvote_count ?? 0;
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
  replyComposer: {
    gap: spacing.md,
  },
  composerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  composerTitle: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  replyTargetCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  replyTargetText: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.xs,
  },
  clearReplyTarget: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  replyInput: {
    minHeight: 132,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSoft,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    lineHeight: 22,
  },
  composerActions: {
    gap: spacing.sm,
  },
  composerHint: {
    flexShrink: 1,
  },
  signInPrompt: {
    gap: spacing.sm,
  },
  signInPromptText: {
    flexShrink: 1,
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
  voteGroup: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: "hidden",
  },
  voteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  activeUpvoteButton: {
    backgroundColor: "rgba(14, 167, 106, 0.16)",
  },
  activeDownvoteButton: {
    backgroundColor: "rgba(235, 106, 90, 0.14)",
  },
  voteDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: colors.borderSoft,
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
  replyAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  disabledBadge: {
    opacity: 0.65,
  },
  pressedBadge: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
