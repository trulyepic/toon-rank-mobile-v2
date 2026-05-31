import Ionicons from "@expo/vector-icons/Ionicons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";

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
} from "../components";
import { colors, radii, spacing } from "../theme/tokens";
import type { LeaderboardUser } from "../types/account";

const PAGE_SIZE = 25;

function formatCp(value: number) {
  return `${value.toLocaleString()} CP`;
}

function PodiumCard({
  user,
  featured = false,
}: {
  user: LeaderboardUser;
  featured?: boolean;
}) {
  return (
    <Surface
      variant={featured ? "accent" : "raised"}
      radius="xl"
      style={[styles.podiumCard, featured ? styles.featuredPodium : null]}
    >
      <View style={[styles.rankPill, featured ? styles.featuredRankPill : null]}>
        <AppText variant="caption">#{user.rank}</AppText>
      </View>
      <UserAvatar
        username={user.username}
        avatarUrl={user.avatar_url}
        avatarPreset={user.avatar_preset}
        size={featured ? "xl" : "lg"}
      />
      <RoleNameText
        variant={featured ? "sectionTitle" : "cardTitle"}
        role={user.role}
        align="center"
      >
        {user.username}
      </RoleNameText>
      <AppText tone="muted" align="center">
        {formatCp(user.cred_score)}
      </AppText>
      <AppText variant="caption" tone="subtle" align="center">
        {user.post_count} posts / {user.series_rated} rated
      </AppText>
    </Surface>
  );
}

function LeaderboardRow({ user }: { user: LeaderboardUser }) {
  return (
    <Surface variant="raised" radius="lg" style={styles.row}>
      <View style={styles.rowRank}>
        <AppText variant="caption">#{user.rank}</AppText>
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
        <AppText variant="caption" tone="muted">
          {user.post_count} posts / {user.series_rated} rated
        </AppText>
      </View>
      <View style={styles.cpPill}>
        <Ionicons name="diamond-outline" size={13} color={colors.accentStrong} />
        <AppText variant="caption">{formatCp(user.cred_score)}</AppText>
      </View>
    </Surface>
  );
}

export function LeaderboardScreen() {
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
                <PodiumCard user={user} featured={user.rank === 1} />
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
              <LeaderboardRow key={user.username} user={user} />
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
  podiumRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.sm,
  },
  podiumColumn: {
    flex: 1,
  },
  firstColumn: {
    flex: 1.12,
  },
  podiumCard: {
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 204,
    paddingHorizontal: spacing.sm,
  },
  featuredPodium: {
    minHeight: 226,
  },
  rankPill: {
    borderRadius: radii.pill,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  featuredRankPill: {
    borderColor: colors.accentBorder,
  },
  stack: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
