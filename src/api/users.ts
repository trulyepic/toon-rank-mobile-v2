import { api } from "./client";
import type {
  FavoriteSeries,
  LeaderboardPage,
  PrivacySettings,
  PublicProfile,
} from "../types/account";

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

export async function updateMyPrivacy(payload: Partial<PrivacySettings>) {
  const res = await api.patch<PrivacySettings>("/auth/me/privacy", payload);
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

export interface UserSearchResult {
  username: string;
  avatar_url: string | null;
  avatar_preset: string | null;
}

export async function searchUsers(q: string, limit = 8) {
  const res = await api.get<UserSearchResult[]>("/users/search", {
    params: { q, limit },
  });
  return res.data;
}
