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
              "w-[5px] rounded-[1px]",
              step === 1 ? "h-[7px]" : step === 2 ? "h-[10px]" : "h-[13px]",
              step <= meter.steps ? meter.color : "bg-[var(--border-strong)]",
            )}
          />
        ))}
      </span>
      <span className={cn("text-[13px] font-semibold", meter.text)}>
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
        "group relative flex h-full cursor-pointer overflow-hidden rounded-xl border transition-[border-color,box-shadow] duration-200",
        "border-border-card hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)]",
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
        <span className="absolute left-2.5 top-2.5 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
          {ERA_LABELS[quiz.era] ?? quiz.era}
        </span>
        {featured && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-[var(--accent-gold)] px-2.5 py-0.5 text-xs font-semibold text-white">
            Đề nổi bật
          </span>
        )}
      </div>

      {/* Body */}
      <div className={cn("flex min-w-0 flex-1 flex-col", featured ? "p-4 md:p-6" : "p-3 md:p-4")}>
        {quiz.contextTitle && (
          <p className="line-clamp-1 text-[13px] font-medium text-[var(--gold-on-light)]">
            {quiz.contextTitle}
          </p>
        )}

        <h3
          className={cn(
            "archive-title is-plain mt-1",
            featured ? "line-clamp-4 text-[22px] md:text-2xl" : "line-clamp-2 text-[17px] md:text-lg",
          )}
        >
          {quiz.title}
        </h3>

        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <LevelMeter level={quiz.level} />
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
              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-content-text">
                <Star size={12} fill="var(--accent-gold)" color="var(--accent-gold)" strokeWidth={0} />
                {quiz.rating.toFixed(1)}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-end border-t border-[var(--border-default)] pt-2.5">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-content-heading transition-colors group-hover:text-[var(--accent-gold)]">
              Làm bài
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>

    </article>
  );
}
