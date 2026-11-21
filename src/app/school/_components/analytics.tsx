"use client";

import * as React from "react";
import Image from "next/image";
import {
  Activity,
  BookOpen,
  CalendarDays,
  Coins,
  HelpCircle,
  MessageSquare,
  MessagesSquare,
  ShoppingCart,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";

import { StaffStatCard, StaffStatsGrid } from "@/components/staff/staff-stat-card";
import { SaaSLineChart } from "@/components/staff/saas-line-chart";
import { Panel, SectionHeading, formatNumber } from "@/components/saas/saas-ui";
import { Skeleton } from "@/components/ui/skeleton";
import { DateInput } from "@/components/ui/date-input";
import { isValidUrl } from "@/lib/utils/url";
import { cn } from "@/lib/utils/cn";
import {
  useSchoolChatActivity,
  useSchoolContentSummary,
  useSchoolOverview,
  useSchoolQuizAnalytics,
  useSchoolTokenAnalytics,
  useSchoolUserAnalytics,
} from "@/features/dashboard/hooks";
import type { SchoolDashboardRangeParams } from "@/services/analytics-dashboard.service";

/**
 * Thống kê của trường theo bộ dashboard System Admin, nhưng fit cho B2B:
 * chỉ người dùng / nội dung Local / chat / quiz / token của chính trường (GET /school-admin/dashboard/*).
 * Không có doanh thu, gói hội viên hay nội dung HistoryTalk (Global).
 */

type Granularity = NonNullable<SchoolDashboardRangeParams["granularity"]>;

const GRANULARITY_LABELS: Record<Granularity, string> = { day: "Ngày", week: "Tuần", month: "Tháng", year: "Năm" };

const ROLE_LABELS: Record<string, string> = {
  SCHOOL_ADMIN: "Quản trị trường",
  TEACHER: "Giáo viên",
  SCHOOL_STUDENT: "Học sinh",
};

const ROLE_COLORS: Record<string, string> = {
  SCHOOL_ADMIN: "var(--status-success)",
  TEACHER: "var(--quest-quiz)",
  SCHOOL_STUDENT: "var(--accent-blue)",
};

function isoDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const formatVND = (n: number | undefined) => `${(n ?? 0).toLocaleString("vi-VN")} đ`;
const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

/** Một dòng nhãn — giá trị, dùng chung cho các card. */
function StatRow({ label, value, hint, strong }: { label: string; value: React.ReactNode; hint?: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--border-default)] py-1.5 last:border-0">
      <span className="flex items-center gap-1 text-xs text-content-muted" title={hint}>
        {label}
        {hint && <HelpCircle className="h-3 w-3 opacity-60" aria-label={hint} />}
      </span>
      <span className={cn("text-xs font-bold tabular-nums", strong ? "text-[var(--accent-gold)]" : "text-content-heading")}>{value}</span>
    </div>
  );
}

/** Thanh tỉ lệ có nhãn. */
function ShareBar({ label, value, percent, color, sub }: { label: string; value: string; percent: number; color: string; sub?: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between gap-2 text-xs font-semibold">
        <span className="text-content-muted">{label}</span>
        <span className="tabular-nums text-content-heading">
          {value} <span className="text-[10px] font-normal text-content-muted">({percent}%)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-sm bg-[var(--status-neutral-bg)]">
        <div className="h-full transition-all duration-700" style={{ width: `${Math.min(100, percent)}%`, background: color }} />
      </div>
      {sub && <p className="mt-0.5 text-[10px] text-content-muted">{sub}</p>}
    </div>
  );
}

function Rows({ n, h = "h-8" }: { n: number; h?: string }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: n }).map((_, i) => (
        <Skeleton key={i} className={cn(h, "w-full")} />
      ))}
    </div>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-xs text-content-muted">{children}</p>;
}

export function SchoolAnalyticsSection() {
  const [from, setFrom] = React.useState(isoDaysAgo(13));
  const [to, setTo] = React.useState(isoDaysAgo(0));
  const [granularity, setGranularity] = React.useState<Granularity>("day");
  const range = { from, to, granularity };

  const overview = useSchoolOverview();
  const users = useSchoolUserAnalytics(range);
  const content = useSchoolContentSummary();
  const chat = useSchoolChatActivity(range);
  const quiz = useSchoolQuizAnalytics(range);
  const tokens = useSchoolTokenAnalytics(range);

  const anyFetching = [overview, users, content, chat, quiz, tokens].some((q) => q.isFetching);
  const unit = GRANULARITY_LABELS[granularity].toLowerCase();
  const show = (q: { isPending: boolean; isError: boolean }, v: number | undefined) =>
    q.isPending ? "…" : q.isError || v === undefined ? "—" : formatNumber(v);

  const ov = overview.data;
  const tk = tokens.data;
  const mgmt = tk?.schoolTokenManagement;

  // Biểu đồ token & tin nhắn: hai API cùng from/to/granularity nên cùng mốc thời gian.
  const tokenDates = (tk?.trend ?? []).map((p) => p.date);
  const messagesByDate = new Map((chat.data?.trend ?? []).map((p) => [p.date, p.messages]));

  const roleRows = (users.data?.byRole ?? []).filter((r) => r.role in ROLE_LABELS);
  const roleTotal = roleRows.reduce((s, r) => s + r.count, 0);
  const topCharacters = ov?.topLocalCharacters ?? ov?.topCharacters ?? [];

  return (
    <div className="space-y-6">
      {/* ── Khoảng thời gian ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-sm border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3">
        <CalendarDays className="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
        <span className="shrink-0 text-xs font-semibold text-content-muted">Khoảng thời gian:</span>
        <div className="flex items-center gap-2">
          <DateInput
            value={from}
            max={to}
            onValueChange={(v) => v && setFrom(v)}
            wrapperClassName="w-[8.5rem]"
            className="w-full rounded-sm border border-[var(--card-light-border)] bg-transparent px-2 py-1 text-xs text-content-heading focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]"
          />
          <span className="text-xs text-content-muted">→</span>
          <DateInput
            value={to}
            min={from}
            max={isoDaysAgo(0)}
            onValueChange={(v) => v && setTo(v)}
            wrapperClassName="w-[8.5rem]"
            className="w-full rounded-sm border border-[var(--card-light-border)] bg-transparent px-2 py-1 text-xs text-content-heading focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]"
          />
        </div>
        <div className="flex items-center gap-1">
          {(Object.keys(GRANULARITY_LABELS) as Granularity[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGranularity(g)}
              aria-pressed={granularity === g}
              className={cn(
                "rounded-sm px-3 py-1 text-[11px] font-bold transition-colors",
                granularity === g ? "bg-[var(--text-primary)] text-[var(--text-inverse)]" : "text-content-muted hover:text-[var(--text-primary)]",
              )}
            >
              {GRANULARITY_LABELS[g]}
            </button>
          ))}
        </div>
        {anyFetching && <span className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent-gold)] border-t-transparent" />}
      </div>

      {/* ── KPI ── */}
      <StaffStatsGrid className="sm:grid-cols-2 lg:grid-cols-4">
        <StaffStatCard label="Tài khoản của trường" value={show(overview, ov?.users.total)} icon={<Users className="h-5 w-5" />} tone="blue" />
        <StaffStatCard label="Đang hoạt động" value={show(overview, ov?.users.active)} icon={<UserCheck className="h-5 w-5" />} tone="green" />
        <StaffStatCard
          label="Token dùng trong kỳ"
          value={show(tokens, tk?.summary.totalTokens)}
          icon={<Coins className="h-5 w-5" />}
          tone="gold"
        />
        <StaffStatCard
          label="Phiên chat đang mở"
          value={show(chat, chat.data?.summary.activeSessions)}
          icon={<MessagesSquare className="h-5 w-5" />}
          tone="amber"
        />
      </StaffStatsGrid>

      {/* ── Xu hướng ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionHeading title="Xu hướng người dùng" description={`Tài khoản mới và đang hoạt động theo ${unit}.`} />
          {users.isPending ? (
            <Skeleton className="h-[190px] w-full" />
          ) : users.isError ? (
            <EmptyLine>Chưa tải được xu hướng người dùng.</EmptyLine>
          ) : (
            <SaaSLineChart
              dates={(users.data.trend ?? []).map((p) => p.date)}
              series={[
                {
                  label: "Tài khoản mới",
                  data: (users.data.trend ?? []).map((p) => p.newUsers),
                  color: "var(--accent-blue)",
                  gradientId: "schoolUserNew",
                  valueFormatter: (v) => `${formatNumber(v)} người`,
                },
                {
                  label: "Đang hoạt động",
                  data: (users.data.trend ?? []).map((p) => p.activeUsers),
                  color: "var(--status-success)",
                  gradientId: "schoolUserActive",
                  valueFormatter: (v) => `${formatNumber(v)} người`,
                },
              ]}
            />
          )}
        </Panel>

        <Panel>
          <SectionHeading title="Xu hướng token & tin nhắn" description={`Token tiêu thụ và số tin nhắn chat theo ${unit}.`} />
          {tokens.isPending ? (
            <Skeleton className="h-[190px] w-full" />
          ) : tokens.isError ? (
            <EmptyLine>Chưa tải được xu hướng token.</EmptyLine>
          ) : (
            <SaaSLineChart
              dates={tokenDates}
              series={[
                {
                  label: "Token",
                  data: (tk?.trend ?? []).map((p) => p.totalTokens),
                  color: "var(--accent-gold)",
                  gradientId: "schoolTokenTrend",
                  valueFormatter: (v) => `${formatNumber(v)} token`,
                },
                {
                  label: "Tin nhắn",
                  data: tokenDates.map((d) => messagesByDate.get(d) ?? 0),
                  color: "var(--quest-quiz)",
                  gradientId: "schoolMessageTrend",
                  valueFormatter: (v) => `${formatNumber(v)} tin`,
                },
              ]}
            />
          )}
        </Panel>
      </div>

      {/* ── Quản lý token của trường (thay cho doanh thu ở System Admin) ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel>
          <SectionHeading title="Token theo vai trò" description="Học sinh và giáo viên dùng bao nhiêu trong kỳ đang lọc." />
          {tokens.isPending ? (
            <Rows n={4} h="h-10" />
          ) : tokens.isError ? (
            <EmptyLine>Chưa tải được số liệu token.</EmptyLine>
          ) : (
            <>
              <div className="space-y-3.5">
                {(tk?.tokenUsageByRole ?? []).map((r) => (
                  <ShareBar
                    key={r.role}
                    label={ROLE_LABELS[r.role] ?? r.role}
                    value={formatNumber(r.totalTokens)}
                    percent={Math.round(r.usagePercentage)}
                    color={ROLE_COLORS[r.role] ?? "var(--accent-blue)"}
                    sub={`${formatNumber(r.users)} tài khoản hoạt động · hạn mức ${formatNumber(r.defaultDailyQuota)}/ngày`}
                  />
                ))}
              </div>
              <div className="border-t border-[var(--border-default)] pt-2">
                <StatRow label="Token trong kỳ" value={formatNumber(tk?.summary.totalTokens ?? 0)} strong />
                <StatRow label="Prompt / phản hồi" value={`${formatNumber(tk?.summary.promptTokens ?? 0)} / ${formatNumber(tk?.summary.completionTokens ?? 0)}`} />
                <StatRow
                  label="Tài khoản hết token hôm nay"
                  value={formatNumber(tk?.summary.usersOutOfTokens ?? 0)}
                  hint="Số tài khoản trong trường đã dùng hết hạn mức ngày"
                />
              </div>
            </>
          )}
        </Panel>

        <Panel>
          <SectionHeading title="Quỹ token & nạp thêm" description="Số liệu tích luỹ của quỹ chung toàn trường." />
          {tokens.isPending ? (
            <Rows n={7} h="h-6" />
          ) : !mgmt ? (
            <EmptyLine>Chưa tải được thông tin quỹ token.</EmptyLine>
          ) : (
            <>
              <ShareBar
                label="Đã dùng khỏi quỹ"
                value={`${formatNumber(mgmt.allocatedTokens)} / ${formatNumber(mgmt.totalSchoolTokenQuota)}`}
                percent={Math.round(mgmt.quotaUsagePercentage)}
                color={mgmt.quotaUsagePercentage >= 90 ? "var(--accent-danger)" : mgmt.quotaUsagePercentage >= 70 ? "var(--status-warning)" : "var(--jade)"}
              />
              <div>
                <StatRow label="Còn lại trong quỹ" value={formatNumber(mgmt.unallocatedTokenQuota)} strong />
                <StatRow label="Học sinh đã dùng (tổng)" value={`${formatNumber(mgmt.tokensUsedByStudents)} · ${mgmt.studentTokenUsagePercentage.toFixed(1)}%`} />
                <StatRow label="Giáo viên đã dùng (tổng)" value={`${formatNumber(mgmt.tokensUsedByTeachers)} · ${mgmt.teacherTokenUsagePercentage.toFixed(1)}%`} />
                <StatRow label="Hạn mức HS / GV mỗi ngày" value={`${formatNumber(mgmt.defaultDailyStudentQuota)} / ${formatNumber(mgmt.defaultDailyTeacherQuota)}`} />
                <StatRow label="Yêu cầu xin thêm chờ duyệt" value={formatNumber(mgmt.pendingTokenBoostRequests)} />
              </div>
              <div className="rounded-sm border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-content-heading">
                  <ShoppingCart className="h-3.5 w-3.5 text-[var(--accent-gold)]" aria-hidden="true" /> Mua thêm token
                </p>
                <StatRow label="Đơn đã thanh toán" value={formatNumber(mgmt.topupPaidOrders)} />
                <StatRow label="Token đã mua" value={formatNumber(mgmt.topupTokensPurchased)} />
                <StatRow label="Tổng chi" value={formatVND(mgmt.topupAmountPaid)} strong />
              </div>
            </>
          )}
        </Panel>

        <Panel>
          <SectionHeading title="Dùng token nhiều nhất" description="Học sinh, giáo viên dùng nhiều nhất trong kỳ." />
          {tokens.isPending ? (
            <Rows n={6} h="h-9" />
          ) : (tk?.topUsersByTokenUsage ?? []).length === 0 ? (
            <EmptyLine>Chưa có ai dùng token trong khoảng thời gian này.</EmptyLine>
          ) : (
            <ol className="divide-y divide-[var(--border-default)]">
              {(tk?.topUsersByTokenUsage ?? []).slice(0, 8).map((u, i) => (
                <li key={u.uid} className="flex items-center gap-3 py-2">
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-sm text-[11px] font-extrabold text-white"
                    style={{ background: i === 0 ? "var(--accent-gold)" : i === 1 ? "var(--text-tertiary)" : i === 2 ? "var(--accent-bronze)" : "var(--content-muted)" }}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-content-heading">{u.userName}</span>
                    {u.email && <span className="block truncate text-[11px] text-content-muted">{u.email}</span>}
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-bold tabular-nums text-content-heading">{formatNumber(u.totalTokens)}</span>
                    <span className="block text-[10px] text-content-muted">token</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      {/* ── Nhân vật hot (Local) + Quiz | Kho nội dung Local ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Panel>
            <SectionHeading title="Nhân vật được trò chuyện nhiều nhất" description="Chỉ tính nhân vật do giáo viên của trường tạo." />
            {overview.isPending ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : topCharacters.length === 0 ? (
              <EmptyLine>Chưa có cuộc trò chuyện nào với nhân vật của trường.</EmptyLine>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {topCharacters.map((c, idx) => (
                  <div key={c.characterId} className="relative flex items-center gap-3 rounded-sm border border-[var(--card-light-border)] p-3">
                    <span
                      className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-sm text-[11px] font-extrabold text-white"
                      style={{ background: idx === 0 ? "var(--accent-gold)" : idx === 1 ? "var(--text-tertiary)" : idx === 2 ? "var(--accent-bronze)" : "var(--content-muted)" }}
                    >
                      {idx + 1}
                    </span>
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[var(--card-light-border)] bg-[var(--card-light-border)]">
                      {isValidUrl(c.imageUrl) ? (
                        <Image src={c.imageUrl!} alt={c.name} fill className="object-cover" sizes="48px" />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-sm font-bold text-content-muted">{c.name?.charAt(0) ?? "?"}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-content-heading" title={c.name}>{c.name}</p>
                      {c.title && <p className="truncate text-[10px] text-content-muted">{c.title}</p>}
                      <p className="mt-1 flex items-center gap-1.5 text-[10px] text-content-muted">
                        <MessageSquare className="h-3 w-3 text-[var(--accent-gold)]" aria-hidden="true" />
                        <b className="text-xs text-content-heading">{formatNumber(c.totalMessages)}</b> tin nhắn
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel>
            <SectionHeading title="Quiz của trường" description="Kết quả làm bài và những câu học sinh hay sai trong kỳ." />
            {quiz.isPending ? (
              <Rows n={3} h="h-16" />
            ) : quiz.isError ? (
              <EmptyLine>Chưa tải được thống kê quiz.</EmptyLine>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-sm border border-[var(--card-light-border)] bg-[var(--bg-elevated)] p-3">
                      <span className="text-xs text-content-muted">Tổng số quiz</span>
                      <p className="mt-0.5 text-lg font-bold tabular-nums text-content-heading">{formatNumber(quiz.data.summary.totalQuizzes)}</p>
                      <p className="text-[10px] text-content-muted">Đã xuất bản: {formatNumber(quiz.data.summary.publishedQuizzes)}</p>
                    </div>
                    <div className="rounded-sm border border-[var(--card-light-border)] bg-[var(--bg-elevated)] p-3">
                      <span className="text-xs text-content-muted">Tỷ lệ hoàn thành</span>
                      <p className="mt-0.5 text-lg font-bold tabular-nums text-[var(--status-success)]">{quiz.data.summary.completionRate.toFixed(1)}%</p>
                      <p className="text-[10px] text-content-muted">
                        Điểm TB: {quiz.data.summary.averageScorePercentage.toFixed(1)}% · {formatNumber(quiz.data.summary.completedSessions)} lượt
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-content-heading">
                      <Trophy className="h-4 w-4 text-[var(--status-warning)]" aria-hidden="true" /> Làm nhiều nhất
                    </h4>
                    {quiz.data.topQuizzes.length === 0 ? (
                      <p className="text-xs text-content-muted">Chưa có lượt làm bài trong kỳ.</p>
                    ) : (
                      <div className="space-y-2">
                        {quiz.data.topQuizzes.slice(0, 3).map((q) => (
                          <div key={q.quizId} className="flex items-center justify-between gap-3 rounded-sm border border-[var(--card-light-border)] p-2 text-xs">
                            <span className="min-w-0 truncate font-bold text-content-heading" title={q.title}>{q.title}</span>
                            <span className="shrink-0 text-right text-[10px] text-content-muted">
                              {formatNumber(q.startedSessions)} lượt ·{" "}
                              <b className="text-[var(--status-warning)]">{q.averageScorePercentage.toFixed(1)}%</b>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-content-heading">
                    <HelpCircle className="h-4 w-4 text-[var(--accent-danger)]" aria-hidden="true" /> Câu hay sai nhất
                  </h4>
                  {quiz.data.topWrongQuestions.length === 0 ? (
                    <p className="text-xs text-content-muted">Chưa có dữ liệu câu trả lời trong kỳ.</p>
                  ) : (
                    <div className="space-y-2">
                      {quiz.data.topWrongQuestions.slice(0, 3).map((q) => (
                        <div key={q.questionId} className="rounded-sm border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-2.5 text-xs">
                          <p className="line-clamp-2 font-medium text-content-heading">{q.questionContent || q.questionId}</p>
                          <p className="mt-1 flex justify-between gap-2 border-t border-[var(--border-default)] pt-1 text-[10px] text-content-muted">
                            <span className="truncate">Quiz: {q.quizTitle}</span>
                            <b className="shrink-0 text-[var(--accent-danger)]">
                              Sai {q.wrongRate.toFixed(1)}% ({q.wrongAnswers}/{q.totalAnswers})
                            </b>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel>
            <SectionHeading title="Kho nội dung của trường" />
            {content.isPending ? (
              <Rows n={3} h="h-16" />
            ) : content.isError ? (
              <EmptyLine>Chưa tải được kho nội dung.</EmptyLine>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Bối cảnh lịch sử", data: content.data.historicalContexts, tone: "border-accent-gold/30 bg-[var(--accent-gold-active-bg)] text-[var(--accent-gold)]" },
                  { label: "Nhân vật", data: content.data.characters, tone: "border-[var(--quest-quiz)]/20 bg-[var(--quest-quiz-bg)] text-[var(--quest-quiz)]" },
                ].map((row) => (
                  <div key={row.label} className={cn("rounded-sm border p-3", row.tone)}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[13px] font-semibold">{row.label}</span>
                      <span className="text-lg font-bold tabular-nums text-content-heading">{formatNumber(row.data.total)}</span>
                    </div>
                    <p className="flex gap-3 text-[11px] text-content-muted">
                      <span>Xuất bản: <b className="text-content-heading">{formatNumber(row.data.published)}</b></span>
                      <span>Hoạt động: <b className="text-content-heading">{formatNumber(row.data.active)}</b></span>
                    </p>
                  </div>
                ))}
                <div className="rounded-sm border border-accent-blue/20 bg-accent-blue/10 p-3 text-accent-blue">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[13px] font-semibold"><BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Tài liệu</span>
                    <span className="text-lg font-bold tabular-nums text-content-heading">{formatNumber(content.data.documents.total)}</span>
                  </div>
                  <p className="text-[11px] text-content-muted">Hoạt động: <b className="text-content-heading">{formatNumber(content.data.documents.active)}</b></p>
                </div>
              </div>
            )}
          </Panel>

          <Panel>
            <SectionHeading title="Hội thoại chat" />
            {chat.isPending ? (
              <Rows n={6} h="h-6" />
            ) : chat.isError ? (
              <EmptyLine>Chưa tải được thống kê chat.</EmptyLine>
            ) : (
              <div>
                <StatRow label="Tổng phiên chat" value={formatNumber(chat.data.summary.sessions)} strong />
                <StatRow label="Phiên đang mở" value={formatNumber(chat.data.summary.activeSessions)} hint="Phiên có tin nhắn trong 2 phút gần nhất" />
                <StatRow label="Tổng tin nhắn" value={formatNumber(chat.data.summary.messages)} />
                <StatRow label="Tin nhắn người dùng / AI" value={`${formatNumber(chat.data.summary.userMessages)} / ${formatNumber(chat.data.summary.aiMessages)}`} />
                <StatRow label="Phiên mới hôm nay" value={formatNumber(chat.data.summary.sessionsToday)} />
                <StatRow label="Tin nhắn hôm nay" value={formatNumber(chat.data.summary.messagesToday)} />
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* ── Người dùng của trường ── */}
      <Panel>
        <SectionHeading title="Người dùng của trường" description="Phân bổ tài khoản đang hoạt động theo vai trò." />
        {users.isPending ? (
          <Rows n={3} h="h-10" />
        ) : users.isError ? (
          <EmptyLine>Chưa tải được thống kê người dùng.</EmptyLine>
        ) : (
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="space-y-3.5">
              {roleRows.map((r) => (
                <ShareBar
                  key={r.role}
                  label={ROLE_LABELS[r.role]}
                  value={formatNumber(r.count)}
                  percent={pct(r.count, roleTotal)}
                  color={ROLE_COLORS[r.role]}
                />
              ))}
            </div>
            <div>
              <StatRow label="Tổng tài khoản" value={formatNumber(users.data.summary.total)} strong />
              <StatRow label="Đang hoạt động" value={formatNumber(users.data.summary.active)} />
              <StatRow label="Không hoạt động" value={formatNumber(users.data.summary.inactive)} />
              <StatRow label="Hoạt động 7 ngày qua" value={formatNumber(users.data.summary.recentlyActive)} />
              <StatRow
                label="Mới hôm nay / tháng này"
                value={ov ? `${formatNumber(ov.users.newToday)} / ${formatNumber(ov.users.newThisMonth)}` : "…"}
              />
            </div>
          </div>
        )}
      </Panel>

      <p className="flex items-center gap-1.5 text-[11px] text-content-muted">
        <Activity className="h-3 w-3" aria-hidden="true" />
        Biểu đồ, token theo vai trò, top người dùng và quiz tính trong khoảng thời gian đã chọn; các số còn lại là tổng hiện tại.
      </p>
    </div>
  );
}
