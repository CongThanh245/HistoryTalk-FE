"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";
import { ArchiveHeading } from "@/components/commons/archive-heading";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StaffFormLabel } from "@/components/staff/staff-form";
import { MockDataNotice } from "@/components/saas/mock-data-notice";
import { PLAN_LABELS } from "@/features/saas/mock-data";
import type { AccountStatus, School } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

/* ───────────────────────── Hydration ─────────────────────────
 * The SaaS store persists to localStorage, so the server render (seed data) and the first client
 * render (saved data) can differ. Screens render their data only after mount to avoid mismatches. */
const noopSubscribe = () => () => {};
export function useHydrated() {
  return React.useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/* ───────────────────────── Page shell ───────────────────────── */
export function SaasShell({
  title,
  description,
  variant = "staff",
  children,
}: {
  title: string;
  description?: string;
  /** "staff" = School Admin / System Admin workspace; "app" = learning app (layout already pads). */
  variant?: "staff" | "app";
  children: React.ReactNode;
}) {
  const hydrated = useHydrated();
  return (
    <div
      className={cn(
        "space-y-6 text-content-text",
        variant === "staff" ? "max-w-[1600px] px-4 pb-8 pt-4 sm:px-6 lg:px-10" : "py-6",
      )}
    >
      <MockDataNotice />
      <ArchiveHeading as="h1" title={title} description={description} className="mb-0" />
      {hydrated ? (
        children
      ) : (
        <div className="flex h-40 items-center justify-center gap-2 text-sm text-content-muted">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-gold)]" />
          Đang tải dữ liệu...
        </div>
      )}
    </div>
  );
}

/** Bordered surface used for forms, tables and lists. */
export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("space-y-4 rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] p-4 sm:p-6", className)}>
      {children}
    </section>
  );
}

/** Section heading (ArchiveHeading) with an optional row of actions under it. */
export function SectionHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <ArchiveHeading title={title} description={description} className="mb-0" />
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ───────────────────────── Inputs ───────────────────────── */
export function SearchInput({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full sm:w-[280px]", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-subtle" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] pl-10 text-content-text focus-visible:border-[var(--text-primary)]"
      />
    </div>
  );
}

export function Field({
  label,
  required,
  hint,
  error,
  htmlFor,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string | null;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <StaffFormLabel htmlFor={htmlFor}>
        {label}
        {required && <span className="text-[var(--accent-danger)]">*</span>}
      </StaffFormLabel>
      {children}
      {error ? (
        <p className="text-[11px] text-[var(--accent-danger)]">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-content-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/** Shared class names for dialogs so every SaaS dialog fits 375px and scrolls when tall. */
export const DIALOG_CLASS =
  "staff-theme max-h-[90dvh] overflow-y-auto rounded-[2px] border-[var(--text-primary)] bg-[var(--bg-surface)] text-content-text";
export const DIALOG_TITLE_CLASS = "archive-title is-plain text-2xl";

/** Small icon-only table action. */
export function IconAction({
  label,
  onClick,
  tone = "default",
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger" | "success";
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "rounded-[2px] hover:bg-[var(--status-neutral-bg)]",
        tone === "danger" && "text-[var(--accent-danger)]",
        tone === "success" && "text-[var(--status-success)]",
        tone === "default" && "text-[var(--text-secondary)]",
      )}
    >
      {children}
    </Button>
  );
}

/* ───────────────────────── Badges ───────────────────────── */
const PILL = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[2px] border px-2 py-0.5 text-[11px] font-bold";

const ACCOUNT_STATUS: Record<AccountStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: "Hoạt động",
    className: "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]",
  },
  LOCKED: {
    label: "Đã khóa",
    className: "border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--accent-danger)]",
  },
  INVITED: {
    label: "Chờ kích hoạt",
    className: "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
  },
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  ACTIVE: ACCOUNT_STATUS.ACTIVE.label,
  LOCKED: ACCOUNT_STATUS.LOCKED.label,
  INVITED: ACCOUNT_STATUS.INVITED.label,
};

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const s = ACCOUNT_STATUS[status];
  return <span className={cn(PILL, s.className)}>{s.label}</span>;
}

export function SchoolStatusBadge({ status }: { status: School["status"] }) {
  return status === "ACTIVE" ? (
    <span className={cn(PILL, ACCOUNT_STATUS.ACTIVE.className)}>Đang hoạt động</span>
  ) : (
    <span className={cn(PILL, ACCOUNT_STATUS.LOCKED.className)}>Tạm ngưng</span>
  );
}

export function PlanBadge({ plan }: { plan: School["plan"] }) {
  return (
    <span className={cn(PILL, "border-[var(--text-primary)] bg-transparent text-[var(--text-primary)]")}>{PLAN_LABELS[plan]}</span>
  );
}

export function NeutralBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(PILL, "border-[var(--border-strong)] bg-[var(--status-neutral-bg)] text-[var(--text-secondary)]", className)}>
      {children}
    </span>
  );
}

/* ───────────────────────── Token bar ───────────────────────── */
export function TokenBar({ used, quota, className }: { used: number; quota: number; className?: string }) {
  const ratio = quota > 0 ? used / quota : 0;
  const pct = Math.min(100, Math.round(ratio * 100));
  const fill = ratio >= 1 ? "fill-[var(--accent-danger)]" : ratio >= 0.8 ? "fill-[var(--gold-leaf)]" : "fill-[var(--jade)]";
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-[2px] bg-[var(--status-neutral-bg)] ring-1 ring-inset ring-[var(--border-default)]", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
    >
      <svg className="block h-full w-full" aria-hidden="true">
        <rect width={`${pct}%`} height="100%" className={fill} />
      </svg>
    </div>
  );
}

/* ───────────────────────── Helpers ───────────────────────── */
export function formatDate(value: string | undefined | null) {
  if (!value) return "—";
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export const formatNumber = (n: number) => n.toLocaleString("vi-VN");

export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** Lowercase + strip Vietnamese diacritics, for search and header matching. */
export function normalizeText(v: string) {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export const GRADE_OPTIONS = [6, 7, 8, 9, 10, 11, 12];
