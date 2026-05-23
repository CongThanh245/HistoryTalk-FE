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
  UserIcon,
  ServerIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  CalendarIcon,
  BarChart3Icon,
  MessagesSquareIcon,
  FileTextIcon,
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
  useAdminSystemHealth,
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

// ─── Bar chart (dual series) ──────────────────────────────────────────────────

interface DualBarChartProps {
  data: { date: string; a: number; b: number }[];
  colorA?: string;
  colorB?: string;
  labelA?: string;
  labelB?: string;
}

function DualBarChart({ data, colorA = "var(--accent-blue)", colorB = "var(--accent-gold)", labelA = "A", labelB = "B" }: DualBarChartProps) {
  const maxVal = Math.max(...data.flatMap((d) => [d.a, d.b]), 1);

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--content-muted)]">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: colorA }} />
          {labelA}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--content-muted)]">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: colorB }} />
          {labelB}
        </span>
      </div>
      {/* Bars */}
      <div className="flex items-end gap-1.5 h-[150px]">
        {data.map((item, idx) => {
          const pctA = (item.a / maxVal) * 100;
          const pctB = (item.b / maxVal) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
              <div className="w-full flex items-end justify-center gap-[2px] h-[130px] relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 pointer-events-none">
                  <div className="bg-[var(--abyssal-blue,#1a2035)] text-white text-[10px] py-1 px-2 rounded-lg shadow-xl whitespace-nowrap">
                    <div style={{ color: colorA }}>{labelA}: {item.a.toLocaleString()}</div>
                    <div style={{ color: colorB }}>{labelB}: {item.b.toLocaleString()}</div>
                  </div>
                </div>
                {/* Bar A */}
                <div
                  className="w-[45%] rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                  style={{ height: `${pctA}%`, background: colorA, minHeight: pctA > 0 ? 2 : 0 }}
                />
                {/* Bar B */}
                <div
                  className="w-[45%] rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                  style={{ height: `${pctB}%`, background: colorB, minHeight: pctB > 0 ? 2 : 0 }}
                />
              </div>
              <span className="text-[9px] font-semibold text-[var(--content-muted)] truncate max-w-full text-center">
                {item.date}
              </span>
            </div>
          );
        })}
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
            <div className="text-3xl font-extrabold text-[var(--content-heading)] leading-none">
              {typeof value === "number" ? value.toLocaleString() : value}
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
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useAdminSystemHealth();

  const anyLoading = ovLoading || usersLoading || contentLoading || chatLoading || healthLoading;

  // Map user trend → dual bar
  const userTrend = (users?.trend ?? []).map((p) => ({
    date: p.date,
    a: p.newUsers,
    b: p.activeUsers,
  }));

  // Map chat trend → dual bar
  const chatTrend = (chat?.trend ?? []).map((p) => ({
    date: p.date,
    a: p.sessions,
    b: p.messages,
  }));

  // Role distribution total
  const totalRoles = (overview?.roles.customers ?? 0) + (overview?.roles.contentAdmins ?? 0) + (overview?.roles.systemAdmins ?? 0);
  const roleBar = (val: number) => (totalRoles > 0 ? Math.round((val / totalRoles) * 100) : 0);

  return (
    <StaffShell
      title="Tổng quan hệ thống"
      description="Trung tâm điều khiển và giám sát chỉ số tăng trưởng HistoryTalk."
      icon={GaugeIcon}
      accent="var(--accent-gold)"
    >
      <div className="space-y-6">

        {/* ── Row 1: KPI cards ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            title="Tổng người dùng"
            value={overview?.users.total ?? 0}
            icon={UsersIcon}
            color="#3b82f6"
            loading={ovLoading}
            sub={
              <span className="flex items-center gap-1">
                <TrendingUpIcon className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">+{overview?.users.newToday ?? 0}</span> hôm nay
              </span>
            }
          />
          <KpiCard
            title="Đang hoạt động"
            value={overview?.users.active ?? 0}
            icon={UserCheckIcon}
            color="#10b981"
            loading={ovLoading}
            sub={<span>Không hoạt động: <strong>{(overview?.users.inactive ?? 0).toLocaleString()}</strong></span>}
          />
          <KpiCard
            title="Chat sessions"
            value={overview?.chat.sessions ?? 0}
            icon={MessageSquareIcon}
            color="#8b5cf6"
            loading={ovLoading}
            sub={<span>Tin nhắn hôm nay: <strong>{(overview?.chat.messagesToday ?? 0).toLocaleString()}</strong></span>}
          />
          <KpiCard
            title="Nội dung"
            value={(overview?.content.historicalContexts ?? 0) + (overview?.content.characters ?? 0)}
            icon={BookOpenIcon}
            color="#f59e0b"
            loading={ovLoading}
            sub={<span>Tài liệu: <strong>{(overview?.content.documents ?? 0).toLocaleString()}</strong></span>}
          />
          <KpiCard
            title="Trạng thái hệ thống"
            value={health?.status ?? "—"}
            icon={ServerIcon}
            color={
              (health?.status ?? "").toUpperCase() === "UP" || (health?.status ?? "").toUpperCase() === "HEALTHY"
                ? "#10b981"
                : "#ef4444"
            }
            loading={healthLoading}
            sub={health?.lastCheckedAt ? <span>Cập nhật: {fmtDate(health.lastCheckedAt)}</span> : undefined}
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
              ) : userTrend.length > 0 ? (
                <DualBarChart
                  data={userTrend}
                  colorA="#3b82f6"
                  colorB="#10b981"
                  labelA="Người dùng mới"
                  labelB="Đang hoạt động"
                />
              ) : (
                <div className="flex h-[150px] items-center justify-center text-xs text-[var(--content-muted)]">
                  Không có dữ liệu trong khoảng thời gian này
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat trend */}
          <Card style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessagesSquareIcon className="h-4 w-4 text-purple-500" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--content-heading)]">
                  Hoạt động Chat
                </CardTitle>
              </div>
              <CardDescription className="text-xs">Phiên chat & tin nhắn theo {granularity === "day" ? "ngày" : granularity === "week" ? "tuần" : "tháng"}</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 px-5 pb-4 border-t border-dashed border-[var(--card-light-border)]">
              {chatLoading ? (
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
              ) : chatTrend.length > 0 ? (
                <DualBarChart
                  data={chatTrend}
                  colorA="#8b5cf6"
                  colorB="#f59e0b"
                  labelA="Phiên chat"
                  labelB="Tin nhắn"
                />
              ) : (
                <div className="flex h-[150px] items-center justify-center text-xs text-[var(--content-muted)]">
                  Không có dữ liệu trong khoảng thời gian này
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 4: Detail cards ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* User analytics detail */}
          <Card style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--content-heading)]">
                  Phân tích người dùng
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

          {/* Content summary */}
          <Card style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpenIcon className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--content-heading)]">
                  Kho nội dung
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="border-t border-dashed border-[var(--card-light-border)] pt-4 space-y-4">
              {contentLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
              ) : (
                <>
                  {/* Historical Contexts */}
                  <div className="rounded-xl p-3" style={{ background: "rgba(245,158,11,0.07)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Bối cảnh lịch sử</span>
                      <span className="text-lg font-extrabold text-[var(--content-heading)]">{(content?.historicalContexts.total ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-[var(--content-muted)]">
                      <span>Xuất bản: <strong className="text-[var(--content-heading)]">{content?.historicalContexts.published ?? 0}</strong></span>
                      <span>Hoạt động: <strong className="text-[var(--content-heading)]">{content?.historicalContexts.active ?? 0}</strong></span>
                    </div>
                  </div>

                  {/* Characters */}
                  <div className="rounded-xl p-3" style={{ background: "rgba(139,92,246,0.07)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-purple-500 uppercase tracking-wider">Nhân vật</span>
                      <span className="text-lg font-extrabold text-[var(--content-heading)]">{(content?.characters.total ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-[var(--content-muted)]">
                      <span>Xuất bản: <strong className="text-[var(--content-heading)]">{content?.characters.published ?? 0}</strong></span>
                      <span>Hoạt động: <strong className="text-[var(--content-heading)]">{content?.characters.active ?? 0}</strong></span>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="rounded-xl p-3" style={{ background: "rgba(59,130,246,0.07)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">Tài liệu</span>
                      <span className="text-lg font-extrabold text-[var(--content-heading)]">{(content?.documents.total ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-[var(--content-muted)]">
                      Hoạt động: <strong className="text-[var(--content-heading)]">{content?.documents.active ?? 0}</strong>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* System health */}
          <Card style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ServerIcon className="h-4 w-4 text-emerald-500" />
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--content-heading)]">
                    Sức khoẻ hệ thống
                  </CardTitle>
                </div>
                <button
                  onClick={() => refetchHealth()}
                  className="rounded-lg p-1.5 hover:bg-[var(--card-light-border)] transition-colors"
                  title="Làm mới"
                >
                  <RefreshCwIcon className="h-3.5 w-3.5 text-[var(--content-muted)]" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="border-t border-dashed border-[var(--card-light-border)] pt-4 space-y-4">
              {healthLoading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--content-muted)]">Trạng thái</span>
                    <HealthBadge status={health?.status} />
                  </div>
                  <StatRow label="Uptime" value={health?.uptime ?? "—"} />
                  <StatRow label="HTTP Requests" value={(health?.httpRequestCount ?? 0).toLocaleString()} />
                  <StatRow
                    label="HTTP Errors"
                    value={(health?.httpErrorCount ?? 0).toLocaleString()}
                  />

                  {/* Memory bar */}
                  {(health?.jvmMemoryMax ?? 0) > 0 && (
                    <div className="pt-1">
                      <MemoryBar
                        used={health!.jvmMemoryUsed}
                        max={health!.jvmMemoryMax}
                      />
                    </div>
                  )}

                  <div className="pt-1 text-[10px] text-[var(--content-muted)] text-right">
                    Cập nhật lần cuối: {health?.lastCheckedAt ? fmtDate(health.lastCheckedAt) : "—"}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 5: Chat summary + Quick nav ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Chat summary detail */}
          <Card style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessagesSquareIcon className="h-4 w-4 text-purple-500" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--content-heading)]">
                  Thống kê Chat
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
                  <StatRow label="Phiên hôm nay" value={chat?.summary.sessionsToday ?? 0} />
                  <StatRow label="Tin nhắn hôm nay" value={chat?.summary.messagesToday ?? 0} />
                </>
              )}
            </CardContent>
          </Card>

          {/* Roles overview */}
          <Card style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-[var(--accent-gold)]" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--content-heading)]">
                  Phân bổ vai trò
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="border-t border-dashed border-[var(--card-light-border)] pt-4 space-y-4">
              {ovLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
              ) : (
                [
                  { label: "Khách hàng", value: overview?.roles.customers ?? 0, color: "#3b82f6" },
                  { label: "Content Admin", value: overview?.roles.contentAdmins ?? 0, color: "#8b5cf6" },
                  { label: "System Admin", value: overview?.roles.systemAdmins ?? 0, color: "#10b981" },
                ].map((r) => {
                  const pct = roleBar(r.value);
                  return (
                    <div key={r.label}>
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span className="text-[var(--content-muted)]">{r.label}</span>
                        <span className="text-[var(--content-heading)]">{r.value.toLocaleString()} <span className="text-[var(--content-muted)] font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--card-light-border)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: r.color }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
              <div className="pt-2 border-t border-dashed border-[var(--card-light-border)]">
                <StatRow label="Mới tháng này" value={overview?.users.newThisMonth ?? 0} highlight />
                <StatRow label="Đã xoá" value={overview?.users.deleted ?? 0} />
              </div>
            </CardContent>
          </Card>

          {/* Quick nav */}
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
                className="w-full justify-between h-10 rounded-xl px-4 hover:bg-[var(--card-light-hover)] border-[var(--card-light-border)]"
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
                className="w-full justify-between h-10 rounded-xl px-4 hover:bg-[var(--card-light-hover)] border-[var(--card-light-border)]"
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
                className="w-full justify-between h-10 rounded-xl px-4 hover:bg-[var(--card-light-hover)] border-[var(--card-light-border)]"
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
