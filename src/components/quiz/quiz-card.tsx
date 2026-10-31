"use client";

import React from "react";
import { ArrowRight, Clock, Star, Users } from "lucide-react";
import type { QuizSet } from "@/services/quiz.service";
import { cn } from "@/lib/utils/cn";

const ERA_LABELS: Record<QuizSet["era"], string> = {
  ALL: "Tổng hợp",
  ANCIENT: "Cổ đại",
  MEDIEVAL: "Trung đại",
  MODERN: "Cận đại",
  CONTEMPORARY: "Hiện đại",
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
        className={cn(
          "w-full cursor-pointer rounded-lg px-3 py-2.5 text-left transition-colors duration-150",
          isActive
            ? "bg-[var(--accent-gold-active-bg)] "
            : "bg-transparent hover:bg-[var(--bg-elevated)]",
        )}
      >
        <p
          className={cn(
            "line-clamp-2 text-sm font-semibold leading-snug",
            isActive ? "text-[var(--gold-on-light)]" : "text-content-heading",
          )}
        >
          {quiz.title}
        </p>
        {quiz.contextTitle && (
          <p className="mt-0.5 truncate text-xs text-content-muted">
            {quiz.contextTitle}
          </p>
        )}
      </button>
    );
  }

  const minutes = quiz.durationSeconds ? Math.max(1, Math.round(quiz.durationSeconds / 60)) : null;
  const eyebrow = [ERA_LABELS[quiz.era] ?? quiz.era, quiz.contextTitle].filter(Boolean).join(" · ");

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Làm bài: ${quiz.title}`}
      onClick={() => onStart(quiz.quizId)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onStart(quiz.quizId);
        }
      }}
      className={cn(
        "group flex h-full cursor-pointer flex-col rounded-xl border p-4 transition-colors duration-150",
        "border-border-card hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)]",
        isActive ? "bg-[var(--accent-gold-active-bg)]" : "bg-[var(--bg-surface)]",
      )}
    >
      <p className="line-clamp-1 text-[13px] text-content-muted">{eyebrow}</p>

      <h3 className="archive-title is-plain mt-1 line-clamp-3 text-[17px] md:text-lg">
        {quiz.title}
      </h3>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          {minutes && (
            <span className="inline-flex items-center gap-1 text-[13px] text-content-muted">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {minutes} phút
            </span>
          )}
          {quiz.playCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[13px] text-content-muted" title="Lượt làm">
              <Users className="h-3.5 w-3.5" aria-hidden="true" /> {quiz.playCount.toLocaleString("vi-VN")}
            </span>
          )}
          {quiz.rating ? (
            <span className="inline-flex items-center gap-1 text-[13px] text-content-muted">
              <Star size={12} fill="currentColor" strokeWidth={0} />
              {quiz.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
        <ArrowRight
          className="h-4 w-4 shrink-0 text-content-subtle transition-[color,transform] duration-150 group-hover:translate-x-0.5 group-hover:text-content-heading"
          aria-hidden="true"
        />
      </div>
    </article>
  );
}
