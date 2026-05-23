import { api } from "./client";
import type {
  AuthSession,
  GoogleOAuthRequest,
  LoginRequest,
  MessageResponse,
  MobileRefreshResponse,
  ResendVerificationRequest,
  SignupRequest,
  SignupResponse,
  UserAvatarOut,
} from "../types/account";

export async function login(payload: LoginRequest) {
  const res = await api.post<AuthSession>("/auth/login", payload);
  return res.data;
}

export async function signup(payload: SignupRequest) {
  const res = await api.post<SignupResponse>("/auth/signup", payload);
  return res.data;
}

export async function loginWithGoogle(payload: GoogleOAuthRequest) {
  const res = await api.post<AuthSession>("/auth/google-oauth", payload);
  return res.data;
}

export async function exchangeMobileAuthCode(code: string) {
  const res = await api.post<AuthSession>("/auth/mobile-token", { code });
  return res.data;
}

export async function refreshMobileSession(refreshToken: string) {
  const res = await api.post<MobileRefreshResponse>("/auth/mobile-refresh", {
    refresh_token: refreshToken,
  });
  return res.data;
}

export async function revokeMobileSession(refreshToken?: string | null) {
  const res = await api.post<MessageResponse>("/auth/mobile-logout", {
    refresh_token: refreshToken ?? null,
  });
  return res.data;
}

export async function verifyEmail(token: string) {
  const res = await api.get<MessageResponse>("/auth/verify-email", {
    params: { token },
  });
  return res.data;
}

export async function resendVerification(payload: ResendVerificationRequest) {
  const res = await api.post<MessageResponse>("/auth/resend-verification", payload);
  return res.data;
}

export async function setAvatarPreset(preset: string) {
  const res = await api.patch<UserAvatarOut>("/auth/me/avatar/preset", {
    avatar_preset: preset,
  });
  return res.data;
}
