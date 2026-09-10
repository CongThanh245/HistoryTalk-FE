"use client";

import React, { useEffect, useRef, useState } from "react";
import { LayoutGrid, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

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
      className="sticky top-0 z-20 flex-shrink-0 bg-[var(--palladian)] border-b border-[var(--oatmeal)] shadow-[0_2px_8px_rgba(27,38,50,0.06)]"
    >
      <div className="flex items-center gap-2 px-4 h-14">
        <button
          onClick={onBack}
          className="ml-8 h-9 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-black/5 flex-shrink-0 text-content-muted"
          title="Quay lại"
        >
          Quay lại
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium truncate text-content-muted">
              {quizTitle}
            </p>
            {practiceMode && (
              <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold bg-accent-gold-active text-gold-on-light border border-accent-gold/35">
                Luyện tập
              </span>
            )}
          </div>
          <p className="text-xs text-content-subtle">
            {answeredCount}/{totalQuestions} câu đã trả lời
          </p>
        </div>

        <button
          onClick={() => setPanelOpen((v) => !v)}
          className={cn(
            "p-1.5 rounded-lg transition-colors hover:bg-black/5 flex-shrink-0 relative",
            panelOpen
              ? "text-accent-gold bg-accent-gold-active"
              : "text-content-muted bg-transparent",
          )}
          title="Danh sách câu hỏi"
        >
          <LayoutGrid size={16} />
          {answeredCount < totalQuestions && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center bg-accent-gold text-bg-deep">
              {totalQuestions - answeredCount}
            </span>
          )}
        </button>

        <div
          className={cn(
            "flex min-w-[104px] flex-col items-center rounded-full px-3 py-1 text-xs flex-shrink-0 border",
            timerDanger
              ? "bg-accent-danger/10 text-accent-danger border-accent-danger/22"
              : "bg-card-light-bg text-content-muted border-card-light-border",
          )}
        >
          <span className="text-[10px] font-semibold leading-none">
            {hasTimeLimit ? "Còn lại" : "Thời gian"}
          </span>
          <span className="font-bold leading-5">
            {formatTime(hasTimeLimit ? remainingSeconds : elapsedSeconds)}
          </span>
        </div>

        <div className="w-px h-5 flex-shrink-0 bg-card-light-border" />

        <button
          onClick={onGoHome}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 flex-shrink-0 bg-card-light-bg text-content-muted border border-card-light-border"
          title="Về trang quiz"
        >
          <span className="hidden sm:inline">Về trang</span>
        </button>

        <button
          onClick={onRetry}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-85 flex-shrink-0 bg-[var(--abyssal-blue)] text-[var(--text-on-dark)]"
          title="Làm lại"
        >
          <span className="hidden sm:inline">Làm lại</span>
        </button>
      </div>

      <div className="h-1 bg-[var(--oatmeal)]">
        <div
          className={cn(
            "h-full transition-all duration-500",
            pct === 100 ? "bg-[#047857]" : "bg-accent-gold",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {panelOpen && (
        <div className="absolute left-0 right-0 top-full z-30 px-4 py-3 bg-[var(--palladian)] border-b border-[var(--oatmeal)] shadow-[0_6px_20px_rgba(27,38,50,0.1)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 text-xs text-content-muted">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm inline-block bg-accent-gold" />
                Đã làm ({answeredCount})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm inline-block bg-card-light-bg border border-card-light-border" />
                Chưa làm ({totalQuestions - answeredCount})
              </span>
              {!!flagged?.size && (
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block bg-accent-danger" />
                  Đã đánh dấu ({flagged.size})
                </span>
              )}
            </div>
            <button
              onClick={() => setPanelOpen(false)}
              className="text-content-muted"
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
                  className={cn(
                    "relative w-8 h-8 rounded-lg text-xs font-bold transition-colors",
                    answered
                      ? "bg-accent-gold text-bg-deep"
                      : "bg-card-light-bg text-content-muted border border-card-light-border",
                  )}
                >
                  {idx + 1}
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent-danger border-[1.5px] border-[var(--palladian)]" />
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
