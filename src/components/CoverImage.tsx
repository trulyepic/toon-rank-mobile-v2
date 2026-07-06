import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { colors } from "../theme/tokens";

type Props = {
  uri?: string | null;
  style?: object;
  /** Icon size for the fallback placeholder. Defaults to 24. */
  fallbackIconSize?: number;
};

/**
 * Cover image with memory+disk caching, a solid placeholder shown while
 * loading, and a smooth 150 ms fade-in on first load.
 * Pass `uri={null | undefined}` to render the no-cover fallback icon.
 */
export function CoverImage({ uri, style, fallbackIconSize = 24 }: Props) {
  const styles = getStyles();
  if (!uri) {
    return (
      <View style={[styles.fallback, style]}>
        <Ionicons
          name="image-outline"
          size={fallbackIconSize}
          color={colors.textSubtle}
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[styles.image, style]}
      contentFit="cover"
      transition={250}
      cachePolicy="memory-disk"
    />
  );
}

function getStyles() {
  return StyleSheet.create({
    image: {
      backgroundColor: colors.surface,
    },
    fallback: {
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
