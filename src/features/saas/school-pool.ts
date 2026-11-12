import { ROUTES } from "@/constants/routes";
import { tokenApiErrorMessage } from "./hooks-school-token";
import type { TodayQuota } from "./quota-bonus";

/** Anchor of the PayOS purchase panel on the School Admin token page. */
export const TOKEN_PURCHASE_ANCHOR = "mua-token";
export const TOKEN_PURCHASE_HREF = `${ROUTES.SCHOOL.TOKENS}#${TOKEN_PURCHASE_ANCHOR}`;

/** Where schools contact HistoryTalk (orders too large for a self-service purchase, contracts). */
export const HISTORYTALK_CONTACT_EMAIL = "hello@historytalk.vn";

/** Pre-filled email to HistoryTalk asking to top up a school's shared pool. */
export function topUpMailto(school: { schoolName?: string | null; schoolCode?: string | null }) {
  const name = [school.schoolName, school.schoolCode && `(${school.schoolCode})`].filter(Boolean).join(" ");
  const subject = `Nạp thêm token cho trường${name ? ` ${name}` : ""}`;
  const body = [
    "Chào HistoryTalk,",
    "",
    `Quỹ token chung của trường${name ? ` ${name}` : ""} sắp hết hoặc đã hết. Trường muốn nạp thêm token.`,
    "Số token cần nạp thêm: ",
    "Người liên hệ / số điện thoại: ",
  ].join("\n");
  return `mailto:${HISTORYTALK_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export type PoolLevel = "empty" | "danger" | "warn" | "ok";

/** "empty" once nothing is left; "danger" from 85% used, "warn" from 60%. */
export function poolLevel(total: number, remaining: number): PoolLevel {
  if (remaining <= 0) return "empty";
  const pct = total > 0 ? ((total - remaining) / total) * 100 : 0;
  return pct >= 85 ? "danger" : pct >= 60 ? "warn" : "ok";
}

/** Backend refusal when the school pool cannot cover an approval or a grant. */
export const isSchoolPoolShortError = (error: unknown) =>
  /quỹ token chung của trường không đủ/i.test(tokenApiErrorMessage(error, ""));

/**
 * A student's usable tokens are min(today's limit left, school pool). Limit left but nothing usable means the
 * school pool is empty, so asking the teacher for more cannot help.
 */
export const isSchoolPoolEmptyForStudent = (quota: TodayQuota | null) =>
  !!quota && quota.quota - quota.used > 0 && quota.remaining <= 0;
