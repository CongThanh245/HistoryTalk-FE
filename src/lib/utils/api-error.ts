import axios from "axios";

type ApiErrorBody = {
  success?: boolean;
  errorCode?: string | number;
  message?: unknown;
  status?: string;
  timestamp?: string;
  errors?: Record<string, string | string[]>;
};

function formatFieldErrors(errors?: ApiErrorBody["errors"]) {
  if (!errors) return "";

  return Object.entries(errors)
    .map(([field, value]) => {
      const text = Array.isArray(value) ? value.join(", ") : value;
      return `${field}: ${text}`;
    })
    .join("\n");
}

/**
 * Sprint 7 codes the backend puts in front of a 403 message, e.g. "AI_QUOTA_EXCEEDED: Bạn đã hết hạn mức…":
 * - AI_QUOTA_EXCEEDED: the student hit today's limit or the school pool is empty — only AI chat is locked.
 * - SCHOOL_SUBSCRIPTION_EXPIRED / _NOT_STARTED: outside 01/09 – 31/05 or not renewed — the whole school is locked.
 * - ACCOUNT_DEACTIVATED: graduated / transferred student — sign out.
 */
export const SCHOOL_ERROR_CODES = [
  "AI_QUOTA_EXCEEDED",
  "SCHOOL_SUBSCRIPTION_EXPIRED",
  "SCHOOL_SUBSCRIPTION_NOT_STARTED",
  "ACCOUNT_DEACTIVATED",
] as const;
export type SchoolErrorCode = (typeof SCHOOL_ERROR_CODES)[number];

const CODE_PREFIX = new RegExp(`^\\s*(${SCHOOL_ERROR_CODES.join("|")})\\s*:\\s*`);

/** Raw message of an axios error, or of the Error thrown by the fetch()-based chat stream. */
function rawErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message;
    return typeof message === "string" ? message : "";
  }
  if (error instanceof Error) {
    const data = (error as Error & { response?: { data?: ApiErrorBody } }).response?.data;
    return typeof data?.message === "string" ? data.message : error.message;
  }
  return "";
}

/** Code in front of the backend message, if any. */
export function schoolErrorCode(errorOrMessage: unknown): SchoolErrorCode | null {
  const message = typeof errorOrMessage === "string" ? errorOrMessage : rawErrorMessage(errorOrMessage);
  return (message.match(CODE_PREFIX)?.[1] as SchoolErrorCode | undefined) ?? null;
}

/** Message without the leading code, for display. */
export function stripErrorCode(message: string): string {
  return message.replace(CODE_PREFIX, "");
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;
    const message = typeof data?.message === "string" ? stripErrorCode(data.message) : "";
    const fieldErrors = formatFieldErrors(data?.errors);

    return [message, fieldErrors].filter(Boolean).join("\n") || fallback;
  }

  if (error instanceof Error && error.message) {
    return stripErrorCode(error.message);
  }

  return fallback;
}

/** Out of tokens: B2C wallet empty, or a school student's daily limit / school pool used up (AI_QUOTA_EXCEEDED). */
export function isTokenExhaustionError(error: unknown) {
  if (schoolErrorCode(error) === "AI_QUOTA_EXCEEDED") return true;
  const rawMessage = axios.isAxiosError<ApiErrorBody>(error)
    ? error.response?.data?.message
    : error instanceof Error
      ? error.message
      : undefined;

  const message = typeof rawMessage === "string" ? rawMessage.toLowerCase() : "";
  const status = axios.isAxiosError<ApiErrorBody>(error)
    ? error.response?.status
    : undefined;

  return (
    message.includes("hết token") ||
    message.includes("không đủ token") ||
    message.includes("nap thêm") ||
    message.includes("nạp thêm") ||
    (status === 400 && message.includes("token"))
  );
}
