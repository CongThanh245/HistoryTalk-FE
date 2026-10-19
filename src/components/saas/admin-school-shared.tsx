"use client";

import * as React from "react";
import { AlertTriangle, Info, RotateCcw } from "lucide-react";

import { StaffFormInput } from "@/components/staff/staff-form";
import { Field, isValidEmail } from "@/components/saas/saas-ui";
import { PACKAGE_SHORT_LABELS, SCHOOL_STATUS_LABELS, millionTokens, type AdminFormField } from "@/features/saas/admin-schools";
import { ENTERPRISE_PACKAGE_TOKENS, type EnterprisePackage, type SchoolStatus } from "@/services/school.service";
import { cn } from "@/lib/utils/cn";

/**
 * Pieces shared by the System Admin school screens: status / package pills, error and
 * notice blocks, and the School Admin account fields used by the create wizard and the detail page.
 */

const PILL = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[2px] border px-2 py-0.5 text-[11px] font-bold";

const STATUS_CLASS: Record<SchoolStatus, string> = {
  ACTIVE: "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]",
  INACTIVE: "border-[var(--border-strong)] bg-[var(--status-neutral-bg)] text-[var(--text-secondary)]",
  SUSPENDED: "border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--accent-danger)]",
  EXPIRED: "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
};

export function SchoolStatusPill({ status }: { status: SchoolStatus }) {
  return <span className={cn(PILL, STATUS_CLASS[status] ?? STATUS_CLASS.INACTIVE)}>{SCHOOL_STATUS_LABELS[status] ?? status}</span>;
}

/** "Enterprise S" pill with the school-year pool under it ("5 triệu token/năm học"). */
export function PackageCell({ pkg, inline }: { pkg: EnterprisePackage; inline?: boolean }) {
  const tokens = ENTERPRISE_PACKAGE_TOKENS[pkg];
  return (
    <span className={cn("inline-flex gap-1", inline ? "flex-row flex-wrap items-center gap-2" : "flex-col items-start")}>
      <span className={cn(PILL, "border-[var(--text-primary)] bg-transparent text-[var(--text-primary)]")}>{PACKAGE_SHORT_LABELS[pkg] ?? pkg}</span>
      {tokens && <span className="whitespace-nowrap text-xs text-content-muted">{millionTokens(tokens)} token/năm học</span>}
    </span>
  );
}

/** Small muted note explaining a server limitation. */
export function MutedNotice({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-start gap-2 text-xs leading-relaxed text-content-muted", className)}>
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/** Error block with a "Thử lại" button. */
export function ErrorRetry({ title, message, onRetry, retrying }: { title: string; message: string; onRetry: () => void; retrying?: boolean }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-[2px] border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-danger)]" aria-hidden="true" />
        <div className="min-w-0 space-y-0.5">
          <p className="font-semibold text-content-heading">{title}</p>
          {/* Server messages can be raw SQL with no spaces: wrap anywhere and cap the height. */}
          <p className="line-clamp-3 text-[var(--text-secondary)] [overflow-wrap:anywhere]" title={message}>
            {message}
          </p>
        </div>
      </div>
      <button type="button" className="btn-line w-full sm:w-auto" onClick={onRetry} disabled={retrying}>
        <RotateCcw className={cn("h-4 w-4", retrying && "animate-spin")} aria-hidden="true" /> Thử lại
      </button>
    </div>
  );
}

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ───────────────────────── School Admin account fields ───────────────────────── */
export interface AdminAccountValues {
  fullName: string;
  email: string;
  phoneNumber: string;
}

export const emptyAdminAccount = (): AdminAccountValues => ({ fullName: "", email: "", phoneNumber: "" });

/** Lenient phone rule (mobile or landline, 8–20 characters); the backend only caps the length at 20. */
export const LOOSE_PHONE_PATTERN = /^\+?[0-9][0-9 .()-]{6,18}[0-9]$/;
export const compactPhone = (v: string) => v.replace(/[\s.()-]/g, "");

export function adminAccountErrors(v: AdminAccountValues): Record<AdminFormField, string | null> {
  const name = v.fullName.trim();
  return {
    fullName: !name ? "Nhập họ và tên" : name.length < 2 || name.length > 150 ? "Họ và tên từ 2 đến 150 ký tự" : null,
    email: isValidEmail(v.email) ? null : "Email không hợp lệ",
    phoneNumber: v.phoneNumber.trim() && !LOOSE_PHONE_PATTERN.test(v.phoneNumber.trim()) ? "Số điện thoại không hợp lệ" : null,
  };
}

/** Name / email / phone of a new School Admin. Inputs use `${idPrefix}-${field}` ids so callers can focus them. */
export function AdminAccountFields({
  idPrefix,
  values,
  onChange,
  errors,
  autoFocus,
}: {
  idPrefix: string;
  values: AdminAccountValues;
  onChange: (v: AdminAccountValues) => void;
  errors: Partial<Record<AdminFormField, string | null>>;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-4">
      <Field label="Họ và tên" required error={errors.fullName} htmlFor={`${idPrefix}-fullName`}>
        <StaffFormInput
          id={`${idPrefix}-fullName`}
          autoFocus={autoFocus}
          maxLength={150}
          value={values.fullName}
          onChange={(e) => onChange({ ...values, fullName: e.target.value })}
          placeholder="Nguyễn Thị B"
          aria-invalid={!!errors.fullName}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" required error={errors.email} htmlFor={`${idPrefix}-email`} hint="Dùng để đăng nhập">
          <StaffFormInput
            id={`${idPrefix}-email`}
            type="email"
            autoComplete="off"
            value={values.email}
            onChange={(e) => onChange({ ...values, email: e.target.value })}
            placeholder="admin@truong.edu.vn"
            aria-invalid={!!errors.email}
          />
        </Field>
        <Field label="Số điện thoại" error={errors.phoneNumber} htmlFor={`${idPrefix}-phoneNumber`} hint="Không bắt buộc">
          <StaffFormInput
            id={`${idPrefix}-phoneNumber`}
            type="tel"
            maxLength={20}
            value={values.phoneNumber}
            onChange={(e) => onChange({ ...values, phoneNumber: e.target.value })}
            placeholder="0903 112 233"
            aria-invalid={!!errors.phoneNumber}
          />
        </Field>
      </div>
      <MutedNotice>
        Hệ thống tự cấp tên tài khoản và mật khẩu tạm (hiển thị một lần sau khi tạo). Quản trị trường đăng nhập bằng email và phải đổi mật khẩu ở lần
        đầu.
      </MutedNotice>
    </div>
  );
}

/** Focuses `#id` on the next frame (after the field re-renders with its error). */
export function focusById(id: string) {
  requestAnimationFrame(() => document.getElementById(id)?.focus());
}
