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
        return "bg-emerald-500/10 border-[1.5px] border-emerald-500/45 text-[#065f46] cursor-default";
      }
      if (optionIndex === selectedAnswer) {
        return "bg-accent-danger/[0.08] border-[1.5px] border-accent-danger/40 text-accent-danger cursor-default";
      }
      return "bg-card-light-bg border-[1.5px] border-card-light-border text-content-muted cursor-default";
    }

    if (optionIndex === selectedAnswer) {
      return "bg-accent-gold-active border-[1.5px] border-accent-gold text-gold-on-light cursor-pointer";
    }

    return "bg-card-light-bg border-[1.5px] border-card-light-border text-content-heading cursor-pointer";
  }

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden transition-all duration-200 bg-card-light-bg shadow-[0_2px_8px_rgba(27,38,50,0.05)] border-[1.5px]",
        hasAnswered ? "border-accent-gold/35" : "border-card-light-border",
      )}
    >
      <div className="px-5 py-4 border-b border-card-light-border">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 bg-accent-gold-active text-accent-gold">
            {index + 1}
          </span>
          <p className="text-sm font-semibold leading-relaxed pt-0.5 flex-1 text-content-heading">
            {question.content}
          </p>
          {onToggleFlag && (
            <button
              onClick={() => onToggleFlag(question.questionId)}
              className={cn(
                "flex-shrink-0 p-1 -mt-0.5 -mr-1 rounded-lg transition-colors hover:bg-black/5",
                flagged ? "text-accent-gold" : "text-content-subtle",
              )}
              title={flagged ? "Bỏ đánh dấu" : "Đánh dấu để xem lại"}
            >
              <Bookmark size={16} fill={flagged ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-2.5">
        {revealed && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold",
              isCorrect
                ? "bg-emerald-500/10 text-[#047857]"
                : "bg-accent-danger/[0.08] text-accent-danger",
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
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
              getOptionClasses(optIndex),
            )}
          >
            <span
              className={cn(
                "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                revealed && optIndex === question.correctAnswer
                  ? "bg-[#047857] text-white"
                  : revealed && optIndex === selectedAnswer
                    ? "bg-accent-danger text-white"
                    : optIndex === selectedAnswer
                      ? "bg-accent-gold text-white"
                      : "bg-card-light-bg text-content-muted border border-card-light-border",
              )}
            >
              {OPTION_LABELS[optIndex]}
            </span>
            <span className="flex-1 text-sm">{option}</span>
          </button>
        ))}

        {revealed && question.explanation && (
          <div className="rounded-lg px-3 py-2.5 text-xs leading-5 bg-[rgba(27,38,50,0.035)] text-content-muted">
            <span className="font-bold text-content-heading">
              Giải thích:{" "}
            </span>
            {question.explanation}
          </div>
        )}
      </div>
    </div>
  );
}
