"use client";

// Helpers for the System Admin school screens (`/staff/admin/schools/**`): labels for the
// backend enums, error → form-field mapping and the School Admin account helpers.

import { apiErrorMessage, apiErrorStatus, useApiSchoolAdmins } from "@/features/saas/hooks-api";
import type { CredentialRecord } from "@/components/saas/accounts-utils";
import {
  type ApiSchool,
  type ApiSchoolAdmin,
  type EnterprisePackage,
  type ResetPasswordResult,
  type SchoolStatus,
} from "@/services/school.service";

/* ───────────────────────── Labels ───────────────────────── */
export const PACKAGE_ORDER: EnterprisePackage[] = ["ENTERPRISE_SMALL", "ENTERPRISE_MEDIUM", "ENTERPRISE_LARGE"];

export const PACKAGE_SHORT_LABELS: Record<EnterprisePackage, string> = {
  ENTERPRISE_SMALL: "Enterprise S",
  ENTERPRISE_MEDIUM: "Enterprise M",
  ENTERPRISE_LARGE: "Enterprise L",
};

/** "5 triệu", "20 triệu", "50 triệu". */
export function millionTokens(n: number) {
  const m = n / 1_000_000;
  return `${Number.isInteger(m) ? m : m.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} triệu`;
}

export const SCHOOL_STATUS_LABELS: Record<SchoolStatus, string> = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Ngừng hoạt động",
  SUSPENDED: "Tạm ngưng",
};

/** Same rule as the backend (`^[A-Za-z0-9_-]{2,30}$`); the backend stores it upper-case. */
export const SCHOOL_CODE_PATTERN = /^[A-Za-z0-9_-]{2,30}$/;

/** Token pool numbers of a school: total, still unallocated, and handed out to students. */
export function schoolPool(s: Pick<ApiSchool, "totalSchoolTokenQuota" | "unallocatedTokenQuota">) {
  const total = Math.max(0, s.totalSchoolTokenQuota ?? 0);
  const unallocated = Math.max(0, Math.min(total, s.unallocatedTokenQuota ?? 0));
  const allocated = total - unallocated;
  return { total, unallocated, allocated, percent: total > 0 ? Math.round((allocated / total) * 100) : 0 };
}

/** The backend sends `LocalDateTime` without a zone (e.g. "2026-10-09T13:15:30"); treat it as local time. */
export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
}

/* ───────────────────────── Errors ───────────────────────── */
export type SchoolFormField = "name" | "schoolCode" | "address" | "contactEmail" | "contactPhone" | "packageType" | "localHistoryPolicyAccepted";
export type AdminFormField = "fullName" | "email" | "phoneNumber";

const FIELD_ERRORS = (error: unknown): Record<string, string> | undefined => {
  if (typeof error === "object" && error !== null && "response" in error) {
    return (error as { response?: { data?: { errors?: Record<string, string> } } }).response?.data?.errors ?? undefined;
  }
  return undefined;
};

/** Raw backend message (English for most errors). */
function rawMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? "";
  }
  return "";
}

/** Vietnamese copy for the backend's known English messages; anything else is shown as sent. */
function translate(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("school code") && m.includes("already exists")) return "Mã trường đã được dùng cho trường khác. Chọn mã khác hoặc để trống để hệ thống tự sinh.";
  if (m.includes("school code must contain")) return "Mã trường gồm 2–30 ký tự: chữ, số, dấu gạch ngang hoặc gạch dưới.";
  if (m.includes("email") && m.includes("already in use")) return "Email này đã được dùng cho một tài khoản khác.";
  if (m.includes("local history")) return "Trường phải đồng ý cam kết nội dung lịch sử địa phương.";
  if (m.includes("school admin not found") || m.includes("not a school admin"))
    return "Không tìm thấy tài khoản quản trị trường. Tài khoản có thể đã bị xóa.";
  if (m.includes("school not found")) return "Không tìm thấy trường. Trường có thể đã bị xóa.";
  if (m.includes("must not be blank")) return "Vui lòng điền đủ các trường bắt buộc.";
  if (m.includes("email is invalid")) return "Email không hợp lệ.";
  if (m.includes("must not exceed") || m.includes("must be between")) return "Một trường thông tin quá dài hoặc quá ngắn.";
  if (m === "access denied" || m.includes("forbidden")) return "Tài khoản của bạn không có quyền thực hiện thao tác này.";
  return message;
}

export interface MappedError<F extends string> {
  message: string;
  field: F | null;
  status: number | undefined;
}

/** Maps a `POST /admin/schools` error to a message + the form field to focus. */
export function schoolCreateError(error: unknown): MappedError<SchoolFormField> {
  const status = apiErrorStatus(error);
  const raw = rawMessage(error);
  const fieldErrors = FIELD_ERRORS(error);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    const [field, msg] = Object.entries(fieldErrors)[0];
    return { status, field: (field as SchoolFormField) ?? null, message: translate(msg) };
  }
  const lower = raw.toLowerCase();
  let field: SchoolFormField | null = null;
  if (lower.includes("school code")) field = "schoolCode";
  else if (lower.includes("tên trường") || lower.includes("school name")) field = "name";
  else if (lower.includes("email")) field = "contactEmail";
  else if (lower.includes("local history")) field = "localHistoryPolicyAccepted";
  return {
    status,
    field,
    message: raw ? translate(raw) : apiErrorMessage(error, "Không tạo được trường. Vui lòng thử lại."),
  };
}

/** Maps a `POST /admin/school-admins` error to a message + the form field to focus. */
export function schoolAdminCreateError(error: unknown): MappedError<AdminFormField> {
  const status = apiErrorStatus(error);
  const raw = rawMessage(error);
  const fieldErrors = FIELD_ERRORS(error);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    const [field, msg] = Object.entries(fieldErrors)[0];
    const known: AdminFormField[] = ["fullName", "email", "phoneNumber"];
    return { status, field: known.includes(field as AdminFormField) ? (field as AdminFormField) : null, message: translate(msg) };
  }
  return {
    status,
    field: status === 409 || raw.toLowerCase().includes("email") ? "email" : null,
    message: raw ? translate(raw) : apiErrorMessage(error, "Không tạo được tài khoản quản trị trường. Vui lòng thử lại."),
  };
}

const ADMIN_FIELDS: AdminFormField[] = ["fullName", "email", "phoneNumber"];

/** Field-specific Vietnamese copy for the backend's English validation messages. */
const ADMIN_FIELD_MESSAGES: Record<AdminFormField, (raw: string) => string> = {
  fullName: (raw) => (raw.toLowerCase().includes("blank") ? "Nhập họ và tên" : "Họ và tên từ 2 đến 150 ký tự"),
  email: (raw) => (raw.toLowerCase().includes("blank") ? "Nhập email" : translate(raw)),
  phoneNumber: () => "Số điện thoại tối đa 20 ký tự",
};

export interface AdminFormErrors {
  /** Per-field messages (400 validation errors, 409 duplicate email). */
  fields: Partial<Record<AdminFormField, string>>;
  /** Message for the whole form when no field applies. */
  message: string | null;
  status: number | undefined;
}

/**
 * Maps a `PUT /admin/school-admins/{id}` error: every 400 field error goes to its field, 409 goes to the
 * email field, anything else becomes a form-level message.
 */
export function schoolAdminUpdateError(error: unknown): AdminFormErrors {
  const status = apiErrorStatus(error);
  const raw = rawMessage(error);
  const fieldErrors = FIELD_ERRORS(error);
  const fields: Partial<Record<AdminFormField, string>> = {};
  let other: string | null = null;
  for (const [field, msg] of Object.entries(fieldErrors ?? {})) {
    if (ADMIN_FIELDS.includes(field as AdminFormField)) fields[field as AdminFormField] = ADMIN_FIELD_MESSAGES[field as AdminFormField](msg);
    else other ??= translate(msg);
  }
  if (Object.keys(fields).length > 0 || other) return { status, fields, message: other };
  if (status === 409 || (raw.toLowerCase().includes("email") && raw.toLowerCase().includes("in use"))) {
    return { status, fields: { email: "Email này đã được dùng cho một tài khoản khác." }, message: null };
  }
  return {
    status,
    fields: {},
    message: raw ? translate(raw) : apiErrorMessage(error, "Không lưu được thay đổi. Vui lòng thử lại."),
  };
}

/** Vietnamese message for a failed lock / unlock / delete / reset-password call. */
export function schoolAdminActionError(error: unknown, fallback: string): string {
  const raw = rawMessage(error);
  return raw ? translate(raw) : apiErrorMessage(error, fallback);
}

/* ───────────────────────── Counts ───────────────────────── */
/**
 * Total and active School Admins of a school, read from `totalElements` of two one-row queries so they
 * cover every page. `active` is `undefined` until known. The backend does not stop the last active
 * admin from being locked or deleted, so the UI uses `active` to guard it.
 */
export function useSchoolAdminCounts(schoolId: string | undefined) {
  const all = useApiSchoolAdmins(schoolId, { page: 0, size: 1 });
  const active = useApiSchoolAdmins(schoolId, { active: true, page: 0, size: 1 });
  return {
    total: all.data?.totalElements,
    active: active.isError || active.isPlaceholderData ? undefined : active.data?.totalElements,
    activeError: active.isError,
  };
}

/* ───────────────────────── Credentials ───────────────────────── */
/** Backend login uses the email, so it is the primary login; the generated userName is shown as extra info. */
export function adminCredentialRecord(admin: ApiSchoolAdmin): CredentialRecord {
  return {
    id: admin.uid,
    fullName: admin.fullName,
    login: admin.email,
    userName: admin.userName,
    password: admin.initialPassword ?? "",
    roleLabel: "Quản trị trường",
  };
}

/** One-time credentials after `POST /admin/school-admins/{id}/reset-password` (login = email). */
export function resetCredentialRecord(r: ResetPasswordResult): CredentialRecord {
  return {
    id: r.uid,
    fullName: r.fullName,
    login: r.email,
    userName: r.userName,
    password: r.initialPassword,
    roleLabel: "Quản trị trường",
  };
}

/** File-name friendly school code, e.g. "LHP-HCM" → "lhp-hcm". */
export const codeSlug = (code: string | null | undefined) => (code || "truong").toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
