import { Alert, Linking } from "react-native";

export async function openExternalUrl(url: string) {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("Unable to open link", "Your device cannot open this link right now.");
      return;
    }

    await Linking.openURL(url);
  } catch {
    Alert.alert("Unable to open link", "Try again in a moment.");
  }
}
