"use client";

// components/quiz/QuizFlow.tsx — v2
// Thêm: sidebar trái danh sách quiz, timer optional

import React, { useState, useCallback } from "react";
import { Loader2, PanelLeftOpen, PanelLeftClose } from "lucide-react";

import { QuizDetailPage } from "./QuizDetailPage";
import { QuizSessionPage } from "./QuizSessionPage";
import { QuizResultPage } from "./QuizResultPage";
import { QuizSidebar } from "./QuizSidebar";
import type { QuizSet, QuizQuestion, QuizSetV2 } from "@/services/quiz.service";
import {
  MOCK_QUIZ_SETS,
  MOCK_QUESTIONS,
  quizService,
} from "@/services/quiz.service";

type QuizPhase = "detail" | "session" | "result";

interface QuizFlowProps {
  quiz: QuizSetV2;
}

export function QuizFlow({ quiz: initialQuiz }: QuizFlowProps) {
  const [currentQuiz, setCurrentQuiz] = useState<QuizSetV2>(initialQuiz);
  const [phase, setPhase] = useState<QuizPhase>("detail");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [useTimer, setUseTimer] = useState(false); // timer optional

  const handleStart = useCallback(
    async (withTimer: boolean) => {
      setIsLoadingQuestions(true);
      setUseTimer(withTimer);
      try {
        // TODO: const session = await quizService.startQuiz(currentQuiz.quizId);
        await new Promise((r) => setTimeout(r, 400));
        const qs =
          MOCK_QUESTIONS[currentQuiz.quizId] ?? MOCK_QUESTIONS["ls12-b1"];

        setQuestions(qs);
        setStartTime(Date.now());
        setPhase("session");
      } finally {
        setIsLoadingQuestions(false);
      }
    },
    [currentQuiz.quizId],
  );

  const handleSubmit = useCallback(
    (finalAnswers: Record<string, number>, duration: number) => {
      setAnswers(finalAnswers);
      setElapsedSeconds(duration);
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

  // Switch sang quiz khác từ sidebar
  const handleSwitchQuiz = useCallback(
    (quizId: string) => {
      const next = MOCK_QUIZ_SETS.find((q) => q.quizId === quizId);
      if (!next || next.quizId === currentQuiz.quizId) return;
      // Reset state
      setCurrentQuiz(next);
      setPhase("detail");
      setAnswers({});
      setQuestions([]);
      setElapsedSeconds(0);
    },
    [currentQuiz.quizId],
  );

  const sidebarWidth = 260;

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{ background: "var(--bg-content)" }}
    >
      {/* Left Sidebar */}
      <div
        className="flex-shrink-0 overflow-hidden transition-all duration-300"
        style={{ width: sidebarOpen ? `${sidebarWidth}px` : "0px" }}
      >
        <div style={{ width: `${sidebarWidth}px`, height: "100%" }}>
          <QuizSidebar
            quizzes={MOCK_QUIZ_SETS}
            activeQuizId={currentQuiz.quizId}
            onSelectQuiz={handleSwitchQuiz}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Toggle sidebar button */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="absolute top-3 left-3 z-30 p-1.5 rounded-lg transition-all hover:bg-black/5"
          style={{
            color: "var(--content-muted)",
            background: "var(--card-light-bg)",
            border: "1px solid var(--card-light-border)",
          }}
          title={sidebarOpen ? "Ẩn danh sách" : "Hiện danh sách"}
        >
          {sidebarOpen ? (
            <PanelLeftClose size={15} />
          ) : (
            <PanelLeftOpen size={15} />
          )}
        </button>

        {/* Phase content */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingQuestions ? (
            <div
              className="flex-1 flex flex-col items-center justify-center gap-3 h-full"
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
          ) : phase === "detail" ? (
            <QuizDetailPage
              quiz={currentQuiz as QuizSet}
              onStart={handleStart}
            />
          ) : phase === "session" ? (
            <QuizSessionPage
              quiz={currentQuiz as QuizSet}
              questions={questions}
              onSubmit={handleSubmit}
              onBack={handleRetry}
              startTime={startTime}
              useTimer={useTimer}
            />
          ) : (
            <QuizResultPage
              quiz={currentQuiz as QuizSet}
              questions={questions}
              answers={answers}
              durationSeconds={elapsedSeconds}
              onRetry={handleRetry}
            />
          )}
        </div>
      </div>
    </div>
  );
}
