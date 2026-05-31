import Constants from "expo-constants";

import { loginWithGoogle } from "../api/auth";
import type { AuthSession } from "../types/account";

const GOOGLE_CANCELLED_CODE = "SIGN_IN_CANCELLED";

let isConfigured = false;

export function isGoogleSignInSupported() {
  return Constants.appOwnership !== "expo";
}

export async function configureGoogleSignIn() {
  if (!isGoogleSignInSupported() || isConfigured) return;

  const { GoogleSignin } = await import("@react-native-google-signin/google-signin");

  GoogleSignin.configure({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ["profile", "email"],
  });

  isConfigured = true;
}

export async function signInWithGoogle(): Promise<AuthSession | null> {
  if (!isGoogleSignInSupported()) {
    throw new Error(
      "Google sign-in requires a development or store build. Use username and password while running in Expo Go.",
    );
  }

  await configureGoogleSignIn();

  const { GoogleSignin } = await import("@react-native-google-signin/google-signin");

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  // Always sign out of any cached Google session first so the account picker
  // appears every time the user explicitly taps "Continue with Google".
  await GoogleSignin.signOut().catch(() => undefined);
  const result = await GoogleSignin.signIn();
  const idToken = result.data?.idToken;

  if (!idToken) {
    throw new Error("Google sign-in did not return an ID token.");
  }

  return loginWithGoogle({ token: idToken, signup_platform: "mobile" });
}

export async function signOutGoogle() {
  if (!isGoogleSignInSupported()) return;

  const { GoogleSignin } = await import("@react-native-google-signin/google-signin");
  await GoogleSignin.signOut().catch(() => undefined);
}

export function isGoogleSignInCancellation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === GOOGLE_CANCELLED_CODE
  );
}
