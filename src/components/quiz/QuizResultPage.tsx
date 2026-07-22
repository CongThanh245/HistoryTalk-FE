"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Flag, Minus, Star, TrendingDown, TrendingUp } from "lucide-react";
import type { QuizSet, QuizQuestion } from "@/services/quiz.service";
import { characterService } from "@/services/character.service";
import { queryKeys } from "@/shared/query-key";
import { isValidUrl } from "@/lib/utils/url";
import { useAuthRequiredNavigation } from "@/features/auth/use-auth-required-navigation";
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

const OPTION_LABELS = ["A", "B", "C", "D"];

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
  answers: Record<string, number>;
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
  const color = delta > 0 ? "#047857" : delta < 0 ? "var(--accent-danger)" : "var(--content-muted)";
  const bg = delta > 0 ? "rgba(16,185,129,0.10)" : delta < 0 ? "rgba(184,50,42,0.08)" : "rgba(27,38,50,0.05)";
  const text =
    delta === 0
      ? `Bằng lần trước (${previous.percentage}%)`
      : `${delta > 0 ? "+" : ""}${delta}% so với lần trước (${previous.percentage}%)`;

  return (
    <div
      className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
      style={{ background: bg, color }}
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
            className="h-10 rounded-lg px-4 text-sm font-semibold transition-colors"
            style={{ background: "var(--card-light-bg)", color: "var(--content-muted)", border: "1px solid var(--card-light-border)" }}
          >
            Huỷ
          </button>
          <button
            onClick={submit}
            className="h-10 rounded-lg px-4 text-sm font-bold text-white transition-colors"
            style={{ background: "var(--abyssal-blue)" }}
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
    <section
      className="mb-6 flex flex-col items-center rounded-xl border p-5"
      style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
    >
      <h2 className="text-base font-bold" style={{ color: "var(--content-heading)" }}>
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
              color={star <= value ? "var(--gold-on-light)" : "var(--card-light-border)"}
              fill={star <= value ? "var(--gold-on-light)" : "none"}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
      {justRated && (
        <p className="mt-2 text-xs font-semibold" style={{ color: "#047857" }}>
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
  // Chi can previousAttempt tu day — cac so lieu khac da co san tu submitResult.
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

  const score =
    submitResult?.score ??
    Object.keys(answers).filter((qId) => {
      const q = questions.find((item) => item.questionId === qId);
      return q && answers[qId] === q.correctAnswer;
    }).length;

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
      ? { label: "Xuất sắc", color: "var(--gold-on-light)", bg: "rgba(201,162,77,0.14)" }
      : percentage >= 70
        ? { label: "Khá tốt", color: "#047857", bg: "rgba(16,185,129,0.10)" }
        : percentage >= 50
          ? { label: "Ổn định", color: "var(--accent-blue)", bg: "rgba(59,130,246,0.10)" }
          : { label: "Cần ôn lại", color: "var(--accent-danger)", bg: "rgba(184,50,42,0.10)" };

  function isCorrect(q: QuizQuestion, idx: number): boolean {
    if (submitResult) {
      return submitResult.correctAnswers.includes(idx);
    }
    return answers[q.questionId] === q.correctAnswer;
  }

  return (
    <main className="min-h-full px-5 py-7 md:px-8" style={{ background: "var(--bg-content)" }}>
      {authRequiredDialog}
      <div className="mx-auto max-w-4xl">
        <section
          className="mb-6 rounded-xl border p-6 md:p-7"
          style={{
            background: "var(--card-light-bg)",
            borderColor: "var(--card-light-border)",
            boxShadow: "0 16px 36px rgba(27,38,50,0.08)",
          }}
        >
          <div className="grid gap-6 md:grid-cols-[1fr_220px] md:items-center">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--content-muted)" }}>
                Kết quả bài làm
              </p>
              <h1 className="mt-2 text-2xl font-bold leading-tight" style={{ color: "var(--content-heading)" }}>
                {quiz.title}
              </h1>
              <span
                className="mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: tier.bg, color: tier.color, border: "1px solid var(--card-light-border)" }}
              >
                {tier.label}
              </span>
            </div>

            <div className="rounded-xl border p-5 text-center" style={{ borderColor: "var(--card-light-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--content-subtle)" }}>
                Điểm
              </p>
              <p className="mt-2 text-5xl font-black leading-none" style={{ color: tier.color }}>
                {correctCount}
                <span className="text-2xl">/{totalQuestions}</span>
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {[
              { label: "Đúng", value: correctCount, color: "#047857" },
              { label: "Sai", value: wrongCount, color: "var(--accent-danger)" },
              { label: "Tổng câu", value: totalQuestions, color: "var(--content-heading)" },
              { label: "Thời gian", value: formatDuration(durationSeconds), color: "var(--gold-on-light)" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border px-4 py-3"
                style={{ background: "rgba(27,38,50,0.035)", borderColor: "var(--card-light-border)" }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--content-subtle)" }}>
                  {item.label}
                </p>
                <p className="mt-1 text-xl font-bold" style={{ color: item.color }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {previousAttempt && (
            <ComparisonBadge percentage={percentage} previous={previousAttempt} />
          )}
        </section>

        {quiz.quizId && <RateQuizCard quizId={quiz.quizId} />}

        {showReviewSection && reviewCharacters.length > 0 && (
          <section
            className="mb-6 rounded-xl border p-5"
            style={{
              background: "var(--card-light-bg)",
              borderColor: "var(--card-light-border)",
            }}
          >
            <h2 className="mb-1 text-base font-bold" style={{ color: "var(--content-heading)" }}>
              Ôn lại cùng nhân vật
            </h2>
            <p className="mb-4 text-sm" style={{ color: "var(--content-muted)" }}>
              Có vẻ bạn đã trả lời chưa đúng <b>{wrongCount}</b> câu — hãy thử hỏi lại các nhân vật lịch sử để ôn lại kiến thức nhé!
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {reviewCharacters.map((character) => (
                <button
                  key={character.id}
                  onClick={() =>
                    navigateWithAuth(`/chat/${character.id}?contextId=${quiz.contextId}`)
                  }
                  className="group flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:border-[rgba(201,162,77,0.45)]"
                  style={{ borderColor: "var(--card-light-border)" }}
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={isValidUrl(character.imageUrl) ? character.imageUrl! : "/card.jpg"}
                      alt={character.name}
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-semibold"
                      style={{ color: "var(--content-heading)" }}
                    >
                      {character.name}
                    </p>
                    <p
                      className="truncate text-xs"
                      style={{ color: "var(--gold-on-light)" }}
                    >
                      {character.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold" style={{ color: "var(--content-heading)" }}>
              Xem lại đáp án
            </h2>
            {wrongCount > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setReviewFilter("all")}
                  className="rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
                  style={
                    reviewFilter === "all"
                      ? { background: "var(--accent-gold-active-bg)", color: "var(--gold-on-light)", border: "1px solid rgba(201,162,77,0.35)" }
                      : { background: "var(--card-light-bg)", color: "var(--content-muted)", border: "1px solid var(--card-light-border)" }
                  }
                >
                  Tất cả ({questions.length})
                </button>
                <button
                  onClick={() => setReviewFilter("wrong")}
                  className="rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
                  style={
                    reviewFilter === "wrong"
                      ? { background: "rgba(184,50,42,0.10)", color: "var(--accent-danger)", border: "1px solid rgba(184,50,42,0.35)" }
                      : { background: "var(--card-light-bg)", color: "var(--content-muted)", border: "1px solid var(--card-light-border)" }
                  }
                >
                  Câu sai ({wrongCount})
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const selected = answers[q.questionId];
              const correct = isCorrect(q, idx);
              const notAnswered = selected === undefined;

              if (reviewFilter === "wrong" && correct) return null;

              return (
                <article
                  key={q.questionId}
                  className="rounded-xl border p-4"
                  style={{
                    background: "var(--card-light-bg)",
                    borderColor: notAnswered
                      ? "var(--card-light-border)"
                      : correct
                        ? "rgba(16,185,129,0.28)"
                        : "rgba(184,50,42,0.24)",
                  }}
                >
                  <div className="mb-3 flex items-start gap-3">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        background: correct ? "rgba(16,185,129,0.12)" : "rgba(27,38,50,0.06)",
                        color: correct ? "#047857" : "var(--content-heading)",
                      }}
                    >
                      {idx + 1}
                    </span>
                    <p className="flex-1 text-sm font-semibold leading-6" style={{ color: "var(--content-heading)" }}>
                      {q.content}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {q.options.map((opt, i) => {
                      const isAnswer = i === q.correctAnswer;
                      const isWrongPick = i === selected && !correct;
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                          style={{
                            background: isAnswer
                              ? "rgba(16,185,129,0.10)"
                              : isWrongPick
                                ? "rgba(184,50,42,0.08)"
                                : "rgba(27,38,50,0.025)",
                            color: isAnswer
                              ? "#065f46"
                              : isWrongPick
                                ? "var(--accent-danger)"
                                : "var(--content-muted)",
                            fontWeight: isAnswer || isWrongPick ? 700 : 500,
                          }}
                        >
                          <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                            style={{
                              background: isAnswer
                                ? "#047857"
                                : isWrongPick
                                  ? "var(--accent-danger)"
                                  : "var(--card-light-bg)",
                              color: isAnswer || isWrongPick ? "#fff" : "var(--content-muted)",
                              border: isAnswer || isWrongPick ? "none" : "1px solid var(--card-light-border)",
                            }}
                          >
                            {OPTION_LABELS[i]}
                          </span>
                          <span className="min-w-0">{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <p className="mt-3 text-sm leading-6" style={{ color: "var(--content-muted)" }}>
                      {q.explanation}
                    </p>
                  )}

                  <button
                    onClick={() => handleReportPress(q.questionId)}
                    disabled={reportedIds.has(q.questionId)}
                    className="mt-3 flex items-center gap-1.5 text-xs font-semibold transition-colors disabled:cursor-default"
                    style={{
                      color: reportedIds.has(q.questionId) ? "#047857" : "var(--content-subtle)",
                    }}
                  >
                    <Flag size={12} />
                    {reportedIds.has(q.questionId) ? "Đã gửi báo cáo, cảm ơn bạn!" : "Câu này có vấn đề?"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <div className="flex gap-3 pb-6 pt-6">
          <button
            onClick={() => router.push("/quiz")}
            className="h-12 flex-1 rounded-lg text-sm font-bold transition-colors"
            style={{
              background: "var(--card-light-bg)",
              color: "var(--content-heading)",
              border: "1px solid var(--card-light-border)",
            }}
          >
            Về trang quiz
          </button>
          <button
            onClick={() => router.push("/quiz?view=history")}
            className="h-12 flex-1 rounded-lg text-sm font-bold transition-colors"
            style={{
              background: "var(--accent-gold-active-bg)",
              color: "var(--gold-on-light)",
              border: "1px solid rgba(201,162,77,0.35)",
            }}
          >
            Xem lịch sử
          </button>
          <button
            onClick={onRetry}
            className="h-12 flex-1 rounded-lg text-sm font-bold transition-colors"
            style={{
              background: "var(--abyssal-blue)",
              color: "var(--text-on-dark)",
              boxShadow: "0 8px 18px rgba(27,38,50,0.18)",
            }}
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
