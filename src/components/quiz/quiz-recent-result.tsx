import React from "react";
import type { QuizResult } from "@/services/quiz.service";
import { cn } from "@/lib/utils/cn";

interface QuizRecentResultsProps {
  results: QuizResult[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function ScoreBadge({
  score,
  total,
  percentage,
}: {
  score: number;
  total: number;
  percentage: number;
}) {
  const pct = Math.round(percentage);
  return (
    <span
      className={cn(
        "rounded-[2px] border px-2 py-0.5 font-display text-sm font-extrabold",
        pct >= 80
          ? "border-[var(--status-success)] text-[var(--status-success)]"
          : pct >= 50
            ? "border-[var(--accent-gold)] text-[var(--gold-on-light)]"
            : "border-[var(--accent-danger)] text-accent-danger",
      )}
    >
      {score}/{total}
    </span>
  );
}

export function QuizRecentResults({
  results,
  isLoading,
  onViewAll,
}: QuizRecentResultsProps) {
  return (
    <section className="rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)]">
      <div className="flex items-end justify-between gap-3 px-4 py-3 border-b border-[var(--text-primary)]">
        <div>
          <h3 className="archive-title mt-1 text-[20px]">
            Lịch sử làm bài
          </h3>
          <p className="mt-0.5 text-xs text-text-tertiary">
            Các lần nộp gần đây của bạn
          </p>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="archive-link shrink-0 text-[11px]"
          >
            Xem tất cả
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-sm text-content-muted">
          Đang tải...
        </div>
      ) : results.length === 0 ? (
        <div className="p-6 text-center text-sm text-content-muted">
          Chưa có lịch sử làm bài
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-default)]">
          {results.map((r) => (
            <div key={r.sessionId} className="px-4 py-3 transition-colors hover:bg-[var(--bg-elevated)]">
              <div className="mb-1.5 flex items-start justify-between gap-3">
                <p className="archive-title is-plain min-w-0 flex-1 truncate text-[16px]">
                  {r.quizTitle}
                </p>
                <ScoreBadge score={r.score} total={r.totalQuestions} percentage={r.percentage} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-content-muted">
                {formatDate(r.completedAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
