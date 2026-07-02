import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  type LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import {
  createForumPost,
  deleteForumPost,
  deleteForumPostMine,
  deleteForumThread,
  editForumPost,
  getForumCategories,
  getForumThreadPosts,
  lockForumThread,
  markThreadRead,
  searchPostsInThread,
  pinForumThread,
  setForumPostVote,
  reportPost,
  togglePostBookmark,
  toggleThreadFollow,
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
  InsertReadingListSheet,
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
  ForumCategory,
  ForumPost,
  ForumThread,
  ForumThreadPostsPage,
  ForumVote,
  ForumVoteResponse,
} from "../types/forum";
import { formatForumCount } from "../utils/forumFormatting";
import { timeAgo } from "../utils/timeAgo";
import {
  extractForumSeriesIds,
  getActiveForumMention,
  insertForumMention,
  insertUserMention,
} from "../utils/forumMentions";
import type { MentionSelection } from "../components/ForumMentionSuggestions";
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
import { useForumDraft } from "../hooks/useForumDraft";
import {
  EMPTY_REPLY_DRAFT,
  isReplyDraftEmpty,
  replyDraftKey,
} from "../utils/forumDrafts";
import { buildQuoteMarkdown } from "../utils/forumQuote";
import { buildReadingListRef } from "../utils/forumReadingListRef";
import type { ReadingList } from "../types/readingList";

type ForumThreadRoute = RouteProp<RootStackParamList, "ForumThread">;
type ForumThreadNavigation = NativeStackNavigationProp<RootStackParamList>;
const POSTS_PAGE_SIZE = 20;
const REPLY_MAX_LENGTH = 2000;
const MAX_TITLE_LENGTH = 200;

// Reddit/YouTube-style branch rail (ported from the web ThreadPage, adapted to
// RN). A parent owns ONE continuous rail down its direct replies, drawn as a
// single SVG path: a vertical spine plus a quadratic curve into each child's
// avatar centre, ending at the last child (no trailing tail). The avatar lives in
// a left "rail column"; child centres are measured at runtime (onLayout) because
// reply heights vary. Tapping the rail collapses the branch.
const RAIL_AVATAR = 30; // UserAvatar size "sm"
const RAIL_GAP = 10; // gap between the avatar/rail column and the content
const RAIL_X = RAIL_AVATAR / 2; // rail x = centre of the avatar column
const RAIL_CHILD_AVATAR_LEFT = RAIL_AVATAR + RAIL_GAP; // child avatar's left edge
const RAIL_CHILD_CURVE_X = RAIL_X + 10; // x where the curve flattens into the row
const RAIL_ELBOW_RADIUS = 12;
const RAIL_START_Y = RAIL_AVATAR + 4; // rail begins just below the parent avatar
const RAIL_THICKNESS = 1.5; // hairline, like Reddit/YouTube (was 2 — read too heavy)
// Indentation cap (§6): past this depth, each further level indents by the smaller
// capped amount instead of the full avatar-column width, so deep threads stay
// readable on narrow phones. The rail still curves into each child.
const MAX_RAIL_DEPTH = 4;
const RAIL_CHILD_AVATAR_LEFT_CAPPED = 24;

type PendingVote = {
  postId: number;
  vote: ForumVote | null;
};

/** Total nested descendants under a post — used for the collapsed "(N replies)". */
function countDescendants(postId: number, byParent: Record<number, ForumPost[]>): number {
  const kids = byParent[postId] || [];
  let total = kids.length;
  for (const kid of kids) total += countDescendants(kid.id, byParent);
  return total;
}

function PostCard({
  post,
  isOriginalPost = false,
  isOp = false,
  collapsed = false,
  descendantCount = 0,
  onExpand,
  pendingVote,
  onVote,
  canReply,
  onStartReply,
  onStartQuote,
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
  isBookmarked,
  onBookmark,
  canReport,
  onReport,
}: {
  post: ForumPost;
  isOriginalPost?: boolean;
  isOp?: boolean;
  collapsed?: boolean;
  descendantCount?: number;
  onExpand?: () => void;
  pendingVote: ForumVote | null;
  onVote: (post: ForumPost, vote: ForumVote) => void;
  canReply: boolean;
  onStartReply: (post: ForumPost) => void;
  onStartQuote: (post: ForumPost) => void;
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
  isBookmarked?: boolean;
  onBookmark?: (post: ForumPost) => void;
  canReport?: boolean;
  onReport?: (post: ForumPost) => void;
}) {
  const styles = getStyles();
  const viewerVote = getViewerVote(post);
  const isVoting = pendingVote !== null;
  const upvotes = getUpvoteCount(post);
  const downvotes = getDownvoteCount(post);
  const canEdit = isOwner || isAdmin;
  const canDelete = isOwner || isAdmin;
  const canQuote = canReply && !isEditing;
  const hasSecondaryActions =
    (canQuote || onBookmark || canReport || canEdit || canDelete) && !isEditing;
  const [sheetVisible, setSheetVisible] = useState(false);
  const isEdited =
    new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 10000;

  return (
    <View
      ref={(r) => onRegisterRef?.(r)}
      style={[styles.comment, isOriginalPost ? styles.commentOriginal : null]}
    >
      <View style={styles.commentHeaderText}>
        <View style={styles.authorLine}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${post.author_username || "reader"}'s profile`}
            disabled={!post.author_username}
            onPress={() => {
              if (post.author_username) onAuthorPress?.(post.author_username);
            }}
            style={({ pressed }) => (pressed ? styles.pressedBadge : null)}
          >
            <RoleNameText
              variant={isOriginalPost ? "cardTitle" : "caption"}
              role={post.author_role}
            >
              {post.author_username || "Unknown reader"}
            </RoleNameText>
          </Pressable>
          {isOp ? (
            <View
              style={styles.opBadge}
              accessibilityRole="text"
              accessibilityLabel="Original poster"
            >
              <AppText style={styles.opBadgeText}>OP</AppText>
            </View>
          ) : null}
          <RankerBadge rank={rank} />
          {isOriginalPost ? (
            <View style={styles.originalPostPill}>
              <AppText style={styles.originalPostPillText}>Original post</AppText>
            </View>
          ) : null}
        </View>
        <View style={styles.postDateRow}>
          <AppText variant="caption" tone="muted">
            {timeAgo(post.created_at)}
          </AppText>
          {isEdited ? (
            <AppText variant="caption" tone="muted" style={styles.editedLabel}>
              · edited
            </AppText>
          ) : null}
          {collapsed && descendantCount > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Show ${descendantCount} ${
                descendantCount === 1 ? "reply" : "replies"
              }`}
              onPress={onExpand}
              hitSlop={6}
              style={({ pressed }) => (pressed ? styles.pressedBadge : null)}
            >
              <AppText variant="caption" tone="accent">
                {descendantCount} {descendantCount === 1 ? "reply" : "replies"}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>

      {isEditing ? (
        <View style={styles.editBlock}>
          <ForumMentionSuggestions
            mention={getActiveForumMention(editText)}
            onSelect={(selection: MentionSelection) => {
              const mention = getActiveForumMention(editText);
              if (!mention) return;
              const next =
                selection.type === "series"
                  ? insertForumMention(editText, mention, selection.series)
                  : insertUserMention(editText, mention, selection.username);
              onEditChange(next);
            }}
          />
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
            hitSlop={6}
            style={({ pressed }) => [
              styles.textAction,
              pressed ? styles.pressedBadge : null,
            ]}
          >
            <Ionicons
              name="return-up-forward-outline"
              size={14}
              color={colors.textMuted}
            />
            <AppText variant="caption" tone="muted">
              Reply
            </AppText>
          </Pressable>
        ) : null}
        {hasSecondaryActions ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More actions"
            onPress={() => setSheetVisible(true)}
            hitSlop={6}
            style={({ pressed }) => [
              styles.textAction,
              pressed ? styles.pressedBadge : null,
            ]}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Secondary actions — compact bottom sheet (Reddit/Apollo style) */}
      <Modal transparent visible={sheetVisible} animationType="fade">
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetVisible(false)} />
        <View style={styles.actionSheet}>
          {canQuote ? (
            <Pressable
              style={({ pressed }) => [
                styles.sheetRow,
                pressed ? styles.sheetRowPressed : null,
              ]}
              onPress={() => {
                setSheetVisible(false);
                onStartQuote(post);
              }}
            >
              <Ionicons name="chatbox-ellipses-outline" size={17} color={colors.text} />
              <AppText variant="caption">Quote</AppText>
            </Pressable>
          ) : null}
          {canQuote && (onBookmark || canReport || canEdit || canDelete) ? (
            <View style={styles.sheetDivider} />
          ) : null}
          {onBookmark ? (
            <Pressable
              style={({ pressed }) => [
                styles.sheetRow,
                pressed ? styles.sheetRowPressed : null,
              ]}
              onPress={() => {
                setSheetVisible(false);
                onBookmark(post);
              }}
            >
              <Ionicons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={17}
                color={isBookmarked ? colors.credText : colors.text}
              />
              <AppText variant="caption">
                {isBookmarked ? "Remove bookmark" : "Save post"}
              </AppText>
            </Pressable>
          ) : null}
          {canReport ? (
            <>
              <View style={styles.sheetDivider} />
              <Pressable
                style={({ pressed }) => [
                  styles.sheetRow,
                  pressed ? styles.sheetRowPressed : null,
                ]}
                onPress={() => {
                  setSheetVisible(false);
                  onReport?.(post);
                }}
              >
                <Ionicons name="flag-outline" size={17} color={colors.textMuted} />
                <AppText variant="caption" tone="muted">
                  Report
                </AppText>
              </Pressable>
            </>
          ) : null}
          {canEdit ? (
            <>
              <View style={styles.sheetDivider} />
              <Pressable
                style={({ pressed }) => [
                  styles.sheetRow,
                  pressed ? styles.sheetRowPressed : null,
                ]}
                onPress={() => {
                  setSheetVisible(false);
                  onEditStart(post);
                }}
              >
                <Ionicons name="pencil-outline" size={17} color={colors.text} />
                <AppText variant="caption">Edit</AppText>
              </Pressable>
            </>
          ) : null}
          {canDelete ? (
            <>
              <View style={styles.sheetDivider} />
              <Pressable
                style={({ pressed }) => [
                  styles.sheetRow,
                  pressed ? styles.sheetRowPressed : null,
                ]}
                onPress={() => {
                  setSheetVisible(false);
                  onDelete(post);
                }}
              >
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
                <AppText variant="caption" tone="danger">
                  Delete
                </AppText>
              </Pressable>
            </>
          ) : null}
        </View>
      </Modal>
    </View>
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
  const styles = getStyles();
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

// One child row in a branch: a left gutter that draws the parent-owned vertical
// rail plus a curved elbow into the child's avatar, then the child content. The
// rail runs full-height for every child except the last, which stops at the elbow
// so there is no dangling tail below the final reply.
type CommentNodeProps = {
  post: ForumPost;
  byParent: Record<number, ForumPost[]>;
  depth: number;
  pendingVote: PendingVote | null;
  onVote: (post: ForumPost, vote: ForumVote) => void;
  canReply: boolean;
  onStartReply: (post: ForumPost) => void;
  onStartQuote: (post: ForumPost) => void;
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
  registerPostRef?: (id: number, ref: View | null) => void;
  topRankMap: Record<string, number>;
  onAuthorPress: (username: string) => void;
  onBookmark?: (post: ForumPost) => void;
  onReport?: (post: ForumPost) => void;
  reportedPostIds?: Set<number>;
  opUsername?: string | null;
};

// A single comment plus its branch. The avatar lives in a left "rail column"; a
// single SVG path draws one continuous rail (spine + a curve into each direct
// child's measured avatar centre). Tapping the rail collapses the branch.
function CommentNode(props: CommentNodeProps) {
  const {
    post,
    byParent,
    depth,
    pendingVote,
    onVote,
    canReply,
    onStartReply,
    onStartQuote,
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
    registerPostRef,
    topRankMap,
    onAuthorPress,
    onBookmark,
    onReport,
    reportedPostIds,
    opUsername,
  } = props;
  const styles = getStyles();
  const children = byParent[post.id] || [];
  const hasChildren = children.length > 0;
  const isOwner = Boolean(currentUsername && post.author_username === currentUsername);
  const isOp = Boolean(opUsername && post.author_username === opUsername);

  const [collapsed, setCollapsed] = useState(false);
  const [railPressed, setRailPressed] = useState(false);
  const [childrenTop, setChildrenTop] = useState<number | null>(null);
  const [childYs, setChildYs] = useState<Record<number, number>>({});

  const recordChildY = (id: number, y: number) =>
    setChildYs((prev) => (prev[id] === y ? prev : { ...prev, [id]: y }));

  // Past the cap depth, pull children left so the indent grows slower; the rail's
  // curve target follows so it still lands on the (shifted) child avatar.
  const capped = depth >= MAX_RAIL_DEPTH;
  const childAvatarLeft = capped ? RAIL_CHILD_AVATAR_LEFT_CAPPED : RAIL_CHILD_AVATAR_LEFT;
  const childCurveX = Math.min(RAIL_CHILD_CURVE_X, childAvatarLeft - 4);

  // Each child's avatar centre, measured relative to this branch's top.
  const childCenters =
    !collapsed && hasChildren && childrenTop != null
      ? children
          .map((child) => childYs[child.id])
          .filter((y): y is number => y != null)
          .map((y) => childrenTop + y + RAIL_AVATAR / 2)
      : [];

  let railPath: { d: string; height: number } | null = null;
  if (childCenters.length > 0) {
    const lastCenter = childCenters[childCenters.length - 1];
    const lastCurveStart = Math.max(RAIL_START_Y, lastCenter - RAIL_ELBOW_RADIUS);
    railPath = {
      d: [
        `M ${RAIL_X} ${RAIL_START_Y} V ${lastCurveStart}`,
        ...childCenters.map((center) => {
          const curveStart = Math.max(RAIL_START_Y, center - RAIL_ELBOW_RADIUS);
          return `M ${RAIL_X} ${curveStart} Q ${RAIL_X} ${center} ${childCurveX} ${center} H ${childAvatarLeft}`;
        }),
      ].join(" "),
      height: Math.ceil(lastCenter + RAIL_THICKNESS),
    };
  }

  const descendantCount = collapsed ? countDescendants(post.id, byParent) : 0;

  return (
    <View style={styles.branchRow}>
      {railPath ? (
        <Svg
          pointerEvents="none"
          style={styles.railSvg}
          width={childAvatarLeft + RAIL_THICKNESS}
          height={railPath.height}
        >
          <Path
            d={railPath.d}
            stroke={railPressed ? colors.accentStrong : colors.border}
            strokeWidth={RAIL_THICKNESS}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      ) : null}

      {/* Avatar + rail column — the rail runs from this comment's avatar down. */}
      <View style={styles.railColumn}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${post.author_username || "reader"}'s profile`}
          disabled={!post.author_username}
          onPress={() => {
            if (post.author_username) onAuthorPress(post.author_username);
          }}
          style={({ pressed }) => (pressed ? styles.pressedBadge : null)}
        >
          <UserAvatar
            username={post.author_username || "Reader"}
            avatarUrl={post.author_avatar_url}
            avatarPreset={post.author_avatar_preset}
            size="sm"
          />
        </Pressable>
        {hasChildren && !collapsed ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Collapse replies"
            style={styles.railHit}
            onPress={() => {
              // Clear the pressed highlight too — collapsing unmounts this
              // Pressable before onPressOut fires, which otherwise leaves
              // railPressed stuck true (rail stays highlighted after expand).
              setRailPressed(false);
              setCollapsed(true);
            }}
            onPressIn={() => setRailPressed(true)}
            onPressOut={() => setRailPressed(false)}
          />
        ) : null}
        {hasChildren && collapsed ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Expand replies"
            style={styles.expandButton}
            onPress={() => setCollapsed(false)}
          >
            <AppText style={styles.expandButtonText}>+</AppText>
          </Pressable>
        ) : null}
      </View>

      {/* Content column */}
      <View style={styles.contentColumn}>
        <PostCard
          post={post}
          isOp={isOp}
          collapsed={collapsed}
          descendantCount={descendantCount}
          onExpand={() => setCollapsed(false)}
          pendingVote={pendingVote?.postId === post.id ? pendingVote.vote : null}
          onVote={onVote}
          canReply={canReply}
          onStartReply={onStartReply}
          onStartQuote={onStartQuote}
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
          isBookmarked={post.viewer_has_bookmarked}
          onBookmark={onBookmark}
          canReport={
            !!currentUsername &&
            !!post.author_username &&
            post.author_username !== currentUsername &&
            !reportedPostIds?.has(post.id)
          }
          onReport={onReport}
        />
        {hasChildren && !collapsed ? (
          <View
            style={[
              styles.childrenWrap,
              capped ? { marginLeft: childAvatarLeft - RAIL_CHILD_AVATAR_LEFT } : null,
            ]}
            onLayout={(e: LayoutChangeEvent) => {
              const y = e.nativeEvent.layout.y;
              setChildrenTop((prev) => (prev === y ? prev : y));
            }}
          >
            {children.map((child) => (
              <View
                key={child.id}
                onLayout={(e: LayoutChangeEvent) =>
                  recordChildY(child.id, e.nativeEvent.layout.y)
                }
              >
                <CommentNode
                  post={child}
                  byParent={byParent}
                  depth={depth + 1}
                  pendingVote={pendingVote}
                  onVote={onVote}
                  canReply={canReply}
                  onStartReply={onStartReply}
                  onStartQuote={onStartQuote}
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
                  registerPostRef={registerPostRef}
                  topRankMap={topRankMap}
                  onAuthorPress={onAuthorPress}
                  onBookmark={onBookmark}
                  onReport={onReport}
                  reportedPostIds={reportedPostIds}
                  opUsername={opUsername}
                />
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function ForumThreadScreen() {
  const styles = getStyles();
  const route = useRoute<ForumThreadRoute>();
  const navigation = useNavigation<ForumThreadNavigation>();
  const queryClient = useQueryClient();
  const { isSignedIn, user } = useAuth();
  const topRankMap = useTopRankMap();
  const isAdmin = user?.role === "ADMIN";
  const {
    draft: replyDraft,
    setDraft: setReplyDraft,
    clearDraft: clearReplyDraft,
  } = useForumDraft(
    replyDraftKey(route.params.threadId, null),
    EMPTY_REPLY_DRAFT,
    isReplyDraftEmpty,
  );
  const replyText = replyDraft.body;
  const setReplyText = (updater: string | ((prev: string) => string)) =>
    setReplyDraft((d) => ({
      body: typeof updater === "function" ? updater(d.body) : updater,
    }));
  const [replySelection, setReplySelection] = useState<ForumTextSelection>({
    start: 0,
    end: 0,
  });
  const [replyAttachment, setReplyAttachment] = useState<ForumMediaAttachment | null>(
    null,
  );
  const [replyTarget, setReplyTarget] = useState<ForumPost | null>(null);
  const [composerExpanded, setComposerExpanded] = useState(false);
  // Formatting tools are hidden by default (most replies are plain text);
  // the "Aa" toggle in the action row reveals them on demand.
  const [formattingVisible, setFormattingVisible] = useState(false);
  const [insertListVisible, setInsertListVisible] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [isEditingThread, setIsEditingThread] = useState(false);
  const [threadActionsOpen, setThreadActionsOpen] = useState(false);
  const [editThreadTitle, setEditThreadTitle] = useState("");
  const [editThreadBody, setEditThreadBody] = useState("");
  const [editThreadCategoryId, setEditThreadCategoryId] = useState<number | null>(null);
  const [reportedPostIds, setReportedPostIds] = useState<Set<number>>(new Set());
  const [postSearchOpen, setPostSearchOpen] = useState(false);
  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [debouncedPostSearch, setDebouncedPostSearch] = useState("");
  const [reportModalPost, setReportModalPost] = useState<ForumPost | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportError, setReportError] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const { threadId, postId } = route.params;
  const scrollViewRef = useRef<ScrollView>(null);
  const replyInputRef = useRef<TextInput | null>(null);
  const postRefs = useRef<Map<number, View>>(new Map());
  const hasScrolledToPost = useRef(false);
  const queryKey = ["forum", "thread", threadId] as const;
  const activeMention = getActiveForumMention(replyText);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPostSearch(postSearchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [postSearchQuery]);

  const postSearchResultsQuery = useQuery({
    queryKey: ["forum", "thread-post-search", threadId, debouncedPostSearch],
    queryFn: () => searchPostsInThread(threadId, debouncedPostSearch),
    enabled: postSearchOpen && debouncedPostSearch.length >= 2,
    staleTime: 30_000,
  });
  const postSearchResults = postSearchResultsQuery.data?.items ?? [];
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
      clearReplyDraft();
      setReplySelection({ start: 0, end: 0 });
      setReplyAttachment(null);
      setReplyTarget(null);
      setComposerExpanded(false);
      // Start the next reply with a clean, tools-hidden composer.
      setFormattingVisible(false);
      Keyboard.dismiss();
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
      editForumPost(threadId, postId, {
        content_markdown: markdown,
        series_ids: extractForumSeriesIds(markdown),
      }),
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
      // Decrement post_count on the thread card in the forum list
      queryClient.setQueriesData<{ pages: { items: ForumThread[] }[] }>(
        { queryKey: ["forum", "threads"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((t) =>
                t.id === threadId
                  ? { ...t, post_count: Math.max(0, t.post_count - 1) }
                  : t,
              ),
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
      categoryId,
    }: {
      title: string;
      body: string;
      originalPostId: number;
      categoryId?: number | null;
    }) =>
      updateForumThread(threadId, {
        title,
        first_post_markdown: body,
        series_ids: extractForumSeriesIds(body),
        category_id: categoryId ?? null,
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
      // Sync title and category to the thread list card
      queryClient.setQueriesData<{ pages: { items: ForumThread[] }[] }>(
        { queryKey: ["forum", "threads"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((t) =>
                t.id === threadId
                  ? {
                      ...t,
                      title: updatedThread.title,
                      category_id: updatedThread.category_id,
                      category_name: updatedThread.category_name,
                    }
                  : t,
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
      // Sync locked badge to the thread list card
      queryClient.setQueriesData<{ pages: { items: ForumThread[] }[] }>(
        { queryKey: ["forum", "threads"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((t) =>
                t.id === threadId ? { ...t, locked: updatedThread.locked } : t,
              ),
            })),
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

  const categoriesQuery = useQuery({
    queryKey: ["forum", "categories"],
    queryFn: getForumCategories,
    staleTime: 5 * 60 * 1000,
    enabled: isAdmin,
  });
  const categories: ForumCategory[] = categoriesQuery.data ?? [];

  const pinMutation = useMutation({
    mutationFn: (pinned: boolean) => pinForumThread(threadId, pinned),
    onSuccess: (result) => {
      queryClient.setQueryData<InfiniteData<ForumThreadPostsPage>>(
        queryKey,
        (current) => {
          if (!current) return current;
          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              thread: { ...page.thread, is_pinned: result.is_pinned },
            })),
          };
        },
      );
      // Sync pin state to the thread list card
      queryClient.setQueriesData<{ pages: { items: ForumThread[] }[] }>(
        { queryKey: ["forum", "threads"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((t) =>
                t.id === threadId ? { ...t, is_pinned: result.is_pinned } : t,
              ),
            })),
          };
        },
      );
    },
    onError: (error) => {
      Alert.alert(
        "Pin not updated",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    },
  });

  const followMutation = useMutation({
    mutationFn: () => toggleThreadFollow(threadId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData<InfiniteData<ForumThreadPostsPage>>(
        queryKey,
        (current) => {
          if (!current) return current;
          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              thread: {
                ...page.thread,
                viewer_is_following: !page.thread.viewer_is_following,
              },
            })),
          };
        },
      );
    },
    onSuccess: (result) => {
      queryClient.setQueryData<InfiniteData<ForumThreadPostsPage>>(
        queryKey,
        (current) => {
          if (!current) return current;
          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              thread: {
                ...page.thread,
                viewer_is_following: result.following,
                follower_count: result.follower_count,
              },
            })),
          };
        },
      );
      // Refresh the Following tab + its count on the forum screen.
      void queryClient.invalidateQueries({ queryKey: ["forum", "me"] });
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey });
      Alert.alert("Follow failed", "Could not update follow status. Try again.");
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: (postId: number) => togglePostBookmark(threadId, postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData<InfiniteData<ForumThreadPostsPage>>(
        queryKey,
        (current) => {
          if (!current) return current;
          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              posts: page.posts.map((p) =>
                p.id === postId
                  ? { ...p, viewer_has_bookmarked: !p.viewer_has_bookmarked }
                  : p,
              ),
            })),
          };
        },
      );
    },
    onSuccess: (result, postId) => {
      queryClient.setQueryData<InfiniteData<ForumThreadPostsPage>>(
        queryKey,
        (current) => {
          if (!current) return current;
          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              posts: page.posts.map((p) =>
                p.id === postId ? { ...p, viewer_has_bookmarked: result.bookmarked } : p,
              ),
            })),
          };
        },
      );
      // Refresh the Bookmarked tab + its count on the forum screen.
      void queryClient.invalidateQueries({ queryKey: ["forum", "me"] });
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey });
      Alert.alert("Bookmark failed", "Could not update bookmark. Try again.");
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
  // The original poster's username drives the "OP" badge on their own posts.
  // Null when the OP is anonymous, which suppresses the badge everywhere.
  const opUsername = thread?.author_username ?? originalPost?.author_username ?? null;
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

  // Silently mark thread as read when posts load — cursor only advances
  useEffect(() => {
    if (!isSignedIn || posts.length === 0) return;
    const lastPost = posts[posts.length - 1];
    if (!lastPost) return;
    void markThreadRead(threadId, lastPost.id)
      .then(() => {
        // Clear the unread badge in the thread list cache immediately
        queryClient.setQueriesData<{ pages: { items: ForumThread[] }[] }>(
          { queryKey: ["forum", "threads"] },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.map((t) =>
                  t.id === threadId ? { ...t, has_unread: false, unread_count: 0 } : t,
                ),
              })),
            };
          },
        );
      })
      .catch(() => {
        // silent — never surface mark-read errors to the user
      });
  }, [posts, isSignedIn, threadId, queryClient]);

  const handleEditThreadStart = () => {
    if (!thread || !originalPost) return;
    setEditThreadTitle(thread.title);
    setEditThreadBody(originalPost.content_markdown);
    setEditThreadCategoryId(thread.category_id ?? null);
    setIsEditingThread(true);
  };

  const handleEditThreadCancel = () => {
    setIsEditingThread(false);
    setEditThreadTitle("");
    setEditThreadBody("");
    setEditThreadCategoryId(null);
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
      categoryId: editThreadCategoryId,
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

  const handleReport = (post: ForumPost) => {
    setReportModalPost(post);
    setReportReason("");
    setReportError("");
  };

  const submitReport = async () => {
    if (!reportModalPost) return;
    setIsSubmittingReport(true);
    setReportError("");
    try {
      await reportPost(threadId, reportModalPost.id, reportReason.trim() || undefined);
      setReportedPostIds((prev) => new Set(prev).add(reportModalPost.id));
      setReportModalPost(null);
      Alert.alert("Report submitted", "Our team will review it. Thank you.");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 409) {
        setReportError("You have already reported this post.");
      } else if (axiosErr.response?.status === 429) {
        setReportError("Too many reports recently. Try again later.");
      } else {
        setReportError("Could not submit report. Try again.");
      }
    } finally {
      setIsSubmittingReport(false);
    }
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
  const ensureCanReply = (): boolean => {
    if (!isSignedIn) {
      Alert.alert(
        "Log in to reply",
        "Use your Toon Ranks account to join the discussion.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log in", onPress: () => navigation.navigate("Login") },
        ],
      );
      return false;
    }

    if (!canReplyToThread) {
      Alert.alert("Thread is locked", "This discussion is no longer accepting replies.");
      return false;
    }

    return true;
  };

  const handleStartReply = (post: ForumPost) => {
    if (!ensureCanReply()) return;

    setReplyTarget(post);
    setReplyAttachment(null);
    setReplySelection({ start: 0, end: 0 });
    setComposerExpanded(true);
  };

  const handleStartQuote = (post: ForumPost) => {
    if (!ensureCanReply()) return;

    const quote = buildQuoteMarkdown(post.author_username, post.content_markdown);
    setReplyTarget(post);
    setReplyAttachment(null);
    setReplyText((current) => {
      // Prepend the quote, preserving any in-progress reply text below it.
      const next = `${quote}${current}`.slice(0, REPLY_MAX_LENGTH);
      const caret = Math.min(quote.length, next.length);
      setReplySelection({ start: caret, end: caret });
      return next;
    });
    setComposerExpanded(true);
  };

  const collapseComposer = () => {
    setComposerExpanded(false);
    Keyboard.dismiss();
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
  const handleMentionSelect = (selection: MentionSelection) => {
    setReplyText((current) => {
      if (!activeMention) return current;
      const next = (
        selection.type === "series"
          ? insertForumMention(current, activeMention, selection.series)
          : insertUserMention(current, activeMention, selection.username)
      ).slice(0, REPLY_MAX_LENGTH);
      setReplySelection({ start: next.length, end: next.length });
      return next;
    });
  };
  const handlePickReplyAttachment = async () => {
    const picked = await pickForumMediaAttachment();
    if (picked) setReplyAttachment(picked);
  };
  const handleInsertReadingList = (list: ReadingList) => {
    const ref = buildReadingListRef(list.name, list.share_token);
    setReplyText((current) => {
      const { start, end } = replySelection;
      const next = `${current.slice(0, start)}${ref}${current.slice(end)}`.slice(
        0,
        REPLY_MAX_LENGTH,
      );
      const caret = Math.min(start + ref.length, next.length);
      setReplySelection({ start: caret, end: caret });
      return next;
    });
    setInsertListVisible(false);
    requestAnimationFrame(() => replyInputRef.current?.focus());
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

  const composerFooter = !thread ? null : thread.locked ? (
    <View style={styles.dockedLockedBar}>
      <Ionicons name="lock-closed-outline" size={16} color={colors.warningText} />
      <AppText variant="caption" tone="muted" style={styles.dockedBarText}>
        This thread is locked — new replies are disabled.
      </AppText>
    </View>
  ) : !isSignedIn ? (
    <Pressable
      style={({ pressed }) => [styles.dockedBar, pressed ? styles.pressedLight : null]}
      onPress={() => navigation.navigate("Login")}
      accessibilityRole="button"
      accessibilityLabel="Log in to reply"
    >
      <Ionicons name="log-in-outline" size={18} color={colors.accentStrong} />
      <AppText tone="muted" style={styles.dockedBarText}>
        Log in to reply
      </AppText>
    </Pressable>
  ) : !composerExpanded ? (
    <Pressable
      style={({ pressed }) => [styles.dockedBar, pressed ? styles.pressedLight : null]}
      onPress={() => setComposerExpanded(true)}
      accessibilityRole="button"
      accessibilityLabel="Open reply composer"
    >
      <Ionicons name="create-outline" size={18} color={colors.accentStrong} />
      <AppText
        tone={replyTarget || replyText.trim() ? "primary" : "muted"}
        numberOfLines={1}
        style={styles.dockedBarText}
      >
        {replyTarget
          ? `Replying to @${replyTarget.author_username || "reader"}`
          : replyText.trim()
            ? replyText.trim()
            : "Write a reply…"}
      </AppText>
      {replyTarget ? (
        <Pressable
          hitSlop={8}
          onPress={() => setReplyTarget(null)}
          accessibilityRole="button"
          accessibilityLabel="Clear reply target"
        >
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </Pressable>
  ) : (
    <View style={styles.dockedComposer}>
      <View style={styles.composerHeader}>
        <View style={styles.composerTitle}>
          <Ionicons
            name="return-up-forward-outline"
            size={16}
            color={colors.accentStrong}
          />
          <AppText variant="caption">
            {replyTarget
              ? `Replying to @${replyTarget.author_username || "reader"}`
              : "Reply in thread"}
          </AppText>
          {replyTarget ? (
            <Pressable
              hitSlop={6}
              onPress={() => setReplyTarget(null)}
              accessibilityRole="button"
              accessibilityLabel="Clear reply target"
            >
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.dockedHeaderRight}>
          {replyText.length >= REPLY_MAX_LENGTH * 0.8 ? (
            <AppText
              variant="caption"
              tone={replyText.length > REPLY_MAX_LENGTH ? "danger" : "subtle"}
            >
              {replyText.length}/{REPLY_MAX_LENGTH}
            </AppText>
          ) : null}
          <Pressable
            hitSlop={8}
            onPress={collapseComposer}
            accessibilityRole="button"
            accessibilityLabel="Collapse reply composer"
          >
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>
      <ForumMentionSuggestions mention={activeMention} onSelect={handleMentionSelect} />
      {formattingVisible ? (
        <ForumComposerToolbar
          disabled={replyMutation.isPending}
          onFormat={handleFormatReply}
        />
      ) : null}
      <TextInput
        ref={replyInputRef}
        autoFocus
        autoCapitalize="sentences"
        autoCorrect
        multiline
        textAlignVertical="top"
        value={replyText}
        onChangeText={setReplyText}
        onSelectionChange={(event) => setReplySelection(event.nativeEvent.selection)}
        selection={replySelection}
        placeholder="Write a reply..."
        placeholderTextColor={colors.textSubtle}
        style={styles.dockedInput}
      />
      <ForumAttachmentPicker
        attachment={replyAttachment}
        disabled={replyMutation.isPending}
        onRemove={() => setReplyAttachment(null)}
      />
      <View style={styles.dockedActionsRow}>
        <View style={styles.composerQuickActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              formattingVisible ? "Hide formatting tools" : "Show formatting tools"
            }
            accessibilityState={{ selected: formattingVisible }}
            disabled={replyMutation.isPending}
            onPress={() => setFormattingVisible((prev) => !prev)}
            style={({ pressed }) => [
              styles.quickAction,
              formattingVisible ? styles.quickActionActive : null,
              pressed ? styles.pressedBadge : null,
            ]}
          >
            <AppText variant="caption" style={styles.quickActionLabel}>
              Aa
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Attach image or GIF"
            disabled={replyMutation.isPending}
            onPress={handlePickReplyAttachment}
            style={({ pressed }) => [
              styles.quickAction,
              pressed ? styles.pressedBadge : null,
            ]}
          >
            <Ionicons name="image-outline" size={17} color={colors.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Insert a reading list"
            disabled={replyMutation.isPending}
            onPress={() => setInsertListVisible(true)}
            style={({ pressed }) => [
              styles.quickAction,
              pressed ? styles.pressedBadge : null,
            ]}
          >
            <Ionicons name="bookmark-outline" size={17} color={colors.text} />
          </Pressable>
        </View>
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
    </View>
  );

  return (
    <ScreenShell
      title="Thread"
      subtitle="Read public discussions, vote, and reply with your Toon Ranks account."
      scrollRef={scrollViewRef}
      stickyFooter={composerFooter}
      rightSlot={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={postSearchOpen ? "Close search" : "Search posts"}
          onPress={() => {
            setPostSearchOpen((prev) => !prev);
            setPostSearchQuery("");
            setDebouncedPostSearch("");
          }}
          style={({ pressed }) => [
            styles.threadSearchButton,
            pressed ? styles.pressedLight : null,
          ]}
        >
          <Ionicons
            name={postSearchOpen ? "close" : "search-outline"}
            size={20}
            color={colors.text}
          />
        </Pressable>
      }
    >
      {/* In-thread post search */}
      {postSearchOpen ? (
        <View style={styles.postSearchContainer}>
          <View style={styles.postSearchBar}>
            <Ionicons name="search-outline" size={17} color={colors.textMuted} />
            <TextInput
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Search posts in this thread..."
              placeholderTextColor={colors.textMuted}
              style={styles.postSearchInput}
              value={postSearchQuery}
              onChangeText={setPostSearchQuery}
              returnKeyType="search"
            />
          </View>
          {debouncedPostSearch.length >= 2 ? (
            postSearchResultsQuery.isLoading ? (
              <LoadingState message="Searching..." />
            ) : postSearchResults.length === 0 ? (
              <AppText tone="muted" variant="caption" style={styles.postSearchEmpty}>
                {'No posts matched "'}
                {debouncedPostSearch}
                {'".'}
              </AppText>
            ) : (
              <View style={styles.postSearchResults}>
                {postSearchResults.map((result) => (
                  <Pressable
                    key={result.id}
                    style={({ pressed }) => [
                      styles.postSearchRow,
                      pressed ? styles.pressedLight : null,
                    ]}
                    onPress={() => {
                      setPostSearchOpen(false);
                      setPostSearchQuery("");
                      const ref = postRefs.current.get(result.id);
                      if (ref && scrollViewRef.current) {
                        ref.measureLayout(
                          scrollViewRef.current as unknown as View,
                          (_x, y) =>
                            scrollViewRef.current?.scrollTo({
                              y: Math.max(0, y - spacing.md),
                              animated: true,
                            }),
                          () => {},
                        );
                      }
                    }}
                  >
                    <AppText variant="caption" tone="muted" numberOfLines={1}>
                      @{result.author_username || "Unknown"}
                    </AppText>
                    <AppText variant="caption" numberOfLines={2}>
                      {result.content_markdown.slice(0, 120)}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            )
          ) : debouncedPostSearch.length > 0 ? (
            <AppText tone="muted" variant="caption" style={styles.postSearchEmpty}>
              Type at least 2 characters.
            </AppText>
          ) : null}
        </View>
      ) : null}

      {postsQuery.isLoading ? <LoadingState message="Loading thread..." /> : null}

      {postsQuery.isError ? (
        <ErrorState message="This discussion could not be loaded. Try again in a moment." />
      ) : null}

      {thread && !isEditingThread ? (
        <Surface variant="accent" radius="hero" style={styles.hero}>
          {/* Title */}
          <AppText variant="sectionTitle">{thread.title}</AppText>

          {/* Author row */}
          <View style={styles.heroAuthorRow}>
            <UserAvatar
              username={thread.author_username || "Unknown"}
              avatarUrl={thread.author_avatar_url}
              avatarPreset={thread.author_avatar_preset}
              size="sm"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${thread.author_username || "author"}'s profile`}
              disabled={!thread.author_username}
              onPress={() => openPublicProfile(thread.author_username)}
              style={({ pressed }) => (pressed ? styles.pressedBadge : null)}
            >
              <RoleNameText variant="caption" role={thread.author_role}>
                {thread.author_username || "Unknown"}
              </RoleNameText>
            </Pressable>
            <RankerBadge rank={rankForUsername(topRankMap, thread.author_username)} />
            <AppText variant="caption" tone="muted">
              · {timeAgo(thread.created_at)}
            </AppText>
          </View>

          {/* Stats + status chips */}
          <View style={styles.heroStats}>
            <View style={styles.threadFlag}>
              <Ionicons
                name="chatbubbles-outline"
                size={13}
                color={colors.accentStrong}
              />
              <AppText variant="caption">
                {formatForumCount(Math.max(0, thread.post_count - 1), "reply", "replies")}
              </AppText>
            </View>
            {thread.view_count != null && thread.view_count > 0 ? (
              <View style={styles.threadFlag}>
                <Ionicons name="eye-outline" size={13} color={colors.textMuted} />
                <AppText variant="caption" tone="muted">
                  {thread.view_count.toLocaleString()} views
                </AppText>
              </View>
            ) : null}
            {thread.category_name ? (
              <View style={styles.threadFlag}>
                <Ionicons name="folder-outline" size={13} color={colors.textMuted} />
                <AppText variant="caption" tone="muted">
                  {thread.category_name}
                </AppText>
              </View>
            ) : null}
            {thread.is_pinned ? (
              <View style={[styles.threadFlag, styles.pinnedFlag]}>
                <Ionicons name="pin-outline" size={13} color={colors.warningText} />
                <AppText variant="caption" style={styles.warningText}>
                  Pinned
                </AppText>
              </View>
            ) : null}
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
                  name="swap-vertical-outline"
                  size={13}
                  color={colors.accentStrong}
                />
                <AppText variant="caption">Latest first</AppText>
              </View>
            ) : null}
          </View>

          {/* Follow button — signed-in users only */}
          {isSignedIn ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                thread.viewer_is_following ? "Unfollow thread" : "Follow thread"
              }
              onPress={() => followMutation.mutate()}
              disabled={followMutation.isPending}
              style={({ pressed }) => [
                styles.followButton,
                thread.viewer_is_following ? styles.followButtonActive : null,
                pressed ? styles.pressedBadge : null,
              ]}
            >
              <Ionicons
                name={
                  thread.viewer_is_following ? "notifications" : "notifications-outline"
                }
                size={15}
                color={thread.viewer_is_following ? colors.accentStrong : colors.text}
              />
              <AppText
                variant="caption"
                style={
                  thread.viewer_is_following ? styles.followButtonTextActive : undefined
                }
              >
                {thread.viewer_is_following ? "Following" : "Follow"}
              </AppText>
              {thread.follower_count != null && thread.follower_count > 0 ? (
                <AppText variant="caption" tone="muted">
                  · {thread.follower_count}
                </AppText>
              ) : null}
            </Pressable>
          ) : null}

          {/* Admin / author actions — behind a "⋯" overflow (see
              FORUM_REDDIT_REFINEMENT doc) instead of a visible button row */}
          {canManageThread ? (
            <View style={styles.heroActionsRow}>
              <View style={styles.heroDivider} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Thread actions"
                onPress={() => setThreadActionsOpen(true)}
                style={({ pressed }) => [
                  styles.replyAction,
                  pressed ? styles.pressedBadge : null,
                ]}
              >
                <Ionicons name="ellipsis-horizontal" size={15} color={colors.text} />
                <AppText variant="caption">Thread actions</AppText>
              </Pressable>
            </View>
          ) : null}
        </Surface>
      ) : null}

      {/* Thread actions bottom sheet (owner/admin) */}
      {thread && canManageThread ? (
        <Modal
          transparent
          visible={threadActionsOpen}
          animationType="fade"
          onRequestClose={() => setThreadActionsOpen(false)}
        >
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setThreadActionsOpen(false)}
          />
          <View style={styles.actionSheet}>
            <Pressable
              disabled={!originalPost}
              onPress={() => {
                setThreadActionsOpen(false);
                handleEditThreadStart();
              }}
              style={({ pressed }) => [
                styles.sheetRow,
                pressed ? styles.sheetRowPressed : null,
              ]}
            >
              <Ionicons name="pencil-outline" size={17} color={colors.text} />
              <AppText>Edit thread</AppText>
            </Pressable>
            {isAdmin ? (
              <>
                <Pressable
                  disabled={lockMutation.isPending}
                  onPress={() => {
                    setThreadActionsOpen(false);
                    handleLockThread();
                  }}
                  style={({ pressed }) => [
                    styles.sheetRow,
                    pressed ? styles.sheetRowPressed : null,
                  ]}
                >
                  <Ionicons
                    name={thread.locked ? "lock-open-outline" : "lock-closed-outline"}
                    size={17}
                    color={colors.text}
                  />
                  <AppText>{thread.locked ? "Unlock thread" : "Lock thread"}</AppText>
                </Pressable>
                <Pressable
                  disabled={settingsMutation.isPending}
                  onPress={() => {
                    setThreadActionsOpen(false);
                    handleToggleLatestFirst();
                  }}
                  style={({ pressed }) => [
                    styles.sheetRow,
                    pressed ? styles.sheetRowPressed : null,
                  ]}
                >
                  <Ionicons
                    name="swap-vertical-outline"
                    size={17}
                    color={thread.latest_first ? colors.accentStrong : colors.text}
                  />
                  <AppText tone={thread.latest_first ? "accent" : undefined}>
                    {thread.latest_first ? "Latest first: on" : "Latest first: off"}
                  </AppText>
                </Pressable>
                <Pressable
                  disabled={pinMutation.isPending}
                  onPress={() => {
                    setThreadActionsOpen(false);
                    const nextPinned = !thread.is_pinned;
                    Alert.alert(
                      nextPinned ? "Pin thread?" : "Unpin thread?",
                      nextPinned
                        ? "This thread will appear at the top of the thread list."
                        : "This thread will no longer be pinned.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: nextPinned ? "Pin" : "Unpin",
                          onPress: () => pinMutation.mutate(nextPinned),
                        },
                      ],
                    );
                  }}
                  style={({ pressed }) => [
                    styles.sheetRow,
                    pressed ? styles.sheetRowPressed : null,
                  ]}
                >
                  <Ionicons
                    name={thread.is_pinned ? "pin" : "pin-outline"}
                    size={17}
                    color={thread.is_pinned ? colors.accentStrong : colors.text}
                  />
                  <AppText tone={thread.is_pinned ? "accent" : undefined}>
                    {thread.is_pinned ? "Unpin thread" : "Pin thread"}
                  </AppText>
                </Pressable>
              </>
            ) : null}
            <Pressable
              disabled={deleteThreadMutation.isPending}
              onPress={() => {
                setThreadActionsOpen(false);
                handleDeleteThread();
              }}
              style={({ pressed }) => [
                styles.sheetRow,
                pressed ? styles.sheetRowPressed : null,
              ]}
            >
              <Ionicons name="trash-outline" size={17} color={colors.danger} />
              <AppText tone="danger">Delete thread</AppText>
            </Pressable>
          </View>
        </Modal>
      ) : null}

      {isEditingThread ? (
        <Surface radius="xl" style={styles.threadEditCard}>
          <AppText variant="cardTitle">Edit thread</AppText>
          {isAdmin && categories.length > 0 ? (
            <View style={styles.editCategorySection}>
              <AppText variant="caption">Category (optional)</AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pillStrip}
              >
                <Pressable
                  onPress={() => setEditThreadCategoryId(null)}
                  style={[
                    styles.categoryPill,
                    editThreadCategoryId === null ? styles.categoryPillActive : null,
                  ]}
                >
                  <AppText
                    variant="caption"
                    style={
                      editThreadCategoryId === null
                        ? styles.pillTextActive
                        : styles.pillText
                    }
                  >
                    None
                  </AppText>
                </Pressable>
                {categories.map((cat) => {
                  const active = editThreadCategoryId === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setEditThreadCategoryId(active ? null : cat.id)}
                      style={[
                        styles.categoryPill,
                        active ? styles.categoryPillActive : null,
                      ]}
                    >
                      <AppText
                        variant="caption"
                        style={active ? styles.pillTextActive : styles.pillText}
                      >
                        {cat.name}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
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
          <ForumMentionSuggestions
            mention={activeThreadBodyMention}
            onSelect={(selection) => {
              setEditThreadBody((current) => {
                if (!activeThreadBodyMention) return current;
                return (
                  selection.type === "series"
                    ? insertForumMention(
                        current,
                        activeThreadBodyMention,
                        selection.series,
                      )
                    : insertUserMention(
                        current,
                        activeThreadBodyMention,
                        selection.username,
                      )
                ).slice(0, REPLY_MAX_LENGTH);
              });
            }}
          />
          <TextInput
            value={editThreadBody}
            onChangeText={(v) => setEditThreadBody(v.slice(0, REPLY_MAX_LENGTH))}
            placeholder="First post content..."
            placeholderTextColor={colors.textSubtle}
            multiline
            textAlignVertical="top"
            style={styles.replyInput}
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
          <View style={styles.opRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${
                originalPost.author_username || "reader"
              }'s profile`}
              disabled={!originalPost.author_username}
              onPress={() => openPublicProfile(originalPost.author_username)}
              style={({ pressed }) => (pressed ? styles.pressedBadge : null)}
            >
              <UserAvatar
                username={originalPost.author_username || "Reader"}
                avatarUrl={originalPost.author_avatar_url}
                avatarPreset={originalPost.author_avatar_preset}
                size="md"
              />
            </Pressable>
            <View style={styles.contentColumn}>
              <PostCard
                post={originalPost}
                isOriginalPost
                isOp={Boolean(opUsername)}
                pendingVote={
                  voteMutation.isPending &&
                  voteMutation.variables?.postId === originalPost.id
                    ? voteMutation.variables.vote
                    : null
                }
                onVote={handleVote}
                canReply={canReplyToThread}
                onStartReply={handleStartReply}
                onStartQuote={handleStartQuote}
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
                isBookmarked={originalPost.viewer_has_bookmarked}
                onBookmark={isSignedIn ? (p) => bookmarkMutation.mutate(p.id) : undefined}
                canReport={
                  isSignedIn &&
                  !!originalPost.author_username &&
                  originalPost.author_username !== user?.username &&
                  !reportedPostIds.has(originalPost.id)
                }
                onReport={handleReport}
              />
            </View>
          </View>
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
          <View style={styles.replyList}>
            {topLevelReplies.map((post) => (
              <CommentNode
                key={post.id}
                post={post}
                byParent={byParent}
                depth={0}
                pendingVote={
                  voteMutation.isPending ? (voteMutation.variables ?? null) : null
                }
                onVote={handleVote}
                canReply={canReplyToThread}
                onStartReply={handleStartReply}
                onStartQuote={handleStartQuote}
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
                registerPostRef={registerPostRef}
                topRankMap={topRankMap}
                onAuthorPress={openPublicProfile}
                onBookmark={isSignedIn ? (p) => bookmarkMutation.mutate(p.id) : undefined}
                onReport={isSignedIn ? handleReport : undefined}
                reportedPostIds={reportedPostIds}
                opUsername={opUsername}
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

      {/* Report modal */}
      <Modal transparent visible={!!reportModalPost} animationType="slide">
        <View style={styles.reportModalBackdrop}>
          <Surface radius="xl" style={styles.reportModal}>
            <AppText variant="sectionTitle">Report post</AppText>
            <AppText tone="muted">
              Briefly describe the issue (optional). Our team will review it.
            </AppText>
            <TextInput
              value={reportReason}
              onChangeText={(t) => {
                setReportReason(t);
                setReportError("");
              }}
              placeholder="Reason (optional)"
              placeholderTextColor={colors.textMuted}
              maxLength={500}
              multiline
              style={styles.reportInput}
            />
            {reportError ? (
              <AppText tone="danger" variant="caption">
                {reportError}
              </AppText>
            ) : null}
            <View style={styles.reportActions}>
              <AppButton
                label="Cancel"
                variant="ghost"
                disabled={isSubmittingReport}
                onPress={() => setReportModalPost(null)}
              />
              <AppButton
                label={isSubmittingReport ? "Submitting…" : "Submit Report"}
                selected
                disabled={isSubmittingReport}
                iconLeft={
                  isSubmittingReport ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : undefined
                }
                onPress={() => void submitReport()}
              />
            </View>
          </Surface>
        </View>
      </Modal>

      <InsertReadingListSheet
        visible={insertListVisible}
        onClose={() => setInsertListVisible(false)}
        onInsert={handleInsertReadingList}
      />
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

function getStyles() {
  return StyleSheet.create({
    hero: {
      gap: spacing.sm,
    },
    heroAuthorRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    heroStats: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    heroActionsRow: {
      gap: spacing.sm,
    },
    heroDivider: {
      height: 1,
      backgroundColor: colors.accentBorder,
      marginVertical: spacing.xs,
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
    pinnedFlag: {
      backgroundColor: colors.warningSurface,
      borderColor: colors.warningBorder,
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
    dockedBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.surfaceRaised,
    },
    dockedBarText: {
      flex: 1,
      minWidth: 0,
    },
    dockedLockedBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      minHeight: 44,
      paddingHorizontal: spacing.md,
    },
    dockedComposer: {
      gap: spacing.sm,
    },
    dockedActionsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    composerQuickActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    quickAction: {
      minWidth: 38,
      height: 34,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.backgroundSoft,
      paddingHorizontal: spacing.sm,
    },
    quickActionActive: {
      borderColor: colors.accentBorder,
      backgroundColor: colors.accentSoft,
    },
    quickActionLabel: {
      fontWeight: "800",
    },
    dockedHeaderRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    dockedInput: {
      minHeight: 44,
      maxHeight: 140,
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
    // Flat comment (no card) — used for the original post and every reply.
    comment: {
      gap: spacing.xs,
    },
    commentOriginal: {
      gap: spacing.sm,
    },
    commentHeaderText: {
      gap: 2,
    },
    // One comment + its branch: avatar/rail column on the left, content on right.
    branchRow: {
      flexDirection: "row",
      gap: RAIL_GAP,
      position: "relative",
    },
    railColumn: {
      width: RAIL_AVATAR,
      alignItems: "center",
    },
    railSvg: {
      position: "absolute",
      left: 0,
      top: 0,
    },
    // Transparent, full-height tap target over the rail — collapses the branch.
    railHit: {
      flex: 1,
      alignSelf: "stretch",
      marginTop: 4,
    },
    expandButton: {
      marginTop: 4,
      width: 18,
      height: 18,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.accentBorder,
      backgroundColor: colors.accentSoft,
    },
    expandButtonText: {
      fontSize: 13,
      lineHeight: 15,
      fontWeight: "800",
      color: colors.accentStrong,
    },
    contentColumn: {
      flex: 1,
      minWidth: 0,
    },
    opRow: {
      flexDirection: "row",
      gap: RAIL_GAP,
    },
    replyList: {
      gap: spacing.md,
    },
    childrenWrap: {
      marginTop: spacing.sm,
      gap: spacing.md,
    },
    authorLine: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: spacing.xs,
    },
    originalPostPill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radii.pill,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accentBorder,
    },
    originalPostPillText: {
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "700",
      letterSpacing: 0.4,
      color: colors.accentStrong,
      textTransform: "uppercase",
    },
    opBadge: {
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accentBorder,
    },
    opBadgeText: {
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "800",
      letterSpacing: 0.5,
      color: colors.accentStrong,
    },
    postFooter: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: spacing.md,
    },
    // Plain-text reply/overflow action — no border/pill — placed beside the votes.
    textAction: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: spacing.xs,
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
    threadSearchButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.pill,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    postSearchContainer: {
      gap: spacing.sm,
    },
    postSearchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.surfaceRaised,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    postSearchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      paddingVertical: 0,
    },
    postSearchResults: {
      gap: spacing.xs,
    },
    postSearchRow: {
      gap: 2,
      padding: spacing.sm,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.backgroundSoft,
    },
    postSearchEmpty: {
      paddingHorizontal: spacing.xs,
    },
    sheetBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    actionSheet: {
      backgroundColor: colors.surfaceRaised,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: colors.borderSoft,
      overflow: "hidden",
      paddingBottom: spacing.lg,
    },
    sheetRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 11,
    },
    sheetRowPressed: {
      backgroundColor: colors.backgroundSoft,
    },
    sheetDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderSoft,
      marginHorizontal: spacing.md,
    },
    reportModalBackdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.6)",
    },
    reportModal: {
      gap: spacing.md,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    reportInput: {
      borderWidth: 1,
      borderColor: colors.borderSoft,
      borderRadius: radii.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.text,
      backgroundColor: colors.backgroundSoft,
      fontSize: 15,
      minHeight: 80,
      textAlignVertical: "top",
    },
    reportActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.sm,
    },
    pressedLight: {
      opacity: 0.6,
    },
    followButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.backgroundSoft,
    },
    followButtonActive: {
      borderColor: colors.accentBorder,
      backgroundColor: colors.accentSoft,
    },
    followButtonTextActive: {
      color: colors.accentStrong,
    },
    activeBookmarkAction: {
      borderColor: colors.credBorder,
      backgroundColor: colors.credSurface,
    },
    postDateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    editedLabel: {
      fontStyle: "italic",
    },
    editCategorySection: {
      gap: spacing.xs,
    },
    pillStrip: {
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: 2,
    },
    categoryPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.backgroundSoft,
    },
    categoryPillActive: {
      borderColor: colors.accentBorder,
      backgroundColor: colors.accent,
    },
    pillText: {
      color: colors.textMuted,
    },
    pillTextActive: {
      color: colors.text,
    },
  });
}
