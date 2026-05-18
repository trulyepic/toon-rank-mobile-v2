import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { setApiAuthToken } from "../api/client";
import type { AuthSession, AuthUser } from "../types/account";
import {
  clearStoredAuthSession,
  getStoredAuthSession,
  setStoredAuthSession,
} from "./authStorage";

type AuthStatus = "loading" | "signed_out" | "signed_in";

type AuthContextValue = {
  status: AuthStatus;
  token: string | null;
  user: AuthUser | null;
  isSignedIn: boolean;
  setSession: (session: AuthSession) => Promise<void>;
  logout: () => Promise<void>;
  refreshSessionFromStorage: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const refreshSessionFromStorage = useCallback(async () => {
    setStatus("loading");
    const storedSession = await getStoredAuthSession();

    if (!storedSession) {
      setApiAuthToken(null);
      setToken(null);
      setUser(null);
      setStatus("signed_out");
      return;
    }

    setApiAuthToken(storedSession.token);
    setToken(storedSession.token);
    setUser(storedSession.user);
    setStatus("signed_in");
  }, []);

  useEffect(() => {
    void refreshSessionFromStorage();
  }, [refreshSessionFromStorage]);

  const setSession = useCallback(async (session: AuthSession) => {
    await setStoredAuthSession({
      token: session.access_token,
      user: session.user,
    });
    setApiAuthToken(session.access_token);
    setToken(session.access_token);
    setUser(session.user);
    setStatus("signed_in");
  }, []);

  const logout = useCallback(async () => {
    await clearStoredAuthSession();
    setApiAuthToken(null);
    setToken(null);
    setUser(null);
    setStatus("signed_out");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      token,
      user,
      isSignedIn: status === "signed_in",
      setSession,
      logout,
      refreshSessionFromStorage,
    }),
    [logout, refreshSessionFromStorage, setSession, status, token, user],
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
