import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, View } from "react-native";

import { getLeaderboard } from "../api/users";
import {
  AppButton,
  AppText,
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
import { colors, radii, spacing } from "../theme/tokens";
import type { LeaderboardUser } from "../types/account";
import type { RootStackParamList } from "../navigation/RootNavigator";

const PAGE_SIZE = 25;

const RANK_THEMES = {
  first: {
    background: "rgba(232, 162, 58, 0.17)",
    border: "#f0b84d",
    soft: "rgba(240, 184, 77, 0.24)",
    text: "#f8d77d",
    icon: "trophy-outline" as const,
  },
  second: {
    background: "rgba(174, 184, 202, 0.15)",
    border: "#aeb8ca",
    soft: "rgba(174, 184, 202, 0.2)",
    text: "#d7deea",
    icon: "medal-outline" as const,
  },
  third: {
    background: "rgba(218, 137, 83, 0.16)",
    border: "#d88953",
    soft: "rgba(218, 137, 83, 0.22)",
    text: "#f0b184",
    icon: "ribbon-outline" as const,
  },
  default: {
    background: "rgba(49, 95, 220, 0.11)",
    border: colors.borderSoft,
    soft: colors.backgroundSoft,
    text: colors.text,
    icon: "diamond-outline" as const,
  },
};

function getRankTheme(rank: number) {
  if (rank === 1) return RANK_THEMES.first;
  if (rank === 2) return RANK_THEMES.second;
  if (rank === 3) return RANK_THEMES.third;
  return RANK_THEMES.default;
}

function formatCp(value: number) {
  return `${value.toLocaleString()} CP`;
}

function PodiumCard({
  user,
  featured = false,
  onPress,
}: {
  user: LeaderboardUser;
  featured?: boolean;
  onPress: () => void;
}) {
  const styles = getStyles();
  const rankTheme = getRankTheme(user.rank);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${user.username}'s profile`}
      onPress={onPress}
      style={({ pressed }) => [styles.podiumPressable, pressed ? styles.pressed : null]}
    >
      <Surface
        variant={featured ? "accent" : "raised"}
        radius="xl"
        style={[
          styles.podiumCard,
          {
            borderColor: rankTheme.border,
            backgroundColor: rankTheme.background,
          },
          featured ? styles.featuredPodium : null,
        ]}
      >
        <View
          style={[
            styles.rankPill,
            {
              backgroundColor: rankTheme.soft,
              borderColor: rankTheme.border,
            },
          ]}
        >
          <Ionicons name={rankTheme.icon} size={13} color={rankTheme.text} />
          <AppText variant="caption" style={{ color: rankTheme.text }}>
            #{user.rank}
          </AppText>
        </View>
        <View style={[styles.avatarRing, { borderColor: rankTheme.border }]}>
          <UserAvatar
            username={user.username}
            avatarUrl={user.avatar_url}
            avatarPreset={user.avatar_preset}
            size={featured ? "xl" : "lg"}
          />
        </View>
        <RoleNameText
          variant={featured ? "sectionTitle" : "cardTitle"}
          role={user.role}
          align="center"
        >
          {user.username}
        </RoleNameText>
        <UserTagBadges
          role={user.role}
          seriesRated={user.series_rated}
          postCount={user.post_count}
        />
        <AppText align="center" style={{ color: rankTheme.text }}>
          {formatCp(user.cred_score)}
        </AppText>
        <AppText variant="caption" tone="subtle" align="center">
          {user.post_count} posts / {user.series_rated} rated
        </AppText>
      </Surface>
    </Pressable>
  );
}

function LeaderboardRow({
  user,
  onPress,
}: {
  user: LeaderboardUser;
  onPress: () => void;
}) {
  const styles = getStyles();
  const rankTheme = getRankTheme(user.rank);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${user.username}'s profile`}
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      <Surface
        variant="raised"
        radius="lg"
        style={[
          styles.row,
          user.rank <= 10
            ? {
                borderColor: rankTheme.border,
                backgroundColor:
                  user.rank <= 3 ? rankTheme.background : colors.surfaceRaised,
              }
            : null,
        ]}
      >
        <View
          style={[
            styles.rowRank,
            {
              backgroundColor: user.rank <= 10 ? rankTheme.soft : colors.backgroundSoft,
              borderColor: user.rank <= 10 ? rankTheme.border : colors.borderSoft,
            },
          ]}
        >
          <AppText
            variant="caption"
            style={{ color: user.rank <= 10 ? rankTheme.text : colors.text }}
          >
            #{user.rank}
          </AppText>
        </View>
        <UserAvatar
          username={user.username}
          avatarUrl={user.avatar_url}
          avatarPreset={user.avatar_preset}
          size="md"
        />
        <View style={styles.rowText}>
          <RoleNameText variant="cardTitle" role={user.role}>
            {user.username}
          </RoleNameText>
          <UserTagBadges
            role={user.role}
            seriesRated={user.series_rated}
            postCount={user.post_count}
          />
          <AppText variant="caption" tone="muted">
            {user.post_count} posts / {user.series_rated} rated
          </AppText>
        </View>
        <View style={styles.cpPill}>
          <Ionicons name="diamond-outline" size={13} color={colors.credText} />
          <AppText variant="caption" style={{ color: colors.credText }}>
            {formatCp(user.cred_score)}
          </AppText>
        </View>
      </Surface>
    </Pressable>
  );
}

export function LeaderboardScreen() {
  const styles = getStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const leaderboardQuery = useInfiniteQuery({
    queryKey: ["users", "leaderboard"],
    queryFn: ({ pageParam }) => getLeaderboard(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
  });

  const pages = leaderboardQuery.data?.pages ?? [];
  const users = pages.flatMap((page) => page.items);
  const topUsers = users.slice(0, 3);
  const orderedPodium = [topUsers[1], topUsers[0], topUsers[2]].filter(Boolean);
  const remainingUsers = users.slice(3);
  const openProfile = (username: string) =>
    navigation.navigate("PublicProfile", { username });

  return (
    <ScreenShell title="Rankers" subtitle="Cred Points from ratings and forum activity.">
      <Surface variant="accent" radius="hero" style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="trophy-outline" size={24} color={colors.text} />
        </View>
        <View style={styles.heroText}>
          <AppText variant="sectionTitle">Community leaderboard</AppText>
          <AppText tone="muted">
            Rankers earn CP through series ratings, forum posts, and community activity.
          </AppText>
        </View>
      </Surface>

      {leaderboardQuery.isLoading ? <LoadingState message="Loading rankers..." /> : null}

      {leaderboardQuery.isError ? (
        <ErrorState message="The leaderboard could not be loaded. Try again in a moment." />
      ) : null}

      {leaderboardQuery.data && users.length === 0 ? (
        <EmptyState
          title="No rankers yet"
          message="Community ranking will appear once users start earning CP."
        />
      ) : null}

      {topUsers.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Top rankers" body="The current community podium." />
          <View style={styles.podiumRow}>
            {orderedPodium.map((user) => (
              <View
                key={user.username}
                style={[styles.podiumColumn, user.rank === 1 ? styles.firstColumn : null]}
              >
                <PodiumCard
                  user={user}
                  featured={user.rank === 1}
                  onPress={() => openProfile(user.username)}
                />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {remainingUsers.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Ranker list" body={`${users.length} rankers shown`} />
          <View style={styles.stack}>
            {remainingUsers.map((user) => (
              <LeaderboardRow
                key={user.username}
                user={user}
                onPress={() => openProfile(user.username)}
              />
            ))}
          </View>
          {leaderboardQuery.hasNextPage ? (
            <AppButton
              label={leaderboardQuery.isFetchingNextPage ? "Loading..." : "Load more"}
              disabled={leaderboardQuery.isFetchingNextPage}
              onPress={() => leaderboardQuery.fetchNextPage()}
              iconRight={<Ionicons name="chevron-down" size={15} color={colors.text} />}
            />
          ) : (
            <AppText variant="caption" tone="subtle" align="center">
              End of leaderboard.
            </AppText>
          )}
        </View>
      ) : null}
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
    section: {
      gap: spacing.sm,
    },
    podiumRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.sm,
    },
    podiumColumn: {
      flex: 1,
      justifyContent: "flex-end",
    },
    podiumPressable: {
      width: "100%",
    },
    firstColumn: {
      flex: 1.12,
    },
    podiumCard: {
      alignItems: "center",
      gap: spacing.xs,
      minHeight: 204,
      borderWidth: 1,
      paddingHorizontal: spacing.sm,
    },
    featuredPodium: {
      minHeight: 226,
    },
    rankPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: radii.pill,
      backgroundColor: colors.backgroundSoft,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    avatarRing: {
      padding: 3,
      borderRadius: radii.pill,
      borderWidth: 2,
      backgroundColor: "rgba(10, 13, 20, 0.42)",
    },
    stack: {
      gap: spacing.sm,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderWidth: 1,
    },
    rowRank: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.pill,
      backgroundColor: colors.backgroundSoft,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    cpPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.credBorder,
      backgroundColor: colors.credSurface,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    pressed: {
      opacity: 0.86,
      transform: [{ scale: 0.99 }],
    },
  });
}
