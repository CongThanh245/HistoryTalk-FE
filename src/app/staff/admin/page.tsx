// src/app/staff/admin/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatVietnamDateTime } from "@/lib/utils/datetime";
import {
  UsersIcon,
  TrendingUpIcon,
  ArrowRightIcon,
  ActivityIcon,
  UserCheckIcon,
  ShieldCheckIcon,
  MessageSquareIcon,
  BookOpenIcon,
  ServerIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  CalendarIcon,
  BarChart3Icon,
  MessagesSquareIcon,
  CreditCardIcon,
  AwardIcon,
  CrownIcon,
  PercentIcon,
  TrophyIcon,
  HelpCircleIcon,
  FlameIcon,
  CoinsIcon,
  CpuIcon,
  SchoolIcon,
  Gauge,
} from "lucide-react";
import Image from "next/image";

import { StaffShell } from "@/components/staff/staff-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { isValidUrl } from "@/lib/utils/url";
import { cn } from "@/lib/utils/cn";
import { DateInput } from "@/components/ui/date-input";
import { SaaSLineChart } from "@/components/staff/saas-line-chart";
import { useSystemAdminComprehensiveDashboard } from "@/features/dashboard/hooks";
import {
  useAdminOverview,
  useAdminUserAnalytics,
  useAdminContentSummary,
  useAdminChatActivity,
  useAdminPaymentAnalytics,
  useAdminSystemHealth,
  useAdminRevenueAnalytics,
  useAdminTierAnalytics,
  useAdminQuizAnalytics,
} from "@/features/admin/dashboard.hooks";

// ─── Scope ───────────────────────────────────────────────────────────────────

type ScopeOption = "ALL" | "B2C" | "B2B";

const SCOPE_OPTIONS: { value: ScopeOption; label: string; hint: string }[] = [
  { value: "ALL", label: "Tất cả", hint: "Toàn hệ thống" },
  { value: "B2C", label: "B2C · Khách lẻ", hint: "Khách hàng cá nhân, nội dung HistoryTalk" },
  { value: "B2B", label: "B2B · Trường học", hint: "Quản trị trường, giáo viên, học sinh, nội dung riêng của trường" },
];

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: "Khách hàng",
  SCHOOL_ADMIN: "Quản trị trường",
  TEACHER: "Giáo viên",
  SCHOOL_STUDENT: "Học sinh",
  CONTENT_ADMIN: "Quản trị nội dung",
  SYSTEM_ADMIN: "Quản trị hệ thống",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function fmtDate(iso: string) {
  return formatVietnamDateTime(iso, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }, iso);
}

function formatVND(amount?: number) {
  if (amount === undefined || amount === null) return "0 đ";
  return amount.toLocaleString("vi-VN") + " đ";
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Large pools (billions of tokens) do not fit a stat card, so show them as "3,55 tỷ" / "435,75 triệu". */
function formatTokenAmount(n: number): string {
  const fmt = (v: number) => v.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
  if (n >= 1_000_000_000) return `${fmt(n / 1_000_000_000)} tỷ`;
  if (n >= 1_000_000) return `${fmt(n / 1_000_000)} triệu`;
  return n.toLocaleString("vi-VN");
}

function formatUptime(uptime: string | number | undefined | null): string {
  if (uptime === undefined || uptime === null || uptime === "") return "—";
  // The health endpoint sends "1d 2h 3m 4s"; the JVM metrics send plain seconds.
  const parts = typeof uptime === "string" ? uptime.match(/(\d+)\s*([dhms])/g) : null;
  const seconds = parts
    ? parts.reduce((sum, part) => {
        const [, n, unit] = part.match(/(\d+)\s*([dhms])/)!;
        return sum + Number(n) * { d: 86400, h: 3600, m: 60, s: 1 }[unit as "d" | "h" | "m" | "s"];
      }, 0)
    : parseFloat(String(uptime));
  if (isNaN(seconds)) return String(uptime);

  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (d > 0) {
    return `${d} ngày ${h} giờ`;
  }
  if (h > 0) {
    return `${h} giờ ${m} phút`;
  }
  if (m > 0) {
    return `${m} phút ${s} giây`;
  }
  return `${s} giây`;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-sm bg-[var(--card-light-border)] ${className}`}
      style={style}
    />
  );
}

// ─── Health badge ─────────────────────────────────────────────────────────────

function HealthBadge({ status }: { status?: string }) {
  const s = (status ?? "").toUpperCase();
  if (s === "UP" || s === "HEALTHY" || s === "OK")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm bg-[var(--status-success-bg)] px-3 py-1 text-xs font-bold text-[var(--status-success)]">
        <CheckCircle2Icon className="h-3.5 w-3.5" /> Online
      </span>
    );
  if (s === "DOWN" || s === "ERROR")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm bg-[var(--status-danger-bg)] px-3 py-1 text-xs font-bold text-[var(--accent-danger)]">
        <XCircleIcon className="h-3.5 w-3.5" /> Offline
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm bg-[var(--status-warning-bg)] px-3 py-1 text-xs font-bold text-[var(--status-warning)]">
      <AlertCircleIcon className="h-3.5 w-3.5" /> {status ?? "Unknown"}
    </span>
  );
}

// ─── Stat row ─────────────────────────────────────────────────────────────────

function StatRow({
  label,
  value,
  highlight = false,
  hint,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-default)] last:border-0">
      <span className="flex items-center gap-1 text-xs text-[var(--content-muted)]" title={hint}>
        {label}
        {hint && <HelpCircleIcon className="h-3 w-3 opacity-60" aria-label={hint} />}
      </span>
      <span className={`text-xs font-bold ${highlight ? "text-[var(--accent-gold)]" : "text-[var(--content-heading)]"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  color,
  loading = false,
}: {
  title: string;
  value: string | number;
  sub?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  loading?: boolean;
}) {
  return (
    <Card
      className="relative overflow-hidden rounded-xl border shadow-none transition-colors duration-300 bg-[var(--bg-surface)] border-border-card"
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-5">
        <span className="text-[13px] font-medium text-[var(--text-secondary)]">{title}</span>
        <div className="shrink-0 rounded-lg p-2" style={{ background: `color-mix(in srgb, ${color} 10%, transparent)`, color }}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {loading ? (
          <>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-3 w-32" />
          </>
        ) : (
          <>
            <div
              className="text-2xl font-bold tabular-nums text-[var(--content-heading)] leading-[1.2] truncate"
              title={String(value)}
            >
              {value}
            </div>
            {sub && <div className="mt-1.5 text-xs text-[var(--content-muted)]">{sub}</div>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Memory progress bar ──────────────────────────────────────────────────────

function MemoryBar({ used, max }: { used: number; max: number }) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  const color = pct > 85 ? "var(--accent-danger)" : pct > 65 ? "var(--status-warning)" : "var(--status-success)";
  return (
    <div>
      <div className="flex justify-between text-[10px] font-semibold text-[var(--content-muted)] mb-1">
        <span>JVM Memory</span>
        <span style={{ color }}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-[var(--card-light-border)] overflow-hidden">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-[var(--content-muted)] mt-0.5">
        <span>{formatBytes(used)}</span>
        <span>{formatBytes(max)}</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function orderStatusMeta(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "paid") return { label: "Đã thanh toán", color: "var(--status-success)" };
  if (normalized === "pending") return { label: "Đang chờ", color: "var(--status-warning)" };
  if (normalized === "cancelled") return { label: "Đã huỷ", color: "var(--text-muted)" };
  if (normalized === "expired") return { label: "Hết hạn", color: "var(--quest-quiz)" };
  if (normalized === "failed") return { label: "Thất bại", color: "var(--accent-danger)" };
  return { label: status, color: "var(--accent-blue)" };
}

export default function AdminDashboardPage() {
  const router = useRouter();

  // Date range state
  const [from, setFrom] = React.useState(daysAgoISO(13));
  const [to, setTo] = React.useState(todayISO());
  const [granularity, setGranularity] = React.useState<"day" | "week" | "month" | "year">("day");
  // Phân khúc thống kê: BE tách B2C (khách lẻ / Global) và B2B (trường học / Local) — Sprint 10.
  const [scope, setScope] = React.useState<ScopeOption>("ALL");
  const isB2B = scope === "B2B";
  const isB2C = scope === "B2C";
  // Tab Global/Local cho card "Nhân vật Hot nhất" khi xem scope ALL.
  const [charTab, setCharTab] = React.useState<"global" | "local">("global");

  const rangeParams = { from, to, granularity, scope };
  const { data: overview, isLoading: ovLoading } = useAdminOverview({ scope });
  const { data: users, isLoading: usersLoading } = useAdminUserAnalytics(rangeParams);
  const { data: content, isLoading: contentLoading } = useAdminContentSummary({ scope });
  const { data: chat, isLoading: chatLoading } = useAdminChatActivity(rangeParams);
  const { data: payments, isLoading: paymentsLoading } = useAdminPaymentAnalytics(rangeParams);
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useAdminSystemHealth();

  // New Analytics hooks
  const { data: revenue, isLoading: revenueLoading } = useAdminRevenueAnalytics(rangeParams);
  // /tiers chỉ áp dụng cho B2C (CUSTOMER) — BE không nhận scope.
  const { data: tiers, isLoading: tiersLoading } = useAdminTierAnalytics({ from, to, granularity });
  const { data: quiz, isLoading: quizLoading } = useAdminQuizAnalytics(rangeParams);
  // GET /admin/dashboard — token B2B/B2C, JVM chi tiet, tong quan nen tang.
  const { data: comprehensive, isLoading: comprehensiveLoading } = useSystemAdminComprehensiveDashboard();
  const tokenSummary = comprehensive?.tokenSummary;
  const jvm = comprehensive?.jvmHealth;
  const platform = comprehensive?.platformOverview;

  const anyLoading =
    ovLoading ||
    usersLoading ||
    contentLoading ||
    chatLoading ||
    paymentsLoading ||
    healthLoading ||
    revenueLoading ||
    tiersLoading ||
    quizLoading;

  // Map user trend arrays for SaaSLineChart
  const datesList = (users?.trend ?? []).map((p) => p.date);
  const newUsersList = (users?.trend ?? []).map((p) => p.newUsers);
  const activeUsersList = (users?.trend ?? []).map((p) => p.activeUsers);

  // Map revenue trend arrays for SaaSLineChart
  const revDatesList = (revenue?.trend ?? []).map((p) => p.date);
  const revenueList = (revenue?.trend ?? []).map((p) => p.revenue);
  const paidOrdersList = (revenue?.trend ?? []).map((p) => p.paidOrders);

  const orderStatusRows = [
    { status: "paid", count: payments?.summary?.paidOrders ?? 0 },
    { status: "pending", count: payments?.summary?.pendingOrders ?? 0 },
    { status: "failed", count: payments?.summary?.failedOrders ?? 0 },
    { status: "cancelled", count: payments?.summary?.cancelledOrders ?? 0 },
    { status: "expired", count: payments?.summary?.expiredOrders ?? 0 },
  ];
  const totalOrders = payments?.summary?.totalOrders ?? 0;
  const orderStatusMax = Math.max(...orderStatusRows.map((row) => row.count), 1);

  // % đóng góp theo gói: revenueByTier lọc theo from..to, còn summary.totalRevenue là toàn thời gian
  // → chia cho tổng revenueByTier để tổng % = 100%.
  const revenueByTier = revenue?.revenueByTier ?? [];
  const revenueByTierTotal = revenueByTier.reduce((sum, t) => sum + (t.revenue ?? 0), 0);
  const revenueByTierOrders = revenueByTier.reduce((sum, t) => sum + (t.paidOrders ?? 0), 0);
  // % hội viên theo gói: mẫu số là tổng hội viên B2C (free + paid), không phải tổng user toàn hệ thống.
  const tierUserTotal = (tiers?.summary.currentFreeUsers ?? 0) + (tiers?.summary.currentPaidUsers ?? 0);

  // Nhân vật hot: B2C → Global, B2B → Local, ALL → theo tab.
  const showLocalCharacters = isB2B || (!isB2C && charTab === "local");
  const topCharacters =
    (showLocalCharacters ? overview?.topLocalCharacters : overview?.topGlobalCharacters) ??
    overview?.topCharacters ??
    [];

  const b2bRoleRows = [
    { label: "Quản trị trường", count: overview?.roles.schoolAdmins ?? 0, color: "var(--status-success)" },
    { label: "Giáo viên", count: overview?.roles.teachers ?? 0, color: "var(--quest-quiz)" },
    { label: "Học sinh", count: overview?.roles.schoolStudents ?? 0, color: "var(--accent-blue)" },
  ];
  const b2bRoleTotal = b2bRoleRows.reduce((sum, r) => sum + r.count, 0);

  return (
    <StaffShell
      title="Tổng quan hệ thống"
      label="Quản trị"
      description="Trung tâm điều khiển và giám sát chỉ số tài chính, nội dung và tăng trưởng HistoryTalk."
      icon={Gauge}
      accent="var(--accent-gold)"
    >
      <div className="space-y-6">

        {/* ── Scope selector: B2C / B2B ── */}
        <div className="flex flex-wrap items-center gap-3 rounded-sm border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3">
          <SchoolIcon className="h-4 w-4 text-[var(--content-muted)] shrink-0" />
          <span className="text-xs font-semibold text-[var(--content-muted)] shrink-0">Phân khúc:</span>
          <div className="flex flex-wrap items-center gap-1">
            {SCOPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                title={opt.hint}
                onClick={() => setScope(opt.value)}
                className={cn(
                  "rounded-sm px-3 py-1 text-[11px] font-bold transition-all duration-200",
                  scope === opt.value
                    ? "bg-[var(--text-primary)] text-[var(--text-inverse)]"
                    : "bg-transparent text-[var(--content-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-[var(--content-muted)]">
            {SCOPE_OPTIONS.find((o) => o.value === scope)?.hint}
          </span>
        </div>

        {/* ── Row 1: KPI cards ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            title="Doanh thu hệ thống"
            value={formatVND(revenue?.summary.totalRevenue ?? 0)}
            icon={TrendingUpIcon}
            color="var(--accent-gold)"
            loading={revenueLoading}
            sub={
              <span className="flex flex-col gap-0.5">
                <span>Hôm nay: <strong className="text-[var(--content-heading)]">{formatVND(revenue?.summary.revenueToday ?? 0)}</strong></span>
                <span>Tháng này: <strong className="text-[var(--content-heading)]">{formatVND(revenue?.summary.revenueThisMonth ?? 0)}</strong></span>
              </span>
            }
          />
          <KpiCard
            title="Tổng người dùng"
            value={(overview?.users.total ?? 0).toLocaleString()}
            icon={UsersIcon}
            color="var(--accent-blue)"
            loading={ovLoading}
            sub={
              <span className="flex items-center gap-1 mt-0.5">
                <TrendingUpIcon className="h-3 w-3 text-[var(--status-success)]" />
                <span className="text-[var(--status-success)] font-semibold">+{overview?.users.newToday ?? 0}</span> hôm nay
                <span className="text-[var(--content-muted)] ml-1">|+{overview?.users.newThisMonth ?? 0} tháng này</span>
              </span>
            }
          />
          <KpiCard
            title="Đang hoạt động"
            value={(overview?.users.active ?? 0).toLocaleString()}
            icon={UserCheckIcon}
            color="var(--status-success)"
            loading={ovLoading}
            sub={
              <span className="flex flex-col gap-0.5">
                <span>Không hoạt động: <strong>{(overview?.users.inactive ?? 0).toLocaleString()}</strong></span>
                <span>Mới hoạt động: <strong>{(users?.summary.recentlyActive ?? 0).toLocaleString()}</strong></span>
              </span>
            }
          />
          <KpiCard
            title="Đơn hàng thành công"
            value={`${(revenue?.summary.paidOrders ?? 0).toLocaleString()} đơn`}
            icon={CheckCircle2Icon}
            color="var(--quest-quiz)"
            loading={revenueLoading}
            sub={
              <span className="flex flex-col gap-0.5">
                <span>Tổng đơn: <strong>{totalOrders.toLocaleString()}</strong></span>
                {!isB2B && (
                  <span>Chuyển đổi (B2C): <strong>{(tiers?.summary.freeToPaidConversionRate ?? 0).toFixed(1)}%</strong></span>
                )}
              </span>
            }
          />
          <KpiCard
            title="Sức khỏe máy chủ"
            value={health?.status ?? "—"}
            icon={ServerIcon}
            color={
              (health?.status ?? "").toUpperCase() === "UP" || (health?.status ?? "").toUpperCase() === "HEALTHY"
                ? "var(--status-success)"
                : "var(--accent-danger)"
            }
            loading={healthLoading}
            sub={
              <span className="flex flex-col gap-0.5">
                <span>Uptime: <strong>{formatUptime(health?.uptime)}</strong></span>
                {health?.lastCheckedAt && <span className="text-[10px]">Cập nhật: {fmtDate(health.lastCheckedAt)}</span>}
              </span>
            }
          />
        </div>

        {/* ── Row 1b: Token & JVM (GET /admin/dashboard) ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            title="Quỹ token B2B"
            value={formatTokenAmount(tokenSummary?.totalTokensB2bAllocated ?? 0)}
            icon={SchoolIcon}
            color="var(--accent-blue)"
            loading={comprehensiveLoading}
            sub={
              <span className="flex flex-col gap-0.5">
                <span>
                  Đã dùng <strong>{(tokenSummary?.totalTokensB2bConsumed ?? 0).toLocaleString()}</strong> · còn{" "}
                  <strong>{(tokenSummary?.totalTokensB2bRemainingInPools ?? 0).toLocaleString()}</strong>
                </span>
                <span>
                  Trường: <strong>{(platform?.totalSchools ?? 0).toLocaleString()}</strong>
                  {platform?.activeSchools != null && <> · hoạt động <strong>{platform.activeSchools.toLocaleString()}</strong></>}
                  {!!platform?.expiredSchools && <> · hết hạn <strong>{platform.expiredSchools.toLocaleString()}</strong></>}
                </span>
              </span>
            }
          />
          <KpiCard
            title="Token B2C đã dùng"
            value={(tokenSummary?.totalTokensB2cConsumed ?? 0).toLocaleString()}
            icon={CoinsIcon}
            color="var(--accent-gold)"
            loading={comprehensiveLoading}
          />
          <KpiCard
            title="Token toàn hệ thống"
            value={(tokenSummary?.totalTokensSystemConsumed ?? 0).toLocaleString()}
            icon={FlameIcon}
            color="var(--accent-danger)"
            loading={comprehensiveLoading}
            sub={<span>Quiz: <strong>{(platform?.totalQuizzes ?? 0).toLocaleString()}</strong></span>}
          />
          <KpiCard
            title="CPU JVM"
            value={`${(jvm?.cpuUsagePercentage ?? 0).toFixed(1)}%`}
            icon={CpuIcon}
            color="var(--quest-quiz)"
            loading={comprehensiveLoading}
            sub={<span>Threads: <strong>{jvm?.activeThreadCount ?? 0}</strong> · Uptime: <strong>{formatUptime(jvm?.uptimeSeconds)}</strong></span>}
          />
          <KpiCard
            title="Bộ nhớ JVM"
            value={`${(jvm?.memoryUsagePercentage ?? 0).toFixed(1)}%`}
            icon={ServerIcon}
            color="var(--status-success)"
            loading={comprehensiveLoading}
            sub={<span>{jvm?.usedMemoryMb ?? 0} / {jvm?.maxMemoryMb ?? 0} MB (trống {jvm?.freeMemoryMb ?? 0} MB)</span>}
          />
        </div>

        {/* ── Row 2: Date range selector ── */}
        <div className="flex flex-wrap items-center gap-3 rounded-sm border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3">
          <CalendarIcon className="h-4 w-4 text-[var(--content-muted)] shrink-0" />
          <span className="text-xs font-semibold text-[var(--content-muted)] shrink-0">Khoảng thời gian:</span>
          <div className="flex items-center gap-2">
            <DateInput
              value={from}
              max={to}
              onValueChange={(v) => v && setFrom(v)}
              wrapperClassName="w-[8.5rem]"
              className="w-full rounded-sm border border-[var(--card-light-border)] bg-transparent px-2 py-1 text-xs text-[var(--content-heading)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]"
            />
            <span className="text-xs text-[var(--content-muted)]">→</span>
            <DateInput
              value={to}
              min={from}
              max={todayISO()}
              onValueChange={(v) => v && setTo(v)}
              wrapperClassName="w-[8.5rem]"
              className="w-full rounded-sm border border-[var(--card-light-border)] bg-transparent px-2 py-1 text-xs text-[var(--content-heading)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]"
            />
          </div>
          <div className="flex items-center gap-1 ml-2">
            {(["day", "week", "month", "year"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={cn(
                  "rounded-sm px-3 py-1 text-[11px] font-bold transition-all duration-200",
                  granularity === g
                    ? "bg-[var(--text-primary)] text-[var(--text-inverse)]"
                    : "bg-transparent text-[var(--content-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                {g === "day" ? "Ngày" : g === "week" ? "Tuần" : g === "month" ? "Tháng" : "Năm"}
              </button>
            ))}
          </div>
          {anyLoading && (
            <div className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent-gold)] border-t-transparent" />
          )}
        </div>

        {/* ── Row 3: Trend charts ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* User trend */}
          <Card className="rounded-xl bg-[var(--bg-surface)] border-border-card shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3Icon className="h-4 w-4 text-accent-blue" />
                <CardTitle className="text-base font-semibold text-[var(--content-heading)]">
                  Xu hướng người dùng
                </CardTitle>
              </div>
              <CardDescription className="text-xs">Người dùng mới & đang hoạt động theo {granularity === "day" ? "ngày" : granularity === "week" ? "tuần" : granularity === "month" ? "tháng" : "năm"}</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 px-5 pb-4 border-t border-[var(--border-default)]">
              {usersLoading ? (
                <div className="flex items-end gap-1.5 h-[180px]">
                  {[60, 80, 50, 90, 70, 45, 85, 65, 75, 55].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full flex items-end" style={{ height: "130px" }}>
                        <Skeleton className="w-full rounded-t-[2px]" style={{ height: `${h}%` }} />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : datesList.length > 0 ? (
                <SaaSLineChart
                  dates={datesList}
                  series={[
                    {
                      label: "Người dùng mới",
                      data: newUsersList,
                      color: "var(--accent-blue)",
                      gradientId: "gradUserNew",
                      valueFormatter: (v) => `${v.toLocaleString()} người`,
                    },
                    {
                      label: "Đang hoạt động",
                      data: activeUsersList,
                      color: "var(--status-success)",
                      gradientId: "gradUserActive",
                      valueFormatter: (v) => `${v.toLocaleString()} người`,
                    },
                  ]}
                />
              ) : (
                <div className="flex h-[150px] items-center justify-center text-xs text-[var(--content-muted)]">
                  Không có dữ liệu trong khoảng thời gian này
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue trend */}
          <Card className="rounded-xl bg-[var(--bg-surface)] border-border-card shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="h-4 w-4 text-[var(--status-warning)]" />
                <CardTitle className="text-base font-semibold text-[var(--content-heading)]">
                  Xu hướng Doanh thu & Đơn hàng
                </CardTitle>
              </div>
              <CardDescription className="text-xs">Doanh thu và lượng đơn thanh toán thành công theo {granularity === "day" ? "ngày" : granularity === "week" ? "tuần" : granularity === "month" ? "tháng" : "năm"}</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 px-5 pb-4 border-t border-[var(--border-default)]">
              {revenueLoading ? (
                <div className="flex items-end gap-1.5 h-[180px]">
                  {[40, 75, 55, 85, 65, 90, 50, 70, 80, 60].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full flex items-end" style={{ height: "130px" }}>
                        <Skeleton className="w-full rounded-t-[2px]" style={{ height: `${h}%` }} />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : revDatesList.length > 0 ? (
                <SaaSLineChart
                  dates={revDatesList}
                  series={[
                    {
                      label: "Doanh thu (VND)",
                      data: revenueList,
                      color: "var(--accent-gold)",
                      gradientId: "gradRevenue",
                      valueFormatter: (v) => formatVND(v),
                    },
                    {
                      label: "Đơn hàng thành công",
                      data: paidOrdersList,
                      color: "var(--quest-quiz)",
                      gradientId: "gradOrders",
                      valueFormatter: (v) => `${v.toLocaleString()} đơn`,
                    },
                  ]}
                />
              ) : (
                <div className="flex h-[150px] items-center justify-center text-xs text-[var(--content-muted)]">
                  Không có dữ liệu trong khoảng thời gian này
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 4: Advanced Subscriptions & Revenue Analytics ── */}
        <div className={cn("grid grid-cols-1 gap-6", isB2B ? "lg:grid-cols-2" : "lg:grid-cols-3")}>

          {/* B2B: phân bổ người dùng trường học (thay cho 2 card gói dịch vụ chỉ áp dụng B2C) */}
          {isB2B && (
            <Card className="rounded-xl bg-[var(--bg-surface)] border-border-card shadow-none">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <SchoolIcon className="h-4 w-4 text-accent-blue" />
                  <CardTitle className="text-base font-semibold text-[var(--content-heading)]">
                    Người dùng trường học
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">Phân bổ tài khoản B2B theo vai trò</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 border-t border-[var(--border-default)] pt-4">
                {ovLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                ) : (
                  <>
                    {b2bRoleRows.map((r) => {
                      const pct = b2bRoleTotal > 0 ? Math.round((r.count / b2bRoleTotal) * 100) : 0;
                      return (
                        <div key={r.label}>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-[var(--content-muted)]">{r.label}</span>
                            <span className="text-[var(--content-heading)]">
                              {r.count.toLocaleString()}{" "}
                              <span className="text-[var(--content-muted)] font-normal text-[10px]">({pct}%)</span>
                            </span>
                          </div>
                          <div className="h-2 bg-[var(--card-light-border)] overflow-hidden">
                            <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: r.color }} />
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-2 border-t border-[var(--border-default)]">
                      <StatRow label="Tổng tài khoản B2B" value={b2bRoleTotal} highlight />
                      <StatRow label="Doanh thu nạp token" value={formatVND(revenue?.summary.totalRevenue ?? 0)} />
                      <StatRow label="Giá trị đơn trung bình" value={formatVND(revenue?.summary.averageOrderValue ?? 0)} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Revenue by Tier Progress — chỉ B2C (scope=B2B trả revenueByTier rỗng) */}
          {!isB2B && (
          <Card className="rounded-xl bg-[var(--bg-surface)] border-border-card shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CrownIcon className="h-4 w-4 text-[var(--status-warning)]" />
                <CardTitle className="text-base font-semibold text-[var(--content-heading)]">
                  Doanh thu theo Gói dịch vụ
                </CardTitle>
              </div>
              <CardDescription className="text-xs">Tỷ trọng tính trong khoảng thời gian đang lọc</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 border-t border-[var(--border-default)] pt-4">
              {revenueLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              ) : (
                <>
                  <div className="space-y-3.5">
                    {revenueByTier.length === 0 && (
                      <div className="text-xs text-[var(--content-muted)]">Không có doanh thu gói trong khoảng thời gian này</div>
                    )}
                    {revenueByTier.map((t) => {
                      const pct = revenueByTierTotal > 0 ? Math.round((t.revenue / revenueByTierTotal) * 100) : 0;
                      return (
                        <div key={t.tierId}>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-[var(--content-muted)]">{t.tierTitle}</span>
                            <span className="text-[var(--content-heading)]">
                              {formatVND(t.revenue)}{" "}
                              <span className="text-[var(--content-muted)] font-normal text-[10px]">
                                ({pct}%)
                              </span>
                            </span>
                          </div>
                          <div className="h-2 bg-[var(--card-light-border)] overflow-hidden">
                            <div
                              className="h-full transition-all duration-700"
                              style={{
                                width: `${pct}%`,
                                background: t.tierTitle.toLowerCase().includes("pro")
                                  ? "var(--accent-gold)"
                                  : t.tierTitle.toLowerCase().includes("plus")
                                    ? "var(--quest-quiz)"
                                    : "var(--accent-blue)",
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-[var(--content-muted)] mt-0.5">
                            <span>Đơn hàng: {t.paidOrders} đơn</span>
                            <span>Giá trị trung bình: {t.paidOrders > 0 ? formatVND(Math.round(t.revenue / t.paidOrders)) : "0 đ"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-2 border-t border-[var(--border-default)]">
                    <StatRow label="Doanh thu trong kỳ" value={formatVND(revenueByTierTotal)} />
                    <StatRow
                      label="Giá trị đơn trung bình (kỳ)"
                      value={revenueByTierOrders > 0 ? formatVND(Math.round(revenueByTierTotal / revenueByTierOrders)) : "0 đ"}
                    />
                    <StatRow
                      label="Giá trị đơn trung bình (toàn thời gian)"
                      value={formatVND(revenue?.summary.averageOrderValue ?? 0)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          )}

          {/* Tier Subscriptions usage — chỉ B2C (CUSTOMER) */}
          {!isB2B && (
          <Card className="rounded-xl bg-[var(--bg-surface)] border-border-card shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-accent-blue" />
                <CardTitle className="text-base font-semibold text-[var(--content-heading)]">
                  Phân tích Hội viên
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 border-t border-[var(--border-default)] pt-4">
              {tiersLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
              ) : (
                <>
                  <div className="space-y-3">
                    {(tiers?.usersByTier ?? []).map((t) => {
                      const pct = tierUserTotal > 0 ? Math.round(((t.users ?? 0) / tierUserTotal) * 100) : 0;
                      return (
                        <div key={t.tierId}>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-[var(--content-muted)]">{t.tierTitle}</span>
                            <span className="text-[var(--content-heading)]">
                              {(t.users ?? 0).toLocaleString()}{" "}
                              <span className="text-[var(--content-muted)] font-normal text-[10px]">
                                ({pct}%)
                              </span>
                            </span>
                          </div>
                          <div className="h-2 bg-[var(--card-light-border)] overflow-hidden">
                            <div
                              className="h-full transition-all duration-700"
                              style={{
                                width: `${pct}%`,
                                background: t.tierTitle.toLowerCase().includes("pro")
                                  ? "var(--accent-gold)"
                                  : t.tierTitle.toLowerCase().includes("plus")
                                    ? "var(--quest-quiz)"
                                    : "var(--accent-blue)",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-2 border-t border-[var(--border-default)]">
                    <StatRow label="Gói hoạt động" value={tiers?.summary.activeTiers ?? 0} />
                    <StatRow label="Hội viên trả phí" value={tiers?.summary.currentPaidUsers ?? 0} />
                    <StatRow label="Hội viên miễn phí" value={tiers?.summary.currentFreeUsers ?? 0} />
                    <StatRow label="Đăng ký còn hạn" value={tiers?.summary.activeSubscriptions ?? 0} />
                    <StatRow label="Sắp hết hạn (3 ngày)" value={tiers?.summary.expiringSoonSubscriptions ?? 0} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          )}

          {/* Orders status & Details */}
          <Card className="rounded-xl bg-[var(--bg-surface)] border-border-card shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCardIcon className="h-4 w-4 text-[var(--quest-quiz)]" />
                <CardTitle className="text-base font-semibold text-[var(--content-heading)]">
                  Trạng thái đơn hàng
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="border-t border-[var(--border-default)] pt-4 space-y-4">
              {paymentsLoading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
              ) : (
                orderStatusRows.map((row) => {
                  const meta = orderStatusMeta(row.status);
                  const pct = totalOrders > 0 ? Math.round((row.count / totalOrders) * 100) : 0;
                  const widthPct = orderStatusMax > 0 ? Math.round((row.count / orderStatusMax) * 100) : 0;
                  return (
                    <div key={row.status}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-[var(--content-muted)]">{meta.label}</span>
                        <span className="text-[var(--content-heading)]">{row.count.toLocaleString()} <span className="text-[var(--content-muted)] font-normal text-[10px]">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-[var(--card-light-border)] overflow-hidden">
                        <div
                          className="h-full transition-all duration-700"
                          style={{ width: `${widthPct}%`, background: meta.color }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
              <div className="pt-2 border-t border-[var(--border-default)]">
                <StatRow label="Tổng đơn hàng" value={totalOrders} highlight />
                <StatRow label="Giao dịch thành công" value={payments?.summary?.successfulTransactions ?? 0} />
                <StatRow label="Giao dịch thất bại" value={payments?.summary?.failedTransactions ?? 0} />
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ── Row 5: Nhân vật hot + Quiz analytics (stacked) & Content summary ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Top nhân vật hot */}
            <Card className="rounded-xl bg-[var(--bg-surface)] border-border-card shadow-none">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FlameIcon className="h-4 w-4 text-[var(--accent-gold)]" />
                    <CardTitle className="text-base font-semibold text-[var(--content-heading)]">
                      Nhân vật Hot nhất
                    </CardTitle>
                  </div>
                  {scope === "ALL" ? (
                    <div className="flex items-center gap-1">
                      {(["global", "local"] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setCharTab(tab)}
                          className={cn(
                            "rounded-sm px-2.5 py-0.5 text-[11px] font-bold transition-all duration-200",
                            charTab === tab
                              ? "bg-[var(--text-primary)] text-[var(--text-inverse)]"
                              : "bg-transparent text-[var(--content-muted)] hover:text-[var(--text-primary)]"
                          )}
                        >
                          {tab === "global" ? "HistoryTalk" : "Trường học"}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="rounded-sm border border-[var(--card-light-border)] px-2 py-0.5 text-[10px] font-bold text-[var(--content-muted)]">
                      {isB2B ? "Trường học" : "HistoryTalk"}
                    </span>
                  )}
                </div>
                <CardDescription className="text-xs">
                  {showLocalCharacters
                    ? "Nhân vật do các trường tạo được trò chuyện nhiều nhất"
                    : "Nhân vật HistoryTalk được trò chuyện nhiều nhất"}
                </CardDescription>
              </CardHeader>
              <CardContent className="border-t border-[var(--border-default)] pt-4">
                {ovLoading ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-sm" />
                    ))}
                  </div>
                ) : topCharacters.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {topCharacters.map((c, idx) => {
                      const rank = idx + 1;
                      const rankColor =
                        rank === 1 ? "var(--accent-gold)" : rank === 2 ? "var(--text-tertiary)" : rank === 3 ? "var(--accent-bronze)" : "var(--content-muted)";
                      const total = c.totalMessages || 1;
                      const userPct = Math.round((c.userMessages / total) * 100);
                      return (
                        <div
                          key={c.characterId}
                          className="relative flex items-center gap-3 rounded-sm border p-3 transition-all duration-300"
                          style={{ borderColor: "var(--card-light-border)" }}
                        >
                          <span
                            className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-sm text-[11px] font-extrabold text-white"
                            style={{ background: rankColor }}
                          >
                            {rank}
                          </span>
                          <div
                            className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border"
                            style={{ borderColor: "var(--card-light-border)", background: "var(--card-light-border)" }}
                          >
                            {isValidUrl(c.imageUrl) ? (
                              <Image src={c.imageUrl!} alt={c.name} fill className="object-cover" sizes="48px" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm font-bold" style={{ color: "var(--content-subtle)" }}>
                                {c.name?.charAt(0) ?? "?"}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-bold text-[var(--content-heading)]" title={c.name}>
                              {c.name}
                            </div>
                            {c.title && (
                              <div className="truncate text-[10px] text-[var(--content-muted)]" title={c.title}>
                                {c.title}
                              </div>
                            )}
                            <div className="mt-1 flex items-center gap-1.5">
                              <MessageSquareIcon className="h-3 w-3 text-[var(--accent-gold)]" />
                              <span className="text-xs font-extrabold text-[var(--content-heading)]">
                                {c.totalMessages.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-[var(--content-muted)]">tin nhắn</span>
                            </div>
                            <div className="mt-1 h-1 bg-[var(--card-light-border)] overflow-hidden">
                              <div
                                className="h-full bg-accent-blue"
                                style={{ width: `${userPct}%` }}
                                title={`Người dùng: ${c.userMessages} | AI: ${c.aiMessages}`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-[80px] items-center justify-center text-xs text-[var(--content-muted)]">
                    Chưa có dữ liệu trò chuyện
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quiz Performance Analytics */}
            <Card className="rounded-xl bg-[var(--bg-surface)] border-border-card shadow-none">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrophyIcon className="h-4 w-4 text-[var(--status-warning)]" />
                  <CardTitle className="text-base font-semibold text-[var(--content-heading)]">
                    Quiz Đang Hot
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">Đánh giá kết quả học tập và các câu hỏi học viên thường xuyên trả lời sai</CardDescription>
              </CardHeader>
              <CardContent className="border-t border-[var(--border-default)] pt-4 space-y-4">
                {quizLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Stats & Top Quizzes */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-sm border border-[var(--card-light-border)] bg-[var(--bg-elevated)]">
                          <span className="text-xs font-medium text-[var(--content-muted)]">Tổng số Quiz</span>
                          <div className="text-lg font-bold text-[var(--content-heading)] mt-0.5">{(quiz?.summary.totalQuizzes ?? 0).toLocaleString()}</div>
                          <div className="text-[10px] text-[var(--content-muted)] mt-0.5">Đã xuất bản: {quiz?.summary.publishedQuizzes ?? 0}</div>
                        </div>
                        <div className="p-3 rounded-sm border border-[var(--card-light-border)] bg-[var(--bg-elevated)]">
                          <span className="text-xs font-medium text-[var(--content-muted)]">Tỷ lệ hoàn thành</span>
                          <div className="text-lg font-bold text-[var(--status-success)] mt-0.5">{(quiz?.summary.completionRate ?? 0).toFixed(1)}%</div>
                          <div className="text-[10px] text-[var(--content-muted)] mt-0.5">Lượt làm bài: {quiz?.summary.completedSessions ?? 0}</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-[var(--content-heading)] mb-2">Bộ đề được làm nhiều nhất</h4>
                        <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                          {(quiz?.topQuizzes ?? []).slice(0, 3).map((q) => (
                            <div key={q.quizId} className="p-2 rounded-sm border border-[var(--card-light-border)] flex items-center justify-between text-xs hover:bg-[var(--card-light-hover)] transition-all">
                              <div className="truncate max-w-[70%]">
                                <div className="font-bold text-[var(--content-heading)] truncate" title={q.title}>{q.title}</div>
                              </div>
                              <div className="text-right text-[10px]">
                                <div>Lượt làm: <strong className="text-[var(--content-heading)]">{q.startedSessions}</strong></div>
                                <div>Đạt trung bình: <strong className="text-[var(--status-warning)]">{q.averageScorePercentage.toFixed(1)}%</strong></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Top Wrong Questions */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <HelpCircleIcon className="h-4 w-4 text-[var(--accent-danger)]" />
                        <h4 className="text-sm font-semibold text-[var(--content-heading)]">Câu hỏi hay sai nhất</h4>
                      </div>
                      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                        {(quiz?.topWrongQuestions ?? []).slice(0, 3).map((q) => (
                          <div key={q.questionId} className="p-2.5 rounded-sm border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-xs flex flex-col gap-1">
                            <div className="font-medium text-[var(--content-heading)] line-clamp-2">
                              {q.questionContent || q.questionId}
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-[var(--content-muted)] mt-1 border-t border-[var(--border-default)] pt-1">
                              <span>Quiz: <strong className="text-[var(--content-heading)] truncate max-w-[120px] inline-block align-bottom">{q.quizTitle}</strong></span>
                              <span className="text-[var(--accent-danger)] font-bold">Tỷ lệ sai: {q.wrongRate.toFixed(1)}% ({q.wrongAnswers}/{q.totalAnswers})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Content summary */}
          <Card className="rounded-xl bg-[var(--bg-surface)] border-border-card shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpenIcon className="h-4 w-4 text-accent-blue" />
                <CardTitle className="text-base font-semibold text-[var(--content-heading)]">
                  Kho nội dung
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="border-t border-[var(--border-default)] pt-4 space-y-3">
              {contentLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-sm" />)
              ) : (
                <>
                  {/* Historical Contexts */}
                  <div className="rounded-sm p-3 border border-accent-gold/30 bg-[var(--accent-gold-active-bg)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-semibold text-[var(--accent-gold)]">
                        Bối cảnh lịch sử {isB2B ? "(Trường học)" : "(HistoryTalk)"}
                      </span>
                      <span className="text-lg font-bold tabular-nums text-[var(--content-heading)]">{(content?.historicalContexts.total ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-3 text-[11px] text-[var(--content-muted)]">
                      <span>Xuất bản: <strong className="text-[var(--content-heading)]">{content?.historicalContexts.published ?? 0}</strong></span>
                      <span>Hoạt động: <strong className="text-[var(--content-heading)]">{content?.historicalContexts.active ?? 0}</strong></span>
                    </div>
                  </div>

                  {/* Characters */}
                  <div className="rounded-sm p-3 border border-[var(--quest-quiz)]/20 bg-[var(--quest-quiz-bg)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-semibold text-[var(--quest-quiz)]">
                        Nhân vật {isB2B ? "(Trường học)" : "(HistoryTalk)"}
                      </span>
                      <span className="text-lg font-bold tabular-nums text-[var(--content-heading)]">{(content?.characters.total ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-3 text-[11px] text-[var(--content-muted)]">
                      <span>Xuất bản: <strong className="text-[var(--content-heading)]">{content?.characters.published ?? 0}</strong></span>
                      <span>Hoạt động: <strong className="text-[var(--content-heading)]">{content?.characters.active ?? 0}</strong></span>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="rounded-sm p-3 border border-accent-blue/20 bg-accent-blue/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-semibold text-accent-blue">Tài liệu</span>
                      <span className="text-lg font-bold tabular-nums text-[var(--content-heading)]">{(content?.documents.total ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-[var(--content-muted)]">
                      Hoạt động: <strong className="text-[var(--content-heading)]">{content?.documents.active ?? 0}</strong>
                    </div>
                  </div>

                  {/* Local content (B2B) — chỉ hiển thị riêng khi xem toàn hệ thống */}
                  {scope === "ALL" && (content?.localHistoricalContexts || content?.localCharacters) && (
                    <div className="rounded-sm p-3 border border-[var(--card-light-border)]">
                      <div className="flex items-center gap-1.5 mb-2">
                        <SchoolIcon className="h-3.5 w-3.5 text-[var(--content-muted)]" />
                        <span className="text-[13px] font-semibold text-[var(--content-heading)]">Nội dung Trường học</span>
                      </div>
                      {[
                        { label: "Bối cảnh lịch sử", data: content?.localHistoricalContexts },
                        { label: "Nhân vật", data: content?.localCharacters },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between py-1 text-[11px] text-[var(--content-muted)]">
                          <span>{row.label}</span>
                          <span>
                            <strong className="text-[var(--content-heading)]">{(row.data?.total ?? 0).toLocaleString()}</strong>
                            {" · "}xuất bản <strong className="text-[var(--content-heading)]">{row.data?.published ?? 0}</strong>
                            {" · "}hoạt động <strong className="text-[var(--content-heading)]">{row.data?.active ?? 0}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 6: Detailed User Analytics, Chat statistics & Quick links ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Detailed User analytics */}
          <Card className="rounded-xl bg-[var(--bg-surface)] border-border-card shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-[var(--status-success)]" />
                <CardTitle className="text-base font-semibold text-[var(--content-heading)]">
                  Chi tiết người dùng
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 border-t border-[var(--border-default)] pt-4">
              {usersLoading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)
              ) : (
                <>
                  <StatRow label="Tổng người dùng" value={users?.summary.total ?? 0} highlight />
                  <StatRow label="Đang hoạt động" value={users?.summary.active ?? 0} />
                  <StatRow label="Không hoạt động" value={users?.summary.inactive ?? 0} />
                  <StatRow label="Đã xoá" value={users?.summary.deleted ?? 0} />
                  <StatRow label="Hoạt động gần đây" value={users?.summary.recentlyActive ?? 0} />
                  {/* Role distribution bars */}
                  <div className="pt-3 space-y-2">
                    {(users?.byRole ?? []).map((r) => {
                      const total = (users?.summary.total ?? 1);
                      const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
                      return (
                        <div key={r.role}>
                          <div className="flex justify-between text-[10px] font-semibold mb-0.5">
                            <span className="text-[var(--content-muted)]">{ROLE_LABELS[r.role] ?? r.role}</span>
                            <span className="text-[var(--content-heading)]">{r.count.toLocaleString()} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-[var(--card-light-border)] overflow-hidden">
                            <div
                              className="h-full transition-all duration-700"
                              style={{
                                width: `${pct}%`,
                                background: r.role.toLowerCase().includes("system")
                                  ? "var(--status-success)"
                                  : r.role.toLowerCase().includes("content")
                                    ? "var(--quest-quiz)"
                                    : "var(--accent-blue)",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Chat activity details */}
          <Card className="rounded-xl bg-[var(--bg-surface)] border-border-card shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessagesSquareIcon className="h-4 w-4 text-[var(--quest-quiz)]" />
                <CardTitle className="text-base font-semibold text-[var(--content-heading)]">
                  Thống kê Hội thoại Chat
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 border-t border-[var(--border-default)] pt-4">
              {chatLoading ? (
                Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)
              ) : (
                <>
                  <StatRow label="Tổng phiên chat" value={chat?.summary.sessions ?? 0} highlight />
                  <StatRow
                    label="Phiên đang hoạt động"
                    value={chat?.summary.activeSessions ?? 0}
                    hint="Phiên có tin nhắn trong 2 phút gần nhất"
                  />
                  <StatRow label="Tổng tin nhắn" value={chat?.summary.messages ?? 0} />
                  <StatRow label="Tin nhắn người dùng" value={chat?.summary.userMessages ?? 0} />
                  <StatRow label="Tin nhắn AI" value={chat?.summary.aiMessages ?? 0} />
                  <StatRow label="Phiên mới hôm nay" value={chat?.summary.sessionsToday ?? 0} />
                  <StatRow label="Tin nhắn mới hôm nay" value={chat?.summary.messagesToday ?? 0} />
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick nav redirects */}
          <Card className="rounded-xl bg-[var(--bg-surface)] border-border-card shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ActivityIcon className="h-4 w-4 text-[var(--accent-gold)]" />
                <CardTitle className="text-base font-semibold text-[var(--content-heading)]">
                  Lối tắt quản lý
                </CardTitle>
              </div>
              <CardDescription className="text-xs">Chuyển hướng nhanh tới các phân hệ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 border-t border-[var(--card-light-border)] pt-4">
              <Button
                variant="outline"
                className="w-full justify-between h-10 rounded-sm px-4 hover:bg-[var(--card-light-hover)] border-[var(--card-light-border)] bg-transparent cursor-pointer"
                onClick={() => router.push("/staff/admin/accounts/customer")}
              >
                <span className="flex items-center gap-2 font-medium text-[var(--content-heading)]">
                  <UserCheckIcon className="h-4 w-4 text-accent-blue" />
                  Customer
                </span>
                <ArrowRightIcon className="h-4 w-4 opacity-50" />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between h-10 rounded-sm px-4 hover:bg-[var(--card-light-hover)] border-[var(--card-light-border)] bg-transparent cursor-pointer"
                onClick={() => router.push("/staff/admin/accounts/system-admin")}
              >
                <span className="flex items-center gap-2 font-medium text-[var(--content-heading)]">
                  <ShieldCheckIcon className="h-4 w-4 text-[var(--status-success)]" />
                  System Admin
                </span>
                <ArrowRightIcon className="h-4 w-4 opacity-50" />
              </Button>
            </CardContent>
          </Card>

        </div>

      </div>
    </StaffShell>
  );
}
