"use client";

// components/quiz/QuizDetailPage.tsx — v2
// Thêm: chọn có dùng timer hay không trước khi bắt đầu

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  BookOpen,
  ChevronRight,
  ArrowLeft,
  Trophy,
  Timer,
  TimerOff,
} from "lucide-react";
import type { QuizSet } from "@/services/quiz.service";
import { QuizSetV2 } from "@/services/quiz.service";

const GRADE_CONFIG: Record<
  number,
  { label: string; color: string; bg: string }
> = {
  10: { label: "Lịch sử 10", color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
  11: { label: "Lịch sử 11", color: "#8b5cf6", bg: "rgba(139,92,246,0.08)" },
  12: { label: "Lịch sử 12", color: "#f97316", bg: "rgba(249,115,22,0.08)" },
};

interface QuizDetailPageProps {
  quiz: QuizSet;
  // onStart nhận thêm boolean: có dùng timer không
  onStart: (withTimer: boolean) => void;
}

export function QuizDetailPage({ quiz, onStart }: QuizDetailPageProps) {
  const router = useRouter();
  const [timerChoice, setTimerChoice] = useState<boolean | null>(null);

  const quizV2 = quiz as QuizSetV2;
  const grade = GRADE_CONFIG[quizV2.grade ?? 12];
  const minutes = Math.floor(quiz.durationSeconds / 60);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-content)" }}>
      {/* Top bar */}
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
        {/* Grade + title */}
        <div>
          {grade && (
            <span
              className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3"
              style={{ background: grade.bg, color: grade.color }}
            >
              {grade.label}
            </span>
          )}
          <h1
            className="text-xl font-bold leading-snug mb-1"
            style={{ color: "var(--content-heading)" }}
          >
            {(quiz as QuizSetV2).chapterTitle ?? quiz.title}
          </h1>
          <p className="text-sm" style={{ color: "var(--content-muted)" }}>
            {quiz.description}
          </p>
        </div>

        {/* Stats row */}
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
              <BookOpen size={16} />
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                Số câu hỏi
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-2.5 p-4 rounded-2xl"
            style={{
              background: "var(--card-light-bg)",
              border: "1px solid var(--card-light-border)",
            }}
          >
            <div
              className="p-2 rounded-xl"
              style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}
            >
              <Clock size={16} />
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                Thời gian gợi ý
              </p>
              <p
                className="text-sm font-bold"
                style={{ color: "var(--content-heading)" }}
              >
                {minutes} phút
              </p>
            </div>
          </div>
        </div>

        {/* Timer choice */}
        <div>
          <p
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--content-heading)" }}
          >
            Bạn muốn đếm giờ không?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTimerChoice(true)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all"
              style={
                timerChoice === true
                  ? {
                      background: "rgba(201,162,77,0.1)",
                      border: "2px solid var(--accent-gold)",
                    }
                  : {
                      background: "var(--card-light-bg)",
                      border: "2px solid var(--card-light-border)",
                    }
              }
            >
              <Timer
                size={22}
                style={{
                  color:
                    timerChoice === true
                      ? "var(--accent-gold)"
                      : "var(--content-muted)",
                }}
              />
              <p
                className="text-sm font-semibold"
                style={{
                  color:
                    timerChoice === true
                      ? "var(--accent-gold)"
                      : "var(--content-heading)",
                }}
              >
                Có đếm giờ
              </p>
              <p
                className="text-xs text-center"
                style={{ color: "var(--content-muted)" }}
              >
                Tính giờ để luyện thi
              </p>
            </button>

            <button
              onClick={() => setTimerChoice(false)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all"
              style={
                timerChoice === false
                  ? {
                      background: "rgba(16,185,129,0.08)",
                      border: "2px solid #10b981",
                    }
                  : {
                      background: "var(--card-light-bg)",
                      border: "2px solid var(--card-light-border)",
                    }
              }
            >
              <TimerOff
                size={22}
                style={{
                  color:
                    timerChoice === false ? "#10b981" : "var(--content-muted)",
                }}
              />
              <p
                className="text-sm font-semibold"
                style={{
                  color:
                    timerChoice === false
                      ? "#10b981"
                      : "var(--content-heading)",
                }}
              >
                Không cần giờ
              </p>
              <p
                className="text-xs text-center"
                style={{ color: "var(--content-muted)" }}
              >
                Ôn tập thoải mái
              </p>
            </button>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={() => timerChoice !== null && onStart(timerChoice)}
          disabled={timerChoice === null}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base transition-all"
          style={
            timerChoice !== null
              ? {
                  background:
                    "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
                  color: "white",
                  boxShadow: "0 8px 24px rgba(201,162,77,0.3)",
                  cursor: "pointer",
                }
              : {
                  background: "var(--bg-surface)",
                  color: "var(--content-muted)",
                  cursor: "not-allowed",
                }
          }
        >
          <Trophy size={18} />
          Bắt đầu làm bài
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
