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
    <div className="mb-4 grid grid-cols-3 border-t border-l border-[var(--text-primary)] md:mb-6">
      {stats.map((s) => (
        <div
          key={s.label}
          className="border-r border-b border-[var(--text-primary)] bg-[var(--bg-surface)] px-2.5 py-2.5 md:px-5 md:py-4"
        >
          <p className="line-clamp-1 text-[10px] font-bold uppercase tracking-[0.1em] text-content-muted md:text-[11px]">
            {s.label}
          </p>
          <p className="mt-1.5 font-display text-2xl font-extrabold leading-none text-content-heading md:text-4xl">
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
