import { Alert, Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";

export async function openInAppBrowser(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      controlsColor: "#6b8cff",
    });
  } catch {
    Alert.alert("Unable to open link", "Try again in a moment.");
  }
}

export async function openSupportEmail(email: string) {
  const mailtoUrl = `mailto:${email}`;
  const supported = await Linking.canOpenURL(mailtoUrl);

  if (!supported) {
    Alert.alert("Email app unavailable", email);
    return;
  }

  await Linking.openURL(mailtoUrl);
}
