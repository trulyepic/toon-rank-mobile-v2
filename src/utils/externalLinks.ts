import { Alert, Linking } from "react-native";

export async function openExternalUrl(url: string) {
  const supported = await Linking.canOpenURL(url);

  if (!supported) {
    Alert.alert("Unable to open link", "Try again in a moment.");
    return;
  }

  await Linking.openURL(url);
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
