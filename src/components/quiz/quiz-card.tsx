"use client";

import React from "react";
import { ChevronRight, Gauge, Users } from "lucide-react";
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

interface QuizCardProps {
  quiz: QuizSet;
  isActive?: boolean;
  onStart: (quizId: string) => void;
  compact?: boolean;
}

export function QuizCard({ quiz, isActive, onStart, compact }: QuizCardProps) {
  if (compact) {
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
          <div
            className="w-2 h-2 rounded-full shrink-0 mt-1.5"
            style={{
              background: isActive
                ? "var(--accent-gold)"
                : "var(--content-subtle)",
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
              {quiz.title}
            </p>
            {quiz.contextTitle && (
              <span
                className="text-xs mt-0.5 block truncate"
                style={{ color: "var(--content-muted)" }}
              >
                {quiz.contextTitle}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }

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
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(201,162,77,0.1)",
              color: "var(--gold-on-light)",
              border: "1px solid rgba(201,162,77,0.2)",
            }}
          >
            {ERA_LABELS[quiz.era] ?? quiz.era}
          </span>
          <div
            className="flex items-center gap-1 text-xs"
            style={{ color: "var(--content-muted)" }}
          >
            <Gauge size={12} />
            {LEVEL_LABELS[quiz.level] ?? quiz.level}
          </div>
        </div>

        <h3
          className="text-sm font-semibold leading-snug mb-2 line-clamp-2 group-hover:text-[var(--accent-gold)] transition-colors"
          style={{ color: "var(--content-heading)" }}
        >
          {quiz.title}
        </h3>

        {quiz.contextTitle && (
          <p
            className="text-xs line-clamp-1 mb-3"
            style={{ color: "var(--content-muted)" }}
          >
            {quiz.contextTitle}
          </p>
        )}

        <div
          className="flex items-center gap-1.5 text-xs mb-3"
          style={{ color: "var(--content-subtle)" }}
        >
          <Users size={12} />
          {quiz.playCount.toLocaleString("vi-VN")} lượt làm
        </div>

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
          {isActive ? "Đang làm bài" : "Xem quiz"}
          {!isActive && <ChevronRight size={12} />}
        </button>
      </div>
    </div>
  );
}
