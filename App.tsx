import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useCallback, useEffect, useState } from "react";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";

import { AuthProvider } from "./src/auth/AuthContext";
import { CompareProvider } from "./src/context/CompareContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { linking } from "./src/navigation/linking";
import { applyTheme, colors, DEFAULT_THEME, type ThemeName } from "./src/theme/tokens";
import { ThemeProvider } from "./src/theme/ThemeContext";
import { configureGoogleSignIn } from "./src/utils/googleSignInNative";
import * as SecureStore from "expo-secure-store";

const THEME_KEY = "toonranks_theme";
const queryClient = new QueryClient();

function AppInner({ navKey }: { navKey: number }) {
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.accentStrong,
      notification: colors.warning,
    },
  };

  return (
    <NavigationContainer key={navKey} theme={navTheme} linking={linking}>
      <StatusBar style="light" />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [navKey, setNavKey] = useState(0);
  const onThemeChange = useCallback(() => setNavKey((k) => k + 1), []);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    void configureGoogleSignIn();
    // Read and apply theme before anything renders
    SecureStore.getItemAsync(THEME_KEY)
      .then((stored) => {
        const theme = (stored as ThemeName) ?? DEFAULT_THEME;
        applyTheme(theme);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  if (!ready || !fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CompareProvider>
            <ThemeProvider onThemeChange={onThemeChange}>
              <AppInner navKey={navKey} />
            </ThemeProvider>
          </CompareProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
