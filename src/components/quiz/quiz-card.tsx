"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, Clock, Star, Users } from "lucide-react";
import type { QuizSet } from "@/services/quiz.service";
import { cn } from "@/lib/utils/cn";
import { isValidUrl } from "@/lib/utils/url";

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

/** Difficulty as a 3-step meter: filled steps + colour read at a glance. */
const LEVEL_METER: Record<QuizSet["level"], { steps: number; color: string; text: string }> = {
  EASY: { steps: 1, color: "bg-[var(--status-success)]", text: "text-[var(--status-success)]" },
  MEDIUM: { steps: 2, color: "bg-[var(--accent-gold)]", text: "text-[var(--gold-on-light)]" },
  HARD: { steps: 3, color: "bg-[var(--accent-danger)]", text: "text-accent-danger" },
};

const FALLBACK_IMAGE = "/war.jpg";

interface QuizCardProps {
  quiz: QuizSet;
  isActive?: boolean;
  onStart: (quizId: string) => void;
  compact?: boolean;
  /** Cover image, usually the historical context's image. */
  imageUrl?: string | null;
  /** Wide horizontal layout used for the lead card of the grid. */
  featured?: boolean;
}

function LevelMeter({ level }: { level: QuizSet["level"] }) {
  const meter = LEVEL_METER[level] ?? LEVEL_METER.MEDIUM;
  return (
    <span className="inline-flex items-center gap-2" title={`Độ khó: ${LEVEL_LABELS[level] ?? level}`}>
      <span className="flex items-end gap-[3px]" aria-hidden="true">
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className={cn(
              "w-[5px]",
              step === 1 ? "h-[7px]" : step === 2 ? "h-[10px]" : "h-[13px]",
              step <= meter.steps ? meter.color : "bg-[var(--border-strong)]",
            )}
          />
        ))}
      </span>
      <span className={cn("text-[11px] font-bold uppercase tracking-[0.1em]", meter.text)}>
        {LEVEL_LABELS[level] ?? level}
      </span>
    </span>
  );
}

export function QuizCard({ quiz, isActive, onStart, compact, imageUrl, featured }: QuizCardProps) {
  if (compact) {
    return (
      <button
        onClick={() => onStart(quiz.quizId)}
        className={cn(
          "w-full cursor-pointer text-left px-4 py-3 rounded-[2px] transition-colors duration-200 border-b border-[var(--border-default)] ",
          isActive
            ? "bg-[var(--accent-gold-active-bg)] "
            : "bg-transparent hover:bg-[var(--bg-elevated)]",
        )}
      >
        <p
          className={cn(
            "archive-title is-plain text-[16px] line-clamp-2",
            isActive ? "text-[var(--gold-on-light)]" : "text-content-heading",
          )}
        >
          {quiz.title}
        </p>
        {quiz.contextTitle && (
          <p className="text-[11px] mt-1 truncate font-semibold uppercase tracking-[0.08em] text-content-muted">
            {quiz.contextTitle}
          </p>
        )}
      </button>
    );
  }

  const cover = imageUrl && isValidUrl(imageUrl) ? imageUrl : FALLBACK_IMAGE;
  const minutes = quiz.durationSeconds ? Math.max(1, Math.round(quiz.durationSeconds / 60)) : null;

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
        "group relative flex h-full cursor-pointer overflow-hidden rounded-[2px] border transition-colors duration-200",
        "border-[var(--border-strong)] hover:border-[var(--text-primary)] focus-visible:outline-none focus-visible:border-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)]",
        featured ? "flex-col md:flex-row" : "flex-col",
        isActive ? "bg-[var(--accent-gold-active-bg)]" : "bg-[var(--bg-surface)]",
      )}
    >
      {/* Cover */}
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-[var(--bg-deep)]",
          featured ? "aspect-[16/9] md:aspect-auto md:w-[55%]" : "aspect-[16/9]",
        )}
      >
        <Image
          src={cover}
          alt=""
          fill
          sizes={featured ? "(max-width: 768px) 100vw, 40vw" : "(max-width: 768px) 50vw, 25vw"}
          className="archive-photo object-cover group-hover:scale-[1.04]"
        />
        <span className="absolute left-0 top-0 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] bg-[var(--text-primary)] text-accent-brass-on-ink">
          {ERA_LABELS[quiz.era] ?? quiz.era}
        </span>
        {featured && (
          <span className="absolute right-0 top-0 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] bg-[var(--accent-gold)] text-white">
            Đề nổi bật
          </span>
        )}
      </div>

      {/* Body */}
      <div className={cn("flex min-w-0 flex-1 flex-col", featured ? "p-4 md:p-6" : "p-3 md:p-4")}>
        {quiz.contextTitle && (
          <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] line-clamp-1 text-accent-gold">
            {quiz.contextTitle}
          </p>
        )}

        <h3
          className={cn(
            "archive-title is-plain mt-1 line-clamp-2",
            featured ? "text-[24px] md:text-[32px]" : "text-[18px] md:text-[20px]",
          )}
        >
          {quiz.title}
        </h3>

        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <LevelMeter level={quiz.level} />
            {minutes && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-content-muted">
                <Clock className="h-3 w-3" aria-hidden="true" /> {minutes} phút
              </span>
            )}
            {quiz.playCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-content-muted">
                <Users className="h-3 w-3" aria-hidden="true" /> {quiz.playCount.toLocaleString("vi-VN")}
              </span>
            )}
            {quiz.rating ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-content-text">
                <Star size={12} fill="var(--accent-gold)" color="var(--accent-gold)" strokeWidth={0} />
                {quiz.rating.toFixed(1)}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-end border-t border-[var(--border-default)] pt-2.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-content-heading transition-colors group-hover:text-accent-gold">
              Làm bài
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>

      {/* Same progress line as the timeline card */}
      <span className="absolute bottom-0 left-0 h-[3px] w-0 bg-accent-gold transition-all duration-500 ease-out group-hover:w-full" aria-hidden="true" />
    </article>
  );
}
