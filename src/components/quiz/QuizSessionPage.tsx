"use client";

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { CheckCircle2 } from "lucide-react";
import type { QuizSet, QuizQuestion } from "@/services/quiz.service";
import { saveQuizProgress } from "@/features/quiz/progress-storage";
import { QuizProgressBar } from "./QuizProgressBar";
import { QuizQuestionCard } from "./QuizQuestionCard";

const AUTO_SUBMIT_BUFFER_SECONDS = 2;

interface QuizSessionPageProps {
  quiz: QuizSet;
  questions: QuizQuestion[];
  sessionId: string;
  onSubmit: (answers: Record<string, number>, elapsedSeconds: number) => Promise<boolean>;
  onBack: () => void;
  onGoHome: () => void;
  onRetry: () => void;
  startTime: number;
  limitedTime?: number;
  initialAnswers?: Record<string, number>;
  initialFlagged?: string[];
  /** Che do luyen tap: hien dung/sai ngay sau moi cau, chay song song che do thi hien tai. */
  practiceMode?: boolean;
}

export function QuizSessionPage({
  quiz,
  questions,
  sessionId,
  onSubmit,
  onBack,
  onGoHome,
  onRetry,
  startTime,
  limitedTime,
  initialAnswers,
  initialFlagged,
  practiceMode = false,
}: QuizSessionPageProps) {
  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers ?? {});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  // Cau nguoi dung tu danh dau de quay lai xem truoc khi nop bai (khong gui len server).
  const [flagged, setFlagged] = useState<Set<string>>(() => new Set(initialFlagged ?? []));
  const answersRef = useRef<Record<string, number>>({});
  const submittedRef = useRef(false);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasTimeLimit = typeof limitedTime === "number" && limitedTime > 0;

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;
  const questionIds = questions.map((q) => q.questionId);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const submitOnce = useCallback(
    async (finalAnswers: Record<string, number>, elapsed: number) => {
      if (submittedRef.current) return false;
      submittedRef.current = true;
      setIsSubmitted(true);
      const ok = await onSubmit(finalAnswers, elapsed);
      if (!ok) {
        submittedRef.current = false;
        setIsSubmitted(false);
      }
      return ok;
    },
    [onSubmit],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextElapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(nextElapsed);

      const submitAt = Math.max((limitedTime ?? 0) - AUTO_SUBMIT_BUFFER_SECONDS, 0);
      if (hasTimeLimit && nextElapsed >= submitAt) {
        window.clearInterval(timer);
        void submitOnce(answersRef.current, nextElapsed);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [hasTimeLimit, limitedTime, startTime, submitOnce]);

  const handleAnswer = useCallback(
    (questionId: string, answerIndex: number) => {
      setAnswers((prev) => {
        const alreadyAnswered = prev[questionId] !== undefined;
        const next = { ...prev, [questionId]: answerIndex };

        // Che do luyen tap: giu nguyen vi tri de nguoi dung doc phan hoi
        // dung/sai truoc, khong tu dong cuon sang cau tiep theo.
        if (!alreadyAnswered && !practiceMode) {
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
    [questions, practiceMode],
  );

  // Tu dong luu tam tien trinh moi khi tra loi / danh dau, de nguoi dung co
  // the tiep tuc neu thoat giua chung (xem QuizFlow.handleStart).
  useEffect(() => {
    saveQuizProgress({
      quizId: quiz.quizId,
      sessionId,
      quizTitle: quiz.title,
      questions,
      answers,
      limitedTime,
      elapsedSeconds,
      flagged: Array.from(flagged),
      practiceMode,
      savedAt: Date.now(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, flagged]);

  const toggleFlag = useCallback((questionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }, []);

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
    void submitOnce(answers, elapsed);
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
        elapsedSeconds={elapsedSeconds}
        limitedTime={limitedTime}
        flagged={flagged}
        practiceMode={practiceMode}
        onBack={onBack}
        onGoHome={onGoHome}
        onRetry={onRetry}
        scrollToQuestion={scrollToQuestion}
      />

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          {hasTimeLimit && (
            <div
              className="rounded-xl border px-4 py-3 text-sm"
              style={{
                background: "rgba(201,162,77,0.08)",
                borderColor: "rgba(201,162,77,0.24)",
                color: "var(--content-muted)",
              }}
            >
              Hết thời gian hệ thống sẽ tự động nộp bài với các câu đã chọn.
            </div>
          )}

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
                flagged={flagged.has(q.questionId)}
                onToggleFlag={toggleFlag}
                practiceMode={practiceMode}
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
              disabled={isSubmitted}
              className="mx-auto h-11 rounded-lg px-8 text-sm font-bold transition-colors duration-200 disabled:opacity-60"
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
