"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, ChevronRight, Gauge, Trophy, Users } from "lucide-react";
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

interface QuizDetailPageProps {
  quiz: QuizSet;
  onStart: () => void;
}

export function QuizDetailPage({ quiz, onStart }: QuizDetailPageProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-content)" }}>
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-5 h-14"
        style={{
          background: "var(--palladian)",
          borderBottom: "1px solid var(--oatmeal)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70 pl-6"
          style={{ color: "var(--content-muted)" }}
        >
          <ArrowLeft size={15} />
          Quay lại
        </button>
      </div>

      <div className="max-w-xl mx-auto px-5 py-8 space-y-5">
        <div>
          <span
            className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3"
            style={{
              background: "rgba(201,162,77,0.1)",
              color: "var(--gold-on-light)",
              border: "1px solid rgba(201,162,77,0.2)",
            }}
          >
            {ERA_LABELS[quiz.era] ?? quiz.era}
          </span>
          <h1
            className="text-xl font-bold leading-snug mb-2"
            style={{ color: "var(--content-heading)" }}
          >
            {quiz.title}
          </h1>
          {quiz.contextTitle && (
            <p className="text-sm" style={{ color: "var(--content-muted)" }}>
              {quiz.contextTitle}
            </p>
          )}
        </div>

        <div
          className="grid grid-cols-2 gap-3 p-4 rounded-2xl"
          style={{
            background: "var(--card-light-bg)",
            border: "1px solid var(--card-light-border)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl"
              style={{
                background: "rgba(201,162,77,0.1)",
                color: "var(--accent-gold)",
              }}
            >
              <Users size={16} />
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                Lượt làm
              </p>
              <p
                className="text-sm font-bold"
                style={{ color: "var(--content-heading)" }}
              >
                {quiz.playCount.toLocaleString("vi-VN")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl"
              style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}
            >
              <Gauge size={16} />
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                Cấp độ
              </p>
              <p
                className="text-sm font-bold"
                style={{ color: "var(--content-heading)" }}
              >
                {LEVEL_LABELS[quiz.level] ?? quiz.level}
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{
            background: "var(--card-light-bg)",
            border: "1px solid var(--card-light-border)",
          }}
        >
          <BookOpen
            size={18}
            className="shrink-0 mt-0.5"
            style={{ color: "var(--accent-gold)" }}
          />
          <p className="text-sm" style={{ color: "var(--content-muted)" }}>
            Câu hỏi sẽ được tải khi bạn bắt đầu làm bài.
          </p>
        </div>

        <button
          onClick={onStart}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base transition-all"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
            color: "white",
            boxShadow: "0 8px 24px rgba(201,162,77,0.3)",
            cursor: "pointer",
          }}
        >
          <Trophy size={18} />
          Bắt đầu làm bài
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
