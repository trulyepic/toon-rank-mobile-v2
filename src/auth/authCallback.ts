import { MOBILE_AUTH_CALLBACK_URL } from "../config/site";

export type AuthCallbackResult =
  | {
      status: "success";
      code: string;
      state: string | null;
    }
  | {
      status: "error";
      error: string;
      description: string | null;
    }
  | {
      status: "ignored";
      reason: "wrong_url" | "missing_code";
    };

export function parseAuthCallbackUrl(url: string): AuthCallbackResult {
  if (!url.startsWith(MOBILE_AUTH_CALLBACK_URL)) {
    return {
      status: "ignored",
      reason: "wrong_url",
    };
  }

  const query = url.split("?")[1] ?? "";
  const params = new URLSearchParams(query);
  const error = params.get("error");

  if (error) {
    return {
      status: "error",
      error,
      description: params.get("error_description"),
    };
  }

  const code = params.get("code");

  if (!code) {
    return {
      status: "ignored",
      reason: "missing_code",
    };
  }

  return {
    status: "success",
    code,
    state: params.get("state"),
  };
}
