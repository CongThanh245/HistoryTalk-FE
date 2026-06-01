"use client";

import React from "react";
import type { QuizSet } from "@/services/quiz.service";

const ERA_LABELS: Record<QuizSet["era"], string> = {
  ALL: "Tổng hợp",
  ANCIENT: "Cổ đại",
  MEDIEVAL: "Trung đại",
  MODERN: "Cận đại",
  CONTEMPORARY: "Hiện đại",
};

const LEVEL_LABELS: Record<QuizSet["level"], string> = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
};

const LEVEL_TONE: Record<QuizSet["level"], { bg: string; fg: string; border: string }> = {
  EASY: {
    bg: "rgba(47,111,115,0.10)",
    fg: "var(--accent-teal)",
    border: "rgba(47,111,115,0.22)",
  },
  MEDIUM: {
    bg: "rgba(201,162,77,0.12)",
    fg: "var(--gold-on-light)",
    border: "rgba(201,162,77,0.24)",
  },
  HARD: {
    bg: "rgba(184,50,42,0.10)",
    fg: "var(--accent-danger)",
    border: "rgba(184,50,42,0.22)",
  },
};

interface QuizCardProps {
  quiz: QuizSet;
  isActive?: boolean;
  onStart: (quizId: string) => void;
  compact?: boolean;
}

export function QuizCard({ quiz, isActive, onStart, compact }: QuizCardProps) {
  const levelTone = LEVEL_TONE[quiz.level] ?? LEVEL_TONE.MEDIUM;

  if (compact) {
    return (
      <button
        onClick={() => onStart(quiz.quizId)}
        className="w-full text-left px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-1"
        style={
          isActive
            ? {
                background: "rgba(201,162,77,0.14)",
                border: "1px solid rgba(201,162,77,0.34)",
                boxShadow: "inset 3px 0 0 var(--accent-gold)",
              }
            : {
                background: "transparent",
                border: "1px solid transparent",
              }
        }
      >
        <p
          className="text-sm font-semibold leading-snug line-clamp-2"
          style={{ color: isActive ? "var(--gold-on-light)" : "var(--content-heading)" }}
        >
          {quiz.title}
        </p>
        {quiz.contextTitle && (
          <p className="text-xs mt-1 truncate" style={{ color: "var(--content-muted)" }}>
            {quiz.contextTitle}
          </p>
        )}
      </button>
    );
  }

  return (
    <article
      className="group rounded-xl transition-all duration-200 hover:-translate-y-1"
      style={{
        background: "var(--card-light-bg)",
        border: `1px solid ${isActive ? "rgba(201,162,77,0.35)" : "var(--card-light-border)"}`,
        boxShadow: isActive
          ? "0 10px 24px rgba(201,162,77,0.14)"
          : "0 8px 20px rgba(27,38,50,0.06)",
      }}
    >
      <div className="p-3.5 sm:p-5">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
          <span
            className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full"
            style={{
              background: "rgba(201,162,77,0.10)",
              color: "var(--gold-on-light)",
              border: "1px solid rgba(201,162,77,0.22)",
            }}
          >
            {ERA_LABELS[quiz.era] ?? quiz.era}
          </span>
          <span
            className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full"
            style={{
              background: levelTone.bg,
              color: levelTone.fg,
              border: `1px solid ${levelTone.border}`,
            }}
          >
            {LEVEL_LABELS[quiz.level] ?? quiz.level}
          </span>
        </div>

        <h3
          className="text-[13px] sm:text-base font-bold leading-snug line-clamp-2 transition-colors"
          style={{ color: "var(--content-heading)" }}
        >
          {quiz.title}
        </h3>

        {quiz.contextTitle && (
          <p className="text-sm line-clamp-1 mt-2" style={{ color: "var(--content-muted)" }}>
            {quiz.contextTitle}
          </p>
        )}

        <div
          className="mt-4 sm:mt-5 pt-3 sm:pt-4 flex items-center justify-between gap-2"
          style={{ borderTop: "1px solid var(--card-light-border)" }}
        >
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wide" style={{ color: "var(--content-subtle)" }}>
              Lượt làm
            </p>
            <p className="text-xs sm:text-sm font-bold" style={{ color: "var(--content-heading)" }}>
              {quiz.playCount.toLocaleString("vi-VN")}
            </p>
          </div>
          <button
            onClick={() => onStart(quiz.quizId)}
            className="h-8 sm:h-10 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: "var(--abyssal-blue)",
              color: "var(--text-on-dark)",
              boxShadow: "0 8px 18px rgba(27,38,50,0.16)",
            }}
          >
            Xem bài
          </button>
        </div>
      </div>
    </article>
  );
}
