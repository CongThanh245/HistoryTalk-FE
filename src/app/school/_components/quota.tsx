"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { School as SchoolIcon } from "lucide-react";

import { Panel, SectionHeading, TokenBar, formatNumber } from "@/components/saas/saas-ui";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { useApiTokenQuota } from "@/features/saas/hooks-api";
import { ROUTES } from "@/constants/routes";
import type { SchoolTokenQuota } from "@/services/school.service";
import { ApiGapNote, ErrorBlock, PackageBadge } from "./shared";

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

function QuotaFigure({ label, value, tone }: { label: string; value: number; tone?: "gold" | "jade" }) {
  return (
    <div
      className={cn(
        "space-y-1 border-l-2 pl-3",
        tone === "gold" ? "border-[var(--gold-leaf)]" : tone === "jade" ? "border-[var(--jade)]" : "border-[var(--border-strong)]",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{label}</p>
      <p className="font-display text-2xl font-extrabold tabular-nums text-content-heading">{formatNumber(value)}</p>
    </div>
  );
}

/** Token pool of the school: total / allocated / unallocated with the allocation progress bar. */
export function QuotaSummary({ quota }: { quota: SchoolTokenQuota }) {
  const pct = Math.max(0, Math.min(100, quota.usagePercentage ?? 0));
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <QuotaFigure label="Tổng quỹ" value={quota.totalSchoolTokenQuota} />
        <QuotaFigure label="Đã cấp cho học sinh" value={quota.allocatedTokenQuota} tone="gold" />
        <QuotaFigure label="Còn lại" value={quota.unallocatedTokenQuota} tone="jade" />
      </div>
      <div className="space-y-1.5">
        <TokenBar used={quota.allocatedTokenQuota} quota={quota.totalSchoolTokenQuota} className="h-3" />
        <p className="text-xs tabular-nums text-content-muted">
          Đã cấp {pct.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}% quỹ token của gói
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
export function QuotaPanel({ title = "Quỹ token của trường", footer }: { title?: string; footer?: ReactNode }) {
  const q = useApiTokenQuota();
  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeading title={title} description="Token theo gói được cấp cho học sinh khi nhập tài khoản hoặc cấp thêm từ trang Học sinh; phần chưa phân bổ dùng cho các lần cấp sau." />
        {q.data && <PackageBadge packageType={q.data.packageType} />}
      </div>
      {q.isPending ? (
        <QuotaSkeleton />
      ) : q.isError ? (
        <ErrorBlock error={q.error} fallback="Không tải được hạn mức token của trường." onRetry={() => void q.refetch()} />
      ) : (
        <QuotaSummary quota={q.data} />
      )}
      {footer}
    </Panel>
  );
}

/** Where per-student allocation happens (Học sinh → chọn học sinh → Cấp token). */
export function PerStudentAllocationNote() {
  return (
    <ApiGapNote>
      Token được cấp khi nhập học sinh (mức mặc định + cột “additional_token”). Để cấp thêm, vào trang{" "}
      <Link href={ROUTES.SCHOOL.STUDENTS} className="font-semibold text-content-heading underline underline-offset-2">
        Học sinh
      </Link>
      , chọn một hoặc nhiều học sinh rồi bấm “Cấp token”.
    </ApiGapNote>
  );
}
