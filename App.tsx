import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CompareProvider } from "./src/context/CompareContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

const queryClient = new QueryClient();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#17110f",
    card: "#241a16",
    text: "#f7f3ef",
    border: "#4a362d",
    primary: "#315fdc",
    notification: "#f97316",
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <CompareProvider>
          <NavigationContainer theme={theme}>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </CompareProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
