import * as SecureStore from "expo-secure-store";

import type { AuthUser } from "../types/account";

const AUTH_TOKEN_KEY = "toonranks.authToken";
const AUTH_USER_KEY = "toonranks.authUser";

export type StoredAuthSession = {
  token: string;
  user: AuthUser;
};

export async function getStoredAuthSession(): Promise<StoredAuthSession | null> {
  const [token, userJson] = await Promise.all([
    SecureStore.getItemAsync(AUTH_TOKEN_KEY),
    SecureStore.getItemAsync(AUTH_USER_KEY),
  ]);

  if (!token || !userJson) return null;

  try {
    const user = JSON.parse(userJson) as AuthUser;
    if (!user.id || !user.username) return null;
    return { token, user };
  } catch {
    await clearStoredAuthSession();
    return null;
  }
}

export async function setStoredAuthSession(session: StoredAuthSession) {
  await Promise.all([
    SecureStore.setItemAsync(AUTH_TOKEN_KEY, session.token),
    SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(session.user)),
  ]);
}

export async function clearStoredAuthSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
    SecureStore.deleteItemAsync(AUTH_USER_KEY),
  ]);
}
