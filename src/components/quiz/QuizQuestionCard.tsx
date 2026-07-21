"use client";

import React from "react";
import { Bookmark, CheckCircle2, XCircle } from "lucide-react";
import type { QuizQuestion } from "@/services/quiz.service";

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

  function getOptionStyle(optionIndex: number) {
    if (revealed) {
      if (optionIndex === question.correctAnswer) {
        return {
          background: "rgba(16,185,129,0.10)",
          border: "1.5px solid rgba(16,185,129,0.45)",
          color: "#065f46",
          cursor: "default",
        };
      }
      if (optionIndex === selectedAnswer) {
        return {
          background: "rgba(184,50,42,0.08)",
          border: "1.5px solid rgba(184,50,42,0.4)",
          color: "var(--accent-danger)",
          cursor: "default",
        };
      }
      return {
        background: "var(--card-light-bg)",
        border: "1.5px solid var(--card-light-border)",
        color: "var(--content-muted)",
        cursor: "default",
      };
    }

    if (optionIndex === selectedAnswer) {
      return {
        background: "var(--accent-gold-active-bg)",
        border: "1.5px solid var(--accent-gold)",
        color: "var(--gold-on-light)",
        cursor: "pointer",
      };
    }

    return {
      background: "var(--card-light-bg)",
      border: "1.5px solid var(--card-light-border)",
      color: "var(--content-heading)",
      cursor: "pointer",
    };
  }

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: "var(--card-light-bg)",
        border: `1.5px solid ${
          hasAnswered ? "rgba(201,162,77,0.35)" : "var(--card-light-border)"
        }`,
        boxShadow: "0 2px 8px rgba(27,38,50,0.05)",
      }}
    >
      <div
        className="px-5 py-4"
        style={{ borderBottom: "1px solid var(--card-light-border)" }}
      >
        <div className="flex items-start gap-3">
          <span
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
            style={{
              background: "var(--accent-gold-active-bg)",
              color: "var(--accent-gold)",
            }}
          >
            {index + 1}
          </span>
          <p
            className="text-sm font-semibold leading-relaxed pt-0.5 flex-1"
            style={{ color: "var(--content-heading)" }}
          >
            {question.content}
          </p>
          {onToggleFlag && (
            <button
              onClick={() => onToggleFlag(question.questionId)}
              className="flex-shrink-0 p-1 -mt-0.5 -mr-1 rounded-lg transition-colors hover:bg-black/5"
              style={{ color: flagged ? "var(--accent-gold)" : "var(--content-subtle)" }}
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
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold"
            style={{
              background: isCorrect ? "rgba(16,185,129,0.10)" : "rgba(184,50,42,0.08)",
              color: isCorrect ? "#047857" : "var(--accent-danger)",
            }}
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
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200"
            style={getOptionStyle(optIndex)}
          >
            <span
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={
                revealed && optIndex === question.correctAnswer
                  ? { background: "#047857", color: "#fff" }
                  : revealed && optIndex === selectedAnswer
                    ? { background: "var(--accent-danger)", color: "#fff" }
                    : optIndex === selectedAnswer
                      ? { background: "var(--accent-gold)", color: "#fff" }
                      : {
                          background: "var(--card-light-bg)",
                          color: "var(--content-muted)",
                          border: "1px solid var(--card-light-border)",
                        }
              }
            >
              {OPTION_LABELS[optIndex]}
            </span>
            <span className="flex-1 text-sm">{option}</span>
          </button>
        ))}

        {revealed && question.explanation && (
          <div
            className="rounded-lg px-3 py-2.5 text-xs leading-5"
            style={{ background: "rgba(27,38,50,0.035)", color: "var(--content-muted)" }}
          >
            <span className="font-bold" style={{ color: "var(--content-heading)" }}>
              Giải thích:{" "}
            </span>
            {question.explanation}
          </div>
        )}
      </div>
    </div>
  );
}
