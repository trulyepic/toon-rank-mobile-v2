import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppButton, AppText, ScreenShell, Surface } from "../components";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function LoginScreen() {
  const navigation = useNavigation<Navigation>();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <ScreenShell title="Log in" subtitle="Use your Toon Ranks website account.">
      <Surface variant="accent" radius="xl" style={styles.hero}>
        <Ionicons name="shield-checkmark-outline" size={24} color={colors.text} />
        <View style={styles.heroText}>
          <AppText variant="sectionTitle">Welcome back</AppText>
          <AppText tone="muted">
            Mobile will use the same saved titles, votes, and forum identity as the
            website.
          </AppText>
        </View>
      </Surface>

      <Surface radius="xl" style={styles.form}>
        <View style={styles.field}>
          <AppText variant="caption" tone="muted">
            Username
          </AppText>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
            placeholder="Your username"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <AppText variant="caption" tone="muted">
            Password
          </AppText>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            placeholderTextColor={colors.textSubtle}
            secureTextEntry
            style={styles.input}
          />
        </View>

        <Surface radius="lg" style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.warningText}
          />
          <AppText tone="muted" style={styles.noticeText}>
            Login is ready for native UI, but submission is paused until the mobile
            reCAPTCHA path is selected.
          </AppText>
        </Surface>

        <AppButton
          label="Continue"
          disabled
          iconLeft={<Ionicons name="lock-closed-outline" size={15} color={colors.text} />}
        />
        <AppButton
          label="Create account"
          variant="ghost"
          onPress={() => navigation.navigate("Signup")}
        />
      </Surface>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  heroText: {
    flex: 1,
    gap: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  input: {
    minHeight: 50,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSoft,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.warningSurface,
    borderColor: colors.warningBorder,
  },
  noticeText: {
    flex: 1,
    minWidth: 0,
  },
});
