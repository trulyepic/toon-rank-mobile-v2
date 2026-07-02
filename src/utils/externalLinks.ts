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

  // Do NOT gate on Linking.canOpenURL: on Android 11+ package-visibility rules
  // make it report false for mailto: unless the manifest declares a <queries>
  // entry — even when an email app is installed. openURL itself fires the
  // intent without that restriction, so try it and only fall back on failure.
  try {
    await Linking.openURL(mailtoUrl);
  } catch {
    Alert.alert(
      "No email app found",
      `Reach us at ${email} from any device or email client.`,
    );
  }
}
