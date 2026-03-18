"use client";

// components/quiz/QuizProgressBar.tsx — v3

import React, { useEffect, useState, useRef } from "react";
import {
  Clock,
  ChevronLeft,
  TimerOff,
  LayoutGrid,
  Home,
  RotateCcw,
  X,
} from "lucide-react";

interface QuizProgressBarProps {
  quizTitle: string;
  totalQuestions: number;
  answeredCount: number;
  answers: Record<string, number>; // questionId → selectedIndex
  questionIds: string[]; // ordered list để biết câu nào là câu mấy
  durationSeconds: number;
  useTimer: boolean;
  onTimeUp: () => void;
  onBack: () => void;
  onGoHome: () => void; // ← mới
  onRetry: () => void; // ← mới
  scrollToQuestion: (index: number) => void; // ← mới
}

export function QuizProgressBar({
  quizTitle,
  totalQuestions,
  answeredCount,
  answers,
  questionIds,
  durationSeconds,
  useTimer,
  onTimeUp,
  onBack,
  onGoHome,
  onRetry,
  scrollToQuestion,
}: QuizProgressBarProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [elapsed, setElapsed] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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
  }, [secondsLeft, useTimer]);

  // Click outside đóng panel
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    if (panelOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [panelOpen]);

  const pct = Math.round((answeredCount / totalQuestions) * 100);
  const isUrgent = useTimer && secondsLeft < 60;

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  return (
    <div
      ref={panelRef}
      className="sticky top-0 z-20 flex-shrink-0"
      style={{
        background: "var(--palladian)",
        borderBottom: "1px solid var(--oatmeal)",
        boxShadow: "0 2px 8px rgba(27,38,50,0.06)",
      }}
    >
      {/* Main bar */}
      <div className="flex items-center gap-2 px-4 h-14">
        {/* Back */}
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg transition-colors hover:bg-black/5 ml-8 flex-shrink-0"
          style={{ color: "var(--content-muted)" }}
          title="Quay lại"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Title */}
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

        {/* Question grid toggle */}
        <button
          onClick={() => setPanelOpen((v) => !v)}
          className="p-1.5 rounded-lg transition-colors hover:bg-black/5 flex-shrink-0 relative"
          style={{
            color: panelOpen ? "var(--accent-gold)" : "var(--content-muted)",
            background: panelOpen
              ? "var(--accent-gold-active-bg)"
              : "transparent",
          }}
          title="Danh sách câu hỏi"
        >
          <LayoutGrid size={16} />
          {/* Badge số câu chưa làm */}
          {answeredCount < totalQuestions && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: "var(--accent-gold)", color: "white" }}
            >
              {totalQuestions - answeredCount}
            </span>
          )}
        </button>

        {/* Timer */}
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

        {/* Divider */}
        <div
          className="w-px h-5 flex-shrink-0"
          style={{ background: "var(--card-light-border)" }}
        />

        {/* Home */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 flex-shrink-0"
          style={{
            background: "var(--card-light-bg)",
            color: "var(--content-muted)",
            border: "1px solid var(--card-light-border)",
          }}
          title="Về trang quiz"
        >
          <Home size={13} />
          <span className="hidden sm:inline">Về trang</span>
        </button>

        {/* Retry */}
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 flex-shrink-0"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
            color: "white",
          }}
          title="Làm lại"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">Làm lại</span>
        </button>
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

      {/* Dropdown panel câu hỏi */}
      {panelOpen && (
        <div
          className="absolute left-0 right-0 top-full z-30 px-4 py-3"
          style={{
            background: "var(--palladian)",
            borderBottom: "1px solid var(--oatmeal)",
            boxShadow: "0 6px 20px rgba(27,38,50,0.1)",
          }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between mb-2">
            <div
              className="flex items-center gap-3 text-xs"
              style={{ color: "var(--content-muted)" }}
            >
              <span className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block"
                  style={{ background: "var(--accent-gold)" }}
                />
                Đã làm ({answeredCount})
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block"
                  style={{
                    background: "var(--card-light-bg)",
                    border: "1px solid var(--card-light-border)",
                  }}
                />
                Chưa làm ({totalQuestions - answeredCount})
              </span>
            </div>
            <button
              onClick={() => setPanelOpen(false)}
              style={{ color: "var(--content-muted)" }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Grid số câu */}
          <div className="flex flex-wrap gap-1.5">
            {questionIds.map((qId, idx) => {
              const answered = answers[qId] !== undefined;
              return (
                <button
                  key={qId}
                  onClick={() => {
                    scrollToQuestion(idx);
                    // setPanelOpen(false);
                  }}
                  className="w-8 h-8 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95"
                  style={
                    answered
                      ? { background: "var(--accent-gold)", color: "white" }
                      : {
                          background: "var(--card-light-bg)",
                          color: "var(--content-muted)",
                          border: "1px solid var(--card-light-border)",
                        }
                  }
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
