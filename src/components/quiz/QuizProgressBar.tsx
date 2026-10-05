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
      className="sticky top-0 z-20 flex-shrink-0 bg-[var(--bg-surface)] border-b border-[var(--text-primary)]"
    >
      <div className="flex items-center gap-2 px-4 h-14">
        <button
          onClick={onBack}
          className="ml-8 h-9 rounded-[2px] px-3 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)] flex-shrink-0 text-content-heading"
          title="Quay lại"
        >
          Quay lại
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="archive-title is-plain text-[15px] truncate">
              {quizTitle}
            </p>
            {practiceMode && (
              <span className="flex-shrink-0 rounded-[2px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] bg-[var(--accent-gold)] text-[#FFFFFF]">
                Luyện tập
              </span>
            )}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-content-muted">
            {answeredCount}/{totalQuestions} câu đã trả lời
          </p>
        </div>

        <button
          onClick={() => setPanelOpen((v) => !v)}
          className={cn(
            "p-1.5 rounded-[2px] border transition-colors flex-shrink-0 relative",
            panelOpen
              ? "bg-[var(--text-primary)] text-[var(--text-inverse)] border-[var(--text-primary)]"
              : "text-content-heading bg-transparent border-[var(--border-strong)] hover:border-[var(--text-primary)]",
          )}
          title="Danh sách câu hỏi"
        >
          <LayoutGrid size={16} />
          {answeredCount < totalQuestions && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-[2px] text-[10px] font-bold flex items-center justify-center bg-accent-gold text-[#FFFFFF]">
              {totalQuestions - answeredCount}
            </span>
          )}
        </button>

        <div
          className={cn(
            "flex min-w-[104px] flex-col items-center rounded-[2px] px-3 py-1 text-xs flex-shrink-0 border",
            timerDanger
              ? "bg-[var(--status-danger-bg)] text-accent-danger border-[var(--accent-danger)]"
              : "bg-[var(--bg-elevated)] text-content-heading border-[var(--text-primary)]",
          )}
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.12em] leading-none opacity-75">
            {hasTimeLimit ? "Còn lại" : "Thời gian"}
          </span>
          <span className="font-display text-lg font-extrabold leading-5 tabular-nums">
            {formatTime(hasTimeLimit ? remainingSeconds : elapsedSeconds)}
          </span>
        </div>

        <div className="w-px h-5 flex-shrink-0 bg-[var(--border-strong)]" />

        <button
          onClick={onGoHome}
          className="px-3 py-1.5 rounded-[2px] text-[11px] font-bold uppercase tracking-[0.08em] transition-colors flex-shrink-0 bg-transparent text-content-heading border border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]"
          title="Về trang quiz"
        >
          <span className="hidden sm:inline">Về trang</span>
        </button>

        <button
          onClick={onRetry}
          className="px-3 py-1.5 rounded-[2px] text-[11px] font-bold uppercase tracking-[0.08em] transition-colors flex-shrink-0 bg-[var(--text-primary)] text-[var(--text-inverse)] border border-[var(--text-primary)] hover:bg-[var(--accent-gold)] hover:border-[var(--accent-gold)] hover:text-[#FFFFFF]"
          title="Làm lại"
        >
          <span className="hidden sm:inline">Làm lại</span>
        </button>
      </div>

      <div className="h-1 bg-[var(--border-default)]">
        <div
          className={cn(
            "h-full transition-all duration-500",
            pct === 100 ? "bg-[var(--status-success)]" : "bg-accent-gold",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {panelOpen && (
        <div className="absolute left-0 right-0 top-full z-30 px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--text-primary)] shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.08em] text-content-muted">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-[1px] inline-block bg-[var(--text-primary)]" />
                Đã làm ({answeredCount})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-[1px] inline-block bg-[var(--bg-surface)] border border-[var(--border-strong)]" />
                Chưa làm ({totalQuestions - answeredCount})
              </span>
              {!!flagged?.size && (
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full inline-block bg-accent-gold" />
                  Đã đánh dấu ({flagged.size})
                </span>
              )}
            </div>
            <button
              onClick={() => setPanelOpen(false)}
              className="text-content-muted transition-colors hover:text-content-heading"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex flex-wrap gap-1">
            {questionIds.map((qId, idx) => {
              const answered = answers[qId] !== undefined;
              const isFlagged = flagged?.has(qId);
              return (
                <button
                  key={qId}
                  onClick={() => scrollToQuestion(idx)}
                  className={cn(
                    "relative w-8 h-8 rounded-[2px] text-xs font-bold transition-colors border tabular-nums",
                    answered
                      ? "bg-[var(--text-primary)] text-[var(--text-inverse)] border-[var(--text-primary)]"
                      : "bg-[var(--bg-surface)] text-content-muted border-[var(--border-strong)] hover:border-[var(--text-primary)]",
                  )}
                >
                  {idx + 1}
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent-gold border-[1.5px] border-[var(--bg-surface)]" />
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
