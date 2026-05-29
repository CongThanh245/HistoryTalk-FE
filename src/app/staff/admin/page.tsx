// src/app/staff/admin/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
  FileTextIcon,
  CreditCardIcon,
  AwardIcon,
  CrownIcon,
  PercentIcon,
  TrophyIcon,
  HelpCircleIcon,
} from "lucide-react";
import { GaugeIcon } from "@phosphor-icons/react";

import { StaffShell } from "@/components/staff/staff-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
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

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded bg-[var(--card-light-border)] ${className}`}
      style={style}
    />
  );
}

// ─── Health badge ─────────────────────────────────────────────────────────────

function HealthBadge({ status }: { status?: string }) {
  const s = (status ?? "").toUpperCase();
  if (s === "UP" || s === "HEALTHY" || s === "OK")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-500">
        <CheckCircle2Icon className="h-3.5 w-3.5" /> Online
      </span>
    );
  if (s === "DOWN" || s === "ERROR")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-500">
        <XCircleIcon className="h-3.5 w-3.5" /> Offline
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-500">
      <AlertCircleIcon className="h-3.5 w-3.5" /> {status ?? "Unknown"}
    </span>
  );
}

// ─── Premium SaaS Area/Line Chart ─────────────────────────────────────────────

interface ChartSeries {
  label: string;
  data: number[];
  color: string;
  gradientId: string;
  valueFormatter: (v: number) => string;
  maxVal?: number;
}

interface SaaSLineChartProps {
  dates: string[];
  series: ChartSeries[];
}

function SaaSLineChart({ dates, series }: SaaSLineChartProps) {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const N = dates.length;
  if (N === 0) {
    return (
      <div className="flex h-[150px] items-center justify-center text-xs text-[var(--content-muted)]">
        Không có dữ liệu trong khoảng thời gian này
      </div>
    );
  }

  const svgWidth = 600;
  const svgHeight = 150;
  const topPadding = 15;
  const bottomPadding = 10;
  const chartHeight = svgHeight - topPadding - bottomPadding;

  // Calculate coordinates for each series
  const seriesPaths = series.map((s) => {
    const sMax = s.maxVal ?? Math.max(...s.data, 1);
    
    // Map data to {x, y} coordinates in SVG space
    const points = s.data.map((val, idx) => {
      const x = N > 1 ? (idx / (N - 1)) * svgWidth : svgWidth / 2;
      const y = svgHeight - bottomPadding - (val / sMax) * chartHeight;
      return { x, y };
    });

    // Build Line Path: "M x0 y0 L x1 y1 ..."
    const linePath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

    // Build Area Path: start at bottom-left, draw line, close at bottom-right
    let areaPath = "";
    if (points.length > 0) {
      const firstX = points[0].x;
      const lastX = points[points.length - 1].x;
      const bottomY = svgHeight - bottomPadding;
      areaPath = `M ${firstX.toFixed(1)} ${bottomY.toFixed(1)} ` + points.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + ` L ${lastX.toFixed(1)} ${bottomY.toFixed(1)} Z`;
    }

    return {
      label: s.label,
      color: s.color,
      gradientId: s.gradientId,
      points,
      linePath,
      areaPath,
      valueFormatter: s.valueFormatter,
      data: s.data,
    };
  });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const idx = Math.min(Math.max(Math.round(pct * (N - 1)), 0), N - 1);
    setHoveredIdx(idx);
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };
  
  // Format dates to short DD/MM form for X-axis labels
  const formatShortDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length >= 3) {
        return `${parts[2]}/${parts[1]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Generate X-axis tick indices (show up to 5-6 dates to avoid overlaps)
  const tickStep = Math.max(Math.floor(N / 5), 1);
  const tickIndices: number[] = [];
  for (let i = 0; i < N; i += tickStep) {
    tickIndices.push(i);
  }
  if (tickIndices[tickIndices.length - 1] !== N - 1 && N - 1 >= 0) {
    tickIndices.push(N - 1);
  }

  return (
    <div className="w-full relative" ref={containerRef}>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 select-none">
        {series.map((s, idx) => (
          <span key={idx} className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--content-muted)]">
            <span className="inline-block h-2.5 w-2.5 rounded-full border border-white/10 shadow-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      {/* SVG Plot */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width="100%"
          height="160"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="overflow-visible cursor-crosshair select-none"
        >
          {/* Gradients */}
          <defs>
            {series.map((s, idx) => (
              <linearGradient key={idx} id={s.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Dotted Grid lines */}
          {[0.25, 0.5, 0.75].map((ratio) => {
            const y = topPadding + ratio * chartHeight;
            return (
              <line
                key={ratio}
                x1="0"
                y1={y}
                x2={svgWidth}
                y2={y}
                stroke="var(--card-light-border)"
                strokeDasharray="4 4"
                strokeWidth="0.8"
                opacity="0.2"
              />
            );
          })}

          {/* Shaded Areas and Stroke Lines */}
          {seriesPaths.map((sp, idx) => (
            <g key={idx}>
              {sp.areaPath && (
                <path
                  d={sp.areaPath}
                  fill={`url(#${sp.gradientId})`}
                  className="transition-all duration-300"
                />
              )}
              {sp.linePath && (
                <path
                  d={sp.linePath}
                  fill="none"
                  stroke={sp.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.06)]"
                />
              )}
            </g>
          ))}

          {/* Interactive Guide line and glows */}
          {hoveredIdx !== null && (
            <g>
              <line
                x1={(hoveredIdx / (N - 1)) * svgWidth}
                y1={topPadding}
                x2={(hoveredIdx / (N - 1)) * svgWidth}
                y2={svgHeight - bottomPadding}
                stroke="var(--accent-gold)"
                strokeDasharray="3 3"
                strokeWidth="1.2"
                opacity="0.7"
              />
              {seriesPaths.map((sp, idx) => {
                const pt = sp.points[hoveredIdx];
                if (!pt) return null;
                return (
                  <g key={idx}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="6.5"
                      fill={sp.color}
                      opacity="0.3"
                      className="animate-ping"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill={sp.color}
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}
            </g>
          )}
        </svg>

        {/* X-Axis Labels: HTML overlay to prevent overlaps and fit perfectly inside card bounds */}
        <div className="relative w-full h-5 mt-2 border-t border-dashed border-[var(--card-light-border)] pt-1.5 select-none">
          {tickIndices.map((idx) => {
            const dateStr = dates[idx];
            const pct = N > 1 ? (idx / (N - 1)) * 100 : 50;
            return (
              <span
                key={idx}
                className="absolute text-[9px] font-bold text-[var(--content-muted)]"
                style={{
                  left: `${pct}%`,
                  transform: `translateX(-${pct}%)`,
                  whiteSpace: "nowrap",
                }}
              >
                {formatShortDate(dateStr)}
              </span>
            );
          })}
        </div>

        {/* Premium Floating SaaS Tooltip (Adjusts position to avoid card clipping) */}
        {hoveredIdx !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 z-30 transition-all duration-150 pointer-events-none"
            style={{
              left: `${(hoveredIdx / (N - 1)) * 100}%`,
              transform: `translate(${(hoveredIdx / (N - 1)) > 0.7 ? "-105%" : "12px"}, -50%)`,
            }}
          >
            <div className="bg-[var(--bg-surface,#1a2436)] border border-[var(--card-light-border)] rounded-xl py-2 px-3.5 shadow-2xl text-[10px] min-w-[155px]">
              <div className="font-bold border-b border-dashed border-[var(--card-light-border)] pb-1 mb-1.5 text-[var(--content-heading)]">
                {dates[hoveredIdx]}
              </div>
              <div className="space-y-1.5">
                {seriesPaths.map((sp, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-[var(--content-muted)]">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: sp.color }} />
                      {sp.label}:
                    </span>
                    <strong className="text-[var(--content-heading)]">
                      {sp.valueFormatter(sp.data[hoveredIdx])}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stat row ─────────────────────────────────────────────────────────────────

function StatRow({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[var(--card-light-border)] last:border-0">
      <span className="text-xs text-[var(--content-muted)]">{label}</span>
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
      className="relative overflow-hidden border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
      style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
    >
      <div className="absolute top-0 left-0 h-[3px] w-full" style={{ background: color }} />
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--content-muted)]">{title}</span>
        <div className="rounded-lg p-2" style={{ background: `${color}18`, color }}>
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
            <div className="text-2xl font-extrabold text-[var(--content-heading)] leading-none truncate">
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
  const color = pct > 85 ? "#ef4444" : pct > 65 ? "#f59e0b" : "#10b981";
  return (
    <div>
      <div className="flex justify-between text-[10px] font-semibold text-[var(--content-muted)] mb-1">
        <span>JVM Memory</span>
        <span style={{ color }}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--card-light-border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
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
  if (normalized === "paid") return { label: "Đã thanh toán", color: "#10b981" };
  if (normalized === "pending") return { label: "Đang chờ", color: "#f59e0b" };
  if (normalized === "cancelled") return { label: "Đã huỷ", color: "#6b7280" };
  if (normalized === "expired") return { label: "Hết hạn", color: "#8b5cf6" };
  if (normalized === "failed") return { label: "Thất bại", color: "#ef4444" };
  return { label: status, color: "#3b82f6" };
}

export default function AdminDashboardPage() {
  const router = useRouter();

  // Date range state
  const [from, setFrom] = React.useState(daysAgoISO(13));
  const [to, setTo] = React.useState(todayISO());
  const [granularity, setGranularity] = React.useState<"day" | "week" | "month">("day");

  const { data: overview, isLoading: ovLoading } = useAdminOverview();
  const { data: users, isLoading: usersLoading } = useAdminUserAnalytics({ from, to, granularity });
  const { data: content, isLoading: contentLoading } = useAdminContentSummary();
  const { data: chat, isLoading: chatLoading } = useAdminChatActivity({ from, to, granularity });
  const { data: payments, isLoading: paymentsLoading } = useAdminPaymentAnalytics({ from, to, granularity });
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useAdminSystemHealth();
  
  // New Analytics hooks
  const { data: revenue, isLoading: revenueLoading } = useAdminRevenueAnalytics({ from, to, granularity });
  const { data: tiers, isLoading: tiersLoading } = useAdminTierAnalytics({ from, to, granularity });
  const { data: quiz, isLoading: quizLoading } = useAdminQuizAnalytics({ from, to, granularity });

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
    { status: "paid", count: payments?.summary.paidOrders ?? 0 },
    { status: "pending", count: payments?.summary.pendingOrders ?? 0 },
    { status: "failed", count: payments?.summary.failedOrders ?? 0 },
    { status: "cancelled", count: payments?.summary.cancelledOrders ?? 0 },
    { status: "expired", count: payments?.summary.expiredOrders ?? 0 },
  ];
  const totalOrders = payments?.summary.totalOrders ?? 0;
  const orderStatusMax = Math.max(...orderStatusRows.map((row) => row.count), 1);

  return (
    <StaffShell
      title="Tổng quan hệ thống"
      description="Trung tâm điều khiển và giám sát chỉ số tài chính, nội dung và tăng trưởng HistoryTalk."
      icon={GaugeIcon}
      accent="var(--accent-gold)"
    >
      <div className="space-y-6">

        {/* ── Row 1: KPI cards ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            title="Doanh thu hệ thống"
            value={formatVND(revenue?.summary.totalRevenue ?? 0)}
            icon={TrendingUpIcon}
            color="#f59e0b"
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
            color="#3b82f6"
            loading={ovLoading}
            sub={
              <span className="flex items-center gap-1 mt-0.5">
                <TrendingUpIcon className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">+{overview?.users.newToday ?? 0}</span> hôm nay
                <span className="text-[var(--content-muted)] ml-1">|+{overview?.users.newThisMonth ?? 0} tháng này</span>
              </span>
            }
          />
          <KpiCard
            title="Đang hoạt động"
            value={(overview?.users.active ?? 0).toLocaleString()}
            icon={UserCheckIcon}
            color="#10b981"
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
            color="#8b5cf6"
            loading={revenueLoading}
            sub={
              <span className="flex flex-col gap-0.5">
                <span>Tổng đơn: <strong>{totalOrders.toLocaleString()}</strong></span>
                <span>Chuyển đổi: <strong>{(tiers?.summary.freeToPaidConversionRate ?? 0).toFixed(1)}%</strong></span>
              </span>
            }
          />
          <KpiCard
            title="Sức khỏe máy chủ"
            value={health?.status ?? "—"}
            icon={ServerIcon}
            color={
              (health?.status ?? "").toUpperCase() === "UP" || (health?.status ?? "").toUpperCase() === "HEALTHY"
                ? "#10b981"
                : "#ef4444"
            }
            loading={healthLoading}
            sub={
              <span className="flex flex-col gap-0.5">
                <span>Uptime: <strong>{health?.uptime ?? "—"}</strong></span>
                {health?.lastCheckedAt && <span className="text-[10px]">Cập nhật: {fmtDate(health.lastCheckedAt)}</span>}
              </span>
            }
          />
        </div>

        {/* ── Row 2: Date range selector ── */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--card-light-border)] bg-[var(--card-light-bg)] px-4 py-3">
          <CalendarIcon className="h-4 w-4 text-[var(--content-muted)] shrink-0" />
          <span className="text-xs font-semibold text-[var(--content-muted)] shrink-0">Khoảng thời gian:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-[var(--card-light-border)] bg-transparent px-2 py-1 text-xs text-[var(--content-heading)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]"
            />
            <span className="text-xs text-[var(--content-muted)]">→</span>
            <input
              type="date"
              value={to}
              min={from}
              max={todayISO()}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-[var(--card-light-border)] bg-transparent px-2 py-1 text-xs text-[var(--content-heading)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]"
            />
          </div>
          <div className="flex items-center gap-1 ml-2">
            {(["day", "week", "month"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className="rounded-lg px-3 py-1 text-[11px] font-bold transition-all duration-200"
                style={
                  granularity === g
                    ? { background: "var(--accent-gold)", color: "#fff" }
                    : { background: "transparent", color: "var(--content-muted)" }
                }
              >
                {g === "day" ? "Ngày" : g === "week" ? "Tuần" : "Tháng"}
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
          <Card style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3Icon className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--content-heading)]">
                  Xu hướng người dùng
                </CardTitle>
              </div>
              <CardDescription className="text-xs">Người dùng mới & đang hoạt động theo {granularity === "day" ? "ngày" : granularity === "week" ? "tuần" : "tháng"}</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 px-5 pb-4 border-t border-dashed border-[var(--card-light-border)]">
              {usersLoading ? (
                <div className="flex items-end gap-1.5 h-[180px]">
                  {[60, 80, 50, 90, 70, 45, 85, 65, 75, 55].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full flex items-end" style={{ height: "130px" }}>
                        <Skeleton className="w-full rounded-t" style={{ height: `${h}%` }} />
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
                      color: "#3b82f6",
                      gradientId: "gradUserNew",
                      valueFormatter: (v) => `${v.toLocaleString()} người`,
                    },
                    {
                      label: "Đang hoạt động",
                      data: activeUsersList,
                      color: "#10b981",
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
          <Card style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--content-heading)]">
                  Xu hướng Doanh thu & Đơn hàng
                </CardTitle>
              </div>
              <CardDescription className="text-xs">Doanh thu và lượng đơn thanh toán thành công theo {granularity === "day" ? "ngày" : granularity === "week" ? "tuần" : "tháng"}</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 px-5 pb-4 border-t border-dashed border-[var(--card-light-border)]">
              {revenueLoading ? (
                <div className="flex items-end gap-1.5 h-[180px]">
                  {[40, 75, 55, 85, 65, 90, 50, 70, 80, 60].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full flex items-end" style={{ height: "130px" }}>
                        <Skeleton className="w-full rounded-t" style={{ height: `${h}%` }} />
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
                      color: "#f59e0b",
                      gradientId: "gradRevenue",
                      valueFormatter: (v) => formatVND(v),
                    },
                    {
                      label: "Đơn hàng thành công",
                      data: paidOrdersList,
                      color: "#8b5cf6",
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Revenue by Tier Progress */}
          <Card style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CrownIcon className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--content-heading)]">
                  Doanh thu theo Gói dịch vụ
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 border-t border-dashed border-[var(--card-light-border)] pt-4">
              {revenueLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              ) : (
                <>
                  <div className="space-y-3.5">
                    {(revenue?.revenueByTier ?? []).map((t) => {
                      const totalRev = revenue?.summary.totalRevenue ?? 1;
                      const pct = totalRev > 0 ? Math.round((t.revenue / totalRev) * 100) : 0;
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
                          <div className="h-2 rounded-full bg-[var(--card-light-border)] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${pct}%`,
                                background: t.tierTitle.toLowerCase().includes("pro")
                                  ? "#ff9215"
                                  : t.tierTitle.toLowerCase().includes("plus")
                                    ? "#8b5cf6"
                                    : "#3b82f6",
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
                  <div className="pt-2 border-t border-dashed border-[var(--card-light-border)] text-xs text-[var(--content-muted)]">
                    <div className="flex justify-between py-1">
                      <span>Giá trị đơn hàng trung bình:</span>
                      <strong className="text-[var(--content-heading)]">{formatVND(revenue?.summary.averageOrderValue ?? 0)}</strong>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tier Subscriptions usage */}
          <Card style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--content-heading)]">
                  Phân tích Hội viên
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 border-t border-dashed border-[var(--card-light-border)] pt-4">
              {tiersLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
              ) : (
                <>
                  <div className="space-y-3">
                    {(tiers?.usersByTier ?? []).map((t) => {
                      const totalUsers = (overview?.users.total ?? 1);
                      const pct = totalUsers > 0 ? Math.round((t.users / totalUsers) * 100) : 0;
                      return (
                        <div key={t.tierId}>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-[var(--content-muted)]">{t.tierTitle}</span>
                            <span className="text-[var(--content-heading)]">
                              {t.users.toLocaleString()}{" "}
                              <span className="text-[var(--content-muted)] font-normal text-[10px]">
                                ({pct}%)
                              </span>
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-[var(--card-light-border)] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${pct}%`,
                                background: t.tierTitle.toLowerCase().includes("pro")
                                  ? "#ff9215"
                                  : t.tierTitle.toLowerCase().includes("plus")
                                    ? "#8b5cf6"
                                    : "#3b82f6",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-2 border-t border-dashed border-[var(--card-light-border)]">
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

          {/* Orders status & Details */}
          <Card style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCardIcon className="h-4 w-4 text-purple-500" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--content-heading)]">
                  Trạng thái đơn hàng
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="border-t border-dashed border-[var(--card-light-border)] pt-4 space-y-4">
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
                      <div className="h-1.5 rounded-full bg-[var(--card-light-border)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${widthPct}%`, background: meta.color }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
              <div className="pt-2 border-t border-dashed border-[var(--card-light-border)]">
                <StatRow label="Tổng đơn hàng" value={totalOrders} highlight />
                <StatRow label="Giao dịch thành công" value={payments?.summary.successfulTransactions ?? 0} />
                <StatRow label="Giao dịch thất bại" value={payments?.summary.failedTransactions ?? 0} />
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ── Row 5: Quiz analytics & Content summary ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Quiz Performance Analytics */}
          <Card className="lg:col-span-2" style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrophyIcon className="h-4 w-4 text-yellow-500" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--content-heading)]">
                  Hiệu suất & Thống kê Quiz
                </CardTitle>
              </div>
              <CardDescription className="text-xs">Đánh giá kết quả học tập và các câu hỏi học viên thường xuyên trả lời sai</CardDescription>
            </CardHeader>
            <CardContent className="border-t border-dashed border-[var(--card-light-border)] pt-4 space-y-4">
              {quizLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Stats & Top Quizzes */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg border border-[var(--card-light-border)] bg-black/5 dark:bg-white/5">
                        <span className="text-[10px] uppercase font-bold text-[var(--content-muted)]">Tổng số Quiz</span>
                        <div className="text-lg font-bold text-[var(--content-heading)] mt-0.5">{(quiz?.summary.totalQuizzes ?? 0).toLocaleString()}</div>
                        <div className="text-[10px] text-[var(--content-muted)] mt-0.5">Đã xuất bản: {quiz?.summary.publishedQuizzes ?? 0}</div>
                      </div>
                      <div className="p-3 rounded-lg border border-[var(--card-light-border)] bg-black/5 dark:bg-white/5">
                        <span className="text-[10px] uppercase font-bold text-[var(--content-muted)]">Tỷ lệ hoàn thành</span>
                        <div className="text-lg font-bold text-emerald-500 mt-0.5">{(quiz?.summary.completionRate ?? 0).toFixed(1)}%</div>
                        <div className="text-[10px] text-[var(--content-muted)] mt-0.5">Lượt làm bài: {quiz?.summary.completedSessions ?? 0}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-[var(--content-heading)] mb-2 uppercase tracking-wider">Top Quizzes Phổ Biến</h4>
                      <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                        {(quiz?.topQuizzes ?? []).slice(0, 3).map((q) => (
                          <div key={q.quizId} className="p-2 rounded border border-[var(--card-light-border)] flex items-center justify-between text-xs hover:bg-[var(--card-light-hover)] transition-all">
                            <div className="truncate max-w-[70%]">
                              <div className="font-bold text-[var(--content-heading)] truncate" title={q.title}>{q.title}</div>
                              <span className="text-[10px] text-[var(--content-muted)]">Cấp độ: {q.level === "EASY" ? "Dễ" : q.level === "MEDIUM" ? "Trung bình" : "Khó"}</span>
                            </div>
                            <div className="text-right text-[10px]">
                              <div>Lượt làm: <strong className="text-[var(--content-heading)]">{q.startedSessions}</strong></div>
                              <div>Đạt trung bình: <strong className="text-amber-500">{q.averageScorePercentage.toFixed(1)}%</strong></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Top Wrong Questions */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <HelpCircleIcon className="h-4 w-4 text-red-500" />
                      <h4 className="text-xs font-bold text-[var(--content-heading)] uppercase tracking-wider">Các Câu Hỏi Hay Sai Nhất</h4>
                    </div>
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                      {(quiz?.topWrongQuestions ?? []).slice(0, 3).map((q) => (
                        <div key={q.questionId} className="p-2.5 rounded border border-red-500/10 bg-red-500/5 text-xs flex flex-col gap-1">
                          <div className="font-medium text-[var(--content-heading)] line-clamp-2">
                            {q.questionId} {/* Show text or ID depending on what BE returns */}
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-[var(--content-muted)] mt-1 border-t border-dashed border-[var(--card-light-border)] pt-1">
                            <span>Quiz: <strong className="text-[var(--content-heading)] truncate max-w-[120px] inline-block align-bottom">{q.quizTitle}</strong></span>
                            <span className="text-red-500 font-bold">Tỷ lệ sai: {q.wrongRate.toFixed(1)}% ({q.wrongAnswers}/{q.totalAnswers})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content summary */}
          <Card style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpenIcon className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--content-heading)]">
                  Kho nội dung
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="border-t border-dashed border-[var(--card-light-border)] pt-4 space-y-3">
              {contentLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
              ) : (
                <>
                  {/* Historical Contexts */}
                  <div className="rounded-xl p-3 border border-amber-500/10" style={{ background: "rgba(245,158,11,0.05)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Bối cảnh lịch sử</span>
                      <span className="text-lg font-extrabold text-[var(--content-heading)]">{(content?.historicalContexts.total ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-3 text-[11px] text-[var(--content-muted)]">
                      <span>Xuất bản: <strong className="text-[var(--content-heading)]">{content?.historicalContexts.published ?? 0}</strong></span>
                      <span>Hoạt động: <strong className="text-[var(--content-heading)]">{content?.historicalContexts.active ?? 0}</strong></span>
                    </div>
                  </div>

                  {/* Characters */}
                  <div className="rounded-xl p-3 border border-purple-500/10" style={{ background: "rgba(139,92,246,0.05)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-purple-500 uppercase tracking-wider">Nhân vật</span>
                      <span className="text-lg font-extrabold text-[var(--content-heading)]">{(content?.characters.total ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-3 text-[11px] text-[var(--content-muted)]">
                      <span>Xuất bản: <strong className="text-[var(--content-heading)]">{content?.characters.published ?? 0}</strong></span>
                      <span>Hoạt động: <strong className="text-[var(--content-heading)]">{content?.characters.active ?? 0}</strong></span>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="rounded-xl p-3 border border-blue-500/10" style={{ background: "rgba(59,130,246,0.05)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">Tài liệu</span>
                      <span className="text-lg font-extrabold text-[var(--content-heading)]">{(content?.documents.total ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-[var(--content-muted)]">
                      Hoạt động: <strong className="text-[var(--content-heading)]">{content?.documents.active ?? 0}</strong>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 6: Detailed User Analytics, Chat statistics & Quick links ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Detailed User analytics */}
          <Card style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--content-heading)]">
                  Chi tiết người dùng
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 border-t border-dashed border-[var(--card-light-border)] pt-4">
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
                            <span className="text-[var(--content-muted)]">{r.role}</span>
                            <span className="text-[var(--content-heading)]">{r.count.toLocaleString()} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--card-light-border)] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${pct}%`,
                                background: r.role.toLowerCase().includes("system")
                                  ? "#10b981"
                                  : r.role.toLowerCase().includes("content")
                                    ? "#8b5cf6"
                                    : "#3b82f6",
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
          <Card style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessagesSquareIcon className="h-4 w-4 text-purple-500" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--content-heading)]">
                  Thống kê Hội thoại Chat
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 border-t border-dashed border-[var(--card-light-border)] pt-4">
              {chatLoading ? (
                Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)
              ) : (
                <>
                  <StatRow label="Tổng phiên chat" value={chat?.summary.sessions ?? 0} highlight />
                  <StatRow label="Phiên đang hoạt động" value={chat?.summary.activeSessions ?? 0} />
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
          <Card style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ActivityIcon className="h-4 w-4 text-[var(--accent-gold)]" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--content-heading)]">
                  Lối tắt quản lý
                </CardTitle>
              </div>
              <CardDescription className="text-xs">Chuyển hướng nhanh tới các phân hệ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 border-t border-[var(--card-light-border)] pt-4">
              <Button
                variant="outline"
                className="w-full justify-between h-10 rounded-xl px-4 hover:bg-[var(--card-light-hover)] border-[var(--card-light-border)] bg-transparent cursor-pointer"
                onClick={() => router.push("/staff/admin/accounts/customer")}
              >
                <span className="flex items-center gap-2 font-medium text-[var(--content-heading)]">
                  <UserCheckIcon className="h-4 w-4 text-blue-500" />
                  Khách hàng
                </span>
                <ArrowRightIcon className="h-4 w-4 opacity-50" />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between h-10 rounded-xl px-4 hover:bg-[var(--card-light-hover)] border-[var(--card-light-border)] bg-transparent cursor-pointer"
                onClick={() => router.push("/staff/admin/accounts/content-admin")}
              >
                <span className="flex items-center gap-2 font-medium text-[var(--content-heading)]">
                  <FileTextIcon className="h-4 w-4 text-purple-500" />
                  Content Admin
                </span>
                <ArrowRightIcon className="h-4 w-4 opacity-50" />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between h-10 rounded-xl px-4 hover:bg-[var(--card-light-hover)] border-[var(--card-light-border)] bg-transparent cursor-pointer"
                onClick={() => router.push("/staff/admin/accounts/system-admin")}
              >
                <span className="flex items-center gap-2 font-medium text-[var(--content-heading)]">
                  <ShieldCheckIcon className="h-4 w-4 text-emerald-500" />
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
