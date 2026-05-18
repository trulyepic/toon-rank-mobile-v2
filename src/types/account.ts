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
}

export interface GoogleOAuthRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email?: string;
  username?: string;
  captcha_token?: string;
}

export interface MessageResponse {
  message: string;
}
