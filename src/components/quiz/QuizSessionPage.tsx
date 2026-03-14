"use client";

// components/quiz/QuizSessionPage.tsx
// Trang làm bài — hiện tất cả câu, scroll xuống, click → reveal đúng/sai + explanation

import React, { useState, useCallback, useRef } from "react";
import { CheckCircle2, Send } from "lucide-react";
import type { QuizSet, QuizQuestion } from "@/services/quiz.service";
import { QuizProgressBar } from "./QuizProgressBar";
import { QuizQuestionCard } from "./QuizQuestionCard";

interface QuizSessionPageProps {
  quiz: QuizSet;
  questions: QuizQuestion[];
  onSubmit: (answers: Record<string, number>, durationSeconds: number) => void;
  onBack: () => void;
  startTime: number; // Date.now() khi bắt đầu
}

export function QuizSessionPage({
  quiz,
  questions,
  onSubmit,
  onBack,
  startTime,
}: QuizSessionPageProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  const handleAnswer = useCallback(
    (questionId: string, answerIndex: number) => {
      setAnswers((prev) => {
        // Đã trả lời rồi thì không cho đổi
        if (prev[questionId] !== undefined) return prev;

        const next = { ...prev, [questionId]: answerIndex };

        // Auto-scroll đến câu tiếp theo sau 600ms
        const currentIdx = questions.findIndex(
          (q) => q.questionId === questionId,
        );
        const nextQ = questions[currentIdx + 1];
        if (nextQ) {
          setTimeout(() => {
            questionRefs.current[nextQ.questionId]?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 600);
        }

        return next;
      });
    },
    [questions],
  );

  const handleSubmit = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    onSubmit(answers, elapsed);
  };

  const handleTimeUp = () => {
    onSubmit(answers, quiz.durationSeconds);
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--bg-content)" }}
    >
      {/* Sticky progress bar + timer */}
      <QuizProgressBar
        quizTitle={quiz.title}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        durationSeconds={quiz.durationSeconds}
        onTimeUp={handleTimeUp}
        onBack={onBack}
      />

      {/* Scrollable questions list */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          {questions.map((q, idx) => (
            <div
              key={q.questionId}
              ref={(el) => {
                questionRefs.current[q.questionId] = el;
              }}
            >
              <QuizQuestionCard
                question={q}
                index={idx}
                selectedAnswer={answers[q.questionId] ?? null}
                onAnswer={handleAnswer}
              />
            </div>
          ))}

          {/* Submit section */}
          <div
            className="rounded-2xl p-5 text-center"
            style={{
              background: allAnswered
                ? "rgba(16,185,129,0.06)"
                : "var(--card-light-bg)",
              border: `1.5px solid ${
                allAnswered
                  ? "rgba(16,185,129,0.25)"
                  : "var(--card-light-border)"
              }`,
            }}
          >
            {allAnswered ? (
              <div className="flex items-center justify-center gap-2 mb-3">
                <CheckCircle2 size={18} color="#10b981" />
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#10b981" }}
                >
                  Bạn đã trả lời tất cả {questions.length} câu!
                </p>
              </div>
            ) : (
              <div className="mb-3">
                <p
                  className="text-sm"
                  style={{ color: "var(--content-muted)" }}
                >
                  Còn {questions.length - answeredCount} câu chưa trả lời
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--content-subtle)" }}
                >
                  Bạn vẫn có thể nộp bài ngay nếu muốn
                </p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 mx-auto px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: allAnswered
                  ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  : "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
                color: "white",
                boxShadow: allAnswered
                  ? "0 6px 20px rgba(16,185,129,0.3)"
                  : "0 6px 20px rgba(201,162,77,0.3)",
              }}
            >
              <Send size={15} />
              Nộp bài
            </button>
          </div>

          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}
