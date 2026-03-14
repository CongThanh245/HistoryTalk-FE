"use client";

// components/quiz/QuizProgressBar.tsx
// Sticky progress bar hiển thị số câu đã trả lời + thời gian còn lại

import React, { useEffect, useState } from "react";
import { Clock, ChevronLeft } from "lucide-react";

interface QuizProgressBarProps {
  quizTitle: string;
  totalQuestions: number;
  answeredCount: number;
  durationSeconds: number; // tổng thời gian
  onTimeUp: () => void;
  onBack: () => void;
}

export function QuizProgressBar({
  quizTitle,
  totalQuestions,
  answeredCount,
  durationSeconds,
  onTimeUp,
  onBack,
}: QuizProgressBarProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onTimeUp();
      return;
    }
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]); // eslint-disable-line

  const pct = Math.round((answeredCount / totalQuestions) * 100);
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft < 60;

  return (
    <div
      className="sticky top-0 z-20 flex-shrink-0"
      style={{
        background: "var(--palladian)",
        borderBottom: "1px solid var(--oatmeal)",
        boxShadow: "0 2px 8px rgba(27,38,50,0.06)",
      }}
    >
      <div className="flex items-center gap-3 px-4 h-14">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg transition-colors hover:bg-black/5 flex-shrink-0"
          style={{ color: "var(--content-muted)" }}
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-medium truncate"
            style={{ color: "var(--content-muted)" }}
          >
            {quizTitle}
          </p>
          <p className="text-xs" style={{ color: "var(--content-subtle)" }}>
            {answeredCount}/{totalQuestions} câu đã trả lời
          </p>
        </div>

        {/* Timer */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold flex-shrink-0 transition-colors"
          style={
            isUrgent
              ? {
                  background: "rgba(239,68,68,0.1)",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.2)",
                }
              : {
                  background: "var(--card-light-bg)",
                  color: "var(--content-heading)",
                  border: "1px solid var(--card-light-border)",
                }
          }
        >
          <Clock size={13} className={isUrgent ? "animate-pulse" : ""} />
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1" style={{ background: "var(--oatmeal)" }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background:
              pct === 100
                ? "linear-gradient(90deg, #10b981, #059669)"
                : "linear-gradient(90deg, var(--accent-gold), var(--truffle))",
          }}
        />
      </div>
    </div>
  );
}
