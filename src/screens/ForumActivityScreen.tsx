import Ionicons from "@expo/vector-icons/Ionicons";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";

import {
  getMyBookmarkedPosts,
  getMyFollowedThreads,
  getMyForumPosts,
  getMyForumThreads,
  getMyForumVotes,
  togglePostBookmark,
  toggleThreadFollow,
} from "../api/forum";
import { useAuth } from "../auth/AuthContext";
import {
  AccountRequiredCard,
  AppButton,
  AppText,
  ChipButton,
  EmptyState,
  ErrorState,
  LoadingState,
  RoleNameText,
  ScreenShell,
  Surface,
} from "../components";
import { stripMarkdownToText } from "../components/ForumMarkdown";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import type { ForumPost, ForumThread } from "../types/forum";

type Tab = "threads" | "posts" | "votes" | "following" | "saved";
type ForumActivityNav = NativeStackNavigationProp<RootStackParamList>;

const PAGE_SIZE = 10;

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function truncate(text: string, max = 120): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

// ─── Row components ──────────────────────────────────────────────────────────

function ThreadRow({ thread }: { thread: ForumThread }) {
  const styles = getStyles();
  const navigation = useNavigation<ForumActivityNav>();
  return (
    <Pressable
      onPress={() => navigation.navigate("ForumThread", { threadId: thread.id })}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowBody}>
        <AppText variant="cardTitle" numberOfLines={2} style={styles.threadTitle}>
          {thread.title}
        </AppText>
        <AppText tone="muted" style={styles.rowMeta}>
          {thread.post_count} {thread.post_count === 1 ? "post" : "posts"} · updated{" "}
          {shortDate(thread.updated_at)}
        </AppText>
      </View>
      {thread.locked ? (
        <View style={styles.lockedBadge}>
          <AppText style={styles.lockedText}>Locked</AppText>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
      )}
    </Pressable>
  );
}

function FollowingRow({
  thread,
  onUnfollow,
  isUnfollowing,
}: {
  thread: ForumThread;
  onUnfollow: () => void;
  isUnfollowing: boolean;
}) {
  const styles = getStyles();
  const navigation = useNavigation<ForumActivityNav>();
  return (
    <Surface variant="raised" radius="xl" style={styles.followingCard}>
      <Pressable
        onPress={() => navigation.navigate("ForumThread", { threadId: thread.id })}
        style={({ pressed }) => [styles.followingRow, pressed && styles.rowPressed]}
      >
        <View style={styles.rowBody}>
          <AppText variant="cardTitle" numberOfLines={2} style={styles.threadTitle}>
            {thread.title}
          </AppText>
          <AppText tone="muted" style={styles.rowMeta}>
            {thread.post_count} {thread.post_count === 1 ? "post" : "posts"} · updated{" "}
            {shortDate(thread.updated_at)}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Unfollow thread"
        onPress={onUnfollow}
        disabled={isUnfollowing}
        style={({ pressed }) => [styles.unfollowButton, pressed && styles.rowPressed]}
      >
        <Ionicons name="notifications-off-outline" size={13} color={colors.textMuted} />
        <AppText variant="caption" tone="muted">
          Unfollow
        </AppText>
      </Pressable>
    </Surface>
  );
}

function PostRow({ post, showVoteBadge }: { post: ForumPost; showVoteBadge?: boolean }) {
  const styles = getStyles();
  const navigation = useNavigation<ForumActivityNav>();
  const threadId = post.thread_id;

  return (
    <Surface variant="raised" radius="xl" style={styles.postCard}>
      <View style={styles.postCardTop}>
        <AppText tone="muted" style={styles.postContent} numberOfLines={4}>
          {truncate(stripMarkdownToText(post.content_markdown))}
        </AppText>
        {showVoteBadge && post.viewer_vote ? (
          <View
            style={[
              styles.voteBadge,
              post.viewer_vote === "UPVOTE" ? styles.voteBadgeUp : styles.voteBadgeDown,
            ]}
          >
            <Ionicons
              name={post.viewer_vote === "UPVOTE" ? "thumbs-up" : "thumbs-down"}
              size={11}
              color={post.viewer_vote === "UPVOTE" ? colors.success : colors.danger}
            />
            <AppText
              style={[
                styles.voteBadgeText,
                post.viewer_vote === "UPVOTE" ? styles.voteTextUp : styles.voteTextDown,
              ]}
            >
              {post.viewer_vote === "UPVOTE" ? "Up" : "Down"}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.postCardFooter}>
        <AppText tone="muted" style={styles.rowMeta}>
          {shortDate(post.created_at)}
        </AppText>
        {threadId ? (
          <Pressable
            onPress={() =>
              navigation.navigate("ForumThread", { threadId, postId: post.id })
            }
            hitSlop={8}
          >
            <AppText style={styles.viewThreadLink}>View →</AppText>
          </Pressable>
        ) : null}
      </View>
    </Surface>
  );
}

function SavedRow({
  post,
  onRemove,
  isRemoving,
}: {
  post: ForumPost;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const styles = getStyles();
  const navigation = useNavigation<ForumActivityNav>();
  const threadId = post.thread_id;
  const isEdited =
    new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 10000;

  return (
    <Surface variant="raised" radius="xl" style={styles.postCard}>
      <AppText tone="muted" style={styles.postContent} numberOfLines={4}>
        {truncate(stripMarkdownToText(post.content_markdown), 140)}
      </AppText>
      <View style={styles.postCardFooter}>
        <View style={styles.savedMeta}>
          <AppText tone="muted" style={styles.rowMeta}>
            {post.author_username ? `@${post.author_username} · ` : ""}
            {shortDate(post.created_at)}
            {isEdited ? " (edited)" : ""}
          </AppText>
        </View>
        <View style={styles.savedActions}>
          {threadId ? (
            <Pressable
              onPress={() =>
                navigation.navigate("ForumThread", { threadId, postId: post.id })
              }
              hitSlop={8}
            >
              <AppText style={styles.viewThreadLink}>View →</AppText>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove bookmark"
            onPress={onRemove}
            disabled={isRemoving}
            hitSlop={8}
          >
            <Ionicons name="close-circle-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>
    </Surface>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function ForumActivityScreen() {
  const styles = getStyles();
  const { isSignedIn, user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("threads");

  const threadsQuery = useInfiniteQuery({
    queryKey: ["forum", "me", "threads"],
    queryFn: ({ pageParam }) => getMyForumThreads(pageParam as number, PAGE_SIZE),
    getNextPageParam: (lastPage) => (lastPage.has_next ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    enabled: isSignedIn,
  });

  const postsQuery = useInfiniteQuery({
    queryKey: ["forum", "me", "posts"],
    queryFn: ({ pageParam }) => getMyForumPosts(pageParam as number, PAGE_SIZE),
    getNextPageParam: (lastPage) => (lastPage.has_next ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    enabled: isSignedIn,
  });

  const votesQuery = useInfiniteQuery({
    queryKey: ["forum", "me", "votes"],
    queryFn: ({ pageParam }) => getMyForumVotes(pageParam as number, PAGE_SIZE),
    getNextPageParam: (lastPage) => (lastPage.has_next ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    enabled: isSignedIn,
  });

  // Lazy — only fetched when the tab is first opened
  const followingQuery = useInfiniteQuery({
    queryKey: ["forum", "me", "following"],
    queryFn: ({ pageParam }) => getMyFollowedThreads(pageParam as number, PAGE_SIZE),
    getNextPageParam: (lastPage) => (lastPage.has_next ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    enabled: isSignedIn && tab === "following",
  });

  const savedQuery = useInfiniteQuery({
    queryKey: ["forum", "me", "bookmarks"],
    queryFn: ({ pageParam }) => getMyBookmarkedPosts(pageParam as number, PAGE_SIZE),
    getNextPageParam: (lastPage) => (lastPage.has_next ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    enabled: isSignedIn && tab === "saved",
  });

  const unfollowMutation = useMutation({
    mutationFn: (threadId: number) => toggleThreadFollow(threadId),
    onSuccess: (_result, threadId) => {
      queryClient.setQueryData<{ pages: { items: ForumThread[] }[] }>(
        ["forum", "me", "following"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.filter((t) => t.id !== threadId),
            })),
          };
        },
      );
    },
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: ({ threadId, postId }: { threadId: number; postId: number }) =>
      togglePostBookmark(threadId, postId),
    onSuccess: (_result, { postId }) => {
      queryClient.setQueryData<{ pages: { items: ForumPost[] }[] }>(
        ["forum", "me", "bookmarks"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.filter((p) => p.id !== postId),
            })),
          };
        },
      );
    },
  });

  const threadsCount = threadsQuery.data?.pages[0]?.total;
  const postsCount = postsQuery.data?.pages[0]?.total;
  const votesCount = votesQuery.data?.pages[0]?.total;
  const followingCount = followingQuery.data?.pages[0]?.total;
  const savedCount = savedQuery.data?.pages[0]?.total;

  const threads = threadsQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const posts = postsQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const votes = votesQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const following = followingQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const saved = savedQuery.data?.pages.flatMap((p) => p.items) ?? [];

  function tabLabel(base: string, count: number | undefined, loading: boolean) {
    if (loading) return `${base} (…)`;
    if (count !== undefined) return `${base} (${count})`;
    return base;
  }

  return (
    <ScreenShell
      title="Forum Activity"
      subtitle="Your threads, replies, and votes across the community."
    >
      {/* Sign-in guard */}
      {!isSignedIn ? (
        <AccountRequiredCard
          title="Log in to see your forum trail"
          body="Your threads, replies, and votes use the same Toon Ranks account as the website."
        />
      ) : null}

      {/* Hero identity card */}
      {isSignedIn ? (
        <Surface variant="accent" radius="hero" style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="chatbubbles-outline" size={24} color={colors.text} />
          </View>
          <View style={styles.heroText}>
            <View style={styles.activityTitleLine}>
              <RoleNameText variant="sectionTitle" role={user?.role}>
                {user?.username ?? "Reader"}
              </RoleNameText>
              <AppText variant="sectionTitle"> activity</AppText>
            </View>
            <AppText tone="muted">
              {"Everything you've posted, replied, voted on, and saved."}
            </AppText>
          </View>
        </Surface>
      ) : null}

      {/* Tab switcher + content — only when signed in */}
      {isSignedIn ? (
        <View style={styles.tabSection}>
          {/* Tab pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabRow}
          >
            <ChipButton
              label={tabLabel("Threads", threadsCount, threadsQuery.isLoading)}
              selected={tab === "threads"}
              onPress={() => setTab("threads")}
            />
            <ChipButton
              label={tabLabel("Replies", postsCount, postsQuery.isLoading)}
              selected={tab === "posts"}
              onPress={() => setTab("posts")}
            />
            <ChipButton
              label={tabLabel("Votes", votesCount, votesQuery.isLoading)}
              selected={tab === "votes"}
              onPress={() => setTab("votes")}
            />
            <ChipButton
              label={tabLabel(
                "Following",
                followingCount,
                tab === "following" && followingQuery.isLoading,
              )}
              selected={tab === "following"}
              onPress={() => setTab("following")}
            />
            <ChipButton
              label={tabLabel(
                "Saved",
                savedCount,
                tab === "saved" && savedQuery.isLoading,
              )}
              selected={tab === "saved"}
              onPress={() => setTab("saved")}
            />
          </ScrollView>

          {/* Threads tab */}
          {tab === "threads" ? (
            <View style={styles.tabContent}>
              {threadsQuery.isLoading ? (
                <LoadingState message="Loading your threads…" />
              ) : threadsQuery.isError ? (
                <ErrorState message="Could not load threads. Try again in a moment." />
              ) : threads.length === 0 ? (
                <EmptyState message="You haven't created any threads yet." />
              ) : (
                <>
                  <View style={styles.list}>
                    {threads.map((t) => (
                      <Surface
                        key={t.id}
                        variant="raised"
                        radius="xl"
                        style={styles.threadRow}
                      >
                        <ThreadRow thread={t} />
                      </Surface>
                    ))}
                  </View>
                  {threadsQuery.hasNextPage ? (
                    <AppButton
                      label={threadsQuery.isFetchingNextPage ? "Loading…" : "Load more"}
                      variant="secondary"
                      disabled={threadsQuery.isFetchingNextPage}
                      onPress={() => void threadsQuery.fetchNextPage()}
                    />
                  ) : null}
                </>
              )}
            </View>
          ) : null}

          {/* Replies tab */}
          {tab === "posts" ? (
            <View style={styles.tabContent}>
              {postsQuery.isLoading ? (
                <LoadingState message="Loading your replies…" />
              ) : postsQuery.isError ? (
                <ErrorState message="Could not load replies. Try again in a moment." />
              ) : posts.length === 0 ? (
                <EmptyState message="You haven't written any replies yet." />
              ) : (
                <>
                  <View style={styles.list}>
                    {posts.map((p) => (
                      <PostRow key={p.id} post={p} />
                    ))}
                  </View>
                  {postsQuery.hasNextPage ? (
                    <AppButton
                      label={postsQuery.isFetchingNextPage ? "Loading…" : "Load more"}
                      variant="secondary"
                      disabled={postsQuery.isFetchingNextPage}
                      onPress={() => void postsQuery.fetchNextPage()}
                    />
                  ) : null}
                </>
              )}
            </View>
          ) : null}

          {/* Votes tab */}
          {tab === "votes" ? (
            <View style={styles.tabContent}>
              {votesQuery.isLoading ? (
                <LoadingState message="Loading your votes…" />
              ) : votesQuery.isError ? (
                <ErrorState message="Could not load votes. Try again in a moment." />
              ) : votes.length === 0 ? (
                <EmptyState message="You haven't voted on any posts yet." />
              ) : (
                <>
                  <View style={styles.list}>
                    {votes.map((p) => (
                      <PostRow key={p.id} post={p} showVoteBadge />
                    ))}
                  </View>
                  {votesQuery.hasNextPage ? (
                    <AppButton
                      label={votesQuery.isFetchingNextPage ? "Loading…" : "Load more"}
                      variant="secondary"
                      disabled={votesQuery.isFetchingNextPage}
                      onPress={() => void votesQuery.fetchNextPage()}
                    />
                  ) : null}
                </>
              )}
            </View>
          ) : null}

          {/* Following tab */}
          {tab === "following" ? (
            <View style={styles.tabContent}>
              {followingQuery.isLoading ? (
                <LoadingState message="Loading followed threads…" />
              ) : followingQuery.isError ? (
                <ErrorState message="Could not load followed threads. Try again." />
              ) : following.length === 0 ? (
                <EmptyState
                  title="No followed threads"
                  message="Tap Follow on a thread to get notified of new replies."
                />
              ) : (
                <>
                  <View style={styles.list}>
                    {following.map((t) => (
                      <FollowingRow
                        key={t.id}
                        thread={t}
                        isUnfollowing={
                          unfollowMutation.isPending &&
                          unfollowMutation.variables === t.id
                        }
                        onUnfollow={() => unfollowMutation.mutate(t.id)}
                      />
                    ))}
                  </View>
                  {followingQuery.hasNextPage ? (
                    <AppButton
                      label={followingQuery.isFetchingNextPage ? "Loading…" : "Load more"}
                      variant="secondary"
                      disabled={followingQuery.isFetchingNextPage}
                      onPress={() => void followingQuery.fetchNextPage()}
                    />
                  ) : null}
                </>
              )}
            </View>
          ) : null}

          {/* Saved tab */}
          {tab === "saved" ? (
            <View style={styles.tabContent}>
              {savedQuery.isLoading ? (
                <LoadingState message="Loading saved posts…" />
              ) : savedQuery.isError ? (
                <ErrorState message="Could not load saved posts. Try again." />
              ) : saved.length === 0 ? (
                <EmptyState
                  title="No saved posts"
                  message="Tap the bookmark icon on any post to save it here."
                />
              ) : (
                <>
                  <View style={styles.list}>
                    {saved.map((p) => (
                      <SavedRow
                        key={p.id}
                        post={p}
                        isRemoving={
                          removeBookmarkMutation.isPending &&
                          removeBookmarkMutation.variables?.postId === p.id
                        }
                        onRemove={() =>
                          p.thread_id
                            ? removeBookmarkMutation.mutate({
                                threadId: p.thread_id,
                                postId: p.id,
                              })
                            : undefined
                        }
                      />
                    ))}
                  </View>
                  {savedQuery.hasNextPage ? (
                    <AppButton
                      label={savedQuery.isFetchingNextPage ? "Loading…" : "Load more"}
                      variant="secondary"
                      disabled={savedQuery.isFetchingNextPage}
                      onPress={() => void savedQuery.fetchNextPage()}
                    />
                  ) : null}
                </>
              )}
            </View>
          ) : null}
        </View>
      ) : null}
    </ScreenShell>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function getStyles() {
  return StyleSheet.create({
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
  activityTitleLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
  },
  tabSection: {
    gap: spacing.md,
  },
  tabRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tabContent: {
    gap: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  // Thread row
  threadRow: {
    padding: 0,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
  },
  rowPressed: {
    opacity: 0.75,
  },
  rowBody: {
    flex: 1,
    gap: spacing.xs,
  },
  threadTitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  rowMeta: {
    fontSize: 12,
  },
  lockedBadge: {
    backgroundColor: colors.warningSurface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  lockedText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.warningText,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  // Following row
  followingCard: {
    gap: 0,
    overflow: "hidden",
  },
  followingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
  },
  unfollowButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  // Post / vote rows
  postCard: {
    gap: spacing.sm,
  },
  postCardTop: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  postContent: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  postCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  savedMeta: {
    flex: 1,
    minWidth: 0,
  },
  savedActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  viewThreadLink: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accentStrong,
  },
  // Vote badge
  voteBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
  },
  voteBadgeUp: {
    backgroundColor: "rgba(14, 167, 106, 0.12)",
    borderColor: "rgba(14, 167, 106, 0.3)",
  },
  voteBadgeDown: {
    backgroundColor: "rgba(235, 106, 90, 0.12)",
    borderColor: "rgba(235, 106, 90, 0.3)",
  },
  voteBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  voteTextUp: {
    color: colors.success,
  },
  voteTextDown: {
    color: colors.danger,
  },
});
}
