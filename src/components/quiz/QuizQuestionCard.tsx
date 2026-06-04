"use client";

import React from "react";
import type { QuizQuestion } from "@/services/quiz.service";

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

  function getOptionStyle(optionIndex: number) {
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
            className="text-sm font-semibold leading-relaxed pt-0.5"
            style={{ color: "var(--content-heading)" }}
          >
            {question.content}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-2.5">
        {question.options.map((option, optIndex) => (
          <button
            key={optIndex}
            onClick={() => onAnswer(question.questionId, optIndex)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200"
            style={getOptionStyle(optIndex)}
          >
            <span
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={
                optIndex === selectedAnswer
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
      </div>
    </div>
  );
}
