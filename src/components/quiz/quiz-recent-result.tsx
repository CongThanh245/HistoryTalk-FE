import React from "react";
import type { QuizResult } from "@/services/quiz.service";

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
  const tone =
    pct >= 80
      ? { bg: "rgba(16,185,129,0.10)", fg: "#047857" }
      : pct >= 50
        ? { bg: "rgba(201,162,77,0.14)", fg: "var(--gold-on-light)" }
        : { bg: "rgba(184,50,42,0.10)", fg: "var(--accent-danger)" };
  return (
    <span
      className="rounded-md px-2 py-1 text-xs font-bold"
      style={{ background: tone.bg, color: tone.fg }}
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
    <section
      className="rounded-xl border"
      style={{
        background: "var(--card-light-bg)",
        borderColor: "var(--card-light-border)",
      }}
    >
      <div
        className="flex items-start justify-between gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid var(--card-light-border)" }}
      >
        <div>
          <h3 className="text-sm font-bold" style={{ color: "var(--content-heading)" }}>
            Lịch sử làm bài
          </h3>
          <p className="mt-0.5 text-xs" style={{ color: "var(--content-muted)" }}>
            Các lần nộp gần đây của bạn
          </p>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="shrink-0 rounded-md px-2 py-1 text-xs font-bold transition-colors hover:bg-black/[0.04]"
            style={{ color: "var(--gold-on-light)" }}
          >
            Xem tất cả
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-sm" style={{ color: "var(--content-muted)" }}>
          Đang tải...
        </div>
      ) : results.length === 0 ? (
        <div className="p-6 text-center text-sm" style={{ color: "var(--content-muted)" }}>
          Chưa có lịch sử làm bài
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--card-light-border)" }}>
          {results.map((r) => (
            <div key={r.sessionId} className="px-4 py-3 transition-colors hover:bg-black/[0.025]">
              <div className="mb-1.5 flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 truncate text-sm font-semibold" style={{ color: "var(--content-heading)" }}>
                  {r.quizTitle}
                </p>
                <ScoreBadge score={r.score} total={r.totalQuestions} percentage={r.percentage} />
              </div>
              <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                {formatDate(r.completedAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
