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
          className="rounded-lg border px-2.5 py-2.5 md:rounded-xl md:px-4 md:py-3"
          style={{
            background: "var(--card-light-bg)",
            borderColor: "var(--card-light-border)",
          }}
        >
          <p className="line-clamp-1 text-[10px] font-semibold uppercase tracking-wide md:text-xs" style={{ color: "var(--content-subtle)" }}>
            {s.label}
          </p>
          <p className="mt-1 text-lg font-bold leading-none md:text-xl" style={{ color: "var(--content-heading)" }}>
            {s.value}
            <span className="text-sm font-semibold" style={{ color: "var(--gold-on-light)" }}>
              {s.suffix}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}
