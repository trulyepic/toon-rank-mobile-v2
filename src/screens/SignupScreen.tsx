import Recaptcha, { RecaptchaRef } from "react-native-recaptcha-that-works";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { signup } from "../api/auth";
import { AppButton, AppText, ScreenShell, Surface } from "../components";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const RECAPTCHA_SITE_KEY = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

export function SignupScreen() {
  const navigation = useNavigation<Navigation>();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recaptchaRef = useRef<RecaptchaRef>(null);

  const signupMutation = useMutation({
    mutationFn: (captchaToken: string) =>
      signup({
        email: email.trim(),
        username: username.trim(),
        password,
        captcha_token: captchaToken,
        signup_platform: "mobile",
      }),
    onMutate: () => setErrorMessage(null),
    onSuccess: () => {
      navigation.navigate("CheckEmail");
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Account could not be created. Try again in a moment.",
      );
    },
  });

  function handleSubmit() {
    setErrorMessage(null);
    if (!email.trim()) {
      setErrorMessage("Enter your email address.");
      return;
    }
    if (!username.trim()) {
      setErrorMessage("Choose a username.");
      return;
    }
    if (!password) {
      setErrorMessage("Choose a password.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }
    recaptchaRef.current?.open();
  }

  function handleVerify(token: string) {
    recaptchaRef.current?.close();
    signupMutation.mutate(token);
  }

  function handleCaptchaError() {
    setErrorMessage("CAPTCHA verification failed. Please try again.");
  }

  const canSubmit =
    !!email.trim() && !!username.trim() && !!password && !signupMutation.isPending;

  return (
    <ScreenShell title="Sign up" subtitle="Create one account for web and mobile.">
      <Surface variant="accent" radius="xl" style={styles.hero}>
        <Ionicons name="person-add-outline" size={24} color={colors.text} />
        <View style={styles.heroText}>
          <AppText variant="sectionTitle">Start your library</AppText>
          <AppText tone="muted">
            Your account syncs reading lists, votes, and forum activity across Toon Ranks.
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
            onChangeText={(v) => {
              setEmail(v);
              setErrorMessage(null);
            }}
            placeholder="you@example.com"
            placeholderTextColor={colors.textSubtle}
            returnKeyType="next"
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
            onChangeText={(v) => {
              setUsername(v);
              setErrorMessage(null);
            }}
            placeholder="Choose a username"
            placeholderTextColor={colors.textSubtle}
            returnKeyType="next"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <AppText variant="caption" tone="muted">
            Password
          </AppText>
          <View style={styles.passwordRow}>
            <TextInput
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setErrorMessage(null);
              }}
              placeholder="At least 8 characters"
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
          label={signupMutation.isPending ? "Creating account..." : "Create account"}
          selected
          disabled={!canSubmit}
          iconLeft={<Ionicons name="person-add-outline" size={15} color={colors.text} />}
          onPress={handleSubmit}
        />

        <AppButton
          label="Already have an account?"
          variant="ghost"
          onPress={() => navigation.navigate("Login")}
        />
      </Surface>

      <Recaptcha
        ref={recaptchaRef}
        siteKey={RECAPTCHA_SITE_KEY}
        baseUrl="https://toonranks.com"
        size="normal"
        onVerify={handleVerify}
        onError={handleCaptchaError}
      />
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
});
