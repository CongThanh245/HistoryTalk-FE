"use client";

// components/quiz/QuizFlow.tsx
// Orchestrator: quản lý state flow Detail → Session → Result

import React, { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { QuizQuestion, QuizSet } from "@/services/quiz.service";
import { quizService } from "@/services/quiz.service";
import { QuizDetailPage } from "./QuizDetailPage";
import { QuizResultPage } from "./QuizResultPage";
import { QuizSessionPage } from "./QuizSessionPage";

type QuizPhase = "detail" | "session" | "result";

interface QuizFlowProps {
  quiz: QuizSet;
}

export function QuizFlow({ quiz }: QuizFlowProps) {
  const [phase, setPhase] = useState<QuizPhase>("detail");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const handleStart = useCallback(async () => {
    setIsLoadingQuestions(true);
    try {
      // TODO: thay bằng API call
      // const session = await quizService.startQuiz(quiz.quizId);
      // setQuestions(session.questions);
      await new Promise((r) => setTimeout(r, 500));
      const qs = await quizService.getQuestions(quiz.quizId);
      setQuestions(qs);
      setStartTime(Date.now());
      setPhase("session");
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [quiz.quizId]);

  const handleSubmit = useCallback(
    (finalAnswers: Record<string, number>, duration: number) => {
      setAnswers(finalAnswers);
      setElapsedSeconds(duration);
      // TODO: gọi API submit
      // await quizService.submitQuiz({ sessionId, answers: [...], durationSeconds: duration });
      setPhase("result");
    },
    [],
  );

  const handleRetry = useCallback(() => {
    setAnswers({});
    setElapsedSeconds(0);
    setQuestions([]);
    setPhase("detail");
  }, []);

  const handleBackToDetail = useCallback(() => {
    setAnswers({});
    setPhase("detail");
  }, []);

  if (isLoadingQuestions) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-3"
        style={{ background: "var(--bg-content)" }}
      >
        <Loader2
          size={28}
          className="animate-spin"
          style={{ color: "var(--accent-gold)" }}
        />
        <p className="text-sm" style={{ color: "var(--content-muted)" }}>
          Đang chuẩn bị câu hỏi...
        </p>
      </div>
    );
  }

  if (phase === "detail") {
    return <QuizDetailPage quiz={quiz} onStart={handleStart} />;
  }

  if (phase === "session") {
    return (
      <QuizSessionPage
        quiz={quiz}
        questions={questions}
        onSubmit={handleSubmit}
        onBack={handleBackToDetail}
        startTime={startTime}
      />
    );
  }

  return (
    <QuizResultPage
      quiz={quiz}
      questions={questions}
      answers={answers}
      durationSeconds={elapsedSeconds}
      onRetry={handleRetry}
    />
  );
}
