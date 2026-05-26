import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useMutation } from "@tanstack/react-query";

import { loginWithGoogle } from "../api/auth";
import type { AuthSession } from "../types/account";

/**
 * Handles the full Google Sign-In flow:
 * 1. Opens the native Google account picker
 * 2. Gets the ID token from Google
 * 3. Sends the token to the Toon Ranks backend (/auth/google-oauth)
 * 4. Returns the AuthSession on success, or null if the user cancelled
 *
 * Works for both login and signup — the backend creates or links the account.
 */
export function useGoogleSignIn() {
  return useMutation<AuthSession | null, Error>({
    mutationFn: async () => {
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
    },
    onError: (error) => {
      // Surface cancellation as a no-op so callers don't need to special-case it.
      if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }
    },
  });
}
