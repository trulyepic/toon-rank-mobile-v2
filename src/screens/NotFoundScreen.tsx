import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

import { AppButton, AppText, ScreenShell } from "../components";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, spacing } from "../theme/tokens";

export function NotFoundScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScreenShell title="Page Not Found" subtitle="">
      <View style={styles.center}>
        <Ionicons name="compass-outline" size={64} color={colors.textMuted} />
        <AppText variant="sectionTitle" align="center">
          This page doesn{"'"}t exist
        </AppText>
        <AppText tone="muted" align="center">
          The link you followed may have expired or the content may have been removed.
        </AppText>
        <AppButton
          label="Go to Home"
          selected
          iconLeft={<Ionicons name="home-outline" size={15} color={colors.text} />}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] })}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
});
