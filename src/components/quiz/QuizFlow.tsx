"use client";

// components/quiz/QuizFlow.tsx
// Dùng API thật: POST /quizzes/:id/start để lấy questions
import {
  type QuizSetV2,
  type QuizQuestion,
  type SubmitQuizPayload,
} from "@/services/quiz.service";
import React, { useState, useCallback } from "react";
import { Loader2, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import {
  useQuizSets,
  useStartQuiz,
  useSubmitQuiz,
} from "@/features/quiz/hooks";
import { queryKeys } from "@/shared/query-key";
import { QuizDetailPage } from "./QuizDetailPage";
import { QuizSessionPage } from "./QuizSessionPage";
import { QuizResultPage } from "./QuizResultPage";
import { QuizSidebar } from "./QuizSidebar";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation"; // thêm nếu chưa có
import { cn } from "@/lib/utils/cn";

type QuizPhase = "detail" | "session" | "result";

interface QuizFlowProps {
  quiz: QuizSetV2;
}

export function QuizFlow({ quiz: initialQuiz }: QuizFlowProps) {
  const { data: quizData } = useQuizSets();
  const allQuizzes = quizData?.content ?? [];

  const [currentQuiz, setCurrentQuiz] = useState<QuizSetV2>(initialQuiz);
  const [phase, setPhase] = useState<QuizPhase>("detail");
  const [sessionId, setSessionId] = useState<string>("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [useTimer, setUseTimer] = useState(false);

  // Submission result state — lưu lại để hiện ở ResultPage
  const [submitResult, setSubmitResult] = useState<{
    score: number;
    totalQuestions: number;
    percentage: number;
    correctAnswers: number[];
    wrongAnswers: number[];
  } | null>(null);

  const startQuizMutation = useStartQuiz();
  const submitQuizMutation = useSubmitQuiz();
  const router = useRouter();
  const handleGoHome = useCallback(() => {
    router.push("/quiz");
  }, [router]);
  const handleStart = useCallback(
    async (withTimer: boolean) => {
      setUseTimer(withTimer);
      try {
        // POST /quizzes/:id/start → nhận sessionId + questions
        const session = await startQuizMutation.mutateAsync(currentQuiz.quizId);
        setSessionId(session.sessionId);
        setQuestions(session.questions);
        setStartTime(Date.now());
        setPhase("session");
      } catch (err) {
        console.error("Không thể bắt đầu quiz:", err);
      }
    },
    [currentQuiz.quizId, startQuizMutation],
  );
  const queryClient = useQueryClient();

  const handleSubmit = useCallback(
    async (finalAnswers: Record<string, number>, duration: number) => {
      setAnswers(finalAnswers);
      setElapsedSeconds(duration);

      try {
        const payload: SubmitQuizPayload = {
          sessionId,
          answers: Object.entries(finalAnswers).map(
            ([questionId, selectedAnswer]) => ({
              questionId,
              selectedAnswer,
            }),
          ),
          durationSeconds: duration,
        };
        const result = await submitQuizMutation.mutateAsync(payload);
        setSubmitResult(result);

        // ← Thêm dòng này sau khi submit thành công
        await queryClient.invalidateQueries({
          queryKey: queryKeys.quizzes.myResults,
        });
      } catch (err) {
        console.error("Lỗi nộp bài:", err);
      }
      setPhase("result");
    },
    [sessionId, submitQuizMutation, queryClient], // ← thêm queryClient vào deps
  );

  const handleRetry = useCallback(() => {
    setAnswers({});
    setElapsedSeconds(0);
    setQuestions([]);
    setSessionId("");
    setSubmitResult(null);
    setPhase("detail");
  }, []);

  // Switch sang quiz khác từ sidebar — reset toàn bộ state
  const handleSwitchQuiz = useCallback(
    (quizId: string) => {
      if (quizId === currentQuiz.quizId) return;
      const next = allQuizzes.find((q) => q.quizId === quizId);
      if (!next) return;
      setCurrentQuiz(next);
      setPhase("detail");
      setAnswers({});
      setQuestions([]);
      setSessionId("");
      setSubmitResult(null);
      setElapsedSeconds(0);
    },
    [currentQuiz.quizId],
  );

  const isLoading = startQuizMutation.isPending;
  const sidebarWidth = 260;

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{ background: "var(--bg-content)" }}
    >
      {/* Left Sidebar */}
      <>
        {/* Backdrop on mobile */}
        <div
          className={cn(
            "lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-[2px] transition-opacity duration-300",
            sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
          )}
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={cn(
            "flex-shrink-0 h-full transition-all duration-300 z-50 border-r",
            "lg:relative absolute left-0 top-0 bottom-0 shadow-2xl lg:shadow-none bg-[var(--bg-content)] overflow-hidden",
            sidebarOpen ? `w-[${sidebarWidth}px] translate-x-0` : "w-0 lg:w-0 -translate-x-[260px] lg:translate-x-0 border-none",
          )}
        >
          <div style={{ width: `${sidebarWidth}px`, height: "100%" }}>
            <QuizSidebar
              quizzes={allQuizzes}
              activeQuizId={currentQuiz.quizId}
              onSelectQuiz={handleSwitchQuiz}
            />
          </div>
        </div>
      </>

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

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div
              className="flex flex-col items-center justify-center gap-3 h-full"
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
            <QuizDetailPage quiz={currentQuiz} onStart={handleStart} />
          ) : phase === "session" ? (
            <QuizSessionPage
              quiz={currentQuiz}
              questions={questions}
              onSubmit={handleSubmit}
              onBack={handleRetry}
              onGoHome={handleGoHome} // ← thêm
              onRetry={handleRetry} // ← thêm
              startTime={startTime}
              useTimer={useTimer}
            />
          ) : (
            <QuizResultPage
              quiz={currentQuiz}
              questions={questions}
              answers={answers}
              durationSeconds={elapsedSeconds}
              submitResult={submitResult}
              onRetry={handleRetry}
            />
          )}
        </div>
      </div>
    </div>
  );
}
