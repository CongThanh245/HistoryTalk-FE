import React from "react";

interface QuizStatsBarProps {
  totalQuizzes: number;
  completedCount: number;
  averageScore: number;
}

export function QuizStatsBar({
  totalQuizzes,
  completedCount,
  averageScore,
}: QuizStatsBarProps) {
  const stats = [
    { label: "Bộ đề đang mở", value: totalQuizzes, suffix: "" },
    { label: "Lần đã làm", value: completedCount, suffix: "" },
    { label: "Điểm trung bình", value: averageScore, suffix: "%" },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border px-5 py-4"
          style={{
            background: "var(--card-light-bg)",
            borderColor: "var(--card-light-border)",
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--content-subtle)" }}>
            {s.label}
          </p>
          <p className="mt-2 text-2xl font-bold leading-none" style={{ color: "var(--content-heading)" }}>
            {s.value}
            <span className="text-base font-semibold" style={{ color: "var(--gold-on-light)" }}>
              {s.suffix}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}
