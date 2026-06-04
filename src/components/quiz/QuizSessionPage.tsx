"use client";

import React, { useState, useCallback, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import type { QuizSet, QuizQuestion } from "@/services/quiz.service";
import { QuizProgressBar } from "./QuizProgressBar";
import { QuizQuestionCard } from "./QuizQuestionCard";

interface QuizSessionPageProps {
  quiz: QuizSet;
  questions: QuizQuestion[];
  onSubmit: (answers: Record<string, number>, elapsedSeconds: number) => void;
  onBack: () => void;
  onGoHome: () => void;
  onRetry: () => void;
  startTime: number;
}

export function QuizSessionPage({
  quiz,
  questions,
  onSubmit,
  onBack,
  onGoHome,
  onRetry,
  startTime,
}: QuizSessionPageProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;
  const questionIds = questions.map((q) => q.questionId);

  const handleAnswer = useCallback(
    (questionId: string, answerIndex: number) => {
      setAnswers((prev) => {
        const alreadyAnswered = prev[questionId] !== undefined;
        const next = { ...prev, [questionId]: answerIndex };

        if (!alreadyAnswered) {
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
            }, 450);
          }
        }

        return next;
      });
    },
    [questions],
  );

  const scrollToQuestion = useCallback(
    (index: number) => {
      const qId = questions[index]?.questionId;
      if (!qId) return;
      questionRefs.current[qId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    },
    [questions],
  );

  const handleSubmit = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    onSubmit(answers, elapsed);
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--bg-content)" }}
    >
      <QuizProgressBar
        quizTitle={quiz.title}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        answers={answers}
        questionIds={questionIds}
        onBack={onBack}
        onGoHome={onGoHome}
        onRetry={onRetry}
        scrollToQuestion={scrollToQuestion}
      />

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
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

          <div
            className="rounded-xl border p-5 text-center"
            style={{
              background: allAnswered
                ? "rgba(16,185,129,0.06)"
                : "var(--card-light-bg)",
              borderColor: allAnswered
                ? "rgba(16,185,129,0.25)"
                : "var(--card-light-border)",
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
              className="mx-auto h-11 rounded-lg px-8 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              style={{
                background: allAnswered ? "#047857" : "var(--abyssal-blue)",
                color: "var(--text-on-dark)",
                boxShadow: allAnswered
                  ? "0 8px 18px rgba(4,120,87,0.18)"
                  : "0 8px 18px rgba(27,38,50,0.18)",
              }}
            >
              Nộp bài
            </button>
          </div>

          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}
