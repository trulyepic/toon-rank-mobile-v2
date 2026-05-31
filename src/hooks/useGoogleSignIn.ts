import { useMutation } from "@tanstack/react-query";

import type { AuthSession } from "../types/account";
import {
  isGoogleSignInCancellation,
  signInWithGoogle,
} from "../utils/googleSignInNative";

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
    mutationFn: signInWithGoogle,
    onError: (error) => {
      // Surface cancellation as a no-op so callers don't need to special-case it.
      if (isGoogleSignInCancellation(error)) {
        return;
      }
    },
  });
}
