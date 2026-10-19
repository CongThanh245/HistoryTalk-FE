import { schoolErrorCode, stripErrorCode } from "@/lib/utils/api-error";
import { useSessionStore } from "@/store/session.store";

/**
 * Reacts to the platform-wide 403 codes (Sprint 7 two-level locking):
 * ACCOUNT_DEACTIVATED → sign-out dialog; SCHOOL_SUBSCRIPTION_EXPIRED / _NOT_STARTED → school lock screen.
 * AI_QUOTA_EXCEEDED only locks AI chat, so it is left to the chat screens. Returns the code it handled.
 */
export function handlePlatformLockError(error: unknown): "ACCOUNT_DEACTIVATED" | "SCHOOL_SUBSCRIPTION_EXPIRED" | "SCHOOL_SUBSCRIPTION_NOT_STARTED" | null {
  const code = schoolErrorCode(error);
  if (code === "ACCOUNT_DEACTIVATED") {
    useSessionStore.getState().showLocked();
    return code;
  }
  if (code === "SCHOOL_SUBSCRIPTION_EXPIRED" || code === "SCHOOL_SUBSCRIPTION_NOT_STARTED") {
    const raw =
      typeof error === "object" && error !== null && "response" in error
        ? (error as { response?: { data?: { message?: unknown } } }).response?.data?.message
        : error instanceof Error
          ? error.message
          : "";
    useSessionStore.getState().showSchoolLock({ code, message: stripErrorCode(typeof raw === "string" ? raw : "") });
    return code;
  }
  return null;
}
