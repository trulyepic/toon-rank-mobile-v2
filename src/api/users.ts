import { api } from "./client";
import type { FavoriteSeries, LeaderboardPage, PublicProfile } from "../types/account";

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

export async function getMyFavorites() {
  const res = await api.get<FavoriteSeries[]>("/auth/me/favourites");
  return res.data;
}

export async function replaceMyFavorites(seriesIds: number[]) {
  const res = await api.put<FavoriteSeries[]>("/auth/me/favourites", {
    series_ids: seriesIds,
  });
  return res.data;
}

export async function removeMyFavorite(seriesId: number) {
  const res = await api.delete<FavoriteSeries[]>(`/auth/me/favourites/${seriesId}`);
  return res.data;
}
