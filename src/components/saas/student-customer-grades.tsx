"use client";

import Link from "next/link";
import { Coins, Loader2, Sparkles, Star, Trophy } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, SectionHeading, formatNumber } from "@/components/saas/saas-ui";
import { ProgressMeter } from "@/components/saas/student-ui";
import { mapEraLabel } from "@/constants/eras";
import { ROUTES } from "@/constants/routes";
import { useMyDashboard } from "@/features/dashboard/hooks";
import { useMyQuizResults } from "@/features/quiz/hooks";
import type { LucideIcon } from "lucide-react";

/**
 * Bảng điểm / tiến độ của Customer (Role Matrix row 25), from the real API:
 * GET /users/me/dashboard (learning + aiUsage) and GET /quizzes/results/me.
 */

const ERA_ORDER = ["ANCIENT", "MEDIEVAL", "MODERN", "CONTEMPORARY"];

const scoreColor = (pct: number) => (pct >= 85 ? "var(--jade)" : pct >= 70 ? "var(--gold-leaf)" : pct >= 40 ? "var(--men-lam)" : "var(--accent-danger)");

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

function Tile({ icon: Icon, color, label, value, sub }: { icon: LucideIcon; color: string; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[2px] text-white" style={{ background: color }} aria-hidden="true">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-bold text-content-muted">{label}</p>
        <p className="font-display text-3xl font-extrabold tabular-nums leading-none text-content-text">{value}</p>
        {sub && <p className="mt-1 truncate text-[12px] text-content-muted">{sub}</p>}
      </div>
    </div>
  );
}

export function CustomerGrades() {
  const { data, isLoading, isError, refetch } = useMyDashboard();
  const results = useMyQuizResults({ page: 0, size: 10 });

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-sm text-content-muted">
        <Loader2 className="h-4 w-4 motion-safe:animate-spin text-[var(--accent-gold)]" aria-hidden="true" />
        Đang tải dữ liệu...
      </div>
    );
  }
  if (isError || !data) {
    return (
      <EmptyState
        title="Không tải được tiến độ học tập"
        description="Vui lòng thử lại sau ít phút."
        action={
          <button type="button" className="btn-line" onClick={() => void refetch()}>
            Thử lại
          </button>
        }
      />
    );
  }

  const { learning, aiUsage } = data;
  const eras = Object.entries(learning.eraDistribution ?? {}).sort(
    ([a], [b]) => ERA_ORDER.indexOf(a.toUpperCase()) - ERA_ORDER.indexOf(b.toUpperCase()),
  );
  const eraMax = Math.max(1, ...eras.map(([, n]) => n));
  const list = results.data?.content?.length ? results.data.content : null;
  const recent = list ?? learning.recentQuizzes.map((q) => ({ sessionId: q.sessionId, quizTitle: q.quizTitle, percentage: q.percentage, completedAt: q.completedAt, score: undefined as number | undefined, totalQuestions: undefined as number | undefined }));

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile
          icon={Star}
          color="var(--gold-leaf)"
          label="Điểm trung bình"
          value={learning.totalQuizzesAttempted ? `${Math.round(learning.averageScorePercentage)}%` : "—"}
          sub="Trên tất cả bài quiz đã làm"
        />
        <Tile icon={Trophy} color="var(--men-lam)" label="Bài quiz đã làm" value={formatNumber(learning.totalQuizzesAttempted)} />
        <Tile icon={Coins} color="var(--accent-gold)" label="Token còn lại" value={formatNumber(aiUsage.currentBalance)} sub={aiUsage.tier ? `Gói ${aiUsage.tier}` : undefined} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel>
          <SectionHeading title="Kết quả gần đây" description="Các lần làm quiz mới nhất của bạn." />
          {recent.length === 0 ? (
            <EmptyState
              size="sm"
              title="Chưa có kết quả"
              description="Làm thử một bộ câu đố để bắt đầu theo dõi tiến độ."
              action={
                <Link href={ROUTES.QUIZ} className="btn-crimson">
                  Làm quiz
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
              {recent.map((r) => (
                <li key={r.sessionId} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-content-text">{r.quizTitle}</span>
                    <span className="block text-[12px] text-content-muted">
                      {formatDate(r.completedAt)}
                      {typeof r.score === "number" && r.totalQuestions ? ` · ${r.score}/${r.totalQuestions} câu đúng` : ""}
                    </span>
                  </span>
                  <span className="font-display text-2xl font-extrabold tabular-nums" style={{ color: scoreColor(r.percentage) }}>
                    {Math.round(r.percentage)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href={ROUTES.QUIZ} className="archive-link">
            Luyện thêm quiz
          </Link>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <SectionHeading title="Phân bố theo thời kỳ" description="Số bài quiz bạn đã làm ở từng thời kỳ lịch sử." />
            {eras.length === 0 ? (
              <p className="text-[13px] text-content-muted">Chưa có dữ liệu.</p>
            ) : (
              <ul className="space-y-3">
                {eras.map(([era, n]) => (
                  <li key={era} className="grid grid-cols-[96px_1fr_36px] items-center gap-3">
                    <span className="truncate text-[13px] font-semibold text-content-text">{mapEraLabel(era)}</span>
                    <ProgressMeter value={n} max={eraMax} color="var(--men-lam)" label={`${mapEraLabel(era)}: ${n} bài`} />
                    <span className="text-right text-[13px] font-bold tabular-nums text-content-text">{n}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <SectionHeading title="Token đã sử dụng" description="Mức dùng AI khi trò chuyện với nhân vật." />
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <Sparkles className="h-4 w-4 self-center text-[var(--accent-gold)]" aria-hidden="true" />
              <span className="font-display text-3xl font-extrabold tabular-nums text-content-text">{formatNumber(aiUsage.totalTokensUsed)}</span>
              <span className="text-[13px] text-content-muted">token tổng cộng</span>
            </div>
            {aiUsage.totalTokensUsed > 0 && (
              <dl className="grid grid-cols-2 gap-3 text-[13px]">
                <div className="space-y-1">
                  <dt className="text-content-muted">Prompt</dt>
                  <dd className="space-y-1 font-bold tabular-nums text-content-text">
                    {formatNumber(aiUsage.promptTokens)}
                    <ProgressMeter value={aiUsage.promptTokens} max={aiUsage.totalTokensUsed} color="var(--gold-leaf)" label="Tỉ lệ token prompt" />
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-content-muted">Completion</dt>
                  <dd className="space-y-1 font-bold tabular-nums text-content-text">
                    {formatNumber(aiUsage.completionTokens)}
                    <ProgressMeter value={aiUsage.completionTokens} max={aiUsage.totalTokensUsed} color="var(--accent-gold)" label="Tỉ lệ token completion" />
                  </dd>
                </div>
              </dl>
            )}
            {aiUsage.topCharacters.length > 0 && (
              <div className="space-y-2 border-t border-[var(--border-default)] pt-3">
                <p className="text-[12px] font-bold text-content-muted">Nhân vật trò chuyện nhiều nhất</p>
                <ul className="space-y-1.5">
                  {aiUsage.topCharacters.slice(0, 3).map((c) => (
                    <li key={c.characterId} className="flex items-center justify-between gap-3 text-[13px]">
                      <Link href={ROUTES.CHAT(c.characterId)} className="truncate font-semibold text-content-text hover:text-[var(--accent-gold)] hover:underline">
                        {c.name}
                      </Link>
                      <span className="shrink-0 tabular-nums text-content-muted">
                        {formatNumber(c.messageCount)} tin nhắn · {formatNumber(c.tokenUsed)} token
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
