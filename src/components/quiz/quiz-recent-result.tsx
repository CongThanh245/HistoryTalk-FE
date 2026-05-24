// components/quiz/QuizRecentResults.tsx
// Bảng lịch sử làm bài gần đây

import React from "react";
import { Trophy, Calendar, Timer } from "lucide-react";
import type { QuizResult } from "@/services/quiz.service";


interface QuizRecentResultsProps {
  results: QuizResult[];
  isLoading?: boolean;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDuration(totalSeconds: number) {
  if (!totalSeconds) return "0 phút";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} giây`;
  if (seconds === 0) return `${minutes} phút`;
  return `${minutes} phút ${seconds} giây`;
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
  const color =
    pct >= 80
      ? "text-emerald-500 bg-emerald-500/10"
      : pct >= 50
      ? "text-[var(--burning-flame)] bg-[var(--streak-bg)]"
      : "text-[var(--accent-danger)] bg-[var(--accent-blood)]/20";
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${color}`}>
      {score}/{total} ({pct}%)
    </span>
  );
}

export function QuizRecentResults({ results, isLoading }: QuizRecentResultsProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--card-light-bg)",
        border: "1px solid var(--card-light-border)",
      }}
    >
      <div
        className="flex items-center gap-2 px-5 py-4"
        style={{ borderBottom: "1px solid var(--card-light-border)" }}
      >
        <Trophy size={16} style={{ color: "var(--accent-gold)" }} />
        <h3 className="font-semibold text-sm" style={{ color: "var(--content-heading)" }}>
          Lịch sử làm bài
        </h3>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm" style={{ color: "var(--content-muted)" }}>
          Đang tải...
        </div>
      ) : results.length === 0 ? (
        <div className="p-8 text-center text-sm" style={{ color: "var(--content-muted)" }}>
          Chưa có lịch sử làm bài
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--card-light-border)" }}>
          {results.map((r) => (
            <div key={r.sessionId} className="flex items-center justify-between px-5 py-3 hover:bg-[var(--card-light-hover)] transition-colors">
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-sm font-medium truncate" style={{ color: "var(--content-heading)" }}>
                  {r.quizTitle}
                </p>
                <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: "var(--content-muted)" }}>
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {formatDate(r.completedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Timer size={11} />
                    {formatDuration(r.durationSeconds)}
                  </span>
                </div>
              </div>
              <ScoreBadge
                score={r.score}
                total={r.totalQuestions}
                percentage={r.percentage}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
