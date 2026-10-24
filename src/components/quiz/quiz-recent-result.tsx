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
        "shrink-0 rounded-full px-2 py-0.5 text-[13px] font-semibold tabular-nums",
        pct >= 80
          ? "bg-[var(--status-success-bg)] text-[var(--status-success)]"
          : pct >= 50
            ? "bg-[var(--accent-gold-active-bg)] text-[var(--gold-on-light)]"
            : "bg-[var(--status-danger-bg)] text-accent-danger",
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
    <section className="overflow-hidden rounded-xl border border-border-card bg-[var(--bg-surface)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-default)] px-4 py-3">
        <div>
          <h3 className="text-base font-semibold text-content-heading">
            Lịch sử làm bài
          </h3>
          <p className="mt-0.5 text-xs text-text-tertiary">
            Các lần nộp gần đây của bạn
          </p>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="archive-link shrink-0 text-[13px]"
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
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-content-heading">
                  {r.quizTitle}
                </p>
                <ScoreBadge score={r.score} total={r.totalQuestions} percentage={r.percentage} />
              </div>
              <p className="text-xs tabular-nums text-content-muted">
                {formatDate(r.completedAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
