import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";

import { applyTheme, DEFAULT_THEME, type ThemeName } from "./tokens";

const STORAGE_KEY = "toonranks_theme";

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (name: ThemeName) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: async () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

type Props = {
  children: React.ReactNode;
  onThemeChange: () => void;
};

export function ThemeProvider({ children, onThemeChange }: Props) {
  const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void SecureStore.getItemAsync(STORAGE_KEY).then((stored) => {
      const resolved = (stored as ThemeName) ?? DEFAULT_THEME;
      if (resolved !== DEFAULT_THEME) {
        applyTheme(resolved);
      }
      setThemeState(resolved);
      setReady(true);
    });
  }, []);

  const setTheme = async (name: ThemeName) => {
    await SecureStore.setItemAsync(STORAGE_KEY, name);
    applyTheme(name);
    setThemeState(name);
    // Signal App to remount the nav tree so inline styles update
    onThemeChange();
  };

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

/** Read the stored theme synchronously from cache if available, for SSR-like init. */
export async function readStoredTheme(): Promise<ThemeName> {
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    return (stored as ThemeName) ?? DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}
