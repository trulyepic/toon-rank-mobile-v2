export type UserRole = "GENERAL" | "CONTRIBUTOR" | "ADMIN" | string;
export type AvatarPreset = "blue" | "emerald" | "amber";

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
  avatar_url?: string | null;
  avatar_preset?: AvatarPreset | null;
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string | null;
  token_type?: string;
  user: AuthUser;
}

export interface MobileRefreshResponse {
  access_token: string;
  token_type?: string;
  user: AuthUser;
}

export interface SignupResponse {
  message: string;
  token: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  captcha_token: string;
}

export interface SignupRequest extends LoginRequest {
  email: string;
  signup_platform?: "web" | "mobile";
}

export interface GoogleOAuthRequest {
  token: string;
  signup_platform?: "web" | "mobile";
}

export interface ResendVerificationRequest {
  email?: string;
  username?: string;
  captcha_token?: string;
}

export interface MessageResponse {
  message: string;
}

export interface UserAvatarOut {
  id: number;
  username: string;
  avatar_url: string | null;
  avatar_preset: AvatarPreset | string;
}

export interface LeaderboardUser {
  rank: number;
  username: string;
  role: UserRole;
  avatar_url: string | null;
  avatar_preset: AvatarPreset | string | null;
  cred_score: number;
  post_count: number;
  series_rated: number;
}

export interface LeaderboardPage {
  items: LeaderboardUser[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface FavoriteSeries {
  series_id: number;
  position: number;
  title: string;
  cover_url: string | null;
  type: string | null;
}

export interface PublicReadingListPreview {
  name: string;
  item_count: number;
  share_token: string;
}

export interface PublicProfile {
  username: string;
  role: UserRole;
  avatar_url: string | null;
  avatar_preset: AvatarPreset | string | null;
  registered_at: string | null;
  cred_score: number;
  rank: number | null;
  post_count: number;
  favourites: FavoriteSeries[];
  reading_lists: PublicReadingListPreview[];
}

export interface UsernameUpdateOut {
  id: number;
  username: string;
  role: string;
  avatar_url: string | null;
  avatar_preset: string | null;
}
