export type UserRole = "GENERAL" | "ADMIN" | string;

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
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
