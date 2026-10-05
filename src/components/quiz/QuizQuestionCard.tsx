"use client";

import React from "react";
import { Bookmark, CheckCircle2, XCircle } from "lucide-react";
import type { QuizQuestion } from "@/services/quiz.service";
import { cn } from "@/lib/utils/cn";

const OPTION_LABELS = ["A", "B", "C", "D"];

interface QuizQuestionCardProps {
  question: QuizQuestion;
  index: number;
  selectedAnswer: number | null;
  onAnswer: (questionId: string, answerIndex: number) => void;
  flagged?: boolean;
  onToggleFlag?: (questionId: string) => void;
  /** Che do luyen tap: lo dap an ngay khi da chon, khoa lai khong cho sua. */
  practiceMode?: boolean;
}

export function QuizQuestionCard({
  question,
  index,
  selectedAnswer,
  onAnswer,
  flagged = false,
  onToggleFlag,
  practiceMode = false,
}: QuizQuestionCardProps) {
  const hasAnswered = selectedAnswer !== null;
  const revealed = practiceMode && hasAnswered;
  const isCorrect = revealed && selectedAnswer === question.correctAnswer;

  function getOptionClasses(optionIndex: number) {
    if (revealed) {
      if (optionIndex === question.correctAnswer) {
        return "bg-[var(--status-success)] text-[var(--text-inverse)] font-semibold cursor-default";
      }
      if (optionIndex === selectedAnswer) {
        return "bg-[var(--accent-danger)] text-[var(--text-inverse)] font-semibold cursor-default";
      }
      return "bg-[var(--bg-surface)] text-content-muted cursor-default";
    }

    if (optionIndex === selectedAnswer) {
      return "bg-[var(--text-primary)] text-[var(--text-inverse)] font-semibold cursor-pointer";
    }

    return "bg-[var(--bg-surface)] text-content-heading cursor-pointer hover:bg-[var(--bg-elevated)]";
  }

  return (
    <div
      className={cn(
        "rounded-[2px] overflow-hidden transition-colors duration-200 bg-[var(--bg-surface)] border border-[var(--text-primary)]",
        hasAnswered ? "" : "",
      )}
    >
      <div className="px-5 py-4 border-b border-[var(--text-primary)]">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 font-display text-[28px] font-extrabold leading-none text-accent-gold tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className="text-[15px] font-semibold leading-relaxed pt-0.5 flex-1 text-content-heading">
            {question.content}
          </p>
          {onToggleFlag && (
            <button
              onClick={() => onToggleFlag(question.questionId)}
              className={cn(
                "flex-shrink-0 p-1 -mt-0.5 -mr-1 rounded-[2px] border border-transparent transition-colors hover:border-[var(--text-primary)]",
                flagged ? "text-accent-gold" : "text-content-subtle",
              )}
              title={flagged ? "Bỏ đánh dấu" : "Đánh dấu để xem lại"}
            >
              <Bookmark size={16} fill={flagged ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      </div>

      <div>
        {revealed && (
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] border-b border-[var(--border-default)]",
              isCorrect
                ? "bg-[var(--status-success-bg)] text-[var(--status-success)]"
                : "bg-[var(--status-danger-bg)] text-accent-danger",
            )}
          >
            {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {isCorrect ? "Chính xác!" : `Sai rồi — đáp án đúng là ${OPTION_LABELS[question.correctAnswer]}`}
          </div>
        )}

        {question.options.map((option, optIndex) => (
          <button
            key={optIndex}
            onClick={() => !revealed && onAnswer(question.questionId, optIndex)}
            disabled={revealed}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 border-b border-[var(--border-default)] last:border-b-0",
              getOptionClasses(optIndex),
            )}
          >
            <span
              className={cn(
                "flex-shrink-0 w-6 h-6 rounded-[2px] flex items-center justify-center text-xs font-bold border",
                revealed && (optIndex === question.correctAnswer || optIndex === selectedAnswer)
                  ? "border-[var(--text-inverse)] text-[var(--text-inverse)]"
                  : optIndex === selectedAnswer
                    ? "bg-[var(--text-inverse)] text-[var(--text-primary)] border-[var(--text-inverse)]"
                    : "bg-transparent text-content-muted border-[var(--border-strong)]",
              )}
            >
              {OPTION_LABELS[optIndex]}
            </span>
            <span className="flex-1 text-sm">{option}</span>
          </button>
        ))}

        {revealed && question.explanation && (
          <div className="px-4 py-3 text-xs leading-5 border-t border-[var(--text-primary)] bg-[var(--bg-elevated)] text-content-muted">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-content-heading">
              Giải thích:{" "}
            </span>
            {question.explanation}
          </div>
        )}
      </div>
    </div>
  );
}
