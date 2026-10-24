import React from "react";

interface QuizStatsBarProps {
  totalQuizzes: number;
  completedCount: number;
  averageScore: number | string;
}

export function QuizStatsBar({
  totalQuizzes,
  completedCount,
  averageScore,
}: QuizStatsBarProps) {
  const stats = [
    { label: "Bộ đề đang mở", value: totalQuizzes, suffix: "" },
    { label: "Lần đã làm", value: completedCount, suffix: "" },
    { label: "Điểm trung bình", value: averageScore, suffix: "" },
  ];

  return (
    <div className="mb-5 grid grid-cols-3 gap-2 md:mb-6 md:gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-border-card bg-[var(--bg-surface)] px-3 py-3 md:px-5 md:py-4"
        >
          <p className="line-clamp-1 text-xs text-[var(--text-secondary)] md:text-sm">
            {s.label}
          </p>
          <p className="mt-1.5 text-xl font-bold leading-none tabular-nums text-content-heading md:text-[28px]">
            {s.value}
            <span className="text-sm font-semibold text-[var(--gold-on-light)]">
              {s.suffix}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}
