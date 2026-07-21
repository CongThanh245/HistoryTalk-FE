"use client";

import React, { useEffect, useRef, useState } from "react";
import { LayoutGrid, X } from "lucide-react";

interface QuizProgressBarProps {
  quizTitle: string;
  totalQuestions: number;
  answeredCount: number;
  answers: Record<string, number>;
  questionIds: string[];
  elapsedSeconds: number;
  limitedTime?: number;
  flagged?: Set<string>;
  practiceMode?: boolean;
  onBack: () => void;
  onGoHome: () => void;
  onRetry: () => void;
  scrollToQuestion: (index: number) => void;
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function QuizProgressBar({
  quizTitle,
  totalQuestions,
  answeredCount,
  answers,
  questionIds,
  elapsedSeconds,
  limitedTime,
  flagged,
  practiceMode,
  onBack,
  onGoHome,
  onRetry,
  scrollToQuestion,
}: QuizProgressBarProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const hasTimeLimit = typeof limitedTime === "number" && limitedTime > 0;
  const remainingSeconds = hasTimeLimit
    ? Math.max((limitedTime ?? 0) - elapsedSeconds, 0)
    : 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    if (panelOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [panelOpen]);

  const pct = Math.round((answeredCount / Math.max(totalQuestions, 1)) * 100);
  const timerDanger = hasTimeLimit && remainingSeconds <= 30;

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
      <div className="flex items-center gap-2 px-4 h-14">
        <button
          onClick={onBack}
          className="ml-8 h-9 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-black/5 flex-shrink-0"
          style={{ color: "var(--content-muted)" }}
          title="Quay lại"
        >
          Quay lại
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p
              className="text-xs font-medium truncate"
              style={{ color: "var(--content-muted)" }}
            >
              {quizTitle}
            </p>
            {practiceMode && (
              <span
                className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{
                  background: "var(--accent-gold-active-bg)",
                  color: "var(--gold-on-light)",
                  border: "1px solid rgba(201,162,77,0.35)",
                }}
              >
                Luyện tập
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--content-subtle)" }}>
            {answeredCount}/{totalQuestions} câu đã trả lời
          </p>
        </div>

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
          {answeredCount < totalQuestions && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: "var(--accent-gold)", color: "var(--bg-deep)" }}
            >
              {totalQuestions - answeredCount}
            </span>
          )}
        </button>

        <div
          className="flex min-w-[104px] flex-col items-center rounded-full px-3 py-1 text-xs flex-shrink-0"
          style={{
            background: timerDanger ? "rgba(184,50,42,0.10)" : "var(--card-light-bg)",
            color: timerDanger ? "var(--accent-danger)" : "var(--content-muted)",
            border: `1px solid ${timerDanger ? "rgba(184,50,42,0.22)" : "var(--card-light-border)"}`,
          }}
        >
          <span className="text-[10px] font-semibold leading-none">
            {hasTimeLimit ? "Còn lại" : "Thời gian"}
          </span>
          <span className="font-bold leading-5">
            {formatTime(hasTimeLimit ? remainingSeconds : elapsedSeconds)}
          </span>
        </div>

        <div
          className="w-px h-5 flex-shrink-0"
          style={{ background: "var(--card-light-border)" }}
        />

        <button
          onClick={onGoHome}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 flex-shrink-0"
          style={{
            background: "var(--card-light-bg)",
            color: "var(--content-muted)",
            border: "1px solid var(--card-light-border)",
          }}
          title="Về trang quiz"
        >
          <span className="hidden sm:inline">Về trang</span>
        </button>

        <button
          onClick={onRetry}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-85 flex-shrink-0"
          style={{
            background: "var(--abyssal-blue)",
            color: "var(--text-on-dark)",
          }}
          title="Làm lại"
        >
          <span className="hidden sm:inline">Làm lại</span>
        </button>
      </div>

      <div className="h-1" style={{ background: "var(--oatmeal)" }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: pct === 100 ? "#047857" : "var(--accent-gold)",
          }}
        />
      </div>

      {panelOpen && (
        <div
          className="absolute left-0 right-0 top-full z-30 px-4 py-3"
          style={{
            background: "var(--palladian)",
            borderBottom: "1px solid var(--oatmeal)",
            boxShadow: "0 6px 20px rgba(27,38,50,0.1)",
          }}
        >
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
              {!!flagged?.size && (
                <span className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ background: "var(--accent-danger)" }}
                  />
                  Đã đánh dấu ({flagged.size})
                </span>
              )}
            </div>
            <button
              onClick={() => setPanelOpen(false)}
              style={{ color: "var(--content-muted)" }}
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {questionIds.map((qId, idx) => {
              const answered = answers[qId] !== undefined;
              const isFlagged = flagged?.has(qId);
              return (
                <button
                  key={qId}
                  onClick={() => scrollToQuestion(idx)}
                  className="relative w-8 h-8 rounded-lg text-xs font-bold transition-colors"
                  style={
                    answered
                      ? { background: "var(--accent-gold)", color: "var(--bg-deep)" }
                      : {
                          background: "var(--card-light-bg)",
                          color: "var(--content-muted)",
                          border: "1px solid var(--card-light-border)",
                        }
                  }
                >
                  {idx + 1}
                  {isFlagged && (
                    <span
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                      style={{ background: "var(--accent-danger)", border: "1.5px solid var(--palladian)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
