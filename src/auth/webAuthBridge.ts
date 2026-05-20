import * as WebBrowser from "expo-web-browser";

import { exchangeMobileAuthCode } from "../api/auth";
import { MOBILE_AUTH_CALLBACK_URL } from "../config/site";
import type { AuthSession } from "../types/account";
import { parseAuthCallbackUrl } from "./authCallback";

export type WebAuthBridgeResult =
  | {
      status: "success";
      session: AuthSession;
    }
  | {
      status: "check_email";
      message: string;
    }
  | {
      status: "cancelled";
    }
  | {
      status: "error";
      message: string;
    };

export function createMobileAuthState() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export async function openWebAuthBridge(
  url: string,
  expectedState?: string,
): Promise<WebAuthBridgeResult> {
  try {
    const result = await WebBrowser.openAuthSessionAsync(url, MOBILE_AUTH_CALLBACK_URL, {
      showInRecents: true,
    });

    if (result.type !== "success") {
      return { status: "cancelled" };
    }

    if (result.type === "success") {
      const callback = parseAuthCallbackUrl(result.url);

      if (callback.status === "success") {
        if (expectedState && callback.state !== expectedState) {
          return {
            status: "error",
            message: "The sign-in return link was stale. Please try again.",
          };
        }

        const session = await exchangeMobileAuthCode(callback.code);
        return { status: "success", session };
      }

      if (callback.status === "error") {
        if (callback.error === "email_verification_required") {
          return {
            status: "check_email",
            message:
              callback.description ??
              "Please verify your email, then log in from the app.",
          };
        }

        return {
          status: "error",
          message: callback.description ?? "The auth step was cancelled.",
        };
      }

      return {
        status: "error",
        message: "The auth page returned without a usable sign-in code.",
      };
    }
  } catch {
    return {
      status: "error",
      message: "Unable to complete sign-in. Try again in a moment.",
    };
  }

  return { status: "cancelled" };
}
