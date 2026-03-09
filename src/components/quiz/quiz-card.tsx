// components/quiz/QuizCard.tsx
// Card hiển thị 1 bộ câu hỏi

"use client";

import React from "react";
import { Clock, Users, Star, ChevronRight, Zap } from "lucide-react";
import type { QuizSet } from "@/services/quiz.service";

const DIFFICULTY_CONFIG = {
  easy: {
    label: "Dễ",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  medium: {
    label: "Trung bình",
    color: "text-[var(--burning-flame)]",
    bg: "bg-[var(--streak-bg)]",
    border: "border-[var(--streak-border)]",
  },
  hard: {
    label: "Khó",
    color: "text-[var(--accent-danger)]",
    bg: "bg-[var(--accent-blood)]/30",
    border: "border-[var(--accent-danger)]/20",
  },
};

const ERA_LABELS: Record<string, string> = {
  ALL: "Tổng hợp",
  ANCIENT: "Cổ đại",
  MEDIEVAL: "Trung đại",
  MODERN: "Cận đại",
  CONTEMPORARY: "Hiện đại",
};

interface QuizCardProps {
  quiz: QuizSet;
  onStart: (quizId: string) => void;
}

export function QuizCard({ quiz, onStart }: QuizCardProps) {
  const diff = DIFFICULTY_CONFIG[quiz.difficulty];
  const minutes = Math.floor(quiz.durationSeconds / 60);

  return (
    <div
      className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1"
      style={{
        background: "var(--card-light-bg)",
        border: "1px solid var(--card-light-border)",
        boxShadow: "0 2px 8px rgba(27,38,50,0.06)",
      }}
      onClick={() => onStart(quiz.quizId)}
    >
      {/* Thumbnail */}
      <div className="relative h-36 overflow-hidden">
        {quiz.thumbnailUrl ? (
          <img
            src={quiz.thumbnailUrl}
            alt={quiz.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: "var(--bg-elevated)" }}
          />
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Era badge */}
        <div
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{
            background: "var(--accent-gold-active-bg)",
            color: "var(--accent-gold-soft)",
            backdropFilter: "blur(8px)",
            border: "1px solid var(--accent-gold-glow)",
          }}
        >
          {ERA_LABELS[quiz.era] ?? quiz.era}
        </div>

        {/* Difficulty badge */}
        <div
          className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold ${diff.color} ${diff.bg} border ${diff.border}`}
          style={{ backdropFilter: "blur(8px)" }}
        >
          {diff.label}
        </div>

        {/* Question count on thumbnail */}
        <div className="absolute bottom-3 right-3 text-white text-xs font-medium opacity-90">
          {quiz.totalQuestions} câu
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3
          className="font-semibold text-sm leading-snug mb-1 line-clamp-2 group-hover:text-[var(--accent-gold)] transition-colors"
          style={{ color: "var(--content-heading)" }}
        >
          {quiz.title}
        </h3>
        <p
          className="text-xs line-clamp-2 mb-3"
          style={{ color: "var(--content-muted)" }}
        >
          {quiz.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--content-muted)" }}>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {minutes} phút
            </span>
            <span className="flex items-center gap-1">
              <Users size={12} />
              {quiz.playCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-amber-500">
              <Star size={12} fill="currentColor" />
              {quiz.rating.toFixed(1)}
            </span>
          </div>

          <button
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: "var(--accent-gold)",
              color: "var(--text-inverse)",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onStart(quiz.quizId);
            }}
          >
            Làm bài
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}