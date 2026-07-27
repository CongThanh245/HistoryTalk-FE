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
    <div className="mb-4 grid grid-cols-3 gap-2 md:mb-5 md:gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-lg border border-card-light-border bg-card-light-bg px-2.5 py-2.5 md:rounded-xl md:px-4 md:py-3"
        >
          <p className="line-clamp-1 text-[10px] font-semibold uppercase tracking-wide text-content-subtle md:text-xs">
            {s.label}
          </p>
          <p className="mt-1 text-lg font-bold leading-none text-content-heading md:text-xl">
            {s.value}
            <span className="text-sm font-semibold text-gold-on-light">
              {s.suffix}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}
