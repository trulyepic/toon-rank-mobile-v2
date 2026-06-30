import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  useMutation,
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import {
  createForumCategory,
  deleteForumCategory,
  getForumCategories,
  getForumThreads,
  getMyBookmarkedPosts,
  getMyFollowedThreads,
  pinForumThread,
  updateForumCategory,
  type ForumThreadSort,
} from "../api/forum";
import { useAuth } from "../auth/AuthContext";
import {
  AppButton,
  AppText,
  EmptyState,
  ErrorState,
  ForumPersonalFeed,
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
import type { ForumCategory, ForumThread } from "../types/forum";
import { formatForumCount, formatForumDate } from "../utils/forumFormatting";
import { rankForUsername, useTopRankMap } from "../hooks/useTopRankMap";
import { useNotificationCount } from "../hooks/useNotificationCount";

const SORT_OPTIONS: { value: ForumThreadSort; label: string }[] = [
  { value: "activity", label: "Active" },
  { value: "newest", label: "Newest" },
  { value: "replies", label: "Most replies" },
];

type ForumView = "discover" | "following" | "bookmarked";

const TAB_OPTIONS: { value: ForumView; label: string }[] = [
  { value: "discover", label: "Discover" },
  { value: "following", label: "Following" },
  { value: "bookmarked", label: "Bookmarked" },
];

function ThreadCard({
  thread,
  rank,
  showCategory,
  onPinToggle,
  isAdmin,
}: {
  thread: ForumThread;
  rank?: number;
  showCategory: boolean;
  onPinToggle?: (thread: ForumThread) => void;
  isAdmin: boolean;
}) {
  const styles = getStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const seriesLabel =
    thread.series_refs.length > 0
      ? thread.series_refs
          .slice(0, 2)
          .map((series) => series.title)
          .filter(Boolean)
          .join(" / ")
      : "General discussion";
  const authorUsername = thread.author_username || "Unknown";
  const openAuthorProfile = () => {
    if (!thread.author_username) return;
    navigation.navigate("PublicProfile", { username: thread.author_username });
  };

  return (
    <Pressable
      onPress={() => navigation.navigate("ForumThread", { threadId: thread.id })}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      <Surface
        variant="raised"
        radius="xl"
        style={[styles.threadCard, thread.is_pinned ? styles.pinnedCard : null]}
      >
        <View style={styles.threadHeader}>
          <View style={[styles.threadIcon, thread.is_pinned ? styles.pinnedIcon : null]}>
            <Ionicons
              name={thread.is_pinned ? "pin" : "chatbubble-ellipses-outline"}
              size={19}
              color={thread.is_pinned ? colors.warningText : colors.text}
            />
          </View>
          <View style={styles.threadTitleWrap}>
            <View style={styles.threadTitleRow}>
              <AppText
                variant="cardTitle"
                style={thread.has_unread ? styles.unreadTitle : undefined}
                numberOfLines={2}
              >
                {thread.title}
              </AppText>
              {thread.has_unread && thread.unread_count ? (
                <View style={styles.unreadChip}>
                  <AppText style={styles.unreadChipText}>
                    {thread.unread_count} new
                  </AppText>
                </View>
              ) : null}
            </View>
            <AppText variant="caption" tone="muted">
              {seriesLabel}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>

        <View style={styles.metaRow}>
          <UserAvatar
            username={authorUsername}
            avatarUrl={thread.author_avatar_url}
            avatarPreset={thread.author_avatar_preset}
            size="sm"
          />
          <View style={styles.metaText}>
            <View style={styles.authorNameRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${authorUsername}'s profile`}
                disabled={!thread.author_username}
                onPress={(event) => {
                  event.stopPropagation();
                  openAuthorProfile();
                }}
                style={({ pressed }) => (pressed ? styles.pressedLight : null)}
              >
                <RoleNameText variant="caption" role={thread.author_role}>
                  {authorUsername}
                </RoleNameText>
              </Pressable>
              <RankerBadge rank={rank} />
            </View>
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
          {thread.is_pinned ? (
            <View style={[styles.badge, styles.pinnedBadge]}>
              <Ionicons name="pin-outline" size={13} color={colors.warningText} />
              <AppText variant="caption" style={{ color: colors.warningText }}>
                Pinned
              </AppText>
            </View>
          ) : null}
          {thread.locked ? (
            <View style={styles.badge}>
              <Ionicons name="lock-closed-outline" size={13} color={colors.warningText} />
              <AppText variant="caption">Locked</AppText>
            </View>
          ) : null}
          {showCategory && thread.category_name ? (
            <View style={styles.badge}>
              <Ionicons name="folder-outline" size={13} color={colors.textMuted} />
              <AppText variant="caption" tone="muted">
                {thread.category_name}
              </AppText>
            </View>
          ) : null}
          {isAdmin ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={thread.is_pinned ? "Unpin thread" : "Pin thread"}
              onPress={(event) => {
                event.stopPropagation();
                onPinToggle?.(thread);
              }}
              style={({ pressed }) => [
                styles.badge,
                styles.adminBadge,
                pressed ? styles.pressedLight : null,
              ]}
            >
              <Ionicons
                name={thread.is_pinned ? "pin" : "pin-outline"}
                size={13}
                color={colors.accentStrong}
              />
              <AppText variant="caption" style={{ color: colors.accentStrong }}>
                {thread.is_pinned ? "Unpin" : "Pin"}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </Surface>
    </Pressable>
  );
}

function CategoryManagerModal({
  visible,
  categories,
  onClose,
  onRefresh,
}: {
  visible: boolean;
  categories: ForumCategory[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const styles = getStyles();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      createForumCategory({
        name: newName.trim(),
        description: newDescription.trim() || null,
      }),
    onSuccess: () => {
      setNewName("");
      setNewDescription("");
      void queryClient.invalidateQueries({ queryKey: ["forum", "categories"] });
      onRefresh();
    },
    onError: () =>
      Alert.alert("Create failed", "A category with that name may already exist."),
  });

  const updateMutation = useMutation({
    mutationFn: (id: number) =>
      updateForumCategory(id, {
        name: editName.trim(),
        description: editDescription.trim() || null,
      }),
    onSuccess: () => {
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ["forum", "categories"] });
      onRefresh();
    },
    onError: () => Alert.alert("Update failed", "Could not update category."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteForumCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["forum", "categories"] });
      onRefresh();
    },
    onError: () =>
      Alert.alert(
        "Cannot delete",
        "Re-assign all threads in this category before deleting it.",
      ),
  });

  const startEdit = (cat: ForumCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description ?? "");
  };

  const confirmDelete = (cat: ForumCategory) => {
    Alert.alert(
      "Delete category",
      `Delete "${cat.name}"? Threads must be re-assigned first.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(cat.id),
        },
      ],
    );
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.modalBackdrop}>
        <Surface radius="xl" style={styles.categoryModal}>
          <View style={styles.modalHeader}>
            <AppText variant="sectionTitle">Manage Categories</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.categoryList}>
            {categories.map((cat) => (
              <Surface
                key={cat.id}
                variant="raised"
                radius="lg"
                style={styles.categoryRow}
              >
                {editingId === cat.id ? (
                  <View style={styles.editCategoryForm}>
                    <TextInput
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="Category name"
                      placeholderTextColor={colors.textMuted}
                      style={styles.categoryInput}
                    />
                    <TextInput
                      value={editDescription}
                      onChangeText={setEditDescription}
                      placeholder="Description (optional)"
                      placeholderTextColor={colors.textMuted}
                      style={styles.categoryInput}
                    />
                    <View style={styles.categoryRowActions}>
                      <AppButton
                        label={updateMutation.isPending ? "Saving..." : "Save"}
                        size="sm"
                        selected
                        disabled={!editName.trim() || updateMutation.isPending}
                        onPress={() => updateMutation.mutate(cat.id)}
                      />
                      <AppButton
                        label="Cancel"
                        size="sm"
                        variant="ghost"
                        onPress={() => setEditingId(null)}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.categoryRowContent}>
                    <View style={styles.categoryRowText}>
                      <AppText variant="cardTitle">{cat.name}</AppText>
                      {cat.description ? (
                        <AppText variant="caption" tone="muted">
                          {cat.description}
                        </AppText>
                      ) : null}
                      <AppText variant="caption" tone="subtle">
                        {cat.thread_count} threads
                      </AppText>
                    </View>
                    <View style={styles.categoryRowActions}>
                      <AppButton
                        label="Edit"
                        size="sm"
                        variant="secondary"
                        onPress={() => startEdit(cat)}
                      />
                      <AppButton
                        label="Delete"
                        size="sm"
                        variant="ghost"
                        onPress={() => confirmDelete(cat)}
                      />
                    </View>
                  </View>
                )}
              </Surface>
            ))}

            <Surface variant="raised" radius="lg" style={styles.categoryRow}>
              <AppText variant="cardTitle">Add category</AppText>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Category name"
                placeholderTextColor={colors.textMuted}
                style={styles.categoryInput}
              />
              <TextInput
                value={newDescription}
                onChangeText={setNewDescription}
                placeholder="Description (optional)"
                placeholderTextColor={colors.textMuted}
                style={styles.categoryInput}
              />
              <AppButton
                label={createMutation.isPending ? "Creating..." : "Create"}
                size="sm"
                selected
                disabled={!newName.trim() || createMutation.isPending}
                iconLeft={
                  createMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : undefined
                }
                onPress={() => createMutation.mutate()}
              />
            </Surface>
          </ScrollView>
        </Surface>
      </View>
    </Modal>
  );
}

export function ForumScreen() {
  const styles = getStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isSignedIn, user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const queryClient = useQueryClient();
  const topRankMap = useTopRankMap();
  const { count: notifCount } = useNotificationCount();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<ForumThreadSort>("activity");
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [searchPosts, setSearchPosts] = useState(false);
  const [view, setView] = useState<ForumView>("discover");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const categoriesQuery = useQuery({
    queryKey: ["forum", "categories"],
    queryFn: getForumCategories,
    staleTime: 5 * 60 * 1000,
  });
  const categories = categoriesQuery.data ?? [];
  const activeCategory = categories.find((c) => c.slug === activeCategorySlug) ?? null;

  // Lightweight first-page requests just to label the tabs with totals.
  const followingCountQuery = useQuery({
    queryKey: ["forum", "me", "following", "count"],
    queryFn: () => getMyFollowedThreads(1, 1),
    enabled: isSignedIn,
    staleTime: 60 * 1000,
  });
  const bookmarkCountQuery = useQuery({
    queryKey: ["forum", "me", "bookmarks", "count"],
    queryFn: () => getMyBookmarkedPosts(1, 1),
    enabled: isSignedIn,
    staleTime: 60 * 1000,
  });
  const followingCount = followingCountQuery.data?.total;
  const bookmarkCount = bookmarkCountQuery.data?.total;

  const threadsQuery = useInfiniteQuery({
    queryKey: ["forum", "threads", debouncedQuery, sort, activeCategorySlug, searchPosts],
    queryFn: ({ pageParam }) =>
      getForumThreads(
        pageParam,
        20,
        debouncedQuery || undefined,
        sort,
        activeCategorySlug ?? undefined,
        debouncedQuery ? searchPosts : undefined,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.has_next ? lastPage.page + 1 : undefined),
  });
  const pages = threadsQuery.data?.pages ?? [];
  const threads = pages.flatMap((page) => page.items);
  const totalThreads = pages[0]?.total ?? 0;
  const hasThreads = threads.length > 0;
  const hasNextPage = Boolean(threadsQuery.hasNextPage);

  const pinMutation = useMutation({
    mutationFn: ({ threadId, pinned }: { threadId: number; pinned: boolean }) =>
      pinForumThread(threadId, pinned),
    onMutate: async ({ threadId, pinned }) => {
      await queryClient.cancelQueries({ queryKey: ["forum", "threads"] });
      queryClient.setQueriesData<{ pages: { items: ForumThread[] }[] }>(
        { queryKey: ["forum", "threads"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((t) =>
                t.id === threadId ? { ...t, is_pinned: pinned } : t,
              ),
            })),
          };
        },
      );
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: ["forum", "threads"] });
      Alert.alert("Pin failed", "Could not update pin status. Try again.");
    },
  });

  const handlePinToggle = (thread: ForumThread) => {
    const nextPinned = !thread.is_pinned;
    Alert.alert(
      nextPinned ? "Pin thread?" : "Unpin thread?",
      nextPinned
        ? `"${thread.title}" will appear at the top of the thread list.`
        : `"${thread.title}" will no longer be pinned.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: nextPinned ? "Pin" : "Unpin",
          onPress: () => pinMutation.mutate({ threadId: thread.id, pinned: nextPinned }),
        },
      ],
    );
  };

  const changeSort = (newSort: ForumThreadSort) => {
    setSort(newSort);
  };

  const changeCategory = (slug: string | null) => {
    setActiveCategorySlug(slug);
  };

  return (
    <ScreenShell
      title="Forum"
      subtitle="Browse Toon Ranks discussions. Vote and reply with your account."
      rightSlot={
        <View style={styles.headerRight}>
          {isSignedIn ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                notifCount > 0 ? `${notifCount} unread notifications` : "Notifications"
              }
              onPress={() => navigation.navigate("Notifications")}
              style={({ pressed }) => [
                styles.gearButton,
                pressed ? styles.pressedLight : null,
              ]}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              {notifCount > 0 ? (
                <View style={styles.notifBadge}>
                  <AppText style={styles.notifBadgeText}>
                    {notifCount > 99 ? "99+" : String(notifCount)}
                  </AppText>
                </View>
              ) : null}
            </Pressable>
          ) : null}
          {isAdmin ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Manage categories"
              onPress={() => setCategoryModalOpen(true)}
              style={({ pressed }) => [
                styles.gearButton,
                pressed ? styles.pressedLight : null,
              ]}
            >
              <Ionicons name="settings-outline" size={20} color={colors.text} />
            </Pressable>
          ) : null}
          <AppButton
            label="New"
            size="sm"
            selected={isSignedIn}
            iconLeft={
              <Ionicons
                name={isSignedIn ? "add" : "log-in-outline"}
                size={15}
                color={colors.text}
              />
            }
            onPress={() =>
              isSignedIn
                ? navigation.navigate("ForumCreateThread")
                : navigation.navigate("Login")
            }
          />
        </View>
      }
    >
      <Surface variant="accent" radius="hero" style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="chatbubbles-outline" size={24} color={colors.text} />
        </View>
        <View style={styles.heroText}>
          <AppText variant="sectionTitle">Community discussions</AppText>
          <AppText tone="muted">
            Read public threads now. Sign in to create threads, reply, and vote with the
            same identity you use on the website.
          </AppText>
        </View>
      </Surface>

      {isSignedIn ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillStrip}
        >
          {TAB_OPTIONS.map((tab) => {
            const count =
              tab.value === "following"
                ? followingCount
                : tab.value === "bookmarked"
                  ? bookmarkCount
                  : undefined;
            const active = view === tab.value;
            return (
              <Pressable
                key={tab.value}
                onPress={() => setView(tab.value)}
                style={[styles.pill, active ? styles.pillActive : null]}
              >
                <AppText
                  variant="caption"
                  style={active ? styles.pillTextActive : styles.pillText}
                >
                  {tab.label}
                </AppText>
                {count != null && count > 0 ? (
                  <AppText
                    variant="caption"
                    style={active ? styles.pillCountActive : styles.pillCount}
                  >
                    {count}
                  </AppText>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {isSignedIn && view !== "discover" ? (
        <ForumPersonalFeed view={view} />
      ) : (
        <>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={colors.textMuted} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Search threads..."
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              value={query}
              onChangeText={(t) => {
                setQuery(t);
                if (!t) setSearchPosts(false);
              }}
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => {
                  setQuery("");
                  setSearchPosts(false);
                }}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          {debouncedQuery.length > 0 ? (
            <Pressable
              onPress={() => setSearchPosts((prev) => !prev)}
              style={styles.searchPostsToggle}
            >
              <View
                style={[
                  styles.searchPostsCheck,
                  searchPosts ? styles.searchPostsCheckOn : null,
                ]}
              >
                {searchPosts ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : null}
              </View>
              <AppText variant="caption" tone={searchPosts ? "accent" : "muted"}>
                Search inside posts
              </AppText>
            </Pressable>
          ) : null}

          {/* Sort controls */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillStrip}
          >
            {SORT_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => changeSort(option.value)}
                style={[styles.pill, sort === option.value ? styles.pillActive : null]}
              >
                <AppText
                  variant="caption"
                  style={sort === option.value ? styles.pillTextActive : styles.pillText}
                >
                  {option.label}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>

          {/* Category filter strip */}
          {categories.length > 0 ? (
            <View style={styles.categorySection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pillStrip}
              >
                <Pressable
                  onPress={() => changeCategory(null)}
                  style={[
                    styles.pill,
                    activeCategorySlug === null ? styles.pillActive : null,
                  ]}
                >
                  <AppText
                    variant="caption"
                    style={
                      activeCategorySlug === null
                        ? styles.pillTextActive
                        : styles.pillText
                    }
                  >
                    All
                  </AppText>
                </Pressable>
                {categories.map((cat) => (
                  <Pressable
                    key={cat.slug}
                    onPress={() => changeCategory(cat.slug)}
                    style={[
                      styles.pill,
                      activeCategorySlug === cat.slug ? styles.pillActive : null,
                    ]}
                  >
                    <AppText
                      variant="caption"
                      style={
                        activeCategorySlug === cat.slug
                          ? styles.pillTextActive
                          : styles.pillText
                      }
                    >
                      {cat.name}
                    </AppText>
                    <AppText
                      variant="caption"
                      style={
                        activeCategorySlug === cat.slug
                          ? styles.pillCountActive
                          : styles.pillCount
                      }
                    >
                      {cat.thread_count}
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>
              {activeCategory?.description ? (
                <AppText
                  variant="caption"
                  tone="muted"
                  style={styles.categoryDescription}
                >
                  {activeCategory.description}
                </AppText>
              ) : null}
            </View>
          ) : null}

          {threadsQuery.isLoading ? (
            <LoadingState message="Loading forum threads..." />
          ) : null}
          {threadsQuery.isError ? (
            <ErrorState message="Forum threads could not be loaded. Try again in a moment." />
          ) : null}

          {threadsQuery.data && !hasThreads ? (
            <EmptyState
              title={debouncedQuery ? "No threads found" : "No discussions yet"}
              message={
                debouncedQuery
                  ? `No threads matched "${debouncedQuery}". Try a different keyword.`
                  : activeCategorySlug
                    ? "No threads in this category yet."
                    : "Public forum threads will appear here once the community starts posting."
              }
            />
          ) : null}

          {hasThreads ? (
            <View style={styles.section}>
              <SectionHeader
                title={
                  debouncedQuery ? `Results for "${debouncedQuery}"` : "Recent threads"
                }
                body={`${formatForumCount(totalThreads, "thread")} available / ${threads.length} shown`}
              />
              <View style={styles.stack}>
                {threads.map((thread) => (
                  <ThreadCard
                    key={thread.id}
                    thread={thread}
                    rank={rankForUsername(topRankMap, thread.author_username)}
                    showCategory={activeCategorySlug === null}
                    isAdmin={isAdmin}
                    onPinToggle={handlePinToggle}
                  />
                ))}
              </View>
              {hasNextPage ? (
                <AppButton
                  label={threadsQuery.isFetchingNextPage ? "Loading..." : "Load more"}
                  disabled={threadsQuery.isFetchingNextPage}
                  onPress={() => threadsQuery.fetchNextPage()}
                  iconRight={
                    <Ionicons name="chevron-down" size={15} color={colors.text} />
                  }
                />
              ) : (
                <AppText variant="caption" tone="subtle" align="center">
                  You are caught up.
                </AppText>
              )}
            </View>
          ) : null}
        </>
      )}

      <CategoryManagerModal
        visible={categoryModalOpen}
        categories={categories}
        onClose={() => setCategoryModalOpen(false)}
        onRefresh={() =>
          void queryClient.invalidateQueries({ queryKey: ["forum", "categories"] })
        }
      />
    </ScreenShell>
  );
}

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
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    notifBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      minWidth: 17,
      height: 17,
      borderRadius: radii.pill,
      backgroundColor: colors.danger,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
      borderWidth: 1.5,
      borderColor: colors.surface,
    },
    notifBadgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "700",
      lineHeight: 13,
    },
    gearButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.pill,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    section: {
      gap: spacing.sm,
    },
    stack: {
      gap: spacing.sm,
    },
    searchBar: {
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
    searchPostsToggle: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      alignSelf: "flex-start",
    },
    searchPostsCheck: {
      width: 18,
      height: 18,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: colors.borderSoft,
      backgroundColor: colors.backgroundSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    searchPostsCheckOn: {
      borderColor: colors.accentStrong,
      backgroundColor: colors.accentStrong,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 16,
      paddingVertical: 0,
    },
    pillStrip: {
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: 2,
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.backgroundSoft,
    },
    pillActive: {
      borderColor: colors.accentBorder,
      backgroundColor: colors.accent,
    },
    pillText: {
      color: colors.textMuted,
    },
    pillTextActive: {
      color: colors.text,
    },
    pillCount: {
      color: colors.textMuted,
      fontSize: 11,
    },
    pillCountActive: {
      color: colors.textMuted,
      fontSize: 11,
    },
    categorySection: {
      gap: spacing.xs,
    },
    categoryDescription: {
      paddingHorizontal: spacing.xs,
      fontStyle: "italic",
    },
    pressed: {
      opacity: 0.86,
      transform: [{ scale: 0.99 }],
    },
    pressedLight: {
      opacity: 0.78,
    },
    disabledPressable: {
      opacity: 1,
    },
    threadCard: {
      gap: spacing.sm,
    },
    pinnedCard: {
      borderLeftWidth: 3,
      borderLeftColor: colors.warningText,
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
    pinnedIcon: {
      backgroundColor: "rgba(245, 158, 11, 0.15)",
      borderColor: colors.warningText,
    },
    threadTitleWrap: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    threadTitleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.xs,
      flexWrap: "wrap",
    },
    unreadTitle: {
      fontWeight: "800",
    },
    unreadChip: {
      backgroundColor: "rgba(22, 163, 74, 0.15)",
      borderWidth: 1,
      borderColor: "rgba(22, 163, 74, 0.4)",
      borderRadius: radii.pill,
      paddingHorizontal: 6,
      paddingVertical: 1,
      alignSelf: "flex-start",
    },
    unreadChipText: {
      color: colors.success,
      fontSize: 10,
      fontWeight: "700",
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
    authorNameRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: spacing.xs,
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
    pinnedBadge: {
      borderColor: colors.warningText,
      backgroundColor: "rgba(245, 158, 11, 0.10)",
    },
    adminBadge: {
      borderColor: colors.accentBorder,
    },
    // Category manager modal
    modalBackdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.6)",
    },
    categoryModal: {
      maxHeight: "85%",
      gap: spacing.md,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    categoryList: {
      gap: spacing.sm,
      paddingBottom: spacing.lg,
    },
    categoryRow: {
      gap: spacing.sm,
    },
    categoryRowContent: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
    },
    categoryRowText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    categoryRowActions: {
      flexDirection: "row",
      gap: spacing.xs,
      flexWrap: "wrap",
    },
    editCategoryForm: {
      gap: spacing.sm,
    },
    categoryInput: {
      borderWidth: 1,
      borderColor: colors.borderSoft,
      borderRadius: radii.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.text,
      backgroundColor: colors.backgroundSoft,
      fontSize: 15,
    },
  });
}
