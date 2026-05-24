// components/quiz/QuizStatsBar.tsx
// Thanh thống kê tổng quan (tổng quiz, đã làm, trung bình điểm)

import React from "react";
import { BookOpen, CheckCircle, TrendingUp, Users } from "lucide-react";

interface QuizStatsBarProps {
  totalQuizzes: number;
  completedCount: number;
  averageScore: number; // 0-100
  totalPlayCount: number;
}

export function QuizStatsBar({
  totalQuizzes,
  completedCount,
  averageScore,
  totalPlayCount,
}: QuizStatsBarProps) {
  const stats = [
    {
      icon: <BookOpen size={18} />,
      label: "Bộ câu hỏi",
      value: totalQuizzes,
      suffix: "",
      color: "text-[var(--accent-gold)]",
      bg: "bg-[var(--accent-gold-active-bg)]",
    },
    {
      icon: <CheckCircle size={18} />,
      label: "Đã hoàn thành",
      value: completedCount,
      suffix: " lần",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      icon: <TrendingUp size={18} />,
      label: "Điểm trung bình",
      value: averageScore,
      suffix: "%",
      color: "text-[var(--accent-blue)]",
      bg: "bg-[var(--accent-blue)]/10",
    },
    {
      icon: <Users size={18} />,
      label: "Tổng lượt làm",
      value: totalPlayCount,
      suffix: "",
      color: "text-[var(--burning-flame)]",
      bg: "bg-[var(--streak-bg)]",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{
            background: "var(--card-light-bg)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className={`p-2 rounded-lg ${s.bg} ${s.color} flex-shrink-0`}>
            {s.icon}
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--content-muted)" }}>
              {s.label}
            </p>
            <p className={`text-lg font-bold leading-tight ${s.color}`}>
              {s.value}
              <span className="text-sm font-normal">{s.suffix}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
