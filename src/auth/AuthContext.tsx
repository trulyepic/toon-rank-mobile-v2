import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import { refreshMobileSession, revokeMobileSession } from "../api/auth";
import { setApiAuthToken } from "../api/client";
import type { AuthSession, AuthUser } from "../types/account";
import { signOutGoogle } from "../utils/googleSignInNative";
import {
  clearStoredAuthSession,
  getStoredAuthSession,
  setStoredAuthSession,
} from "./authStorage";
import { subscribeToSessionExpired } from "./sessionEvents";

type AuthStatus = "loading" | "signed_out" | "signed_in";

type AuthContextValue = {
  status: AuthStatus;
  token: string | null;
  user: AuthUser | null;
  isSignedIn: boolean;
  setSession: (session: AuthSession) => Promise<void>;
  logout: () => Promise<void>;
  refreshSessionFromStorage: () => Promise<void>;
  updateUser: (partial: Partial<AuthUser>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const isRefreshingRef = useRef(false);

  const refreshSessionFromStorage = useCallback(async () => {
    setStatus("loading");
    const storedSession = await getStoredAuthSession();

    if (!storedSession) {
      setApiAuthToken(null);
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      setStatus("signed_out");
      return;
    }

    setApiAuthToken(storedSession.token);
    setToken(storedSession.token);
    setRefreshToken(storedSession.refreshToken ?? null);
    setUser(storedSession.user);
    setStatus("signed_in");
  }, []);

  useEffect(() => {
    void refreshSessionFromStorage();
  }, [refreshSessionFromStorage]);

  const setSession = useCallback(async (session: AuthSession) => {
    await setStoredAuthSession({
      token: session.access_token,
      refreshToken: session.refresh_token ?? null,
      user: session.user,
    });
    setApiAuthToken(session.access_token);
    setToken(session.access_token);
    setRefreshToken(session.refresh_token ?? null);
    setUser(session.user);
    setStatus("signed_in");
  }, []);

  const logout = useCallback(async () => {
    const storedSession = await getStoredAuthSession();
    const tokenToRevoke = refreshToken ?? storedSession?.refreshToken ?? null;

    if (tokenToRevoke) {
      await revokeMobileSession(tokenToRevoke).catch(() => undefined);
    }

    // Clear the Google Sign-In session so the account picker appears on next sign-in.
    await signOutGoogle();

    await clearStoredAuthSession();
    setApiAuthToken(null);
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setStatus("signed_out");
  }, [refreshToken]);

  const updateUser = useCallback(async (partial: Partial<AuthUser>) => {
    const storedSession = await getStoredAuthSession();
    if (!storedSession) return;
    const updated = { ...storedSession.user, ...partial };
    await setStoredAuthSession({ ...storedSession, user: updated });
    setUser(updated);
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (isRefreshingRef.current) return;

    isRefreshingRef.current = true;

    try {
      const storedSession = await getStoredAuthSession();
      const tokenToUse = refreshToken ?? storedSession?.refreshToken ?? null;

      if (!tokenToUse) {
        await logout();
        return;
      }

      const refreshedSession = await refreshMobileSession(tokenToUse);

      await setStoredAuthSession({
        token: refreshedSession.access_token,
        refreshToken: tokenToUse,
        user: refreshedSession.user,
      });
      setApiAuthToken(refreshedSession.access_token);
      setToken(refreshedSession.access_token);
      setRefreshToken(tokenToUse);
      setUser(refreshedSession.user);
      setStatus("signed_in");
    } catch {
      await logout();
    } finally {
      isRefreshingRef.current = false;
    }
  }, [logout, refreshToken]);

  useEffect(() => {
    return subscribeToSessionExpired(() => {
      void refreshAccessToken();
    });
  }, [refreshAccessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      token,
      user,
      isSignedIn: status === "signed_in",
      setSession,
      logout,
      refreshSessionFromStorage,
      updateUser,
    }),
    [logout, refreshSessionFromStorage, setSession, updateUser, status, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
