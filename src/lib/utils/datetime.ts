/**
 * Timezone utilities:
 * - Backend returns all timestamps in UTC (ISO-8601 with trailing 'Z', or bare LocalDateTime in UTC).
 * - Frontend displays and edits all timestamps in Vietnam time (Asia/Ho_Chi_Minh, UTC+7).
 */

export const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const HAS_TZ_SUFFIX_RE = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const DATE_TIME_NO_TZ_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

/** Parse a BE timestamp (treated as UTC when no offset/'Z' is present). */
export function parseUtcDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  let normalized = trimmed;
  if (!HAS_TZ_SUFFIX_RE.test(trimmed) && DATE_TIME_NO_TZ_RE.test(trimmed)) {
    normalized = `${trimmed.replace(" ", "T")}Z`;
  }

  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatVietnamDateTime(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  },
  fallback = "—",
): string {
  const d = parseUtcDate(value);
  if (!d) return fallback;
  return d.toLocaleString("vi-VN", { ...options, timeZone: VIETNAM_TIME_ZONE });
}

export function formatVietnamDate(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  },
  fallback = "—",
): string {
  const d = parseUtcDate(value);
  if (!d) return fallback;
  return d.toLocaleDateString("vi-VN", { ...options, timeZone: VIETNAM_TIME_ZONE });
}

export function formatVietnamTime(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  },
  fallback = "—",
): string {
  const d = parseUtcDate(value);
  if (!d) return fallback;
  return d.toLocaleTimeString("vi-VN", { ...options, timeZone: VIETNAM_TIME_ZONE });
}

/** UTC timestamp from BE -> "YYYY-MM-DDTHH:mm" in Vietnam time for <input type="datetime-local">. */
export function utcToVietnamInput(value: string | null | undefined): string {
  const d = parseUtcDate(value);
  if (!d) return "";
  return new Date(d.getTime() + VIETNAM_OFFSET_MS).toISOString().slice(0, 16);
}

/** <input type="datetime-local"> value (Vietnam time, UTC+7) -> ISO-8601 UTC string for BE. */
export function vietnamInputToUtc(value: string): string {
  if (!value || value.length < 16) return "";
  const d = new Date(`${value.slice(0, 16)}:00+07:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}
