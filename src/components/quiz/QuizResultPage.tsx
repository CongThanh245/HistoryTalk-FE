"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { QuizSet, QuizQuestion } from "@/services/quiz.service";

const OPTION_LABELS = ["A", "B", "C", "D"];

interface SubmitResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  correctAnswers: number[];
  wrongAnswers: number[];
}

interface QuizResultPageProps {
  quiz: QuizSet;
  questions: QuizQuestion[];
  answers: Record<string, number>;
  submitResult: SubmitResult | null;
  onRetry: () => void;
}

export function QuizResultPage({
  quiz,
  questions,
  answers,
  submitResult,
  onRetry,
}: QuizResultPageProps) {
  const router = useRouter();

  const score =
    submitResult?.score ??
    Object.keys(answers).filter((qId) => {
      const q = questions.find((item) => item.questionId === qId);
      return q && answers[qId] === q.correctAnswer;
    }).length;

  const totalQuestions = submitResult?.totalQuestions ?? questions.length;
  const percentage =
    submitResult?.percentage ?? Math.round((score / Math.max(totalQuestions, 1)) * 100);

  const tier =
    percentage >= 90
      ? { label: "Xuất sắc", color: "var(--gold-on-light)", bg: "rgba(201,162,77,0.14)" }
      : percentage >= 70
        ? { label: "Khá tốt", color: "#047857", bg: "rgba(16,185,129,0.10)" }
        : percentage >= 50
          ? { label: "Ổn định", color: "var(--accent-blue)", bg: "rgba(59,130,246,0.10)" }
          : { label: "Cần ôn lại", color: "var(--accent-danger)", bg: "rgba(184,50,42,0.10)" };

  function isCorrect(q: QuizQuestion, idx: number): boolean {
    if (submitResult) {
      return submitResult.correctAnswers.includes(idx);
    }
    return answers[q.questionId] === q.correctAnswer;
  }

  return (
    <main className="min-h-full px-5 py-7 md:px-8" style={{ background: "var(--bg-content)" }}>
      <div className="mx-auto max-w-4xl">
        <section
          className="mb-6 rounded-xl border p-6 md:p-7"
          style={{
            background: "var(--card-light-bg)",
            borderColor: "var(--card-light-border)",
            boxShadow: "0 16px 36px rgba(27,38,50,0.08)",
          }}
        >
          <div className="grid gap-6 md:grid-cols-[1fr_220px] md:items-center">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--content-muted)" }}>
                Kết quả bài làm
              </p>
              <h1 className="mt-2 text-2xl font-bold leading-tight" style={{ color: "var(--content-heading)" }}>
                {quiz.title}
              </h1>
              <span
                className="mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: tier.bg, color: tier.color, border: "1px solid var(--card-light-border)" }}
              >
                {tier.label}
              </span>
            </div>

            <div className="rounded-xl border p-5 text-center" style={{ borderColor: "var(--card-light-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--content-subtle)" }}>
                Điểm
              </p>
              <p className="mt-2 text-5xl font-black leading-none" style={{ color: tier.color }}>
                {score}
                <span className="text-2xl">/{totalQuestions}</span>
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Đúng", value: score, color: "#047857" },
              { label: "Sai", value: totalQuestions - score, color: "var(--accent-danger)" },
              { label: "Tổng câu", value: totalQuestions, color: "var(--content-heading)" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border px-4 py-3"
                style={{ background: "rgba(27,38,50,0.035)", borderColor: "var(--card-light-border)" }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--content-subtle)" }}>
                  {item.label}
                </p>
                <p className="mt-1 text-xl font-bold" style={{ color: item.color }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold" style={{ color: "var(--content-heading)" }}>
            Xem lại đáp án
          </h2>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const selected = answers[q.questionId];
              const correct = isCorrect(q, idx);
              const notAnswered = selected === undefined;

              return (
                <article
                  key={q.questionId}
                  className="rounded-xl border p-4"
                  style={{
                    background: "var(--card-light-bg)",
                    borderColor: notAnswered
                      ? "var(--card-light-border)"
                      : correct
                        ? "rgba(16,185,129,0.28)"
                        : "rgba(184,50,42,0.24)",
                  }}
                >
                  <div className="mb-3 flex items-start gap-3">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        background: correct ? "rgba(16,185,129,0.12)" : "rgba(27,38,50,0.06)",
                        color: correct ? "#047857" : "var(--content-heading)",
                      }}
                    >
                      {idx + 1}
                    </span>
                    <p className="flex-1 text-sm font-semibold leading-6" style={{ color: "var(--content-heading)" }}>
                      {q.content}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {q.options.map((opt, i) => {
                      const isAnswer = i === q.correctAnswer;
                      const isWrongPick = i === selected && !correct;
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                          style={{
                            background: isAnswer
                              ? "rgba(16,185,129,0.10)"
                              : isWrongPick
                                ? "rgba(184,50,42,0.08)"
                                : "rgba(27,38,50,0.025)",
                            color: isAnswer
                              ? "#065f46"
                              : isWrongPick
                                ? "var(--accent-danger)"
                                : "var(--content-muted)",
                            fontWeight: isAnswer || isWrongPick ? 700 : 500,
                          }}
                        >
                          <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                            style={{
                              background: isAnswer
                                ? "#047857"
                                : isWrongPick
                                  ? "var(--accent-danger)"
                                  : "var(--card-light-bg)",
                              color: isAnswer || isWrongPick ? "#fff" : "var(--content-muted)",
                              border: isAnswer || isWrongPick ? "none" : "1px solid var(--card-light-border)",
                            }}
                          >
                            {OPTION_LABELS[i]}
                          </span>
                          <span className="min-w-0">{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <p className="mt-3 text-sm leading-6" style={{ color: "var(--content-muted)" }}>
                      {q.explanation}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <div className="flex gap-3 pb-6 pt-6">
          <button
            onClick={() => router.push("/quiz")}
            className="h-12 flex-1 rounded-lg text-sm font-bold transition-all hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: "var(--card-light-bg)",
              color: "var(--content-heading)",
              border: "1px solid var(--card-light-border)",
            }}
          >
            Về trang quiz
          </button>
          <button
            onClick={() => router.push("/quiz?view=history")}
            className="h-12 flex-1 rounded-lg text-sm font-bold transition-all hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: "var(--accent-gold-active-bg)",
              color: "var(--gold-on-light)",
              border: "1px solid rgba(201,162,77,0.35)",
            }}
          >
            Xem lịch sử
          </button>
          <button
            onClick={onRetry}
            className="h-12 flex-1 rounded-lg text-sm font-bold transition-all hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: "var(--abyssal-blue)",
              color: "var(--text-on-dark)",
              boxShadow: "0 8px 18px rgba(27,38,50,0.18)",
            }}
          >
            Làm lại
          </button>
        </div>
      </div>
    </main>
  );
}
