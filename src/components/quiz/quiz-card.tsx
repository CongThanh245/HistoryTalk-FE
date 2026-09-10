"use client";

import React from "react";
import { Star } from "lucide-react";
import type { QuizSet } from "@/services/quiz.service";
import { cn } from "@/lib/utils/cn";

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
    bg: "bg-accent-teal/10",
    fg: "text-accent-teal",
    border: "border-accent-teal/22",
  },
  MEDIUM: {
    bg: "bg-accent-gold/12",
    fg: "text-gold-on-light",
    border: "border-accent-gold/24",
  },
  HARD: {
    bg: "bg-accent-danger/10",
    fg: "text-accent-danger",
    border: "border-accent-danger/22",
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
        className={cn(
          "w-full cursor-pointer text-left px-4 py-3 rounded-xl transition-colors duration-200 hover:border-[rgba(201,162,77,0.45)] border",
          isActive
            ? "bg-accent-gold/14 border-accent-gold/34"
            : "bg-transparent border-transparent",
        )}
      >
        <p
          className={cn(
            "text-sm font-semibold leading-snug line-clamp-2",
            isActive ? "text-gold-on-light" : "text-content-heading",
          )}
        >
          {quiz.title}
        </p>
        {quiz.contextTitle && (
          <p className="text-xs mt-1 truncate text-content-muted">
            {quiz.contextTitle}
          </p>
        )}
      </button>
    );
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onStart(quiz.quizId)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onStart(quiz.quizId);
        }
      }}
      className={cn(
        "group flex h-full min-h-[190px] cursor-pointer rounded-xl border transition-[border-color,box-shadow] duration-200 md:min-h-[220px] bg-card-light-bg",
        "hover:border-[rgba(201,162,77,0.55)] hover:shadow-[0_10px_24px_rgba(201,162,77,0.12)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]",
        isActive
          ? "border-[rgba(201,162,77,0.35)] shadow-[0_10px_24px_rgba(201,162,77,0.14)]"
          : "border-card-light-border shadow-[0_8px_20px_rgba(27,38,50,0.06)]",
      )}
    >
      <div className="flex h-full w-full flex-col p-3 md:p-4">
        <div className="mb-2 flex min-h-7 flex-wrap items-start gap-1.5 md:mb-3 md:gap-2">
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold md:text-[11px] bg-accent-gold/10 text-gold-on-light border border-accent-gold/22">
            {ERA_LABELS[quiz.era] ?? quiz.era}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold md:text-[11px] border",
              levelTone.bg,
              levelTone.fg,
              levelTone.border,
            )}
          >
            {LEVEL_LABELS[quiz.level] ?? quiz.level}
          </span>
        </div>

        <h3 className="min-h-[2.4rem] text-[13px] font-bold leading-snug line-clamp-2 transition-colors md:min-h-[2.75rem] md:text-base text-content-heading">
          {quiz.title}
        </h3>

        <p className="mt-1.5 min-h-4 text-xs line-clamp-1 md:text-sm text-content-muted">
          {quiz.contextTitle ?? ""}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5 md:pt-3 border-t border-card-light-border">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide md:text-[11px] text-content-subtle">
                Lượt làm
              </p>
              <p className="text-xs font-bold md:text-sm text-content-heading">
                {quiz.playCount.toLocaleString("vi-VN")}
              </p>
            </div>
            {quiz.rating ? (
              <div className="flex items-center gap-1">
                <Star size={12} fill="var(--gold-on-light)" color="var(--gold-on-light)" strokeWidth={0} />
                <span className="text-xs font-bold md:text-sm text-content-heading">
                  {quiz.rating.toFixed(1)}
                </span>
              </div>
            ) : null}
          </div>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onStart(quiz.quizId);
            }}
            className="h-8 rounded-lg px-2.5 text-xs font-semibold transition-[filter,transform,box-shadow] duration-200 hover:brightness-110 hover:shadow-[0_10px_22px_rgba(27,38,50,0.22)] active:translate-y-px md:h-9 md:px-3 md:text-sm bg-[var(--abyssal-blue)] text-[var(--text-on-dark)] shadow-[0_8px_18px_rgba(27,38,50,0.16)]"
          >
            Làm bài ngay
          </button>
        </div>
      </div>
    </article>
  );
}
