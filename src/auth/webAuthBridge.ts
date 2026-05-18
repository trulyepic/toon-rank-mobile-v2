import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";

import { MOBILE_AUTH_CALLBACK_URL } from "../config/site";
import { parseAuthCallbackUrl } from "./authCallback";

export async function openWebAuthBridge(url: string) {
  try {
    const result = await WebBrowser.openAuthSessionAsync(url, MOBILE_AUTH_CALLBACK_URL, {
      showInRecents: true,
    });

    if (result.type === "success") {
      const callback = parseAuthCallbackUrl(result.url);

      if (callback.status === "success") {
        Alert.alert(
          "Almost there",
          "The app received an auth code. Token exchange will be wired after the backend callback endpoint is ready.",
        );
        return;
      }

      if (callback.status === "error") {
        Alert.alert(
          "Sign-in stopped",
          callback.description ?? "The auth step was cancelled.",
        );
        return;
      }

      Alert.alert(
        "Return link incomplete",
        "The auth page returned to the app without a usable auth code.",
      );
    }
  } catch {
    Alert.alert("Unable to open sign-in", "Try again in a moment.");
  }
}
