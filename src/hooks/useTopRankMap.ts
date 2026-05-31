import { useQuery } from "@tanstack/react-query";

import { getLeaderboard } from "../api/users";

export type TopRankMap = Record<string, number>;

export function rankForUsername(rankMap: TopRankMap, username?: string | null) {
  if (!username) return undefined;
  return rankMap[username.toLowerCase()];
}

export function useTopRankMap() {
  const query = useQuery({
    queryKey: ["users", "leaderboard", "top-rank-map"],
    queryFn: () => getLeaderboard(1, 10),
    staleTime: 5 * 60 * 1000,
  });

  const rankMap =
    query.data?.items.reduce<TopRankMap>((acc, user) => {
      acc[user.username.toLowerCase()] = user.rank;
      return acc;
    }, {}) ?? {};

  return rankMap;
}
