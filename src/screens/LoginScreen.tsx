import Recaptcha, { RecaptchaRef } from "react-native-recaptcha-that-works";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { login } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn";
import { AppButton, AppText, ScreenShell, Surface } from "../components";
import { SITE_ORIGIN, WEB_AUTH_URLS } from "../config/site";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import { openInAppBrowser } from "../utils/externalLinks";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const RECAPTCHA_SITE_KEY = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

export function LoginScreen() {
  const styles = getStyles();
  const navigation = useNavigation<Navigation>();
  const { setSession } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recaptchaRef = useRef<RecaptchaRef>(null);

  const googleSignIn = useGoogleSignIn();

  async function handleGoogleSignIn() {
    setErrorMessage(null);
    try {
      const session = await googleSignIn.mutateAsync();
      if (session) {
        await setSession(session);
        navigation.navigate("MainTabs");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Google sign-in failed. Please try again.",
      );
    }
  }

  const loginMutation = useMutation({
    mutationFn: (captchaToken: string) =>
      login({ username: username.trim(), password, captcha_token: captchaToken }),
    onMutate: () => setErrorMessage(null),
    onSuccess: async (session) => {
      await setSession(session);
      navigation.navigate("MainTabs");
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Login failed. Check your details and try again.",
      );
    },
  });

  function handleSubmit() {
    setErrorMessage(null);
    if (!username.trim()) {
      setErrorMessage("Enter your username.");
      return;
    }
    if (!password) {
      setErrorMessage("Enter your password.");
      return;
    }
    recaptchaRef.current?.open();
  }

  function handleVerify(token: string) {
    recaptchaRef.current?.close();
    loginMutation.mutate(token);
  }

  function handleCaptchaError() {
    setErrorMessage("CAPTCHA verification failed. Please try again.");
  }

  const canSubmit = !!username.trim() && !!password && !loginMutation.isPending;

  return (
    <ScreenShell title="Log in" subtitle="Sign in to your Toon Ranks account.">
      <Surface variant="accent" radius="xl" style={styles.hero}>
        <Ionicons name="shield-checkmark-outline" size={24} color={colors.text} />
        <View style={styles.heroText}>
          <AppText variant="sectionTitle">Welcome back</AppText>
          <AppText tone="muted">
            Mobile shares the same saved titles, votes, and forum identity as the website.
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
            onChangeText={(v) => {
              setUsername(v);
              setErrorMessage(null);
            }}
            placeholder="Your username"
            placeholderTextColor={colors.textSubtle}
            returnKeyType="next"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <AppText variant="caption" tone="muted">
              Password
            </AppText>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Open forgot password"
              hitSlop={10}
              onPress={() => openInAppBrowser(WEB_AUTH_URLS.forgotPassword)}
            >
              <AppText variant="caption" style={styles.recoveryLink}>
                Forgot password?
              </AppText>
            </Pressable>
          </View>
          <View style={styles.passwordRow}>
            <TextInput
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setErrorMessage(null);
              }}
              placeholder="Your password"
              placeholderTextColor={colors.textSubtle}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              style={styles.passwordInput}
            />
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={8}
              style={styles.eyeBtn}
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
            <AppText tone="muted" style={styles.errorText}>
              {errorMessage}
            </AppText>
          </View>
        ) : null}

        <AppButton
          label={loginMutation.isPending ? "Signing in..." : "Log in"}
          selected
          disabled={!canSubmit}
          iconLeft={<Ionicons name="log-in-outline" size={15} color={colors.text} />}
          onPress={handleSubmit}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <AppText variant="caption" tone="muted">
            or
          </AppText>
          <View style={styles.dividerLine} />
        </View>

        <AppButton
          label={googleSignIn.isPending ? "Signing in..." : "Continue with Google"}
          variant="secondary"
          disabled={googleSignIn.isPending || loginMutation.isPending}
          iconLeft={<Ionicons name="logo-google" size={15} color={colors.text} />}
          onPress={() => void handleGoogleSignIn()}
        />

        <AppButton
          label="Create account"
          variant="ghost"
          onPress={() => navigation.navigate("Signup")}
        />
      </Surface>

      <Recaptcha
        ref={recaptchaRef}
        siteKey={RECAPTCHA_SITE_KEY}
        baseUrl={SITE_ORIGIN}
        size="normal"
        onVerify={handleVerify}
        onError={handleCaptchaError}
      />
    </ScreenShell>
  );
}

function getStyles() {
  return StyleSheet.create({
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
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  recoveryLink: {
    color: colors.accentStrong,
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
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSoft,
  },
  passwordInput: {
    flex: 1,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    paddingVertical: spacing.sm,
  },
  eyeBtn: {
    paddingHorizontal: spacing.sm,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: "rgba(235, 106, 90, 0.12)",
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: {
    flex: 1,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderSoft,
  },
});
}
