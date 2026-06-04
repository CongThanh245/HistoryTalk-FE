"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Loader2, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  type QuizSet,
  type QuizQuestion,
  type SubmitQuizPayload,
  type SubmitQuizResponse,
} from "@/services/quiz.service";
import { useQuizSets, useStartQuiz, useSubmitQuiz } from "@/features/quiz/hooks";
import { useAuthRequiredNavigation } from "@/features/auth/use-auth-required-navigation";
import { queryKeys } from "@/shared/query-key";
import { cn } from "@/lib/utils/cn";
import { QuizDetailPage } from "./QuizDetailPage";
import { QuizSessionPage } from "./QuizSessionPage";
import { QuizResultPage } from "./QuizResultPage";
import { QuizSidebar } from "./QuizSidebar";

type QuizPhase = "detail" | "session" | "result";

type ApiErrorBody = {
  message?: string;
  errors?: Record<string, string | string[]>;
};

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return fallback;

  const data = error.response?.data;
  const fieldErrors = data?.errors
    ? Object.entries(data.errors)
        .map(([field, value]) => {
          const text = Array.isArray(value) ? value.join(", ") : value;
          return `${field}: ${text}`;
        })
        .join("\n")
    : "";

  return [data?.message, fieldErrors].filter(Boolean).join("\n") || fallback;
}

interface QuizFlowProps {
  quiz: QuizSet;
}

export function QuizFlow({ quiz: initialQuiz }: QuizFlowProps) {
  const { authRequiredDialog, runWithAuth } = useAuthRequiredNavigation({
    title: "Bạn cần đăng nhập để làm quiz",
    description:
      "Bạn vẫn có thể xem nội dung quiz. Đăng nhập để bắt đầu làm bài, nộp kết quả và lưu lại lịch sử luyện tập.",
  });
  const { data: quizData } = useQuizSets();
  const allQuizzes = useMemo(() => quizData?.content ?? [], [quizData?.content]);

  const [currentQuiz, setCurrentQuiz] = useState<QuizSet>(initialQuiz);
  const [phase, setPhase] = useState<QuizPhase>("detail");
  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [startTime, setStartTime] = useState(0);
  const [limitedTime, setLimitedTime] = useState<number | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [submitResult, setSubmitResult] = useState<SubmitQuizResponse | null>(null);

  const startQuizMutation = useStartQuiz();
  const submitQuizMutation = useSubmitQuiz();
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleGoHome = useCallback(() => {
    router.push("/quiz");
  }, [router]);

  const startQuiz = useCallback(
    async (nextLimitedTime?: number) => {
      try {
        const session = await startQuizMutation.mutateAsync({
          quizId: currentQuiz.quizId,
          limitedTime: nextLimitedTime,
        });
        setSessionId(session.sessionId);
        setQuestions(session.questions);
        setStartTime(Date.now());
        setLimitedTime(nextLimitedTime);
        setPhase("session");
      } catch (err) {
        console.error("Không thể bắt đầu quiz:", err);
      }
    },
    [currentQuiz.quizId, startQuizMutation],
  );

  const handleStart = useCallback(
    (nextLimitedTime?: number) => {
      runWithAuth(() => {
        void startQuiz(nextLimitedTime);
      });
    },
    [runWithAuth, startQuiz],
  );

  const handleSubmit = useCallback(
    async (finalAnswers: Record<string, number>, elapsedSeconds: number) => {
      setAnswers(finalAnswers);
      try {
        const payload: SubmitQuizPayload = {
          sessionId,
          answers: Object.entries(finalAnswers).map(
            ([questionId, selectedAnswer]) => ({
              questionId,
              selectedAnswer,
            }),
          ),
        };
        const result = await submitQuizMutation.mutateAsync(payload);
        setSubmitResult({ ...result, durationSeconds: elapsedSeconds });

        await queryClient.invalidateQueries({
          queryKey: queryKeys.quizzes.myResults,
        });
        setPhase("result");
        return true;
      } catch (err) {
        const message = getApiErrorMessage(
          err,
          "Nộp bài thất bại. Vui lòng thử lại.",
        );
        console?.error(
          "Lỗi nộp bài:",
          axios.isAxiosError(err) ? err.response?.data ?? err.message : err,
        );
        toast.error(message, { duration: 6000 });
        return false;
      }
    },
    [sessionId, submitQuizMutation, queryClient],
  );

  const resetSession = useCallback(() => {
    setAnswers({});
    setQuestions([]);
    setSessionId("");
    setSubmitResult(null);
    setLimitedTime(undefined);
    setPhase("detail");
  }, []);

  const handleSwitchQuiz = useCallback(
    (quizId: string) => {
      if (quizId === currentQuiz.quizId) return;
      const next = allQuizzes.find((q) => q.quizId === quizId);
      if (!next) return;
      setCurrentQuiz(next);
      resetSession();
    },
    [allQuizzes, currentQuiz.quizId, resetSession],
  );

  const isLoading = startQuizMutation.isPending;
  const sidebarWidth = 260;

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{ background: "var(--bg-content)" }}
    >
      {authRequiredDialog}
      <>
        <div
          className={cn(
            "lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-[2px] transition-opacity duration-300",
            sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible",
          )}
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={cn(
            "flex-shrink-0 h-full transition-all duration-300 z-50 border-r",
            "lg:relative absolute left-0 top-0 bottom-0 shadow-2xl lg:shadow-none bg-[var(--bg-content)] overflow-hidden",
            sidebarOpen
              ? `w-[${sidebarWidth}px] translate-x-0`
              : "w-0 lg:w-0 -translate-x-[260px] lg:translate-x-0 border-none",
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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
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
              onBack={resetSession}
              onGoHome={handleGoHome}
              onRetry={resetSession}
              startTime={startTime}
              limitedTime={limitedTime}
            />
          ) : (
            <QuizResultPage
              quiz={currentQuiz}
              questions={questions}
              answers={answers}
              submitResult={submitResult}
              onRetry={resetSession}
            />
          )}
        </div>
      </div>
    </div>
  );
}
