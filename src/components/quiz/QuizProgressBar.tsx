"use client";

// components/quiz/QuizProgressBar.tsx — v2
// Timer là optional — chỉ hiện đếm giờ khi useTimer = true

import React, { useEffect, useState } from "react";
import { Clock, ChevronLeft, TimerOff } from "lucide-react";

interface QuizProgressBarProps {
  quizTitle: string;
  totalQuestions: number;
  answeredCount: number;
  durationSeconds: number;
  useTimer: boolean; // ← optional timer
  onTimeUp: () => void;
  onBack: () => void;
}

export function QuizProgressBar({
  quizTitle,
  totalQuestions,
  answeredCount,
  durationSeconds,
  useTimer,
  onTimeUp,
  onBack,
}: QuizProgressBarProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [elapsed, setElapsed] = useState(0); // khi không dùng timer, đếm elapsed

  useEffect(() => {
    if (useTimer) {
      if (secondsLeft <= 0) {
        onTimeUp();
        return;
      }
      const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
      return () => clearInterval(t);
    } else {
      const t = setInterval(() => setElapsed((s) => s + 1), 1000);
      return () => clearInterval(t);
    }
  }, [secondsLeft, useTimer]); // eslint-disable-line

  const pct = Math.round((answeredCount / totalQuestions) * 100);
  const isUrgent = useTimer && secondsLeft < 60;

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

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
        {/* Back — với padding trái vì có sidebar toggle button */}
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg transition-colors hover:bg-black/5 ml-8"
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

        {/* Timer / Elapsed */}
        {useTimer ? (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold flex-shrink-0"
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
            {formatTime(secondsLeft)}
          </div>
        ) : (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs flex-shrink-0"
            style={{
              background: "var(--card-light-bg)",
              color: "var(--content-muted)",
              border: "1px solid var(--card-light-border)",
            }}
          >
            <TimerOff size={12} />
            {formatTime(elapsed)}
          </div>
        )}
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
