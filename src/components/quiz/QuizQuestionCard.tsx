"use client";

// components/quiz/QuizQuestionCard.tsx
// Một câu hỏi: chọn đáp án → hiện đúng/sai + explanation (có toggle)

import React, { useState } from "react";
import type { QuizQuestion } from "@/services/quiz.service";
import { Eye, EyeOff } from "lucide-react";

const OPTION_LABELS = ["A", "B", "C", "D"];

interface QuizQuestionCardProps {
  question: QuizQuestion;
  index: number;
  selectedAnswer: number | null;
  onAnswer: (questionId: string, answerIndex: number) => void;
}

export function QuizQuestionCard({
  question,
  index,
  selectedAnswer,
  onAnswer,
}: QuizQuestionCardProps) {
  const hasAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === question.correctAnswer;
  const [showExplanation, setShowExplanation] = useState(false);

  function getOptionStyle(optionIndex: number) {
    if (!hasAnswered) {
      // Chưa trả lời
      return {
        background: "var(--card-light-bg)",
        border: "1.5px solid var(--card-light-border)",
        color: "var(--content-heading)",
        cursor: "pointer",
      };
    }
    if (optionIndex === question.correctAnswer) {
      // Đáp án đúng — luôn highlight xanh
      return {
        background: "rgba(16,185,129,0.08)",
        border: "1.5px solid rgba(16,185,129,0.5)",
        color: "#065f46",
        cursor: "default",
      };
    }
    if (optionIndex === selectedAnswer) {
      // Đáp án người dùng chọn mà sai — highlight đỏ
      return {
        background: "rgba(239,68,68,0.08)",
        border: "1.5px solid rgba(239,68,68,0.4)",
        color: "#7f1d1d",
        cursor: "default",
      };
    }
    // Các đáp án còn lại — mờ đi
    return {
      background: "var(--card-light-bg)",
      border: "1.5px solid var(--card-light-border)",
      color: "var(--content-muted)",
      cursor: "default",
      opacity: 0.5,
    };
  }

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: "var(--card-light-bg)",
        border: `1.5px solid ${hasAnswered ? (isCorrect ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.25)") : "var(--card-light-border)"}`,
        boxShadow: "0 2px 8px rgba(27,38,50,0.05)",
      }}
    >
      {/* Question header */}
      <div
        className="px-5 py-4"
        style={{ borderBottom: "1px solid var(--card-light-border)" }}
      >
        <div className="flex items-start gap-3">
          {/* Index badge */}
          <span
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
            style={
              hasAnswered
                ? isCorrect
                  ? { background: "rgba(16,185,129,0.15)", color: "#10b981" }
                  : { background: "rgba(239,68,68,0.12)", color: "#ef4444" }
                : {
                    background: "var(--accent-gold-active-bg)",
                    color: "var(--accent-gold)",
                  }
            }
          >
            {index + 1}
          </span>
          <p
            className="text-sm font-semibold leading-relaxed pt-0.5"
            style={{ color: "var(--content-heading)" }}
          >
            {question.content}
          </p>
        </div>
      </div>

      {/* Options */}
      <div className="p-4 space-y-2.5">
        {question.options.map((option, optIndex) => (
          <button
            key={optIndex}
            onClick={() =>
              !hasAnswered && onAnswer(question.questionId, optIndex)
            }
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200"
            style={getOptionStyle(optIndex)}
            disabled={hasAnswered}
          >
            {/* Label A/B/C/D */}
            <span
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={
                hasAnswered && optIndex === question.correctAnswer
                  ? { background: "#10b981", color: "#fff" }
                  : hasAnswered && optIndex === selectedAnswer
                    ? { background: "#ef4444", color: "#fff" }
                    : {
                        background: "var(--card-light-bg)",
                        color: "var(--content-muted)",
                      }
              }
            >
              {OPTION_LABELS[optIndex]}
            </span>
            <span className="flex-1 text-sm">{option}</span>
          </button>
        ))}
      </div>

      {/* Explanation — chỉ hiện khi đã trả lời và bật toggle */}
      {hasAnswered && showExplanation && question.explanation && (
        <div
          className="mx-4 mb-4 p-3.5 rounded-xl"
          style={{
            background: "rgba(201,162,77,0.07)",
            border: "1px solid rgba(201,162,77,0.2)",
            animation: "fade-in 0.3s ease-out",
          }}
        >
          <div className="mb-1.5">
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--accent-gold)" }}
            >
              Giải thích
            </span>
          </div>
          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--content-text)" }}
          >
            {question.explanation}
          </p>
        </div>
      )}

      {/* Status strip at bottom */}
      {hasAnswered && (
        <div
          className="px-5 py-2.5 flex items-center justify-between"
          style={{
            background: isCorrect
              ? "rgba(16,185,129,0.06)"
              : "rgba(239,68,68,0.06)",
            borderTop: `1px solid ${isCorrect ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)"}`,
          }}
        >
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <span
                className="text-xs font-medium"
                style={{ color: "#10b981" }}
              >
                Chính xác!
              </span>
            ) : (
              <span
                className="text-xs font-medium"
                style={{ color: "#ef4444" }}
              >
                Chưa đúng. Đáp án: {OPTION_LABELS[question.correctAnswer]}
              </span>
            )}
          </div>

          {question.explanation && (
            <button
              onClick={() => setShowExplanation((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg transition-all hover:bg-black/5"
              style={{ color: "var(--content-muted)" }}
            >
              {showExplanation ? (
                <>
                  <EyeOff size={14} />
                  <span>Ẩn giải thích</span>
                </>
              ) : (
                <>
                  <Eye size={14} />
                  <span>Xem giải thích</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
