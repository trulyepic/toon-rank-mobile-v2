import { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ScreenOrientation from "expo-screen-orientation";

type Props = {
  uri: string | null | undefined;
  visible: boolean;
  onClose: () => void;
};

export function ImageLightbox({ uri, visible, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    if (!visible) {
      // Re-lock to portrait when lightbox closes
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      setIsLandscape(false);
      return;
    }

    // Unlock rotation when lightbox opens so device rotation and the button both work
    void ScreenOrientation.unlockAsync();

    const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
      const { orientation } = event.orientationInfo;
      setIsLandscape(
        orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
          orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT,
      );
    });

    return () => {
      subscription.remove();
    };
  }, [visible]);

  async function handleRotate() {
    if (isLandscape) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    }
  }

  if (!uri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Image
          source={{ uri }}
          style={{ width, height }}
          resizeMode="contain"
          accessibilityLabel="Full-size cover image"
        />

        {/* Top-right controls: rotate + close */}
        <View style={styles.controls} pointerEvents="box-none">
          <Pressable
            onPress={handleRotate}
            style={styles.controlBtn}
            accessibilityRole="button"
            accessibilityLabel={
              isLandscape ? "Switch to portrait" : "Switch to landscape"
            }
            hitSlop={12}
          >
            <Ionicons
              name={isLandscape ? "phone-portrait-outline" : "phone-landscape-outline"}
              size={20}
              color="#fff"
            />
          </Pressable>

          <Pressable
            onPress={onClose}
            style={styles.controlBtn}
            accessibilityRole="button"
            accessibilityLabel="Close image"
            hitSlop={12}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.93)",
    alignItems: "center",
    justifyContent: "center",
  },
  controls: {
    position: "absolute",
    top: 52,
    right: 16,
    flexDirection: "column",
    gap: 10,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});
