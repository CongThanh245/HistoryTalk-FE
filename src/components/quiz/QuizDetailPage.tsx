"use client";

// components/quiz/QuizDetailPage.tsx
// Trang giới thiệu quiz trước khi bắt đầu làm bài

import React from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  BookOpen,
  Star,
  Users,
  ChevronRight,
  ArrowLeft,
  Zap,
  Trophy,
  Target,
} from "lucide-react";
import type { QuizSet } from "@/services/quiz.service";

const DIFFICULTY_CONFIG = {
  easy: { label: "Dễ", color: "#10b981", bg: "rgba(16,185,129,0.1)", bar: 1 },
  medium: {
    label: "Trung bình",
    color: "#f97316",
    bg: "rgba(249,115,22,0.1)",
    bar: 2,
  },
  hard: { label: "Khó", color: "#ef4444", bg: "rgba(239,68,68,0.1)", bar: 3 },
};

const ERA_LABELS: Record<string, string> = {
  ALL: "Tổng hợp",
  ANCIENT: "Cổ đại",
  MEDIEVAL: "Trung đại",
  MODERN: "Cận đại",
  CONTEMPORARY: "Hiện đại",
};

interface QuizDetailPageProps {
  quiz: QuizSet;
  onStart: () => void;
}

export function QuizDetailPage({ quiz, onStart }: QuizDetailPageProps) {
  const router = useRouter();
  const diff = DIFFICULTY_CONFIG[quiz.difficulty];
  const minutes = Math.floor(quiz.durationSeconds / 60);

  const stats = [
    {
      icon: <BookOpen size={18} />,
      label: "Số câu hỏi",
      value: `${quiz.totalQuestions} câu`,
      color: "var(--accent-gold)",
    },
    {
      icon: <Clock size={18} />,
      label: "Thời gian",
      value: `${minutes} phút`,
      color: "#3b82f6",
    },
    {
      icon: <Users size={18} />,
      label: "Lượt làm",
      value: quiz.playCount.toLocaleString(),
      color: "#8b5cf6",
    },
    {
      icon: <Star size={18} />,
      label: "Đánh giá",
      value: `${quiz.rating.toFixed(1)} / 5`,
      color: "#f59e0b",
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-content)" }}>
      {/* Hero banner */}
      <div className="relative h-56 overflow-hidden">
        {quiz.thumbnailUrl ? (
          <img
            src={quiz.thumbnailUrl}
            alt={quiz.title}
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.6) saturate(0.8)" }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: "var(--bg-elevated)" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-sm backdrop-blur-sm transition-all hover:bg-white/20"
          style={{
            background: "rgba(0,0,0,0.35)",
            color: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <ArrowLeft size={14} />
          Quay lại
        </button>

        {/* Era + difficulty badges */}
        <div className="absolute top-4 right-4 flex gap-2">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm"
            style={{
              background: "rgba(201,162,77,0.25)",
              color: "#e2c77a",
              border: "1px solid rgba(201,162,77,0.35)",
            }}
          >
            {ERA_LABELS[quiz.era] ?? quiz.era}
          </span>
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm"
            style={{
              background: `${diff.color}25`,
              color: diff.color,
              border: `1px solid ${diff.color}40`,
            }}
          >
            {diff.label}
          </span>
        </div>

        {/* Title on hero */}
        <div className="absolute bottom-5 left-6 right-6">
          <h1
            className="text-2xl font-bold text-white leading-tight mb-1"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
          >
            {quiz.title}
          </h1>
          <div className="flex gap-1.5">
            {quiz.tags?.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">
        {/* Description */}
        <div
          className="p-4 rounded-2xl"
          style={{
            background: "var(--card-light-bg)",
            border: "1px solid var(--card-light-border)",
          }}
        >
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--content-text)" }}
          >
            {quiz.description}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{
                background: "var(--card-light-bg)",
                border: "1px solid var(--card-light-border)",
              }}
            >
              <div
                className="p-2 rounded-xl flex-shrink-0"
                style={{ background: `${s.color}15`, color: s.color }}
              >
                {s.icon}
              </div>
              <div>
                <p
                  className="text-xs"
                  style={{ color: "var(--content-muted)" }}
                >
                  {s.label}
                </p>
                <p
                  className="text-sm font-bold"
                  style={{ color: "var(--content-heading)" }}
                >
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Difficulty indicator */}
        <div
          className="p-4 rounded-2xl"
          style={{
            background: "var(--card-light-bg)",
            border: "1px solid var(--card-light-border)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={15} style={{ color: diff.color }} />
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--content-heading)" }}
              >
                Độ khó
              </span>
            </div>
            <span className="text-sm font-bold" style={{ color: diff.color }}>
              {diff.label}
            </span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((level) => (
              <div
                key={level}
                className="flex-1 h-2 rounded-full"
                style={{
                  background:
                    level <= diff.bar ? diff.color : "var(--bg-surface)",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>
        </div>

        {/* Tips */}
        <div
          className="p-4 rounded-2xl"
          style={{
            background: "rgba(201,162,77,0.06)",
            border: "1px solid rgba(201,162,77,0.2)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} style={{ color: "var(--accent-gold)" }} />
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--accent-gold)" }}
            >
              Lưu ý
            </span>
          </div>
          <ul className="space-y-1.5">
            {[
              "Mỗi câu sẽ hiện đáp án và giải thích sau khi bạn chọn",
              `Bạn có ${minutes} phút để hoàn thành ${quiz.totalQuestions} câu`,
              "Kết quả sẽ được lưu vào lịch sử của bạn",
            ].map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs"
                style={{ color: "var(--content-text)" }}
              >
                <span
                  className="mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{
                    background: "rgba(201,162,77,0.2)",
                    color: "var(--accent-gold)",
                  }}
                >
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Start button */}
        <button
          onClick={onStart}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
            color: "white",
            boxShadow: "0 8px 24px rgba(201,162,77,0.35)",
          }}
        >
          <Trophy size={20} />
          Bắt đầu làm bài
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
