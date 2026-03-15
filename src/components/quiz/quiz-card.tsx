"use client";

// components/quiz/QuizCard.tsx — v2
// Card đơn giản: title + grade badge + số câu + nút làm bài

import React from "react";
import { BookOpen, ChevronRight } from "lucide-react";
import { QuizSetV2 } from "@/services/quiz.service";

const GRADE_CONFIG = {
  10: {
    label: "Lịch sử 10",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.2)",
  },
  11: {
    label: "Lịch sử 11",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.2)",
  },
  12: {
    label: "Lịch sử 12",
    color: "#f97316",
    bg: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.2)",
  },
};

interface QuizCardProps {
  quiz: QuizSetV2;
  isActive?: boolean; // đang làm bài này
  onStart: (quizId: string) => void;
  compact?: boolean; // mode nhỏ cho sidebar
}

export function QuizCard({ quiz, isActive, onStart, compact }: QuizCardProps) {
  const grade = GRADE_CONFIG[quiz.grade];

  if (compact) {
    // ── Compact mode cho sidebar ────────────────────────
    return (
      <button
        onClick={() => onStart(quiz.quizId)}
        className="w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 group"
        style={
          isActive
            ? {
                background: "var(--accent-gold-active-bg)",
                border: "1px solid var(--accent-gold-glow)",
              }
            : {
                background: "transparent",
                border: "1px solid transparent",
              }
        }
      >
        <div className="flex items-start gap-2.5">
          {/* Grade dot */}
          <div
            className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
            style={{
              background: isActive ? "var(--accent-gold)" : grade.color,
            }}
          />
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-medium leading-snug line-clamp-2"
              style={{
                color: isActive
                  ? "var(--accent-gold)"
                  : "var(--content-heading)",
              }}
            >
              {quiz.chapterTitle}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-xs"
                style={{
                  color: isActive ? "var(--accent-gold)" : grade.color,
                  opacity: 0.8,
                }}
              >
                {grade.label}
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--content-subtle)" }}
              >
                · {quiz.totalQuestions} câu
              </span>
            </div>
          </div>
        </div>
      </button>
    );
  }

  // ── Full card mode cho danh sách ────────────────────────
  return (
    <div
      className="group rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--card-light-bg)",
        border: `1px solid ${isActive ? "var(--accent-gold-glow)" : "var(--card-light-border)"}`,
        boxShadow: isActive
          ? "0 4px 16px rgba(201,162,77,0.15)"
          : "0 2px 8px rgba(27,38,50,0.05)",
      }}
    >
      <div className="p-4">
        {/* Top: grade badge */}
        <div className="flex items-center justify-between mb-2.5">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: grade.bg,
              color: grade.color,
              border: `1px solid ${grade.border}`,
            }}
          >
            {grade.label}
          </span>
          <span
            className="flex items-center gap-1 text-xs"
            style={{ color: "var(--content-muted)" }}
          >
            <BookOpen size={11} />
            {quiz.totalQuestions} câu
          </span>
        </div>

        {/* Title */}
        <h3
          className="text-sm font-semibold leading-snug mb-3 line-clamp-2 group-hover:text-[var(--accent-gold)] transition-colors"
          style={{ color: "var(--content-heading)" }}
        >
          {quiz.chapterTitle}
        </h3>

        {/* Subject line */}
        <p
          className="text-xs line-clamp-1 mb-3"
          style={{ color: "var(--content-muted)" }}
        >
          {quiz.title.split("—")[1]?.trim() ?? quiz.title}
        </p>

        {/* Start button */}
        <button
          onClick={() => onStart(quiz.quizId)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background: isActive
              ? "var(--accent-gold)"
              : "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
            color: "white",
          }}
        >
          {isActive ? "Đang làm bài" : "Làm bài"}
          {!isActive && <ChevronRight size={12} />}
        </button>
      </div>
    </div>
  );
}
