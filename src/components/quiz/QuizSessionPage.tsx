"use client";

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Link2,
  ListChecks,
  PenLine,
  ScrollText,
} from "lucide-react";
import type { QuizSet, QuizQuestion } from "@/services/quiz.service";
import { saveQuizProgress } from "@/features/quiz/progress-storage";
import {
  gradeAnswer,
  hasAnswerKey,
  isAnswerComplete,
  type AnswerData,
} from "@/features/quiz/question-data";
import { cn } from "@/lib/utils/cn";
import {
  CHEER_LINES,
  QuizCheer,
  QuizConfetti,
  pickCheer,
  type Cheer,
  type CheerTone,
} from "./QuizFx";
import { QuizNavPanel } from "./QuizNavPanel";
import { QuizProgressBar } from "./QuizProgressBar";
import { QuizQuestionCard } from "./QuizQuestionCard";

const AUTO_SUBMIT_BUFFER_SECONDS = 2;
// Tra loi lien tiep trong khoang nay (che do thi) thi tinh la "combo".
const COMBO_WINDOW_MS = 20_000;

interface QuizSessionPageProps {
  quiz: QuizSet;
  questions: QuizQuestion[];
  sessionId: string;
  onSubmit: (
    answers: Record<string, AnswerData>,
    elapsedSeconds: number,
  ) => Promise<boolean>;
  onBack: () => void;
  onGoHome?: () => void;
  onRetry: () => void;
  startTime: number;
  limitedTime?: number;
  initialAnswers?: Record<string, AnswerData>;
  initialFlagged?: string[];
  /** Che do luyen tap: hien dung/sai ngay sau moi cau, chay song song che do thi hien tai. */
  practiceMode?: boolean;
  /**
   * Nhung trong trang khac (bai tap duoc giao): cau hoi chay theo chieu dai trang thay vi
   * cuon trong khung cao co dinh, thanh tien do dinh o dau khi cuon.
   */
  embedded?: boolean;
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
  embedded = false,
}: QuizSessionPageProps) {
  const [answers, setAnswers] = useState<Record<string, AnswerData>>(
    initialAnswers ?? {},
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  // Cau nguoi dung tu danh dau de quay lai xem truoc khi nop bai (khong gui len server).
  const [flagged, setFlagged] = useState<Set<string>>(
    () => new Set(initialFlagged ?? []),
  );
  const answersRef = useRef<Record<string, AnswerData>>({});
  const submittedRef = useRef(false);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasTimeLimit = typeof limitedTime === "number" && limitedTime > 0;

  // Cau dien chu / noi cap chi tinh la "da tra loi" khi nhap du.
  const completedAnswers = useMemo(() => {
    const result: Record<string, AnswerData> = {};
    for (const q of questions) {
      const answer = answers[q.questionId];
      if (answer && isAnswerComplete(q, answer)) result[q.questionId] = answer;
    }
    return result;
  }, [answers, questions]);
  const answeredCount = Object.keys(completedAnswers).length;
  const allAnswered = answeredCount === questions.length;
  const questionIds = questions.map((q) => q.questionId);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const submitOnce = useCallback(
    async (finalAnswers: Record<string, AnswerData>, elapsed: number) => {
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

      const submitAt = Math.max(
        (limitedTime ?? 0) - AUTO_SUBMIT_BUFFER_SECONDS,
        0,
      );
      if (hasTimeLimit && nextElapsed >= submitAt) {
        window.clearInterval(timer);
        void submitOnce(answersRef.current, nextElapsed);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [hasTimeLimit, limitedTime, startTime, submitOnce]);

  // ── Hieu ung vui: loi co vu, chuoi lien tiep, phao giay khi tra loi het ──
  const [cheer, setCheer] = useState<Cheer | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [streak, setStreak] = useState(0);
  const streakRef = useRef(0);
  const lastAnswerAtRef = useRef(0);
  const cheerIdRef = useRef(0);

  useEffect(() => {
    if (!cheer) return;
    const t = window.setTimeout(() => setCheer(null), 1700);
    return () => window.clearTimeout(t);
  }, [cheer]);

  useEffect(() => {
    if (!confettiKey) return;
    const t = window.setTimeout(() => setConfettiKey(0), 4500);
    return () => window.clearTimeout(t);
  }, [confettiKey]);

  const celebrate = useCallback(
    (questionId: string, answer: AnswerData) => {
      const q = questions.find((x) => x.questionId === questionId);
      if (!q) return;
      const prevAnswers = answersRef.current;
      const prev = prevAnswers[questionId];
      if ((prev && isAnswerComplete(q, prev)) || !isAnswerComplete(q, answer))
        return;

      const show = (text: string, tone: CheerTone) =>
        setCheer({ id: ++cheerIdRef.current, text, tone });
      const setStreakTo = (n: number) => {
        streakRef.current = n;
        setStreak(n);
      };
      const done = questions.filter((x) => {
        if (x.questionId === questionId) return true;
        const a = prevAnswers[x.questionId];
        return !!a && isAnswerComplete(x, a);
      }).length;

      // Luyen tap co dap an: chuoi = so cau dung lien tiep.
      if (
        practiceMode &&
        q.questionType !== "FILL_IN_BLANK" &&
        hasAnswerKey(q)
      ) {
        const ok = gradeAnswer(q, answer);
        setStreakTo(ok ? streakRef.current + 1 : 0);
        if (done === questions.length) {
          setConfettiKey((k) => k + 1);
          show("Hoàn thành! 🎉", "good");
        } else if (!ok) show(pickCheer(CHEER_LINES.bad), "bad");
        else
          show(
            streakRef.current >= 2
              ? `🔥 ${streakRef.current} câu đúng liên tiếp!`
              : pickCheer(),
            "good",
          );
        return;
      }

      // Che do thi: chua biet dung sai, chuoi = so cau tra loi lien tiep nhanh.
      const now = Date.now();
      setStreakTo(
        now - lastAnswerAtRef.current < COMBO_WINDOW_MS
          ? streakRef.current + 1
          : 1,
      );
      lastAnswerAtRef.current = now;

      if (done === questions.length) {
        setConfettiKey((k) => k + 1);
        show("Xong hết rồi! Nộp bài thôi 🎉", "good");
      } else if (
        questions.length >= 4 &&
        done === Math.ceil(questions.length / 2)
      ) {
        show("Đã đi được nửa chặng! 💪", "info");
      } else if (q.questionType !== "FILL_IN_BLANK") {
        // Cau dien chu "xong" ngay tu ky tu dau tien, khong reo len giua luc dang go.
        show(
          streakRef.current >= 3
            ? `🔥 Combo x${streakRef.current}!`
            : pickCheer(),
          "good",
        );
      }
    },
    [questions, practiceMode],
  );

  const handleAnswer = useCallback(
    (questionId: string, answer: AnswerData) => {
      celebrate(questionId, answer);
      setAnswers((prev) => {
        const alreadyAnswered = prev[questionId] !== undefined;
        const next = { ...prev, [questionId]: answer };
        const currentIdx = questions.findIndex(
          (q) => q.questionId === questionId,
        );

        // Che do luyen tap: giu nguyen vi tri de nguoi dung doc phan hoi
        // dung/sai truoc, khong tu dong cuon sang cau tiep theo. Chi tu cuon
        // voi cau trac nghiem — cau dien chu / noi cap con dang nhap tiep.
        if (
          !alreadyAnswered &&
          !practiceMode &&
          questions[currentIdx]?.questionType === "MULTIPLE_CHOICE"
        ) {
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
    [questions, practiceMode, celebrate],
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

  // A quiz whose questions were all removed still starts a session with none: say so instead of cheering
  // "bạn đã trả lời cả 0 câu" and letting a submit the API rejects ("answers không được để trống").
  if (questions.length === 0) {
    return (
      <div className="flex min-h-full items-center justify-center px-4 py-12">
        <EmptyState
          mascot="sad"
          title="Bộ đề này chưa có câu hỏi"
          description="Có thể câu hỏi đang được cập nhật. Bạn thử bộ đề khác nhé."
          action={
            <button type="button" className="btn-line" onClick={onBack}>
              Quay lại danh sách
            </button>
          }
        />
      </div>
    );
  }

  const progressBar = (
    <QuizProgressBar
      quizTitle={quiz.title}
      totalQuestions={questions.length}
      answeredCount={answeredCount}
      answers={completedAnswers}
      questionIds={questionIds}
      elapsedSeconds={elapsedSeconds}
      limitedTime={limitedTime}
      flagged={flagged}
      practiceMode={practiceMode}
      onBack={onBack}
      onGoHome={onGoHome}
      onRetry={onRetry}
      scrollToQuestion={scrollToQuestion}
      inset={!embedded}
    />
  );

  const questionList = (
    <>
      {hasTimeLimit && (
        <div className="flex items-center gap-2 rounded-[4px] border-2 border-[var(--gold-leaf)] bg-[var(--gold-leaf-bg)] px-4 py-3 text-sm font-medium text-content-text">
          <Clock
            size={16}
            className="flex-shrink-0 text-[var(--gold-leaf)]"
            aria-hidden="true"
          />
          Hết thời gian hệ thống sẽ tự động nộp bài với các câu đã chọn.
        </div>
      )}

      {questions.map((q, idx) => (
        <div
          key={q.questionId}
          ref={(el) => {
            questionRefs.current[q.questionId] = el;
          }}
          className="scroll-mt-6"
        >
          <QuizQuestionCard
            question={q}
            index={idx}
            answer={answers[q.questionId]}
            onAnswer={handleAnswer}
            flagged={flagged.has(q.questionId)}
            onToggleFlag={toggleFlag}
            practiceMode={practiceMode}
          />
        </div>
      ))}

      <div
        className={cn(
          "rounded-[4px] border-2 p-6 text-center transition-colors duration-300",
          allAnswered
            ? "border-[var(--status-success)] bg-[var(--status-success-bg)] shadow-[5px_5px_0_var(--status-success)]"
            : "border-[var(--text-primary)] bg-[var(--bg-surface)] shadow-[5px_5px_0_var(--border-strong)]",
        )}
      >
        {allAnswered ? (
          <div className="mb-4 flex flex-col items-center gap-2">
            <span className="quiz-pop flex h-14 w-14 items-center justify-center rounded-full bg-[var(--status-success)] text-[#FFFFFF]">
              <CheckCircle2 size={30} />
            </span>
            <p className="font-display text-[22px] font-extrabold text-[var(--status-success)]">
              Tuyệt! Bạn đã trả lời cả {questions.length} câu 🎉
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <p className="font-display text-[22px] font-extrabold text-content-heading">
              Còn {questions.length - answeredCount} câu nữa thôi! 💪
            </p>
            <p className="mt-1 text-xs text-content-subtle">
              Bạn vẫn có thể nộp bài ngay nếu muốn
            </p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitted}
          className={cn(
            "mx-auto h-12 rounded-[6px] px-10 text-[15px] font-extrabold uppercase tracking-[0.08em] transition-all disabled:opacity-60",
            "active:translate-y-1 active:shadow-none",
            allAnswered
              ? "bg-[var(--status-success)] text-[#FFFFFF] shadow-[0_5px_0_color-mix(in_srgb,var(--status-success)_60%,black)] hover:-translate-y-0.5"
              : "bg-[var(--text-primary)] text-[var(--text-inverse)] shadow-[0_5px_0_var(--accent-gold)] hover:-translate-y-0.5",
          )}
        >
          {isSubmitted ? "Đang nộp..." : "Nộp bài"}
        </button>
      </div>
    </>
  );

  const fx = (
    <>
      {confettiKey > 0 && <QuizConfetti key={confettiKey} />}
      {cheer && <QuizCheer key={cheer.id} cheer={cheer} />}
    </>
  );

  const typeCounts = questions.reduce<
    Record<QuizQuestion["questionType"], number>
  >((acc, q) => ({ ...acc, [q.questionType]: acc[q.questionType] + 1 }), {
    MULTIPLE_CHOICE: 0,
    FILL_IN_BLANK: 0,
    MATCHING: 0,
  });
  const heroChips = [
    {
      icon: ListChecks,
      text: `${typeCounts.MULTIPLE_CHOICE} trắc nghiệm`,
      show: typeCounts.MULTIPLE_CHOICE > 0,
    },
    {
      icon: PenLine,
      text: `${typeCounts.FILL_IN_BLANK} điền chỗ trống`,
      show: typeCounts.FILL_IN_BLANK > 0,
    },
    {
      icon: Link2,
      text: `${typeCounts.MATCHING} nối cặp`,
      show: typeCounts.MATCHING > 0,
    },
    {
      icon: Clock,
      text: hasTimeLimit
        ? `Giới hạn ${Math.round((limitedTime ?? 0) / 60)} phút`
        : "Không giới hạn thời gian",
      show: true,
    },
  ].filter((c) => c.show);

  if (embedded) {
    // Trong trang bai tap: cau hoi ben trai theo chieu dai trang, cot dieu huong
    // (dong ho / luoi cau / nop bai) dinh ben phai. Man hep dung thanh tien do dinh tren.
    return (
      <div className="space-y-4">
        <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:hidden">
          {progressBar}
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-8">
          <div className="min-w-0 space-y-5">
            <div className="relative overflow-hidden rounded-[4px] bg-[var(--text-primary)] px-6 py-6 text-[var(--text-inverse)] shadow-[5px_5px_0_var(--accent-gold)]">
              <ScrollText
                size={180}
                strokeWidth={1}
                className="pointer-events-none absolute -bottom-10 -right-6 rotate-[-12deg] opacity-[0.08]"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={onBack}
                className="relative hidden items-center gap-1.5 text-[12px] font-semibold opacity-70 transition-opacity hover:opacity-100 lg:inline-flex"
              >
                <ArrowLeft size={14} aria-hidden="true" />
                Quay lại bài tập
              </button>
              <div className="relative mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--accent-gold)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#FFFFFF]">
                  {practiceMode ? "Luyện tập" : "Bài kiểm tra"}
                </span>
                <span className="text-[12px] font-semibold opacity-70">
                  {questions.length} câu hỏi
                </span>
              </div>
              <h2 className="live-ink relative mt-2 font-display text-[30px] font-extrabold leading-tight">
                {quiz.title}
              </h2>
              <div className="relative mt-4 flex flex-wrap gap-2">
                {heroChips.map(({ icon: Icon, text }) => (
                  <span
                    key={text}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.25)] px-3 py-1 text-[12px] font-semibold"
                  >
                    <Icon size={13} aria-hidden="true" />
                    {text}
                  </span>
                ))}
              </div>
            </div>

            {questionList}
          </div>

          <aside className="hidden lg:sticky lg:top-6 lg:block">
            <QuizNavPanel
              totalQuestions={questions.length}
              answeredCount={answeredCount}
              answers={completedAnswers}
              questionIds={questionIds}
              elapsedSeconds={elapsedSeconds}
              limitedTime={limitedTime}
              flagged={flagged}
              streak={streak}
              submitting={isSubmitted}
              onSubmit={handleSubmit}
              onRetry={onRetry}
              scrollToQuestion={scrollToQuestion}
            />
          </aside>
        </div>
        {fx}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[var(--bg-content)]">
      {fx}
      {progressBar}

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {/* Wider column: at max-w-2xl the questions sat in a narrow strip with large empty margins either side. */}
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
          {questionList}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}
