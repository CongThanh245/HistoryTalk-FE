"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Flag, Minus, Star, TrendingDown, TrendingUp } from "lucide-react";
import type { QuizSet, QuizQuestion } from "@/services/quiz.service";
import type { AnswerData } from "@/features/quiz/question-data";
import { characterService } from "@/services/character.service";
import { queryKeys } from "@/shared/query-key";
import { isValidUrl } from "@/lib/utils/url";
import { useAuthRequiredNavigation } from "@/features/auth/use-auth-required-navigation";
import { cn } from "@/lib/utils/cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  useMyQuizRating,
  useQuizSessionDetail,
  useRateQuiz,
  useReportQuestion,
} from "@/features/quiz/hooks";
import { QuestionAnswerReview } from "./QuestionAnswerReview";

interface SubmitResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  durationSeconds?: number;
  correctAnswers: number[];
  wrongAnswers: number[];
}

interface QuizResultPageProps {
  quiz: QuizSet;
  questions: QuizQuestion[];
  answers: Record<string, AnswerData>;
  submitResult: SubmitResult | null;
  onRetry: () => void;
  /** Session vua nop — dung de lay previousAttempt (so voi lan truoc). */
  sessionId?: string | null;
}

function formatDuration(seconds?: number) {
  if (seconds === undefined) return "Không ghi nhận";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes <= 0) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}

function normalizeQuestionCount(value: number, totalQuestions: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.round(value), 0), totalQuestions);
}

// So sanh % lan nay voi lan gan nhat truoc do cua cung quiz.
function ComparisonBadge({
  percentage,
  previous,
}: {
  percentage: number;
  previous: { percentage: number };
}) {
  const delta = percentage - previous.percentage;
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const text =
    delta === 0
      ? `Bằng lần trước (${previous.percentage}%)`
      : `${delta > 0 ? "+" : ""}${delta}% so với lần trước (${previous.percentage}%)`;

  return (
    <div
      className={cn(
        "mt-4 inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em]",
        delta > 0
          ? "border-[var(--status-success)] text-[var(--status-success)]"
          : delta < 0
            ? "border-[var(--accent-danger)] text-accent-danger"
            : "border-[var(--border-strong)] text-content-muted",
      )}
    >
      <Icon size={13} strokeWidth={2.25} />
      {text}
    </div>
  );
}

// Cho phep nguoi dung mo ta ngan gon van de gap phai truoc khi gui report —
// giup staff hieu ro hon la chi biet "co report" ma khong ro ly do.
function ReportQuestionDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => void;
}) {
  const [text, setText] = useState("");

  function submit() {
    onSubmit(text.trim());
    setText("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Câu này có vấn đề?</DialogTitle>
          <DialogDescription>
            Mô tả ngắn gọn vấn đề bạn gặp phải để đội ngũ hỗ trợ xem lại chính xác hơn (không bắt buộc).
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ví dụ: đáp án đúng đang bị sai, câu hỏi khó hiểu..."
          rows={4}
        />
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="btn-line min-h-10 px-4"
          >
            Huỷ
          </button>
          <button
            onClick={submit}
            className="btn-ink min-h-10 px-4"
          >
            Gửi báo cáo
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Cho phep nguoi dung danh gia quiz (1-5 sao) ngay sau khi xem ket qua, de
// tinh nang rating trung binh (QuizSet.rating) co du lieu thuc.
function RateQuizCard({ quizId }: { quizId: string }) {
  const { data: myRatingData } = useMyQuizRating(quizId);
  const { mutate: rate, isPending } = useRateQuiz(quizId);
  const [localValue, setLocalValue] = useState<number | null>(null);
  const [justRated, setJustRated] = useState(false);

  const value = localValue ?? myRatingData?.myRating ?? 0;

  function handleClick(star: number) {
    setLocalValue(star);
    setJustRated(false);
    rate(star, { onSuccess: () => setJustRated(true) });
  }

  return (
    <section className="mb-6 flex flex-col items-center rounded-sm border border-border-card bg-[var(--bg-surface)] p-5">
      <h2 className="archive-title is-plain mt-1 text-[20px]">
        Bạn thấy quiz này thế nào?
      </h2>
      <div className="mt-3 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleClick(star)}
            disabled={isPending}
            className="transition-transform hover:scale-110 disabled:opacity-60"
          >
            <Star
              size={28}
              color={star <= value ? "var(--accent-gold)" : "var(--border-strong)"}
              fill={star <= value ? "var(--accent-gold)" : "none"}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
      {justRated && (
        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--status-success)]">
          Cảm ơn bạn đã đánh giá!
        </p>
      )}
    </section>
  );
}

export function QuizResultPage({
  quiz,
  questions,
  answers,
  submitResult,
  onRetry,
  sessionId,
}: QuizResultPageProps) {
  const router = useRouter();
  const { authRequiredDialog, navigateWithAuth } = useAuthRequiredNavigation({
    title: "Bạn cần đăng nhập để chat",
    description: "Đăng nhập để trò chuyện và ôn lại kiến thức với nhân vật lịch sử.",
  });
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong">("all");
  // previousAttempt + questionData day du (co dap an) de hien phan xem lai.
  const { data: sessionDetail } = useQuizSessionDetail(sessionId ?? null);
  const previousAttempt = sessionDetail?.previousAttempt;

  const { mutate: reportQuestion } = useReportQuestion();
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [reportTarget, setReportTarget] = useState<string | null>(null);

  function handleReportPress(questionId: string) {
    if (reportedIds.has(questionId)) return;
    setReportTarget(questionId);
  }

  function submitReport(reason: string) {
    const questionId = reportTarget;
    if (!questionId) return;
    setReportTarget(null);
    setReportedIds((prev) => new Set(prev).add(questionId));
    reportQuestion(
      { questionId, reason: reason || undefined },
      {
        onError: () =>
          setReportedIds((prev) => {
            const next = new Set(prev);
            next.delete(questionId);
            return next;
          }),
      },
    );
  }

  // Luc lam bai BE luoc dap an; chi tiet phien (sau khi nop) co questionData day du.
  const reviewQuestions = new Map(
    (sessionDetail?.questions ?? []).map((q) => [q.questionId, q]),
  );

  const score =
    submitResult?.score ??
    questions.filter((q, idx) => isCorrect(q, idx)).length;

  const totalQuestions = submitResult?.totalQuestions ?? questions.length;
  const correctCount = normalizeQuestionCount(
    submitResult?.correctAnswers.length ?? score,
    totalQuestions,
  );
  const wrongCount = normalizeQuestionCount(
    submitResult?.wrongAnswers.length ?? totalQuestions - correctCount,
    totalQuestions,
  );
  const durationSeconds = submitResult?.durationSeconds;
  const percentage =
    submitResult?.percentage ?? Math.round((score / Math.max(totalQuestions, 1)) * 100);

  const showReviewSection = wrongCount > 0 && !!quiz.contextId;
  const { data: reviewCharacters = [] } = useQuery({
    queryKey: queryKeys.characters.byContext(quiz.contextId ?? ""),
    queryFn: () => characterService.getByContext(quiz.contextId!),
    enabled: showReviewSection,
    staleTime: 1000 * 60 * 5,
    select: (data) => data.slice(0, 3),
  });

  const tier =
    percentage >= 90
      ? { label: "Xuất sắc", colorClass: "text-accent-gold", bgClass: "border-[var(--accent-gold)]" }
      : percentage >= 70
        ? { label: "Khá tốt", colorClass: "text-[var(--status-success)]", bgClass: "border-[var(--status-success)]" }
        : percentage >= 50
          ? { label: "Ổn định", colorClass: "text-content-heading", bgClass: "border-[var(--text-primary)]" }
          : { label: "Cần ôn lại", colorClass: "text-accent-danger", bgClass: "border-[var(--accent-danger)]" };

  function isCorrect(q: QuizQuestion, idx: number): boolean {
    const detail = reviewQuestions.get(q.questionId);
    if (detail) return detail.correct;
    return submitResult?.correctAnswers.includes(idx) ?? false;
  }

  return (
    <main className="min-h-full px-5 pb-7 pt-14 md:px-8 bg-[var(--bg-content)]">
      {authRequiredDialog}
      <div className="mx-auto max-w-4xl">
        <section className="mb-6 rounded-sm border border-border-card bg-[var(--bg-surface)]">
          <div className="grid md:grid-cols-[1fr_240px] md:items-stretch">
            <div className="p-6 md:p-7">
              <h1 className="archive-title is-plain mt-2 text-[28px] md:text-[36px]">
                {quiz.title}
              </h1>
              <span
                className={cn(
                  "mt-4 inline-flex rounded-sm px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] border",
                  tier.bgClass,
                  tier.colorClass,
                )}
              >
                {tier.label}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-[var(--text-primary)] bg-[var(--bg-elevated)] p-5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-content-muted">
                Điểm
              </p>
              <p className={cn("mt-2 font-display text-[84px] font-extrabold leading-[0.9] tabular-nums", tier.colorClass)}>
                {correctCount}
                <span className="text-[36px] text-content-muted">/{totalQuestions}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-[var(--text-primary)]">
            {[
              { label: "Đúng", value: correctCount, colorClass: "text-[var(--status-success)]" },
              { label: "Sai", value: wrongCount, colorClass: "text-accent-danger" },
              { label: "Tổng câu", value: totalQuestions, colorClass: "text-content-heading" },
              { label: "Thời gian", value: formatDuration(durationSeconds), colorClass: "text-accent-gold" },
            ].map((item) => (
              <div
                key={item.label}
                className="border-r border-b sm:border-b-0 border-[var(--border-strong)] last:border-r-0 px-4 py-3 [&:nth-child(2)]:border-r-0 sm:[&:nth-child(2)]:border-r"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-content-muted">
                  {item.label}
                </p>
                <p className={cn("mt-1 font-display text-[28px] font-extrabold leading-[1.15]", item.colorClass)}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {previousAttempt && (
            <div className="px-6 pb-5 md:px-7 border-t border-[var(--border-strong)]">
              <ComparisonBadge percentage={percentage} previous={previousAttempt} />
            </div>
          )}
        </section>

        {quiz.quizId && <RateQuizCard quizId={quiz.quizId} />}

        {showReviewSection && reviewCharacters.length > 0 && (
          <section className="mb-6 rounded-sm border border-border-card bg-[var(--bg-surface)] p-5">
            <h2 className="archive-title mb-1 mt-1 text-[22px]">
              Ôn lại cùng nhân vật
            </h2>
            <p className="mb-4 text-sm text-content-muted">
              Có vẻ bạn đã trả lời chưa đúng <b>{wrongCount}</b> câu — hãy thử hỏi lại các nhân vật lịch sử để ôn lại kiến thức nhé!
            </p>
            <div className="grid sm:grid-cols-3 border-t border-l border-[var(--text-primary)]">
              {reviewCharacters.map((character) => (
                <button
                  key={character.id}
                  onClick={() =>
                    navigateWithAuth(`/chat/${character.id}?contextId=${quiz.contextId}`)
                  }
                  className="group flex items-center gap-3 border-r border-b border-[var(--text-primary)] p-3 text-left transition-colors hover:bg-[var(--text-primary)]"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={isValidUrl(character.imageUrl) ? character.imageUrl! : "/card.jpg"}
                      alt={character.name}
                      fill
                      className="archive-photo object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="archive-title is-plain truncate text-[17px] group-hover:text-[var(--text-inverse)]">
                      {character.name}
                    </p>
                    <p className="truncate text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--gold-on-light)] group-hover:text-accent-on-ink">
                      {character.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="archive-heading flex-wrap !mb-0">
            <div>
              <h2 className="archive-title">
                Xem lại đáp án
              </h2>
            </div>
            {wrongCount > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setReviewFilter("all")}
                  className={cn(
                    "rounded-sm px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors border",
                    reviewFilter === "all"
                      ? "bg-[var(--text-primary)] text-[var(--text-inverse)] border-[var(--text-primary)]"
                      : "bg-transparent text-content-muted border-[var(--border-strong)] hover:border-[var(--text-primary)]",
                  )}
                >
                  Tất cả ({questions.length})
                </button>
                <button
                  onClick={() => setReviewFilter("wrong")}
                  className={cn(
                    "rounded-sm px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors border",
                    reviewFilter === "wrong"
                      ? "bg-[var(--accent-danger)] text-[var(--text-inverse)] border-[var(--accent-danger)]"
                      : "bg-transparent text-content-muted border-[var(--border-strong)] hover:border-[var(--text-primary)]",
                  )}
                >
                  Câu sai ({wrongCount})
                </button>
              </div>
            )}
          </div>

          <div>
            {questions.map((q, idx) => {
              const detail = reviewQuestions.get(q.questionId);
              const reviewQ = detail ?? q;
              const selected = detail?.submittedAnswer ?? answers[q.questionId];
              const correct = isCorrect(q, idx);
              const notAnswered = selected === undefined;

              if (reviewFilter === "wrong" && correct) return null;

              return (
                <article
                  key={q.questionId}
                  className={cn(
                    "border-b border-b-[var(--border-default)] py-4 pl-4 pr-1",
                    notAnswered
                      ? ""
                      : correct
                        ? ""
                        : "",
                  )}
                >
                  <div className="mb-3 flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-sm font-display text-sm font-extrabold",
                        correct
                          ? "bg-[var(--status-success)] text-[var(--text-inverse)]"
                          : "border border-border-card text-content-heading",
                      )}
                    >
                      {idx + 1}
                    </span>
                    <p className="flex-1 text-sm font-semibold leading-6 text-content-heading">
                      {q.content}
                    </p>
                  </div>

                  <QuestionAnswerReview
                    question={reviewQ}
                    answer={selected}
                    correct={correct}
                  />

                  {q.explanation && (
                    <p className="mt-3 border-l border-[var(--border-strong)] pl-3 text-sm leading-6 text-content-muted">
                      {q.explanation}
                    </p>
                  )}

                  <button
                    onClick={() => handleReportPress(q.questionId)}
                    disabled={reportedIds.has(q.questionId)}
                    className={cn(
                      "mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors disabled:cursor-default",
                      reportedIds.has(q.questionId) ? "text-[var(--status-success)]" : "text-content-subtle hover:text-accent-gold",
                    )}
                  >
                    <Flag size={12} />
                    {reportedIds.has(q.questionId) ? "Đã gửi báo cáo, cảm ơn bạn!" : "Câu này có vấn đề?"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col gap-2 pb-6 pt-6 sm:flex-row">
          <button
            onClick={() => router.push("/quiz")}
            className="btn-line h-12 flex-1"
          >
            Về trang quiz
          </button>
          <button
            onClick={() => router.push("/quiz?view=history")}
            className="btn-ink h-12 flex-1"
          >
            Xem lịch sử
          </button>
          <button
            onClick={onRetry}
            className="btn-crimson h-12 flex-1"
          >
            Làm lại
          </button>
        </div>
      </div>

      <ReportQuestionDialog
        open={!!reportTarget}
        onOpenChange={(open) => {
          if (!open) setReportTarget(null);
        }}
        onSubmit={submitReport}
      />
    </main>
  );
}
