import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppButton, AppText, ScreenShell, Surface } from "../components";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function CheckEmailScreen() {
  const styles = getStyles();
  const navigation = useNavigation<Navigation>();

  return (
    <ScreenShell title="Check email" subtitle="Verify your Toon Ranks account.">
      <Surface variant="accent" radius="xl" style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="mail-unread-outline" size={28} color={colors.text} />
        </View>
        <AppText variant="sectionTitle" align="center">
          Check your inbox
        </AppText>
        <AppText tone="muted" align="center">
          We sent a verification link to your email address. Open it to activate your
          account, then come back here and log in.
        </AppText>
        <AppText tone="muted" align="center">
          If it does not arrive within a few minutes, check your spam or junk folder and
          mark it as not spam.
        </AppText>
        <AppButton label="Go to login" onPress={() => navigation.navigate("Login")} />
      </Surface>
    </ScreenShell>
  );
}

function getStyles() {
  return StyleSheet.create({
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
}
