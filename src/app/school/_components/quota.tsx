"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, ArrowRight, CalendarRange, Coins, School as SchoolIcon, Zap } from "lucide-react";

import { ROUTES } from "@/constants/routes";

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

/**
 * Khoi chinh cua tong quan truong: quy token nam hoc la thu quan trong nhat nen dat len dau,
 * gop luon goi nam hoc (quy thuoc ve goi) va cac chi so token phu.
 */
export function TokenHero({ quota, dash }: { quota: SchoolTokenQuota; dash?: SchoolAdminDashboard }) {
  const total = Math.max(0, quota.totalSchoolTokenQuota);
  const remaining = Math.max(0, quota.unallocatedTokenQuota);
  const used = Math.max(0, total - remaining);
  const pct = total > 0 ? (used / total) * 100 : 0;
  const level = pct >= 85 ? "danger" : pct >= 60 ? "warn" : "ok";
  const end = dash?.subscriptionEndDate;
  const left = end ? daysUntil(end) : null;
  const pending = dash?.pendingTokenBoostRequests ?? 0;
  const daily = dash?.defaultDailyStudentQuota;
  const students = dash?.totalStudents ?? 0;
  // Truong hop xau nhat: moi hoc sinh dung het han muc moi ngay.
  const worstDays = daily && students ? Math.floor(remaining / (daily * students)) : null;
  const inMay = new Date().getMonth() === 4;

  return (
    <section
      aria-label="Quỹ token năm học"
      className="overflow-hidden rounded-[2px] border-2 border-[var(--text-primary)] bg-[var(--bg-surface)] shadow-[6px_6px_0_var(--accent-gold)]"
    >
      <div className="flex flex-col gap-3 border-b border-[var(--border-strong)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <SchoolIcon className="h-6 w-6 shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
          <div className="min-w-0">
            <p className="archive-title is-plain truncate text-xl">{quota.schoolName}</p>
            <p className="text-xs text-content-muted">Mã trường: {quota.schoolCode}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PackageBadge packageType={quota.packageType} />
          {dash?.status && (
            <span className="rounded-[2px] bg-[var(--status-success-bg)] px-2 py-0.5 text-[11px] font-bold text-[var(--status-success)]">
              {SCHOOL_STATUS_LABELS[dash.status] ?? dash.status}
              {left != null && left >= 0 && ` · còn ${formatNumber(left)} ngày`}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 px-5 py-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.1em] text-content-muted">
            <Coins className="h-4 w-4 text-[var(--accent-gold)]" aria-hidden="true" /> Token còn lại trong quỹ năm học
          </p>
          <p
            className={cn(
              "font-display text-[52px] font-extrabold leading-none tabular-nums sm:text-[64px]",
              level === "danger" ? "text-[var(--accent-danger)]" : level === "warn" ? "text-[var(--status-warning)]" : "text-[var(--jade)]",
            )}
          >
            {formatNumber(remaining)}
          </p>
          <TokenBar used={used} quota={total} className="h-3" />
          <p className="text-sm tabular-nums text-content-muted">
            Đã dùng <b className="text-content-heading">{formatNumber(used)}</b> / {formatNumber(total)} token (
            {pct.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%)
            {level === "danger" && <span className="font-semibold text-[var(--accent-danger)]"> — sắp hết, liên hệ HistoryTalk để nạp thêm</span>}
          </p>
          {worstDays != null && (
            <p className="text-xs text-content-muted">
              Nếu cả {formatNumber(students)} học sinh dùng hết {formatNumber(daily ?? 0)} token mỗi ngày, quỹ còn đủ khoảng{" "}
              <b className="text-content-heading">{formatNumber(worstDays)} ngày</b>
              {left != null && left > 0 && worstDays >= left ? " — đủ đến hết năm học." : "."}
            </p>
          )}
        </div>

        <div className="grid content-start gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <MiniStat icon={Activity} label="Học sinh đã dùng" value={dash ? formatNumber(dash.tokensUsedByStudents) : "…"} />
          <MiniStat icon={Coins} label="Hạn mức / học sinh / ngày" value={daily != null ? formatNumber(daily) : "…"} />
          <Link
            href={ROUTES.SCHOOL.TOKENS}
            className={cn(
              "flex items-center gap-3 rounded-[2px] border px-3 py-2.5 motion-safe:transition-colors",
              pending > 0
                ? "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] hover:border-[var(--status-warning)]"
                : "border-[var(--border-default)] hover:border-[var(--text-primary)]",
            )}
          >
            <Zap className={cn("h-4 w-4 shrink-0", pending > 0 ? "text-[var(--status-warning)]" : "text-content-muted")} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-content-muted">Yêu cầu xin thêm token</span>
              <span className="font-display text-xl font-extrabold tabular-nums text-content-heading">{formatNumber(pending)}</span>
              <span className="ml-1.5 text-xs text-content-muted">{pending > 0 ? "đang chờ duyệt" : "không có yêu cầu"}</span>
            </span>
            {pending > 0 && <span className="text-xs font-bold text-[var(--status-warning)]">Duyệt →</span>}
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-[var(--border-strong)] bg-[var(--bg-elevated)] px-5 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <CalendarRange className="h-4 w-4 text-[var(--accent-gold)]" aria-hidden="true" />
            Gói năm học{" "}
            <b className="text-content-heading">
              {dash?.subscriptionStartDate && end ? `${formatDate(dash.subscriptionStartDate)} – ${formatDate(end)}` : "—"}
            </b>
          </span>
          <span>
            Năm học tới:{" "}
            <b className={dash?.renewedForNextYear ? "text-[var(--status-success)]" : "text-content-heading"}>
              {dash?.renewedForNextYear
                ? `Đã gia hạn${dash.nextPackageType ? ` · ${PACKAGE_SHORT_LABELS[dash.nextPackageType]}` : ""}`
                : "Chưa gia hạn"}
            </b>
          </span>
        </span>
        <Link href={ROUTES.SCHOOL.TOKENS} className="archive-link">
          Hạn mức ngày &amp; yêu cầu token <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        {dash && !dash.renewedForNextYear && (
          <p className={cn("w-full text-xs", inMay ? "text-[var(--status-warning)]" : "text-content-muted")}>
            Gia hạn trong tháng 5 để gói mới chạy từ 01/09; tối đa 20% token còn dư được bảo lưu sang năm sau. Sau 31/05 nếu chưa gia hạn, tài khoản
            của trường bị khóa.
          </p>
        )}
      </div>
    </section>
  );
}

/** Mot dong tom tat quy (trang Han muc token): chi tiet day du o Tong quan truong. */
export function PoolStrip() {
  const q = useApiTokenQuota();
  if (q.isPending) return <Skeleton className="h-14 w-full" />;
  if (q.isError) return <ErrorBlock error={q.error} fallback="Không tải được quỹ token của trường." onRetry={() => void q.refetch()} />;
  const total = Math.max(0, q.data.totalSchoolTokenQuota);
  const remaining = Math.max(0, q.data.unallocatedTokenQuota);
  return (
    <div className="flex flex-col gap-3 rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3 sm:flex-row sm:items-center">
      <Coins className="hidden h-5 w-5 shrink-0 text-[var(--accent-gold)] sm:block" aria-hidden="true" />
      <p className="shrink-0 text-sm">
        Quỹ chung còn <b className="font-display text-lg tabular-nums text-[var(--jade)]">{formatNumber(remaining)}</b>
        <span className="text-content-muted"> / {formatNumber(total)} token</span>
      </p>
      <TokenBar used={total - remaining} quota={total} className="h-2 sm:flex-1" />
      <Link href={ROUTES.SCHOOL.HOME} className="archive-link shrink-0">
        Chi tiết quỹ &amp; gói năm học <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Coins; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[2px] border border-[var(--border-default)] px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
      <span>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-content-muted">{label}</span>
        <span className="font-display text-xl font-extrabold tabular-nums text-content-heading">{value}</span>
      </span>
    </div>
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
