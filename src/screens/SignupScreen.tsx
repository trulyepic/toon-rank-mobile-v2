import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { openWebAuthBridge } from "../auth/webAuthBridge";
import { AppButton, AppText, ScreenShell, Surface } from "../components";
import { WEB_AUTH_URLS } from "../config/site";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function SignupScreen() {
  const navigation = useNavigation<Navigation>();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <ScreenShell title="Sign up" subtitle="Create one account for web and mobile.">
      <Surface variant="accent" radius="xl" style={styles.hero}>
        <Ionicons name="person-add-outline" size={24} color={colors.text} />
        <View style={styles.heroText}>
          <AppText variant="sectionTitle">Start your library</AppText>
          <AppText tone="muted">
            Your account will sync reading lists, votes, and forum activity across Toon
            Ranks.
          </AppText>
        </View>
      </Surface>

      <Surface radius="xl" style={styles.form}>
        <View style={styles.field}>
          <AppText variant="caption" tone="muted">
            Email
          </AppText>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <AppText variant="caption" tone="muted">
            Username
          </AppText>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
            placeholder="Choose a username"
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
            placeholder="Choose a password"
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
            Account creation still depends on the website CAPTCHA flow. Opening
            web signup creates or signs into the website only until the mobile
            callback handoff is added.
          </AppText>
        </Surface>

        <AppButton
          label="Create account"
          disabled
          iconLeft={<Ionicons name="lock-closed-outline" size={15} color={colors.text} />}
        />
        <AppButton
          label="Open web signup"
          onPress={() => openWebAuthBridge(WEB_AUTH_URLS.signup)}
          iconLeft={<Ionicons name="open-outline" size={15} color={colors.text} />}
        />
        <AppButton
          label="Already have an account?"
          variant="ghost"
          onPress={() => navigation.navigate("Login")}
        />
        <AppButton
          label="Check email flow preview"
          variant="ghost"
          onPress={() => navigation.navigate("CheckEmail")}
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
