import { create, isAxiosError } from "axios";

import { API_BASE_URL } from "../config/env";

export const api = create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export function setApiAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION"
  | "SERVER"
  | "NETWORK"
  | "UNKNOWN";

export class ApiError extends Error {
  code: ApiErrorCode;
  status?: number;
  details?: unknown;

  constructor(message: string, code: ApiErrorCode, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type ErrorResponseBody = {
  detail?: unknown;
  message?: string;
};

function getErrorCode(status?: number): ApiErrorCode {
  if (!status) return "NETWORK";
  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 422) return "VALIDATION";
  if (status >= 500) return "SERVER";
  return "UNKNOWN";
}

function getErrorMessage(data: ErrorResponseBody | undefined, fallback: string) {
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.message === "string") return data.message;
  return fallback;
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as ErrorResponseBody | undefined;
    const code = getErrorCode(status);
    const fallback = status
      ? `Request failed with status ${status}`
      : "Network request failed";

    return new ApiError(getErrorMessage(data, fallback), code, status, data?.detail);
  }

  if (error instanceof Error) {
    return new ApiError(error.message, "UNKNOWN");
  }

  return new ApiError("Something went wrong", "UNKNOWN");
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(normalizeApiError(error)),
);
