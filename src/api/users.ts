import { api } from "./client";
import type { LeaderboardPage, PublicProfile } from "../types/account";

export async function getLeaderboard(page = 1, pageSize = 50) {
  const res = await api.get<LeaderboardPage>("/users/leaderboard", {
    params: { page, page_size: pageSize },
  });
  return res.data;
}

export async function getPublicProfile(username: string) {
  const res = await api.get<PublicProfile>(`/users/${encodeURIComponent(username)}`);
  return res.data;
}
