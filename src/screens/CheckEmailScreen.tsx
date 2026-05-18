import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppButton, AppText, ScreenShell, Surface } from "../components";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function CheckEmailScreen() {
  const navigation = useNavigation<Navigation>();

  return (
    <ScreenShell title="Check email" subtitle="Verify your Toon Ranks account.">
      <Surface variant="accent" radius="xl" style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="mail-unread-outline" size={28} color={colors.text} />
        </View>
        <AppText variant="sectionTitle" align="center">
          Verification comes next
        </AppText>
        <AppText tone="muted" align="center">
          After signup is connected, Toon Ranks will send a verification email before
          unlocking account features.
        </AppText>
        <AppButton label="Back to login" onPress={() => navigation.navigate("Login")} />
      </Surface>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: spacing.md,
  },
  iconWrap: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
});
