import React from "react";
import { CalendarDays, Clock3, RotateCcw } from "lucide-react";
import type { QuizResult } from "@/services/quiz.service";

interface QuizHistoryViewProps {
  results: QuizResult[];
  isLoading?: boolean;
  onRetake: (quizId: string) => void;
}

function formatDateTime(iso: string) {
  if (!iso) return "Chưa rõ thời gian";
  const date = new Date(iso);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds?: number) {
  if (!seconds) return "Không ghi nhận";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes <= 0) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}

function getTone(percentage: number) {
  if (percentage >= 80) {
    return { bg: "rgba(16,185,129,0.10)", fg: "#047857" };
  }
  if (percentage >= 50) {
    return { bg: "rgba(201,162,77,0.14)", fg: "var(--gold-on-light)" };
  }
  return { bg: "rgba(184,50,42,0.10)", fg: "var(--accent-danger)" };
}

export function QuizHistoryView({
  results,
  isLoading,
  onRetake,
}: QuizHistoryViewProps) {
  return (
    <section
      className="rounded-xl border"
      style={{
        background: "var(--card-light-bg)",
        borderColor: "var(--card-light-border)",
      }}
    >
      <div
        className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-end sm:justify-between"
        style={{ borderBottom: "1px solid var(--card-light-border)" }}
      >
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--content-heading)" }}>
            Lịch sử làm bài
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--content-muted)" }}>
            Xem lại các lần nộp trước đây của bạn.
          </p>
        </div>
        <span
          className="rounded-md px-2.5 py-1 text-xs font-bold"
          style={{
            background: "rgba(27,38,50,0.05)",
            color: "var(--content-muted)",
          }}
        >
          {results.length} lần làm
        </span>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-sm" style={{ color: "var(--content-muted)" }}>
          Đang tải lịch sử...
        </div>
      ) : results.length === 0 ? (
        <div className="p-10 text-center">
          <p className="font-semibold" style={{ color: "var(--content-heading)" }}>
            Chưa có lịch sử làm bài
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--content-muted)" }}>
            Sau khi nộp bài, kết quả sẽ xuất hiện ở đây.
          </p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--card-light-border)" }}>
          {results.map((result) => {
            const tone = getTone(result.percentage);
            return (
              <article
                key={result.sessionId}
                className="grid gap-4 px-5 py-4 transition-colors hover:bg-black/[0.025] md:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-bold" style={{ color: "var(--content-heading)" }}>
                      {result.quizTitle}
                    </h3>
                    <span
                      className="rounded-md px-2 py-1 text-xs font-bold"
                      style={{ background: tone.bg, color: tone.fg }}
                    >
                      {result.score}/{result.totalQuestions}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs" style={{ color: "var(--content-muted)" }}>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={14} />
                      {formatDateTime(result.completedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 size={14} />
                      {formatDuration(result.durationSeconds)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onRetake(result.quizId)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition-all hover:-translate-y-0.5 active:translate-y-0"
                  style={{
                    background: "var(--abyssal-blue)",
                    color: "var(--text-on-dark)",
                    boxShadow: "0 8px 18px rgba(27,38,50,0.14)",
                  }}
                >
                  <RotateCcw size={16} />
                  Làm lại
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
