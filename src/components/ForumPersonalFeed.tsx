import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, View } from "react-native";

import { getMyBookmarkedPosts, getMyFollowedThreads } from "../api/forum";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import { timeAgo } from "../utils/timeAgo";
import { AppButton } from "./AppButton";
import { AppText } from "./AppText";
import { ForumMarkdown } from "./ForumMarkdown";
import { EmptyState, ErrorState, LoadingState } from "./StateMessage";
import { Surface } from "./Surface";

export type ForumPersonalView = "following" | "bookmarked";

/** True when the markdown embeds an image (so the row can show an "Image" badge). */
export function hasMarkdownImage(markdown: string): boolean {
  return (
    /!\[[^\]]*]\(\s*https?:\/\/[^)]+\)/i.test(markdown) ||
    /\[[^\]]*]\(\s*https?:\/\/[^)]+\.(?:png|jpe?g|webp|gif)(?:[?#][^)]*)?\s*\)/i.test(
      markdown,
    ) ||
    /<img\b[^>]*\bsrc=/i.test(markdown)
  );
}

// Drop series-ref link syntax so the preview shows the label, not "series:209".
function previewSafeMarkdown(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+?)\]\(\s*series:\s*\d+\s*\)/gi, "$1")
    .replace(/\[([^\]]+?)\]\(\s*\/series\/\d+(?:[?#][^)]+)?\s*\)/gi, "$1")
    .trim();
}

/**
 * The personalized forum feeds ("Following" + "Bookmarked") shown to signed-in
 * users via the tabs on the Forum screen. Reuses the existing follow/bookmark
 * endpoints (GET /forum/me/following, GET /forum/me/bookmarks) — presentation
 * only, no new backend. Discover stays the default landing for everyone.
 */
export function ForumPersonalFeed({ view }: { view: ForumPersonalView }) {
  const styles = getStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Paged (was page-1-only, which silently hid anything past 20 items).
  const followingQuery = useInfiniteQuery({
    queryKey: ["forum", "me", "following"],
    queryFn: ({ pageParam }) => getMyFollowedThreads(pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.has_next ? lastPage.page + 1 : undefined),
    enabled: view === "following",
    staleTime: 60 * 1000,
  });
  const bookmarksQuery = useInfiniteQuery({
    queryKey: ["forum", "me", "bookmarks"],
    queryFn: ({ pageParam }) => getMyBookmarkedPosts(pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.has_next ? lastPage.page + 1 : undefined),
    enabled: view === "bookmarked",
    staleTime: 60 * 1000,
  });

  const active = view === "following" ? followingQuery : bookmarksQuery;
  const loadMoreButton = active.hasNextPage ? (
    <AppButton
      label={active.isFetchingNextPage ? "Loading..." : "Load more"}
      disabled={active.isFetchingNextPage}
      onPress={() => void active.fetchNextPage()}
      iconRight={<Ionicons name="chevron-down" size={15} color={colors.text} />}
    />
  ) : null;

  if (active.isLoading) {
    return (
      <LoadingState
        message={
          view === "following"
            ? "Loading followed threads..."
            : "Loading bookmarked posts..."
        }
      />
    );
  }

  if (active.isError) {
    return (
      <ErrorState
        message={`Could not load your ${
          view === "following" ? "followed threads" : "bookmarked posts"
        }. Try again in a moment.`}
      />
    );
  }

  if (view === "following") {
    const threads = followingQuery.data?.pages.flatMap((p) => p.items) ?? [];
    if (threads.length === 0) {
      return (
        <EmptyState
          title="No followed threads yet"
          message="Open any thread and tap Follow to keep up with new replies here."
        />
      );
    }
    return (
      <View style={styles.list}>
        {/* Flat divided feed — matches the Discover thread list */}
        <Surface variant="raised" radius="xl" padding="none" style={styles.feed}>
          {threads.map((thread, index) => {
            const replyCount = Math.max(0, (thread.post_count ?? 1) - 1);
            return (
              <Pressable
                key={thread.id}
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate("ForumThread", { threadId: thread.id })
                }
                style={({ pressed }) => [
                  styles.row,
                  index === threads.length - 1 ? styles.rowLast : null,
                  pressed ? styles.pressedRow : null,
                ]}
              >
                <View style={styles.titleRow}>
                  <AppText variant="cardTitle" numberOfLines={2} style={styles.flex1}>
                    {thread.title}
                  </AppText>
                  {thread.has_unread ? (
                    <View style={styles.newBadge}>
                      <AppText style={styles.newBadgeText}>New</AppText>
                    </View>
                  ) : null}
                </View>
                <View style={styles.metaRow}>
                  <AppText variant="caption" tone="muted">
                    {replyCount} {replyCount === 1 ? "reply" : "replies"}
                  </AppText>
                  <AppText variant="caption" tone="subtle">
                    ·
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    active {timeAgo(thread.last_post_at || thread.updated_at)}
                  </AppText>
                  {thread.category_name ? (
                    <>
                      <AppText variant="caption" tone="subtle">
                        ·
                      </AppText>
                      <AppText variant="caption" tone="muted">
                        {thread.category_name}
                      </AppText>
                    </>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </Surface>
        {loadMoreButton}
      </View>
    );
  }

  const posts = bookmarksQuery.data?.pages.flatMap((p) => p.items) ?? [];
  if (posts.length === 0) {
    return (
      <EmptyState
        title="No bookmarked posts yet"
        message="Open any post, tap the … menu, and choose Save post to keep it here."
      />
    );
  }
  return (
    <View style={styles.list}>
      {/* Flat divided feed — matches the Discover thread list */}
      <Surface variant="raised" radius="xl" padding="none" style={styles.feed}>
        {posts.map((post, index) => {
          const hasImage = hasMarkdownImage(post.content_markdown);
          const preview = previewSafeMarkdown(post.content_markdown);
          return (
            <Pressable
              key={post.id}
              accessibilityRole="button"
              disabled={!post.thread_id}
              onPress={() =>
                post.thread_id != null &&
                navigation.navigate("ForumThread", {
                  threadId: post.thread_id,
                  postId: post.id,
                })
              }
              style={({ pressed }) => [
                styles.row,
                index === posts.length - 1 ? styles.rowLast : null,
                pressed ? styles.pressedRow : null,
              ]}
            >
              <View style={styles.metaRow}>
                <AppText variant="caption" style={styles.author}>
                  {post.author_username || "Anonymous"}
                </AppText>
                <AppText variant="caption" tone="subtle">
                  ·
                </AppText>
                <AppText variant="caption" tone="muted">
                  {timeAgo(post.created_at)}
                </AppText>
                {hasImage ? (
                  <View style={styles.imageBadge}>
                    <Ionicons
                      name="image-outline"
                      size={11}
                      color={colors.accentStrong}
                    />
                    <AppText style={styles.imageBadgeText}>Image</AppText>
                  </View>
                ) : null}
              </View>
              <View style={styles.preview}>
                {preview ? (
                  <ForumMarkdown markdown={preview} />
                ) : (
                  <AppText tone="muted">(no content)</AppText>
                )}
              </View>
            </Pressable>
          );
        })}
      </Surface>
      {loadMoreButton}
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
    list: {
      gap: spacing.sm,
    },
    feed: {
      overflow: "hidden",
    },
    row: {
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSoft,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    pressedRow: {
      backgroundColor: colors.backgroundSoft,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.xs,
    },
    flex1: {
      flex: 1,
      minWidth: 0,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: spacing.xs,
    },
    author: {
      color: colors.text,
    },
    newBadge: {
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accentBorder,
      borderRadius: radii.pill,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    newBadgeText: {
      color: colors.accentStrong,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    imageBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accentBorder,
      borderRadius: radii.pill,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    imageBadgeText: {
      color: colors.accentStrong,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    // Cap the snippet height so a long bookmarked post stays a preview.
    preview: {
      maxHeight: 160,
      overflow: "hidden",
    },
    pressed: {
      opacity: 0.86,
      transform: [{ scale: 0.99 }],
    },
  });
}
