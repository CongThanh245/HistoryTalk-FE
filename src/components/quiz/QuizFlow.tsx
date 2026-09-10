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
import { getApiErrorMessage } from "@/lib/utils/api-error";
import {
  clearQuizProgress,
  loadQuizProgress,
  type SavedQuizProgress,
} from "@/features/quiz/progress-storage";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { QuizDetailPage } from "./QuizDetailPage";
import { QuizSessionPage } from "./QuizSessionPage";
import { QuizResultPage } from "./QuizResultPage";
import { QuizSidebar } from "./QuizSidebar";

type QuizPhase = "detail" | "session" | "result";

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
  const [initialAnswers, setInitialAnswers] = useState<Record<string, number>>({});
  const [initialFlagged, setInitialFlagged] = useState<string[]>([]);
  const [practiceMode, setPracticeMode] = useState(false);
  const [resumeState, setResumeState] = useState<{
    saved: SavedQuizProgress;
    limitedTime?: number;
    practiceMode?: boolean;
  } | null>(null);

  const startQuizMutation = useStartQuiz();
  const submitQuizMutation = useSubmitQuiz();
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleGoHome = useCallback(() => {
    router.push("/quiz");
  }, [router]);

  const startQuiz = useCallback(
    async (nextLimitedTime?: number, nextPracticeMode?: boolean) => {
      try {
        clearQuizProgress(currentQuiz.quizId);
        setInitialAnswers({});
        setInitialFlagged([]);
        setPracticeMode(nextPracticeMode ?? false);
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

  // Neu co tien trinh da luu (localStorage) cho cung quiz nay, hoi nguoi dung
  // muon tiep tuc hay lam lai tu dau thay vi vao thang phien moi.
  const handleStart = useCallback(
    (nextLimitedTime?: number, nextPracticeMode?: boolean) => {
      runWithAuth(() => {
        const saved = loadQuizProgress(currentQuiz.quizId);
        if (saved) {
          setResumeState({ saved, limitedTime: nextLimitedTime, practiceMode: nextPracticeMode });
          return;
        }
        void startQuiz(nextLimitedTime, nextPracticeMode);
      });
    },
    [runWithAuth, startQuiz, currentQuiz.quizId],
  );

  const resumeSaved = useCallback(() => {
    if (!resumeState) return;
    const { saved } = resumeState;
    setSessionId(saved.sessionId);
    setQuestions(saved.questions);
    setInitialAnswers(saved.answers);
    setInitialFlagged(saved.flagged);
    setStartTime(Date.now() - saved.elapsedSeconds * 1000);
    setLimitedTime(saved.limitedTime);
    setPracticeMode(saved.practiceMode ?? false);
    setPhase("session");
    setResumeState(null);
  }, [resumeState]);

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
        clearQuizProgress(currentQuiz.quizId);

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
    [sessionId, submitQuizMutation, queryClient, currentQuiz.quizId],
  );

  const resetSession = useCallback(() => {
    setAnswers({});
    setQuestions([]);
    setSessionId("");
    setSubmitResult(null);
    setLimitedTime(undefined);
    setPhase("detail");
  }, []);

  // "Làm lại" ở màn kết quả: vào thẳng phiên làm bài mới của cùng quiz (giữ
  // nguyên giới hạn thời gian và chế độ đã chọn), không bắt quay lại trang chi tiết.
  const retrySameQuiz = useCallback(() => {
    setAnswers({});
    setSubmitResult(null);
    void startQuiz(limitedTime, practiceMode);
  }, [startQuiz, limitedTime, practiceMode]);

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
    <div className="flex h-full overflow-hidden bg-[var(--bg-content)]">
      {authRequiredDialog}

      <ConfirmDialog
        open={!!resumeState}
        onOpenChange={(open) => {
          if (!open) setResumeState(null);
        }}
        title="Tiếp tục bài làm dở?"
        description="Bạn có một bài đang làm dở cho quiz này. Tiếp tục từ chỗ đã dừng hay làm lại từ đầu?"
        cancelLabel="Làm lại từ đầu"
        confirmLabel="Tiếp tục"
        onConfirm={resumeSaved}
        onCancel={() => {
          const limitedTimeToUse = resumeState?.limitedTime;
          const practiceModeToUse = resumeState?.practiceMode;
          setResumeState(null);
          void startQuiz(limitedTimeToUse, practiceModeToUse);
        }}
      />

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
          className="absolute top-3 left-3 z-30 p-1.5 rounded-lg transition-all hover:bg-black/5 text-content-muted bg-card-light-bg border border-card-light-border"
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
            <div className="flex flex-col items-center justify-center gap-3 h-full bg-[var(--bg-content)]">
              <Loader2
                size={28}
                className="animate-spin text-accent-gold"
              />
              <p className="text-sm text-content-muted">
                Đang chuẩn bị câu hỏi...
              </p>
            </div>
          ) : phase === "detail" ? (
            <QuizDetailPage quiz={currentQuiz} onStart={handleStart} />
          ) : phase === "session" ? (
            <QuizSessionPage
              quiz={currentQuiz}
              questions={questions}
              sessionId={sessionId}
              onSubmit={handleSubmit}
              onBack={resetSession}
              onGoHome={handleGoHome}
              onRetry={resetSession}
              startTime={startTime}
              limitedTime={limitedTime}
              initialAnswers={initialAnswers}
              initialFlagged={initialFlagged}
              practiceMode={practiceMode}
            />
          ) : (
            <QuizResultPage
              quiz={currentQuiz}
              questions={questions}
              answers={answers}
              submitResult={submitResult}
              onRetry={retrySameQuiz}
              sessionId={sessionId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
