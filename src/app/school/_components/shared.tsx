"use client";

// Shared bits for the School Admin screens, which run on the Sprint 5 SaaS API (src/services/school.service.ts).

import * as React from "react";
import { AlertTriangle, Copy, Info, Loader2, RotateCcw } from "lucide-react";

import { ArchiveHeading } from "@/components/commons/archive-heading";
import { copyText } from "@/components/saas/accounts-utils";
import { formatNumber } from "@/components/saas/saas-ui";
import { apiErrorMessage } from "@/features/saas/hooks-api";
import type { EnterprisePackage } from "@/services/school.service";
import { ENTERPRISE_PACKAGE_TOKENS } from "@/services/school.service";
import { cn } from "@/lib/utils/cn";

/** Page shell of the School Admin screens (API-backed): same layout as SaasShell, without the "Dữ liệu mẫu" bar. */
export function SchoolShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  /** Primary page actions, shown on the right of the title. */
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-[1600px] space-y-6 px-4 pb-8 pt-4 text-content-text sm:px-6 lg:px-10">
      <ArchiveHeading as="h1" title={title} description={description} actions={actions} />
      {children}
    </div>
  );
}

export function LoadingBlock({ label = "Đang tải dữ liệu..." }: { label?: string }) {
  return (
    <div role="status" className="flex h-40 items-center justify-center gap-2 text-sm text-content-muted">
      <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-gold)]" aria-hidden="true" />
      {label}
    </div>
  );
}

/** Error block with the backend message and a retry button. */
export function ErrorBlock({ error, fallback, onRetry, className }: { error: unknown; fallback: string; onRetry?: () => void; className?: string }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-3 rounded-sm border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-4 text-sm sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="flex items-start gap-2 text-[var(--accent-danger)]">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{apiErrorMessage(error, fallback)}</span>
      </p>
      {onRetry && (
        <button type="button" className="btn-line shrink-0" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Thử lại
        </button>
      )}
    </div>
  );
}

/** Muted note for features the backend does not expose yet. */
export function ApiGapNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      role="note"
      className={cn(
        "flex items-start gap-2 rounded-sm border border-[var(--border-default)] bg-[var(--status-neutral-bg)] px-3 py-2 text-xs leading-relaxed text-content-muted",
        className,
      )}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}



export const PACKAGE_LABELS: Record<EnterprisePackage, string> = {
  ENTERPRISE_SMALL: "Doanh nghiệp S",
  ENTERPRISE_MEDIUM: "Doanh nghiệp M",
  ENTERPRISE_LARGE: "Doanh nghiệp L",
};

/** e.g. "Doanh nghiệp S · 5.000.000 token/năm học" (quy chung ca nam hoc 01/09–31/05). */
export function packageLabel(p: EnterprisePackage | string | undefined | null) {
  if (!p) return "—";
  const known = p as EnterprisePackage;
  const tokens = ENTERPRISE_PACKAGE_TOKENS[known];
  return tokens ? `${PACKAGE_LABELS[known]} · ${formatNumber(tokens)} token/năm học` : p;
}

export function PackageBadge({ packageType }: { packageType: EnterprisePackage | string | undefined | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border border-border-card px-2 py-0.5 text-[11px] font-bold text-[var(--text-primary)]">
      {packageLabel(packageType)}
    </span>
  );
}

/** Copyable mono tag (class code, user name...). */
export function CopyTag({ value, label = "mã" }: { value: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void copyText(value, `Đã sao chép ${label}`);
      }}
      title={`Sao chép ${label}`}
      aria-label={`Sao chép ${label} ${value}`}
      className="inline-flex max-w-full items-center gap-1.5 rounded-sm border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-2 py-0.5 font-mono text-[11px] font-bold text-content-heading transition-colors hover:border-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]"
    >
      <span className="truncate">{value}</span>
      <Copy className="h-3 w-3 shrink-0 text-content-muted" aria-hidden="true" />
    </button>
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

/** Field-level message from a 400 `errors` map, e.g. { email: "..." }. */
export function apiFieldErrors(error: unknown): Record<string, string> {
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as { response?: { data?: { errors?: unknown; data?: unknown } } }).response?.data;
    const errs = data?.errors ?? data?.data;
    if (errs && typeof errs === "object" && !Array.isArray(errs)) {
      return Object.fromEntries(Object.entries(errs as Record<string, unknown>).filter(([, v]) => typeof v === "string")) as Record<string, string>;
    }
  }
  return {};
}
