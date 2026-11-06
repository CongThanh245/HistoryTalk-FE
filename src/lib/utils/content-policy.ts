// BE rejects messages with inappropriate wording with a 400 whose message starts with this prefix,
// both from POST /chat/messages/check and from the send-message APIs (chat_exam_mode_api_contract.md §2.6).
const INAPPROPRIATE_PREFIX = "INAPPROPRIATE_CONTENT:";

export const DEFAULT_INAPPROPRIATE_MESSAGE =
  "Phát hiện ngôn từ không phù hợp. Vui lòng điều chỉnh nội dung rồi gửi lại.";

/** The text to show the user when `message` is a content-policy rejection, otherwise null. */
export function inappropriateMessageFrom(message: unknown): string | null {
  if (typeof message !== "string") return null;
  const index = message.indexOf(INAPPROPRIATE_PREFIX);
  if (index < 0) return null;
  return message.slice(index + INAPPROPRIATE_PREFIX.length).trim() || DEFAULT_INAPPROPRIATE_MESSAGE;
}

/** Same as inappropriateMessageFrom, for an axios or fetch error. */
export function inappropriateMessageFromError(error: unknown): string | null {
  const e = error as { message?: unknown; response?: { data?: { message?: unknown } } } | null;
  return inappropriateMessageFrom(e?.response?.data?.message) ?? inappropriateMessageFrom(e?.message);
}
