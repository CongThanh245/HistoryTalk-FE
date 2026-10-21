"use client";

import React from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatTime } from "./QuizProgressBar";

interface QuizNavPanelProps {
  totalQuestions: number;
  answeredCount: number;
  answers: Record<string, unknown>;
  questionIds: string[];
  elapsedSeconds: number;
  limitedTime?: number;
  flagged?: Set<string>;
  /** So cau tra loi lien tiep (luyen tap: so cau dung lien tiep). */
  streak?: number;
  submitting: boolean;
  onSubmit: () => void;
  onRetry: () => void;
  scrollToQuestion: (index: number) => void;
}

const RING_R = 32;
const RING_C = 2 * Math.PI * RING_R;

function moodLine(pct: number) {
  if (pct === 0) return "Sẵn sàng chưa? Bắt đầu thôi! 🚀";
  if (pct < 50) return "Khởi đầu tốt lắm! 👍";
  if (pct < 80) return "Đã qua nửa chặng! 💪";
  if (pct < 100) return "Sắp về đích rồi! 🏁";
  return "Hoàn thành! Nộp bài nhé 🎉";
}

/** Cot ben phai khi lam bai (man rong): dong ho, tien do, luoi cau hoi va nut nop bai luon trong tam mat. */
export function QuizNavPanel({
  totalQuestions,
  answeredCount,
  answers,
  questionIds,
  elapsedSeconds,
  limitedTime,
  flagged,
  streak = 0,
  submitting,
  onSubmit,
  onRetry,
  scrollToQuestion,
}: QuizNavPanelProps) {
  const hasTimeLimit = typeof limitedTime === "number" && limitedTime > 0;
  const remainingSeconds = hasTimeLimit
    ? Math.max((limitedTime ?? 0) - elapsedSeconds, 0)
    : 0;
  const timerDanger = hasTimeLimit && remainingSeconds <= 30;
  const allAnswered = answeredCount === totalQuestions;
  const pct = Math.round((answeredCount / Math.max(totalQuestions, 1)) * 100);

  const handleRetry = () => {
    if (
      answeredCount > 0 &&
      !window.confirm("Làm lại từ đầu? Các câu đã trả lời sẽ bị xóa.")
    )
      return;
    onRetry();
  };

  return (
    <div className="overflow-hidden rounded-[4px] border-2 border-[var(--text-primary)] bg-[var(--bg-surface)] shadow-[5px_5px_0_var(--text-primary)]">
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-b px-4 py-3",
          timerDanger
            ? "border-[var(--accent-danger)] bg-[var(--status-danger-bg)] text-accent-danger"
            : "border-[var(--text-primary)] text-content-heading",
        )}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-75">
          {hasTimeLimit ? "Thời gian còn lại" : "Thời gian làm bài"}
        </span>
        <span className="font-display text-[26px] font-extrabold leading-none tabular-nums">
          {formatTime(hasTimeLimit ? remainingSeconds : elapsedSeconds)}
        </span>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="relative h-[76px] w-[76px] flex-shrink-0">
            <svg
              viewBox="0 0 76 76"
              className="h-full w-full -rotate-90"
              aria-hidden="true"
            >
              <circle
                cx="38"
                cy="38"
                r={RING_R}
                fill="none"
                strokeWidth="8"
                className="stroke-[var(--border-default)]"
              />
              <circle
                cx="38"
                cy="38"
                r={RING_R}
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - pct / 100)}
                className={cn(
                  "transition-[stroke-dashoffset] duration-700 ease-out",
                  allAnswered
                    ? "stroke-[var(--status-success)]"
                    : "stroke-[var(--accent-gold)]",
                )}
              />
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
              <span className="font-display text-[20px] font-extrabold tabular-nums text-content-heading">
                {answeredCount}
              </span>
              <span className="text-[10px] font-semibold text-content-muted">
                /{totalQuestions}
              </span>
            </span>
          </div>
          <div className="min-w-0 space-y-1.5">
            <p className="text-[14px] font-bold leading-snug text-content-heading">
              {moodLine(pct)}
            </p>
            {streak >= 2 && (
              <span
                key={streak}
                className="quiz-pop inline-flex items-center gap-1 rounded-full bg-[var(--accent-gold)] px-2.5 py-0.5 text-[12px] font-extrabold text-[#FFFFFF]"
              >
                <span className="quiz-flame inline-block">🔥</span>
                Chuỗi x{streak}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {questionIds.map((qId, idx) => {
            const answered = answers[qId] !== undefined;
            const isFlagged = flagged?.has(qId);
            return (
              <button
                key={qId}
                type="button"
                onClick={() => scrollToQuestion(idx)}
                aria-label={`Câu ${idx + 1}${answered ? ", đã trả lời" : ""}${isFlagged ? ", đã đánh dấu" : ""}`}
                className={cn(
                  "relative h-9 rounded-[4px] border-2 text-xs font-bold tabular-nums transition-all hover:-translate-y-0.5",
                  answered
                    ? "quiz-pop border-[var(--jade)] bg-[var(--jade)] text-[#FFFFFF] shadow-[0_3px_0_color-mix(in_srgb,var(--jade)_60%,black)]"
                    : "border-[var(--border-strong)] bg-[var(--bg-surface)] text-content-muted shadow-[0_3px_0_var(--border-strong)] hover:border-[var(--text-primary)]",
                )}
              >
                {idx + 1}
                {isFlagged && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-[1.5px] border-[var(--bg-surface)] bg-accent-gold" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-content-muted">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-[1px] bg-[var(--jade)]" />
            Đã làm
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-[1px] border border-[var(--border-strong)] bg-[var(--bg-surface)]" />
            Chưa làm
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent-gold" />
            Đánh dấu
          </span>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className={cn(
            "h-12 w-full rounded-[6px] text-[14px] font-extrabold uppercase tracking-[0.06em] transition-all hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:opacity-60",
            allAnswered
              ? "bg-[var(--status-success)] text-[#FFFFFF] shadow-[0_5px_0_color-mix(in_srgb,var(--status-success)_60%,black)]"
              : "bg-[var(--text-primary)] text-[var(--text-inverse)] shadow-[0_5px_0_var(--accent-gold)]",
          )}
        >
          {submitting
            ? "Đang nộp..."
            : allAnswered
              ? "Nộp bài 🚀"
              : `Nộp bài (còn ${totalQuestions - answeredCount} câu)`}
        </button>

        <button
          type="button"
          onClick={handleRetry}
          className="mx-auto flex items-center gap-1.5 text-[12px] font-semibold text-content-muted transition-colors hover:text-content-heading"
        >
          <RotateCcw size={13} aria-hidden="true" />
          Làm lại từ đầu
        </button>
      </div>
    </div>
  );
}
