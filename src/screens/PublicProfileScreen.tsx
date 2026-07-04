import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, View } from "react-native";

import { getPublicProfile } from "../api/users";
import {
  AppButton,
  AppText,
  CoverImage,
  EmptyState,
  ErrorState,
  LoadingState,
  RoleNameText,
  ScreenShell,
  SectionHeader,
  Surface,
  UserAvatar,
  UserTagBadges,
} from "../components";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import type {
  FavoriteSeries,
  PublicForumPost,
  PublicReadingListPreview,
  PublicSeriesRating,
} from "../types/account";

type PublicProfileRoute = RouteProp<RootStackParamList, "PublicProfile">;
type PublicProfileNavigation = NativeStackNavigationProp<RootStackParamList>;

function formatCp(value: number) {
  return `${value.toLocaleString()} CP`;
}

function formatJoinDate(value?: string | null) {
  if (!value) return "Join date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Join date unavailable";

  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatChip({
  icon,
  label,
  accent = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  accent?: boolean;
  onPress?: () => void;
}) {
  const styles = getStyles();
  const content = (
    <>
      <Ionicons
        name={icon}
        size={14}
        color={accent ? colors.credText : colors.textMuted}
      />
      <AppText variant="caption" style={accent ? { color: colors.credText } : undefined}>
        {label}
      </AppText>
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.statChip, accent ? styles.credChip : null]}>{content}</View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.statChip,
        accent ? styles.credChip : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {content}
    </Pressable>
  );
}

function FavoriteCard({
  favorite,
  onPress,
}: {
  favorite: FavoriteSeries;
  onPress: () => void;
}) {
  const styles = getStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${favorite.title}`}
      onPress={onPress}
      style={({ pressed }) => [styles.favoriteCard, pressed ? styles.pressed : null]}
    >
      <CoverImage uri={favorite.cover_url} style={styles.favoriteCover} />
      <View style={styles.favoriteText}>
        <AppText variant="caption" numberOfLines={2}>
          {favorite.title}
        </AppText>
        {favorite.type ? (
          <AppText variant="caption" tone="muted">
            {favorite.type}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

function RatingCard({
  rating,
  onPress,
}: {
  rating: PublicSeriesRating;
  onPress: () => void;
}) {
  const styles = getStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${rating.title ?? "series"}`}
      onPress={onPress}
      style={({ pressed }) => [styles.favoriteCard, pressed ? styles.pressed : null]}
    >
      <View style={styles.ratingCoverWrap}>
        <CoverImage uri={rating.cover_url} style={styles.favoriteCover} />
        <View style={styles.ratingScoreBadge}>
          <Ionicons name="star" size={11} color={colors.accentStrong} />
          <AppText variant="caption" style={styles.ratingScoreText}>
            {rating.score.toFixed(1)}
          </AppText>
        </View>
      </View>
      <View style={styles.favoriteText}>
        <AppText variant="caption" numberOfLines={2}>
          {rating.title ?? "Untitled"}
        </AppText>
        {rating.type ? (
          <AppText variant="caption" tone="muted">
            {rating.type}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

function PostRow({ post, onPress }: { post: PublicForumPost; onPress: () => void }) {
  const styles = getStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open thread ${post.thread_title ?? ""}`}
      onPress={onPress}
      style={({ pressed }) => [styles.postRow, pressed ? styles.pressed : null]}
    >
      <View style={styles.listText}>
        <AppText variant="cardTitle" numberOfLines={1}>
          {post.thread_title ?? "Thread"}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={2}>
          {post.excerpt}
        </AppText>
        {formatDate(post.created_at) ? (
          <AppText variant="caption" tone="subtle">
            {formatDate(post.created_at)}
          </AppText>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function ReadingListRow({
  list,
  onPress,
}: {
  list: PublicReadingListPreview;
  onPress: () => void;
}) {
  const styles = getStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${list.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.listRow, pressed ? styles.pressed : null]}
    >
      <View style={styles.listIcon}>
        <Ionicons name="bookmark-outline" size={18} color={colors.accentStrong} />
      </View>
      <View style={styles.listText}>
        <AppText variant="cardTitle" numberOfLines={1}>
          {list.name}
        </AppText>
        <AppText variant="caption" tone="muted">
          {list.item_count.toLocaleString()} titles
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export function PublicProfileScreen() {
  const styles = getStyles();
  const route = useRoute<PublicProfileRoute>();
  const navigation = useNavigation<PublicProfileNavigation>();
  const { username } = route.params;
  const profileQuery = useQuery({
    queryKey: ["users", "public-profile", username],
    queryFn: () => getPublicProfile(username),
    staleTime: 60_000,
  });

  const profile = profileQuery.data;
  const favorites = profile?.favourites ?? [];
  const readingLists = profile?.reading_lists ?? [];
  const goToLeaderboard = () => navigation.navigate("Leaderboard");

  return (
    <ScreenShell
      title={profile?.username ?? username}
      subtitle="Public Toon Ranks profile."
      rightSlot={
        navigation.canGoBack() ? (
          <AppButton
            label="Back"
            size="sm"
            variant="ghost"
            onPress={() => navigation.goBack()}
            iconLeft={<Ionicons name="chevron-back" size={15} color={colors.text} />}
          />
        ) : undefined
      }
    >
      {profileQuery.isLoading ? <LoadingState message="Loading profile..." /> : null}

      {profileQuery.isError ? (
        <ErrorState message="This profile could not be loaded. Try again in a moment." />
      ) : null}

      {profile ? (
        <>
          <Surface variant="raised" radius="hero" style={styles.profileCard}>
            <View style={styles.accentStrip} />
            <UserAvatar
              username={profile.username}
              avatarUrl={profile.avatar_url}
              avatarPreset={profile.avatar_preset}
              size="xl"
            />
            <View style={styles.identityText}>
              <RoleNameText variant="sectionTitle" role={profile.role} align="center">
                {profile.username}
              </RoleNameText>
              {/* Tag badges replace the raw role string (e.g. "GENERAL") — for
                  untagged users the line simply disappears, which reads cleaner. */}
              <View style={styles.profileTags}>
                <UserTagBadges
                  role={profile.role}
                  seriesRated={profile.ratings?.length ?? 0}
                  postCount={profile.post_count}
                />
              </View>
              <AppText variant="caption" tone="muted" align="center">
                Joined {formatJoinDate(profile.registered_at)}
              </AppText>
            </View>
            <View style={styles.statsRow}>
              {profile.cred_score > 0 ? (
                <StatChip
                  icon="diamond-outline"
                  label={formatCp(profile.cred_score)}
                  accent
                  onPress={goToLeaderboard}
                />
              ) : null}
              {profile.rank ? (
                <StatChip
                  icon="trophy-outline"
                  label={`#${profile.rank} Ranker`}
                  onPress={goToLeaderboard}
                />
              ) : null}
              <StatChip
                icon="chatbubbles-outline"
                label={`${profile.post_count.toLocaleString()} posts`}
              />
            </View>
          </Surface>

          <View style={styles.section}>
            <SectionHeader
              title="Favorite Series"
              body={`Pinned favorites from ${profile.username}.`}
            />
            {favorites.length > 0 ? (
              <View style={styles.favoritesGrid}>
                {favorites.map((favorite) => (
                  <FavoriteCard
                    key={`${favorite.series_id}-${favorite.position}`}
                    favorite={favorite}
                    onPress={() =>
                      navigation.navigate("SeriesDetail", {
                        seriesId: favorite.series_id,
                      })
                    }
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                title="No favorites pinned"
                message={`${profile.username} hasn't pinned any series yet.`}
              />
            )}
          </View>

          {profile.ratings != null ? (
            <View style={styles.section}>
              <SectionHeader
                title="Ratings"
                body={`Series ${profile.username} has rated.`}
              />
              {profile.ratings.length > 0 ? (
                <View style={styles.favoritesGrid}>
                  {profile.ratings.map((rating) => (
                    <RatingCard
                      key={rating.series_id}
                      rating={rating}
                      onPress={() =>
                        navigation.navigate("SeriesDetail", {
                          seriesId: rating.series_id,
                        })
                      }
                    />
                  ))}
                </View>
              ) : (
                <EmptyState
                  title="No ratings yet"
                  message={`${profile.username} hasn't rated any series yet.`}
                />
              )}
            </View>
          ) : null}

          {profile.posts != null ? (
            <View style={styles.section}>
              <SectionHeader
                title="Forum Activity"
                body={`Recent posts from ${profile.username}.`}
              />
              {profile.posts.length > 0 ? (
                <View style={styles.stack}>
                  {profile.posts.map((post) => (
                    <PostRow
                      key={post.post_id}
                      post={post}
                      onPress={() =>
                        navigation.navigate("ForumThread", {
                          threadId: post.thread_id,
                          postId: post.post_id,
                        })
                      }
                    />
                  ))}
                </View>
              ) : (
                <EmptyState
                  title="No posts yet"
                  message={`${profile.username} hasn't posted in the forum yet.`}
                />
              )}
            </View>
          ) : null}

          {readingLists.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader
                title="Reading Lists"
                body={`Shared lists from ${profile.username}.`}
              />
              <View style={styles.stack}>
                {readingLists.map((list) => (
                  <ReadingListRow
                    key={list.share_token}
                    list={list}
                    onPress={() =>
                      navigation.navigate("PublicReadingList", {
                        token: list.share_token,
                      })
                    }
                  />
                ))}
              </View>
            </View>
          ) : null}
        </>
      ) : null}
    </ScreenShell>
  );
}

function getStyles() {
  return StyleSheet.create({
    profileCard: {
      alignItems: "center",
      gap: spacing.md,
      overflow: "hidden",
    },
    accentStrip: {
      alignSelf: "stretch",
      height: 4,
      marginHorizontal: -spacing.md,
      marginTop: -spacing.md,
      backgroundColor: colors.accentBorder,
    },
    identityText: {
      alignItems: "center",
      gap: spacing.xs,
    },
    profileTags: {
      alignItems: "center",
    },
    statsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.xs,
    },
    statChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.backgroundSoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    credChip: {
      borderColor: colors.credBorder,
      backgroundColor: colors.credSurface,
    },
    section: {
      gap: spacing.sm,
    },
    favoritesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    favoriteCard: {
      width: "48%",
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.surfaceRaised,
      overflow: "hidden",
    },
    favoriteCover: {
      width: "100%",
      aspectRatio: 2 / 3,
    },
    favoriteText: {
      gap: 2,
      padding: spacing.sm,
    },
    ratingCoverWrap: {
      position: "relative",
    },
    ratingScoreBadge: {
      position: "absolute",
      top: spacing.xs,
      right: spacing.xs,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      borderRadius: radii.pill,
      // Opaque, theme-aware backing so the score stays legible over any cover
      // and follows the selected theme (was the fixed gold Cred palette).
      backgroundColor: colors.backgroundSoft,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    ratingScoreText: {
      color: colors.accentStrong,
      fontWeight: "800",
    },
    postRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.surfaceRaised,
      padding: spacing.md,
    },
    stack: {
      gap: spacing.sm,
    },
    listRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.surfaceRaised,
      padding: spacing.md,
    },
    listIcon: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.md,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    listText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    pressed: {
      opacity: 0.86,
      transform: [{ scale: 0.99 }],
    },
  });
}
