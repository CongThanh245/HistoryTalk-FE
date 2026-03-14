"use client";

// components/quiz/QuizResultPage.tsx
// Trang kết quả sau khi nộp bài

import React from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  RotateCcw,
  Home,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react";
import type { QuizSet, QuizQuestion } from "@/services/quiz.service";

interface QuizResultPageProps {
  quiz: QuizSet;
  questions: QuizQuestion[];
  answers: Record<string, number>; // questionId → selectedIndex
  durationSeconds: number;
  onRetry: () => void;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

export function QuizResultPage({
  quiz,
  questions,
  answers,
  durationSeconds,
  onRetry,
}: QuizResultPageProps) {
  const router = useRouter();

  const correctCount = questions.filter(
    (q) => answers[q.questionId] === q.correctAnswer,
  ).length;
  const totalCount = questions.length;
  const score = Math.round((correctCount / totalCount) * 100);
  const wrongCount = totalCount - correctCount;
  const unanswered = totalCount - Object.keys(answers).length;

  // Score tier
  const tier =
    score >= 90
      ? { label: "Xuất sắc", color: "#f59e0b", emoji: "🏆" }
      : score >= 70
        ? { label: "Khá giỏi", color: "#10b981", emoji: "🌟" }
        : score >= 50
          ? { label: "Trung bình", color: "#3b82f6", emoji: "📚" }
          : { label: "Cần cố gắng hơn", color: "#ef4444", emoji: "💪" };

  return (
    <div className="min-h-full" style={{ background: "var(--bg-content)" }}>
      {/* Score hero */}
      <div
        className="relative px-5 py-10 text-center overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--abyssal-blue) 0%, #2c3b4d 100%)",
        }}
      >
        {/* Background decoration */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(201,162,77,0.5) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 40%)",
          }}
        />

        <div className="relative z-10">
          <div className="text-5xl mb-3">{tier.emoji}</div>
          <p
            className="text-sm font-medium mb-2"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            {quiz.title}
          </p>

          {/* Big score */}
          <div className="mb-2">
            <span
              className="text-7xl font-black"
              style={{
                color: tier.color,
                textShadow: `0 0 40px ${tier.color}60`,
              }}
            >
              {score}
            </span>
            <span
              className="text-3xl font-bold"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              %
            </span>
          </div>

          <div
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold"
            style={{
              background: `${tier.color}20`,
              color: tier.color,
              border: `1px solid ${tier.color}40`,
            }}
          >
            <Trophy size={14} />
            {tier.label}
          </div>

          {/* Quick stats */}
          <div className="flex justify-center gap-6 mt-6">
            {[
              {
                label: "Đúng",
                value: correctCount,
                color: "#10b981",
                icon: <CheckCircle2 size={14} />,
              },
              {
                label: "Sai",
                value: wrongCount,
                color: "#ef4444",
                icon: <XCircle size={14} />,
              },
              {
                label: "Thời gian",
                value: formatDuration(durationSeconds),
                color: "rgba(255,255,255,0.7)",
                icon: <Clock size={14} />,
              },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div
                  className="flex items-center justify-center gap-1 mb-1"
                  style={{ color: s.color }}
                >
                  {s.icon}
                  <span className="text-xs">{s.label}</span>
                </div>
                <p className="text-xl font-bold" style={{ color: s.color }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">
        {/* Performance bar */}
        <div
          className="p-4 rounded-2xl"
          style={{
            background: "var(--card-light-bg)",
            border: "1px solid var(--card-light-border)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target size={15} style={{ color: "var(--accent-gold)" }} />
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--content-heading)" }}
              >
                Kết quả tổng quan
              </span>
            </div>
            <span className="text-sm font-bold" style={{ color: tier.color }}>
              {correctCount}/{totalCount}
            </span>
          </div>
          <div
            className="h-3 rounded-full overflow-hidden"
            style={{ background: "var(--bg-surface)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${score}%`,
                background: `linear-gradient(90deg, ${tier.color}, ${tier.color}cc)`,
              }}
            />
          </div>
          {unanswered > 0 && (
            <p
              className="text-xs mt-2"
              style={{ color: "var(--content-muted)" }}
            >
              ⚠️ {unanswered} câu chưa được trả lời
            </p>
          )}
        </div>

        {/* Review answers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} style={{ color: "var(--accent-gold)" }} />
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--content-heading)" }}
            >
              Xem lại đáp án
            </h3>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const selected = answers[q.questionId];
              const correct = q.correctAnswer;
              const isRight = selected === correct;
              const notAnswered = selected === undefined;

              return (
                <div
                  key={q.questionId}
                  className="p-4 rounded-xl"
                  style={{
                    background: "var(--card-light-bg)",
                    border: `1.5px solid ${notAnswered ? "var(--card-light-border)" : isRight ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}`,
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                      style={
                        notAnswered
                          ? {
                              background: "var(--bg-surface)",
                              color: "var(--content-muted)",
                            }
                          : isRight
                            ? {
                                background: "rgba(16,185,129,0.15)",
                                color: "#10b981",
                              }
                            : {
                                background: "rgba(239,68,68,0.12)",
                                color: "#ef4444",
                              }
                      }
                    >
                      {idx + 1}
                    </span>
                    <p
                      className="text-sm font-medium leading-snug flex-1"
                      style={{ color: "var(--content-heading)" }}
                    >
                      {q.content}
                    </p>
                    {notAnswered ? null : isRight ? (
                      <CheckCircle2
                        size={15}
                        color="#10b981"
                        className="flex-shrink-0 mt-0.5"
                      />
                    ) : (
                      <XCircle
                        size={15}
                        color="#ef4444"
                        className="flex-shrink-0 mt-0.5"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {q.options.map((opt, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
                        style={{
                          background:
                            i === correct
                              ? "rgba(16,185,129,0.1)"
                              : i === selected && !isRight
                                ? "rgba(239,68,68,0.08)"
                                : "transparent",
                          color:
                            i === correct
                              ? "#065f46"
                              : i === selected && !isRight
                                ? "#7f1d1d"
                                : "var(--content-muted)",
                          fontWeight:
                            i === correct || i === selected ? 600 : 400,
                        }}
                      >
                        <span
                          className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                          style={{
                            background:
                              i === correct
                                ? "#10b981"
                                : i === selected && !isRight
                                  ? "#ef4444"
                                  : "var(--bg-surface)",
                            color:
                              i === correct || (i === selected && !isRight)
                                ? "white"
                                : "var(--content-muted)",
                          }}
                        >
                          {OPTION_LABELS[i]}
                        </span>
                        {opt}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <p
                      className="text-xs leading-relaxed px-1"
                      style={{ color: "var(--content-muted)" }}
                    >
                      💡 {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pb-6">
          <button
            onClick={() => router.push("/quiz")}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{
              background: "var(--card-light-bg)",
              color: "var(--content-heading)",
              border: "1px solid var(--card-light-border)",
            }}
          >
            <Home size={15} />
            Về trang quiz
          </button>
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
              color: "white",
              boxShadow: "0 6px 20px rgba(201,162,77,0.3)",
            }}
          >
            <RotateCcw size={15} />
            Làm lại
          </button>
        </div>
      </div>
    </div>
  );
}
