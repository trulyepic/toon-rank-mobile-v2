import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import {
  createForumPost,
  deleteForumPost,
  deleteForumPostMine,
  deleteForumThread,
  editForumPost,
  getForumThreadPosts,
  lockForumThread,
  setForumPostVote,
  updateForumThread,
  updateForumThreadSettings,
  uploadForumMedia,
} from "../api/forum";
import { useAuth } from "../auth/AuthContext";
import {
  AppText,
  AppButton,
  EmptyState,
  ErrorState,
  ForumComposerToolbar,
  ForumMentionSuggestions,
  ForumMarkdown,
  ForumSeriesStrip,
  LoadingState,
  RankerBadge,
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
  SeriesRef,
} from "../types/forum";
import { formatForumCount, formatForumDate } from "../utils/forumFormatting";
import {
  type ActiveMention,
  extractForumSeriesIds,
  getActiveForumMention,
  insertForumMention,
} from "../utils/forumMentions";
import {
  appendForumMediaMarkdown,
  pickForumMediaAttachment,
  type ForumMediaAttachment,
} from "../utils/forumMedia";
import {
  applyForumFormat,
  type ForumFormatAction,
  type ForumTextSelection,
} from "../utils/forumComposerFormatting";
import { rankForUsername, useTopRankMap } from "../hooks/useTopRankMap";

type ForumThreadRoute = RouteProp<RootStackParamList, "ForumThread">;
type ForumThreadNavigation = NativeStackNavigationProp<RootStackParamList>;
const POSTS_PAGE_SIZE = 20;
const REPLY_MAX_LENGTH = 2000;
const MAX_TITLE_LENGTH = 200;

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
  isOwner,
  isAdmin,
  isEditing,
  editText,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  isSavingEdit,
  onDelete,
  onRegisterRef,
  rank,
  onAuthorPress,
}: {
  post: ForumPost;
  depth?: number;
  label: string;
  pendingVote: ForumVote | null;
  onVote: (post: ForumPost, vote: ForumVote) => void;
  canReply: boolean;
  onStartReply: (post: ForumPost) => void;
  isOwner: boolean;
  isAdmin: boolean;
  isEditing: boolean;
  editText: string;
  onEditStart: (post: ForumPost) => void;
  onEditChange: (text: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  isSavingEdit: boolean;
  onDelete: (post: ForumPost) => void;
  onRegisterRef?: (ref: View | null) => void;
  rank?: number;
  onAuthorPress?: (username: string) => void;
}) {
  const viewerVote = getViewerVote(post);
  const isVoting = pendingVote !== null;
  const upvotes = getUpvoteCount(post);
  const downvotes = getDownvoteCount(post);
  const canEdit = isOwner || isAdmin;
  const canDelete = isOwner || isAdmin;

  return (
    <Surface
      ref={(r) => onRegisterRef?.(r)}
      variant="raised"
      radius="xl"
      style={[
        styles.postCard,
        depth > 0 ? styles.replyCard : null,
        depth > 0 ? { marginLeft: Math.min(depth, 4) * 14 } : null,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${post.author_username || "reader"}'s profile`}
        disabled={!post.author_username}
        onPress={() => {
          if (post.author_username) onAuthorPress?.(post.author_username);
        }}
        style={({ pressed }) => [
          styles.postHeader,
          pressed ? styles.pressedBadge : null,
          !post.author_username ? styles.disabledBadge : null,
        ]}
      >
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
            <RankerBadge rank={rank} />
            <View style={styles.replyLabel}>
              <AppText variant="caption">{label}</AppText>
            </View>
          </View>
          <AppText variant="caption" tone="muted">
            {formatForumDate(post.created_at)}
          </AppText>
        </View>
      </Pressable>

      {isEditing ? (
        <View style={styles.editBlock}>
          <TextInput
            autoCapitalize="sentences"
            autoCorrect
            multiline
            textAlignVertical="top"
            value={editText}
            onChangeText={onEditChange}
            placeholderTextColor={colors.textSubtle}
            style={styles.replyInput}
          />
          <View style={styles.editActions}>
            <AppButton
              label={isSavingEdit ? "Saving..." : "Save"}
              disabled={isSavingEdit || editText.trim().length === 0}
              onPress={onEditSave}
              iconLeft={
                isSavingEdit ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Ionicons name="checkmark-outline" size={15} color={colors.text} />
                )
              }
            />
            <AppButton
              label="Cancel"
              disabled={isSavingEdit}
              onPress={onEditCancel}
              iconLeft={<Ionicons name="close-outline" size={15} color={colors.text} />}
            />
          </View>
        </View>
      ) : (
        <>
          <ForumMarkdown markdown={post.content_markdown} />
          <ForumSeriesStrip seriesRefs={post.series_refs} />
        </>
      )}

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
        {canReply && !isEditing ? (
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
        {canEdit && !isEditing ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit post"
            onPress={() => onEditStart(post)}
            style={({ pressed }) => [
              styles.replyAction,
              pressed ? styles.pressedBadge : null,
            ]}
          >
            <Ionicons name="pencil-outline" size={13} color={colors.text} />
            <AppText variant="caption">Edit</AppText>
          </Pressable>
        ) : null}
        {canDelete && !isEditing ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete post"
            onPress={() => onDelete(post)}
            style={({ pressed }) => [
              styles.deleteAction,
              pressed ? styles.pressedBadge : null,
            ]}
          >
            <Ionicons name="trash-outline" size={13} color={colors.danger} />
            <AppText variant="caption" tone="danger">
              Delete
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </Surface>
  );
}

function InlineComposer({
  replyToPost,
  replyText,
  onReplyChange,
  onSubmit,
  onCancel,
  isPending,
  activeMention,
  onMentionSelect,
  attachment,
  onPickAttachment,
  onRemoveAttachment,
  selection,
  onSelectionChange,
  onFormat,
}: {
  replyToPost: ForumPost;
  replyText: string;
  onReplyChange: (text: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
  activeMention: ActiveMention | null;
  onMentionSelect: (series: SeriesRef) => void;
  attachment: ForumMediaAttachment | null;
  onPickAttachment: () => void;
  onRemoveAttachment: () => void;
  selection: ForumTextSelection;
  onSelectionChange: (selection: ForumTextSelection) => void;
  onFormat: (action: ForumFormatAction) => void;
}) {
  const inputRef = useRef<TextInput | null>(null);
  const isOverLimit = replyText.length > REPLY_MAX_LENGTH;
  const canSubmit =
    (replyText.trim().length > 0 || attachment) && !isOverLimit && !isPending;

  return (
    <Surface variant="raised" radius="xl" style={styles.inlineComposer}>
      <View style={styles.composerHeader}>
        <Ionicons
          name="return-up-forward-outline"
          size={15}
          color={colors.accentStrong}
        />
        <View style={{ flex: 1 }}>
          <RoleNameText variant="caption" role={replyToPost.author_role}>
            {`Replying to @${replyToPost.author_username || "reader"}`}
          </RoleNameText>
        </View>
        <AppText variant="caption" tone={isOverLimit ? "danger" : "subtle"}>
          {replyText.length}/{REPLY_MAX_LENGTH}
        </AppText>
      </View>
      <ForumComposerToolbar
        disabled={isPending}
        onFormat={(action) => {
          onFormat(action);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        onPickAttachment={onPickAttachment}
      />
      <TextInput
        ref={inputRef}
        autoCapitalize="sentences"
        autoCorrect
        multiline
        textAlignVertical="top"
        value={replyText}
        onChangeText={onReplyChange}
        onSelectionChange={(event) => onSelectionChange(event.nativeEvent.selection)}
        selection={selection}
        placeholder={`Reply to ${replyToPost.author_username || "this post"}...`}
        placeholderTextColor={colors.textSubtle}
        style={styles.replyInput}
      />
      <ForumMentionSuggestions mention={activeMention} onSelect={onMentionSelect} />
      <ForumAttachmentPicker
        attachment={attachment}
        disabled={isPending}
        onRemove={onRemoveAttachment}
      />
      <View style={styles.inlineComposerActions}>
        <AppButton
          label={isPending ? "Posting..." : "Post reply"}
          disabled={!canSubmit}
          onPress={onSubmit}
          iconLeft={
            isPending ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Ionicons name="send-outline" size={15} color={colors.text} />
            )
          }
        />
        <AppButton
          label="Cancel"
          disabled={isPending}
          onPress={onCancel}
          iconLeft={<Ionicons name="close-outline" size={15} color={colors.text} />}
        />
      </View>
    </Surface>
  );
}

function ForumAttachmentPicker({
  attachment,
  disabled,
  onRemove,
}: {
  attachment: ForumMediaAttachment | null;
  disabled: boolean;
  onRemove: () => void;
}) {
  return (
    <View style={styles.attachmentBlock}>
      {attachment ? (
        <View style={styles.attachmentPreview}>
          <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
          <View style={styles.attachmentInfo}>
            <AppText variant="caption" numberOfLines={1}>
              {attachment.name}
            </AppText>
            <AppText variant="caption" tone="subtle">
              {attachment.type}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove attachment"
            disabled={disabled}
            onPress={onRemove}
            style={({ pressed }) => [
              styles.removeAttachmentButton,
              disabled ? styles.disabledBadge : null,
              pressed && !disabled ? styles.pressedBadge : null,
            ]}
          >
            <Ionicons name="close" size={18} color={colors.text} />
          </Pressable>
        </View>
      ) : null}
    </View>
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
  editingPostId,
  editText,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  isSavingEdit,
  onDelete,
  currentUsername,
  isAdmin,
  renderInlineComposer,
  parentPost,
  registerPostRef,
  topRankMap,
  onAuthorPress,
}: {
  post: ForumPost;
  byParent: Record<number, ForumPost[]>;
  depth: number;
  topIndex: number;
  pendingVote: PendingVote | null;
  onVote: (post: ForumPost, vote: ForumVote) => void;
  canReply: boolean;
  onStartReply: (post: ForumPost) => void;
  editingPostId: number | null;
  editText: string;
  onEditStart: (post: ForumPost) => void;
  onEditChange: (text: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  isSavingEdit: boolean;
  onDelete: (post: ForumPost) => void;
  currentUsername: string | null;
  isAdmin: boolean;
  renderInlineComposer: (post: ForumPost) => ReactNode;
  parentPost?: ForumPost;
  registerPostRef?: (id: number, ref: View | null) => void;
  topRankMap: Record<string, number>;
  onAuthorPress: (username: string) => void;
}) {
  const children = byParent[post.id] || [];
  const label = parentPost
    ? depth === 0
      ? "Reply to original post"
      : `Reply to @${parentPost.author_username || "reader"}`
    : `Reply ${topIndex}`;
  const isOwner = Boolean(currentUsername && post.author_username === currentUsername);

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
        isOwner={isOwner}
        isAdmin={isAdmin}
        isEditing={editingPostId === post.id}
        editText={editText}
        onEditStart={onEditStart}
        onEditChange={onEditChange}
        onEditSave={onEditSave}
        onEditCancel={onEditCancel}
        isSavingEdit={isSavingEdit}
        onDelete={onDelete}
        onRegisterRef={(r) => registerPostRef?.(post.id, r)}
        rank={rankForUsername(topRankMap, post.author_username)}
        onAuthorPress={onAuthorPress}
      />
      {renderInlineComposer(post)}
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
          editingPostId={editingPostId}
          editText={editText}
          onEditStart={onEditStart}
          onEditChange={onEditChange}
          onEditSave={onEditSave}
          onEditCancel={onEditCancel}
          isSavingEdit={isSavingEdit}
          onDelete={onDelete}
          currentUsername={currentUsername}
          isAdmin={isAdmin}
          renderInlineComposer={renderInlineComposer}
          parentPost={post}
          registerPostRef={registerPostRef}
          topRankMap={topRankMap}
          onAuthorPress={onAuthorPress}
        />
      ))}
    </View>
  );
}

export function ForumThreadScreen() {
  const route = useRoute<ForumThreadRoute>();
  const navigation = useNavigation<ForumThreadNavigation>();
  const queryClient = useQueryClient();
  const { isSignedIn, user } = useAuth();
  const topRankMap = useTopRankMap();
  const isAdmin = user?.role === "ADMIN";
  const [replyText, setReplyText] = useState("");
  const [replySelection, setReplySelection] = useState<ForumTextSelection>({
    start: 0,
    end: 0,
  });
  const [replyAttachment, setReplyAttachment] = useState<ForumMediaAttachment | null>(
    null,
  );
  const [replyTarget, setReplyTarget] = useState<ForumPost | null>(null);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [isEditingThread, setIsEditingThread] = useState(false);
  const [editThreadTitle, setEditThreadTitle] = useState("");
  const [editThreadBody, setEditThreadBody] = useState("");
  const { threadId, postId } = route.params;
  const scrollViewRef = useRef<ScrollView>(null);
  const replyInputRef = useRef<TextInput | null>(null);
  const postRefs = useRef<Map<number, View>>(new Map());
  const hasScrolledToPost = useRef(false);
  const queryKey = ["forum", "thread", threadId] as const;
  const activeMention = getActiveForumMention(replyText);
  const activeThreadBodyMention = getActiveForumMention(editThreadBody);
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
      attachment,
    }: {
      contentMarkdown: string;
      parentId?: number | null;
      attachment?: ForumMediaAttachment | null;
    }) =>
      Promise.resolve()
        .then(async () => {
          if (!attachment) return contentMarkdown;
          const media = await uploadForumMedia(threadId, attachment);
          return appendForumMediaMarkdown(contentMarkdown || "Image", media.url);
        })
        .then((finalMarkdown) =>
          createForumPost(threadId, {
            content_markdown: finalMarkdown,
            parent_id: parentId ?? null,
            series_ids: extractForumSeriesIds(finalMarkdown),
          }),
        ),
    onSuccess: async (createdPost) => {
      setReplyText("");
      setReplySelection({ start: 0, end: 0 });
      setReplyAttachment(null);
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
  const editMutation = useMutation({
    mutationFn: ({ postId, markdown }: { postId: number; markdown: string }) =>
      editForumPost(threadId, postId, { content_markdown: markdown }),
    onSuccess: (updatedPost) => {
      setEditingPostId(null);
      setEditText("");
      queryClient.setQueryData<InfiniteData<ForumThreadPostsPage>>(
        queryKey,
        (current) => {
          if (!current) return current;
          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              posts: page.posts.map((post) =>
                post.id === updatedPost.id ? updatedPost : post,
              ),
            })),
          };
        },
      );
    },
    onError: (error) => {
      Alert.alert(
        "Edit not saved",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    },
  });
  const deleteMutation = useMutation({
    mutationFn: ({ postId, asAdmin }: { postId: number; asAdmin: boolean }) =>
      asAdmin ? deleteForumPost(threadId, postId) : deleteForumPostMine(threadId, postId),
    onSuccess: (_, variables) => {
      queryClient.setQueryData<InfiniteData<ForumThreadPostsPage>>(
        queryKey,
        (current) => {
          if (!current) return current;
          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              posts: page.posts.filter((post) => post.id !== variables.postId),
              total_top_level: page.posts.some(
                (p) => p.id === variables.postId && !p.parent_id,
              )
                ? page.total_top_level - 1
                : page.total_top_level,
            })),
          };
        },
      );
    },
    onError: (error) => {
      Alert.alert(
        "Delete failed",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    },
  });
  const updateThreadMutation = useMutation({
    mutationFn: ({
      title,
      body,
      originalPostId,
    }: {
      title: string;
      body: string;
      originalPostId: number;
    }) =>
      updateForumThread(threadId, {
        title,
        first_post_markdown: body,
        series_ids: extractForumSeriesIds(body),
      }),
    onSuccess: (updatedThread, variables) => {
      setIsEditingThread(false);
      setEditThreadTitle("");
      setEditThreadBody("");
      queryClient.setQueryData<InfiniteData<ForumThreadPostsPage>>(
        queryKey,
        (current) => {
          if (!current) return current;
          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              thread: updatedThread,
              posts: page.posts.map((post) =>
                post.id === variables.originalPostId
                  ? {
                      ...post,
                      content_markdown: variables.body,
                      series_refs: updatedThread.series_refs,
                    }
                  : post,
              ),
            })),
          };
        },
      );
    },
    onError: (error) => {
      Alert.alert(
        "Thread not updated",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: () => deleteForumThread(threadId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["forum", "threads"] });
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert(
        "Thread not deleted",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    },
  });

  const lockMutation = useMutation({
    mutationFn: (locked: boolean) => lockForumThread(threadId, locked),
    onSuccess: (updatedThread) => {
      queryClient.setQueryData<InfiniteData<ForumThreadPostsPage>>(
        queryKey,
        (current) => {
          if (!current) return current;
          return {
            ...current,
            pages: current.pages.map((page) => ({ ...page, thread: updatedThread })),
          };
        },
      );
    },
    onError: (error) => {
      Alert.alert(
        "Lock state not updated",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    },
  });

  const settingsMutation = useMutation({
    mutationFn: (latestFirst: boolean) =>
      updateForumThreadSettings(threadId, { latest_first: latestFirst }),
    onSuccess: (updatedThread) => {
      queryClient.setQueryData<InfiniteData<ForumThreadPostsPage>>(
        queryKey,
        (current) => {
          if (!current) return current;
          return {
            ...current,
            pages: current.pages.map((page) => ({ ...page, thread: updatedThread })),
          };
        },
      );
    },
    onError: (error) => {
      Alert.alert(
        "Settings not updated",
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
  const topLevelReplies = replies.filter(
    (post) => !post.parent_id || post.parent_id === originalPost?.id,
  );
  const isThreadAuthor = Boolean(
    user?.username && thread && user.username === thread.author_username,
  );
  const canManageThread = isThreadAuthor || isAdmin;
  const canReplyToThread = Boolean(thread && !thread.locked);
  const trimmedReply = replyText.trim();
  const canSubmitReply =
    isSignedIn &&
    canReplyToThread &&
    (trimmedReply.length > 0 || replyAttachment) &&
    trimmedReply.length <= REPLY_MAX_LENGTH &&
    !replyMutation.isPending;

  const registerPostRef = (id: number, ref: View | null) => {
    if (ref) {
      postRefs.current.set(id, ref);
    } else {
      postRefs.current.delete(id);
    }
  };

  useEffect(() => {
    if (!postId || hasScrolledToPost.current || posts.length === 0) return;
    const postView = postRefs.current.get(postId);
    if (!postView || !scrollViewRef.current) return;
    hasScrolledToPost.current = true;
    const scrollView = scrollViewRef.current;
    const timer = setTimeout(() => {
      postView.measureLayout(
        scrollView as unknown as View,
        (_x, y) => {
          scrollView.scrollTo({ y: Math.max(0, y - spacing.md), animated: true });
        },
        () => {
          /* ignore measurement failures */
        },
      );
    }, 200);
    return () => clearTimeout(timer);
  }, [posts, postId]);

  const handleEditThreadStart = () => {
    if (!thread || !originalPost) return;
    setEditThreadTitle(thread.title);
    setEditThreadBody(originalPost.content_markdown);
    setIsEditingThread(true);
  };

  const handleEditThreadCancel = () => {
    setIsEditingThread(false);
    setEditThreadTitle("");
    setEditThreadBody("");
  };

  const handleEditThreadSave = () => {
    if (!originalPost) return;
    const trimmedTitle = editThreadTitle.trim();
    const trimmedBody = editThreadBody.trim();
    if (!trimmedTitle || !trimmedBody) return;
    updateThreadMutation.mutate({
      title: trimmedTitle,
      body: trimmedBody,
      originalPostId: originalPost.id,
    });
  };

  const handleDeleteThread = () => {
    Alert.alert(
      "Delete thread",
      "This cannot be undone. The thread and all its posts will be removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteThreadMutation.mutate(),
        },
      ],
    );
  };

  const handleLockThread = () => {
    if (!thread) return;
    const willBeLocked = !thread.locked;
    Alert.alert(
      willBeLocked ? "Lock thread?" : "Unlock thread?",
      willBeLocked
        ? "No new replies will be allowed once locked."
        : "Replies will be allowed again after unlocking.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: willBeLocked ? "Lock" : "Unlock",
          onPress: () => lockMutation.mutate(willBeLocked),
        },
      ],
    );
  };

  const handleToggleLatestFirst = () => {
    if (!thread) return;
    settingsMutation.mutate(!thread.latest_first);
  };

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

    if (!trimmedReply && !replyAttachment) {
      Alert.alert(
        "Write a reply first",
        "Add a message or attach an image before posting.",
      );
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
      attachment: replyAttachment,
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
    setReplyAttachment(null);
    setReplySelection({ start: 0, end: 0 });
  };
  const openPublicProfile = (username?: string | null) => {
    if (!username) return;
    navigation.navigate("PublicProfile", { username });
  };
  const handleEditStart = (post: ForumPost) => {
    setEditingPostId(post.id);
    setEditText(post.content_markdown);
  };
  const handleEditSave = () => {
    if (!editingPostId) return;
    const trimmed = editText.trim();
    if (!trimmed) return;
    editMutation.mutate({ postId: editingPostId, markdown: trimmed });
  };
  const handleEditCancel = () => {
    setEditingPostId(null);
    setEditText("");
  };
  const handleDelete = (post: ForumPost) => {
    const isOwnerOfPost = Boolean(
      user?.username && user.username === post.author_username,
    );
    Alert.alert("Delete post?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          deleteMutation.mutate({ postId: post.id, asAdmin: isAdmin && !isOwnerOfPost }),
      },
    ]);
  };
  const handleMentionSelect = (series: SeriesRef) => {
    setReplyText((current) => {
      const next = activeMention
        ? insertForumMention(current, activeMention, series).slice(0, REPLY_MAX_LENGTH)
        : current;
      setReplySelection({ start: next.length, end: next.length });
      return next;
    });
  };
  const handlePickReplyAttachment = async () => {
    const picked = await pickForumMediaAttachment();
    if (picked) setReplyAttachment(picked);
  };
  const handleFormatReply = (action: ForumFormatAction) => {
    const formatted = applyForumFormat(replyText, replySelection, action);
    const nextReply = formatted.text.slice(0, REPLY_MAX_LENGTH);
    setReplyText(nextReply);
    setReplySelection({
      start: Math.min(formatted.selection.start, nextReply.length),
      end: Math.min(formatted.selection.end, nextReply.length),
    });
    requestAnimationFrame(() => replyInputRef.current?.focus());
  };
  const renderInlineComposer = (post: ForumPost): ReactNode => {
    if (replyTarget?.id !== post.id) return null;
    return (
      <InlineComposer
        replyToPost={post}
        replyText={replyText}
        onReplyChange={setReplyText}
        onSubmit={handleSubmitReply}
        onCancel={() => {
          setReplyTarget(null);
          setReplyText("");
          setReplySelection({ start: 0, end: 0 });
          setReplyAttachment(null);
        }}
        isPending={replyMutation.isPending}
        activeMention={activeMention}
        onMentionSelect={handleMentionSelect}
        attachment={replyAttachment}
        onPickAttachment={handlePickReplyAttachment}
        onRemoveAttachment={() => setReplyAttachment(null)}
        selection={replySelection}
        onSelectionChange={setReplySelection}
        onFormat={handleFormatReply}
      />
    );
  };

  return (
    <ScreenShell
      title="Thread"
      subtitle="Read public discussions, vote, and reply with your Toon Ranks account."
      scrollRef={scrollViewRef}
    >
      {postsQuery.isLoading ? <LoadingState message="Loading thread..." /> : null}

      {postsQuery.isError ? (
        <ErrorState message="This discussion could not be loaded. Try again in a moment." />
      ) : null}

      {thread && !isEditingThread ? (
        <Surface variant="accent" radius="hero" style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.text} />
          </View>
          <View style={styles.heroText}>
            <AppText variant="sectionTitle">{thread.title}</AppText>
            <View style={styles.startedByLine}>
              <AppText tone="muted">Started by</AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${thread.author_username || "author"}'s profile`}
                disabled={!thread.author_username}
                onPress={() => openPublicProfile(thread.author_username)}
                style={({ pressed }) => [
                  styles.authorChipPressable,
                  pressed ? styles.pressedBadge : null,
                ]}
              >
                <RoleNameText variant="caption" role={thread.author_role}>
                  {thread.author_username || "Unknown"}
                </RoleNameText>
                <RankerBadge rank={rankForUsername(topRankMap, thread.author_username)} />
              </Pressable>
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
            {canManageThread ? (
              <View style={styles.threadActions}>
                <Pressable
                  onPress={handleEditThreadStart}
                  disabled={!originalPost}
                  style={({ pressed }) => [
                    styles.replyAction,
                    pressed ? styles.pressedBadge : null,
                  ]}
                >
                  <Ionicons name="pencil-outline" size={13} color={colors.text} />
                  <AppText variant="caption">Edit</AppText>
                </Pressable>
                <Pressable
                  onPress={handleDeleteThread}
                  disabled={deleteThreadMutation.isPending}
                  style={({ pressed }) => [
                    styles.deleteAction,
                    pressed ? styles.pressedBadge : null,
                  ]}
                >
                  <Ionicons name="trash-outline" size={13} color={colors.danger} />
                  <AppText variant="caption" tone="danger">
                    Delete
                  </AppText>
                </Pressable>
                {isAdmin ? (
                  <>
                    <Pressable
                      onPress={handleLockThread}
                      disabled={lockMutation.isPending}
                      style={({ pressed }) => [
                        styles.replyAction,
                        pressed ? styles.pressedBadge : null,
                      ]}
                    >
                      <Ionicons
                        name={thread.locked ? "lock-open-outline" : "lock-closed-outline"}
                        size={13}
                        color={colors.text}
                      />
                      <AppText variant="caption">
                        {thread.locked ? "Unlock" : "Lock"}
                      </AppText>
                    </Pressable>
                    <Pressable
                      onPress={handleToggleLatestFirst}
                      disabled={settingsMutation.isPending}
                      style={({ pressed }) => [
                        styles.replyAction,
                        thread.latest_first ? styles.activeThreadAction : null,
                        pressed ? styles.pressedBadge : null,
                      ]}
                    >
                      <Ionicons
                        name="swap-vertical-outline"
                        size={13}
                        color={thread.latest_first ? colors.accentStrong : colors.text}
                      />
                      <AppText
                        variant="caption"
                        tone={thread.latest_first ? "accent" : undefined}
                      >
                        Latest first
                      </AppText>
                    </Pressable>
                  </>
                ) : null}
              </View>
            ) : null}
          </View>
        </Surface>
      ) : null}

      {isEditingThread ? (
        <Surface radius="xl" style={styles.threadEditCard}>
          <AppText variant="cardTitle">Edit thread</AppText>
          <View style={styles.fieldHeader}>
            <AppText variant="caption">Title</AppText>
            <AppText variant="caption" tone="subtle">
              {editThreadTitle.length}/{MAX_TITLE_LENGTH}
            </AppText>
          </View>
          <TextInput
            value={editThreadTitle}
            onChangeText={(v) => setEditThreadTitle(v.slice(0, MAX_TITLE_LENGTH))}
            placeholder="Thread title"
            placeholderTextColor={colors.textSubtle}
            style={styles.titleInput}
          />
          <View style={styles.fieldHeader}>
            <AppText variant="caption">First post</AppText>
            <AppText variant="caption" tone="subtle">
              {editThreadBody.length}/{REPLY_MAX_LENGTH}
            </AppText>
          </View>
          <TextInput
            value={editThreadBody}
            onChangeText={(v) => setEditThreadBody(v.slice(0, REPLY_MAX_LENGTH))}
            placeholder="First post content..."
            placeholderTextColor={colors.textSubtle}
            multiline
            textAlignVertical="top"
            style={styles.replyInput}
          />
          <ForumMentionSuggestions
            mention={activeThreadBodyMention}
            onSelect={(series) => {
              setEditThreadBody((current) =>
                activeThreadBodyMention
                  ? insertForumMention(current, activeThreadBodyMention, series).slice(
                      0,
                      REPLY_MAX_LENGTH,
                    )
                  : current,
              );
            }}
          />
          <View style={styles.editActions}>
            <AppButton
              label="Cancel"
              disabled={updateThreadMutation.isPending}
              onPress={handleEditThreadCancel}
              iconLeft={<Ionicons name="close-outline" size={15} color={colors.text} />}
            />
            <AppButton
              label={updateThreadMutation.isPending ? "Saving..." : "Save thread"}
              selected
              disabled={
                updateThreadMutation.isPending ||
                !editThreadTitle.trim() ||
                !editThreadBody.trim()
              }
              onPress={handleEditThreadSave}
              iconLeft={
                updateThreadMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Ionicons name="checkmark-outline" size={15} color={colors.text} />
                )
              }
            />
          </View>
          {updateThreadMutation.isError ? (
            <AppText tone="danger">Could not save changes. Try again.</AppText>
          ) : null}
        </Surface>
      ) : null}

      {thread ? <ForumSeriesStrip seriesRefs={thread.series_refs} /> : null}

      {thread ? (
        <Pressable
          onPress={() =>
            navigation.navigate("ReportIssue", {
              pageUrl: `toonranks://forum/thread/${threadId}`,
              title: `Issue with thread: ${thread.title}`,
              issueType: "CONTENT",
            })
          }
          style={({ pressed }) => [
            styles.reportLink,
            pressed ? styles.pressedLight : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Report an issue with this thread"
        >
          <Ionicons name="flag-outline" size={13} color={colors.textSubtle} />
          <AppText variant="caption" tone="subtle">
            Report this thread
          </AppText>
        </Pressable>
      ) : null}

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
            isOwner={Boolean(
              user?.username && user.username === originalPost.author_username,
            )}
            isAdmin={isAdmin}
            isEditing={editingPostId === originalPost.id}
            editText={editText}
            onEditStart={handleEditStart}
            onEditChange={setEditText}
            onEditSave={handleEditSave}
            onEditCancel={handleEditCancel}
            isSavingEdit={editMutation.isPending}
            onDelete={handleDelete}
            onRegisterRef={(r) => registerPostRef(originalPost.id, r)}
            rank={rankForUsername(topRankMap, originalPost.author_username)}
            onAuthorPress={openPublicProfile}
          />
          {renderInlineComposer(originalPost)}
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
                editingPostId={editingPostId}
                editText={editText}
                onEditStart={handleEditStart}
                onEditChange={setEditText}
                onEditSave={handleEditSave}
                onEditCancel={handleEditCancel}
                isSavingEdit={editMutation.isPending}
                onDelete={handleDelete}
                currentUsername={user?.username ?? null}
                isAdmin={isAdmin}
                renderInlineComposer={renderInlineComposer}
                parentPost={originalPost}
                registerPostRef={registerPostRef}
                topRankMap={topRankMap}
                onAuthorPress={openPublicProfile}
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

      {thread && !replyTarget ? (
        <Surface variant="raised" radius="xl" style={styles.replyComposer}>
          <View style={styles.composerHeader}>
            <View style={styles.composerTitle}>
              <Ionicons
                name={thread.locked ? "lock-closed-outline" : "return-up-forward-outline"}
                size={18}
                color={thread.locked ? colors.warningText : colors.accentStrong}
              />
              <AppText variant="cardTitle">
                {thread.locked ? "Thread locked" : "Reply in thread"}
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
              <ForumComposerToolbar
                disabled={replyMutation.isPending}
                onFormat={handleFormatReply}
                onPickAttachment={handlePickReplyAttachment}
              />
              <TextInput
                ref={replyInputRef}
                autoCapitalize="sentences"
                autoCorrect
                multiline
                textAlignVertical="top"
                value={replyText}
                onChangeText={setReplyText}
                onSelectionChange={(event) =>
                  setReplySelection(event.nativeEvent.selection)
                }
                selection={replySelection}
                placeholder="Write a reply..."
                placeholderTextColor={colors.textSubtle}
                style={styles.replyInput}
              />
              <ForumMentionSuggestions
                mention={activeMention}
                onSelect={handleMentionSelect}
              />
              <View style={styles.composerActions}>
                <AppText variant="caption" tone="muted" style={styles.composerHint}>
                  Markdown is supported. Type @ to reference a series. Image and GIF
                  uploads are supported.
                </AppText>
                <ForumAttachmentPicker
                  attachment={replyAttachment}
                  disabled={replyMutation.isPending}
                  onRemove={() => setReplyAttachment(null)}
                />
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
  authorChipPressable: {
    flexDirection: "row",
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
  attachmentBlock: {
    gap: spacing.sm,
  },
  attachmentPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  attachmentImage: {
    width: 58,
    height: 58,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
  },
  attachmentInfo: {
    flex: 1,
    minWidth: 0,
  },
  removeAttachmentButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSoft,
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
  deleteAction: {
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
  editBlock: {
    gap: spacing.sm,
  },
  editActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  inlineComposer: {
    gap: spacing.md,
  },
  inlineComposerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  threadActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  activeThreadAction: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
  },
  threadEditCard: {
    gap: spacing.md,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  titleInput: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.backgroundSoft,
    fontSize: 16,
    fontWeight: "800",
  },
  reportLink: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  pressedLight: {
    opacity: 0.6,
  },
});
