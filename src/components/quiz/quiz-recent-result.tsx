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
        "rounded-md px-2 py-1 text-xs font-bold",
        pct >= 80
          ? "bg-emerald-500/10 text-[#047857]"
          : pct >= 50
            ? "bg-accent-gold/14 text-gold-on-light"
            : "bg-accent-danger/10 text-accent-danger",
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
    <section className="rounded-xl border border-card-light-border bg-card-light-bg">
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-card-light-border">
        <div>
          <h3 className="text-sm font-bold text-content-heading">
            Lịch sử làm bài
          </h3>
          <p className="mt-0.5 text-xs text-content-muted">
            Các lần nộp gần đây của bạn
          </p>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="shrink-0 rounded-md px-2 py-1 text-xs font-bold transition-colors hover:bg-black/[0.04] text-gold-on-light"
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
        <div className="divide-y divide-card-light-border">
          {results.map((r) => (
            <div key={r.sessionId} className="px-4 py-3 transition-colors hover:bg-black/[0.025]">
              <div className="mb-1.5 flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-content-heading">
                  {r.quizTitle}
                </p>
                <ScoreBadge score={r.score} total={r.totalQuestions} percentage={r.percentage} />
              </div>
              <p className="text-xs text-content-muted">
                {formatDate(r.completedAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
