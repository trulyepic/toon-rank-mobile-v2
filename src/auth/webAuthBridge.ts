import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";

import { MOBILE_AUTH_CALLBACK_URL } from "../config/site";

export async function openWebAuthBridge(url: string) {
  try {
    const result = await WebBrowser.openAuthSessionAsync(url, MOBILE_AUTH_CALLBACK_URL, {
      showInRecents: true,
    });

    if (result.type === "success") {
      Alert.alert(
        "Almost there",
        "The app received the auth return link. Token exchange will be wired after the web callback endpoint is ready.",
      );
    }
  } catch {
    Alert.alert("Unable to open sign-in", "Try again in a moment.");
  }
}
