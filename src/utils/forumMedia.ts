import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

import type { ForumMediaFile } from "../api/forum";

export type ForumMediaAttachment = ForumMediaFile & {
  width?: number;
  height?: number;
};

export { appendForumMediaMarkdown } from "./forumMediaMarkdown";

export async function pickForumMediaAttachment(): Promise<ForumMediaAttachment | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      "Photo access required",
      "Allow Toon Ranks to access your photo library in Settings to attach an image or GIF.",
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: "images",
    allowsEditing: false,
    quality: 0.9,
  });

  if (result.canceled || !result.assets.length) return null;

  const asset = result.assets[0];
  const mimeType = asset.mimeType ?? "image/jpeg";
  const extension = mimeType.split("/")[1] || "jpg";
  const name = asset.fileName ?? `forum-media.${extension}`;

  return {
    uri: asset.uri,
    name,
    type: mimeType,
    width: asset.width,
    height: asset.height,
  };
}
