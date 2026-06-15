export type UserRole = "GENERAL" | "CONTRIBUTOR" | "ADMIN" | string;
export type AvatarPreset = "blue" | "emerald" | "amber";

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
  avatar_url?: string | null;
  avatar_preset?: AvatarPreset | null;
  // Public-profile visibility toggles (default true). Optional so older stored
  // sessions without these fields still type-check.
  public_ratings?: boolean;
  public_posts?: boolean;
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

export interface PublicSeriesRating {
  series_id: number;
  title: string | null;
  cover_url: string | null;
  type: string | null;
  score: number;
}

export interface PublicForumPost {
  post_id: number;
  thread_id: number;
  thread_title: string | null;
  excerpt: string;
  created_at: string;
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
  // null when the user has hidden that section (vs [] = public but empty).
  ratings?: PublicSeriesRating[] | null;
  posts?: PublicForumPost[] | null;
}

export interface PrivacySettings {
  public_ratings: boolean;
  public_posts: boolean;
}

export interface UsernameUpdateOut {
  id: number;
  username: string;
  role: string;
  avatar_url: string | null;
  avatar_preset: string | null;
}
