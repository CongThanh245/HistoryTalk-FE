"use client";

import type { ReactNode } from "react";
import { CalendarRange, School as SchoolIcon } from "lucide-react";

import { Panel, SectionHeading, TokenBar, formatDate, formatNumber } from "@/components/saas/saas-ui";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { useApiTokenQuota } from "@/features/saas/hooks-api";
import { PACKAGE_SHORT_LABELS, SCHOOL_STATUS_LABELS } from "@/features/saas/admin-schools";
import type { SchoolAdminDashboard } from "@/services/analytics-dashboard.service";
import type { SchoolTokenQuota } from "@/services/school.service";
import { ErrorBlock, PackageBadge } from "./shared";

/** School header (name, code, package) from GET /school-admin/token-quota. */
export function SchoolHeader({ quota }: { quota: SchoolTokenQuota }) {
  return (
    <Panel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <SchoolIcon className="h-6 w-6 shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
        <div className="min-w-0">
          <p className="archive-title is-plain text-xl">{quota.schoolName}</p>
          <p className="text-xs text-content-muted">Mã trường: {quota.schoolCode}</p>
        </div>
      </div>
      <PackageBadge packageType={quota.packageType} />
    </Panel>
  );
}

function QuotaFigure({ label, value, tone, hint }: { label: string; value: number; tone?: "gold" | "jade"; hint?: string }) {
  return (
    <div
      className={cn(
        "space-y-1 border-l-2 pl-3",
        tone === "gold" ? "border-[var(--gold-leaf)]" : tone === "jade" ? "border-[var(--jade)]" : "border-[var(--border-strong)]",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{label}</p>
      <p className="font-display text-2xl font-extrabold tabular-nums text-content-heading">{formatNumber(value)}</p>
      {hint && <p className="text-xs text-content-muted">{hint}</p>}
    </div>
  );
}

/**
 * Shared pool of the school year (Sprint 7): every student chat is deducted from it directly, so
 * "used" = total − remaining. Nothing is handed out to students in advance.
 */
export function QuotaSummary({ quota }: { quota: SchoolTokenQuota }) {
  const total = Math.max(0, quota.totalSchoolTokenQuota);
  const remaining = Math.max(0, quota.unallocatedTokenQuota);
  const used = Math.max(0, total - remaining);
  const pct = total > 0 ? (used / total) * 100 : 0;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <QuotaFigure label="Tổng quỹ năm học" value={total} hint="Gói + nạp thêm + bảo lưu" />
        <QuotaFigure label="Đã sử dụng" value={used} tone="gold" />
        <QuotaFigure label="Còn lại trong quỹ chung" value={remaining} tone="jade" />
      </div>
      <div className="space-y-1.5">
        <TokenBar used={used} quota={total} className="h-3" />
        <p className={cn("text-xs tabular-nums", pct >= 85 ? "text-[var(--accent-danger)]" : "text-content-muted")}>
          Đã dùng {pct.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}% quỹ token của năm học
          {pct >= 85 && " — sắp hết, liên hệ HistoryTalk để nạp thêm"}
        </p>
      </div>
    </div>
  );
}

export function QuotaSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Đang tải hạn mức token">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

/** Self-loading quota panel used on the dashboard and the tokens page. */
export function QuotaPanel({ title = "Quỹ token chung của trường", footer }: { title?: string; footer?: ReactNode }) {
  const q = useApiTokenQuota();
  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeading
          title={title}
          description="Toàn bộ token của trường nằm trong một quỹ chung. Học sinh chat tới đâu trừ thẳng vào quỹ tới đó, trong giới hạn hạn mức mỗi ngày."
        />
        {q.data && <PackageBadge packageType={q.data.packageType} />}
      </div>
      {q.isPending ? (
        <QuotaSkeleton />
      ) : q.isError ? (
        <ErrorBlock error={q.error} fallback="Không tải được quỹ token của trường." onRetry={() => void q.refetch()} />
      ) : (
        <QuotaSummary quota={q.data} />
      )}
      {footer}
    </Panel>
  );
}

/** Days until `date` (yyyy-MM-dd), negative once passed. */
function daysUntil(date: string) {
  const end = new Date(`${date}T23:59:59`);
  return Math.ceil((end.getTime() - Date.now()) / 86_400_000);
}

/** School year subscription (01/09 – 31/05) and the May renewal, from GET /school-admin/dashboard. */
export function SubscriptionSummary({ data }: { data: SchoolAdminDashboard }) {
  const end = data.subscriptionEndDate;
  const left = end ? daysUntil(end) : null;
  const inMay = new Date().getMonth() === 4;
  return (
    <div className="space-y-3">
      <dl className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Năm học của gói</dt>
          <dd className="flex items-center gap-2 font-semibold text-content-heading">
            <CalendarRange className="h-4 w-4 text-[var(--accent-gold)]" aria-hidden="true" />
            {data.subscriptionStartDate && end ? `${formatDate(data.subscriptionStartDate)} – ${formatDate(end)}` : "—"}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Trạng thái</dt>
          <dd className="font-semibold text-content-heading">
            {data.status ? SCHOOL_STATUS_LABELS[data.status] ?? data.status : "—"}
            {left != null && left >= 0 && <span className="font-normal text-content-muted"> · còn {formatNumber(left)} ngày</span>}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Năm học tới</dt>
          <dd className="font-semibold text-content-heading">
            {data.renewedForNextYear
              ? `Đã gia hạn${data.nextPackageType ? ` · ${PACKAGE_SHORT_LABELS[data.nextPackageType]}` : ""}`
              : "Chưa gia hạn"}
          </dd>
        </div>
      </dl>
      {!data.renewedForNextYear && (
        <p className={cn("text-xs", inMay ? "text-[var(--status-warning)]" : "text-content-muted")}>
          Gia hạn trong tháng 5 (01/05 – 31/05) để gói mới chạy từ 01/09; tối đa 20% token còn dư được bảo lưu sang năm sau. Sau 31/05 nếu chưa
          gia hạn, toàn bộ tài khoản của trường bị khóa. Liên hệ HistoryTalk để gia hạn.
        </p>
      )}
    </div>
  );
}
