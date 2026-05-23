import * as SecureStore from "expo-secure-store";

import type { AuthUser } from "../types/account";

const AUTH_TOKEN_KEY = "toonranks.authToken";
const AUTH_USER_KEY = "toonranks.authUser";
const AUTH_REFRESH_TOKEN_KEY = "toonranks.refreshToken";

export type StoredAuthSession = {
  token: string;
  refreshToken?: string | null;
  user: AuthUser;
};

export async function getStoredAuthSession(): Promise<StoredAuthSession | null> {
  const [token, userJson, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(AUTH_TOKEN_KEY),
    SecureStore.getItemAsync(AUTH_USER_KEY),
    SecureStore.getItemAsync(AUTH_REFRESH_TOKEN_KEY),
  ]);

  if (!token || !userJson) return null;

  try {
    const user = JSON.parse(userJson) as AuthUser;
    if (!user.id || !user.username) return null;
    return { token, refreshToken, user };
  } catch {
    await clearStoredAuthSession();
    return null;
  }
}

export async function setStoredAuthSession(session: StoredAuthSession) {
  const writes = [
    SecureStore.setItemAsync(AUTH_TOKEN_KEY, session.token),
    SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(session.user)),
  ];

  if (session.refreshToken) {
    writes.push(SecureStore.setItemAsync(AUTH_REFRESH_TOKEN_KEY, session.refreshToken));
  } else {
    writes.push(SecureStore.deleteItemAsync(AUTH_REFRESH_TOKEN_KEY));
  }

  await Promise.all(writes);
}

export async function clearStoredAuthSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
    SecureStore.deleteItemAsync(AUTH_USER_KEY),
    SecureStore.deleteItemAsync(AUTH_REFRESH_TOKEN_KEY),
  ]);
}
