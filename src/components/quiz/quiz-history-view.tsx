"use client";

import React, { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, Eye, Minus, RotateCcw, TrendingDown, TrendingUp, XCircle } from "lucide-react";
import { useQuizSessionDetail } from "@/features/quiz/hooks";
import type { QuizResult } from "@/services/quiz.service";
import { QuestionAnswerReview } from "./QuestionAnswerReview";
import { cn } from "@/lib/utils/cn";
import { Mascot } from "@/components/mascot/Mascot";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


interface QuizHistoryViewProps {
  results: QuizResult[];
  isLoading?: boolean;
  onRetake: (quizId: string) => void;
}

function formatDateTime(iso: string) {
  if (!iso) return "Chưa rõ thời gian";
  const date = new Date(iso);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds?: number) {
  if (!seconds) return "Không ghi nhận";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes <= 0) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}

function getDurationFromRange(startedAt?: string, completedAt?: string) {
  if (!startedAt || !completedAt) return undefined;
  const started = new Date(startedAt).getTime();
  const completed = new Date(completedAt).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(completed) || completed < started) {
    return undefined;
  }
  return Math.round((completed - started) / 1000);
}

function getToneClasses(percentage: number) {
  if (percentage >= 80) {
    return "border-[var(--status-success)] text-[var(--status-success)]";
  }
  if (percentage >= 50) {
    return "border-[var(--accent-gold)] text-[var(--gold-on-light)]";
  }
  return "border-[var(--accent-danger)] text-accent-danger";
}

function normalizeQuestionCount(value: number, totalQuestions: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.round(value), 0), totalQuestions);
}

// So sanh % lan nay voi lan gan nhat truoc do cua cung quiz.
function ComparisonBadge({ percentage, previous }: { percentage: number; previous: { percentage: number } }) {
  const delta = percentage - previous.percentage;
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const text =
    delta === 0
      ? `Bằng lần trước (${previous.percentage}%)`
      : `${delta > 0 ? "+" : ""}${delta}% so với lần trước (${previous.percentage}%)`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        delta > 0
          ? "border-[var(--status-success)] text-[var(--status-success)]"
          : delta < 0
            ? "border-[var(--accent-danger)] text-accent-danger"
            : "border-[var(--border-strong)] text-content-muted",
      )}
    >
      <Icon size={13} strokeWidth={2.25} />
      {text}
    </span>
  );
}

export function QuizHistoryView({
  results,
  isLoading,
  onRetake,
}: QuizHistoryViewProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong">("all");
  const { data: detail, isLoading: detailLoading } =
    useQuizSessionDetail(selectedSessionId);
  const selectedResult = useMemo(
    () => results.find((item) => item.sessionId === selectedSessionId),
    [results, selectedSessionId],
  );

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-border-card bg-[var(--bg-surface)]">
        <div className="flex flex-col gap-2 border-b border-[var(--border-default)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-content-heading">
              Lịch sử làm bài
            </h2>
            <p className="mt-0.5 text-sm text-text-tertiary">
              Xem lại các lần nộp trước đây của bạn.
            </p>
          </div>
          <span className="w-fit rounded-full bg-[var(--status-neutral-bg)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] tabular-nums">
            {results.length} lần làm
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-content-muted">
            <Mascot mood="thinking" size={26} arms={false} />
            Đang tải lịch sử...
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center p-10 text-center">
            <Mascot mood="idle" size={72} className="mb-3" />
            <p className="text-base font-semibold text-content-heading">
              Chưa có lịch sử làm bài
            </p>
            <p className="mt-1 text-sm text-content-muted">
              Sau khi nộp bài, kết quả sẽ xuất hiện ở đây.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-default)]">
            {results.map((result) => {
              const score = normalizeQuestionCount(result.score, result.totalQuestions);
              return (
                <article
                  key={result.sessionId}
                  className="grid gap-4 px-5 py-4 transition-colors hover:bg-[var(--bg-elevated)] md:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-content-heading">
                        {result.quizTitle}
                      </h3>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[13px] font-semibold tabular-nums",
                          getToneClasses(result.percentage),
                        )}
                      >
                        {score}/{result.totalQuestions}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-4 text-[13px] tabular-nums text-content-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        {formatDateTime(result.completedAt)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 size={14} />
                        {formatDuration(result.durationSeconds)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <button
                      onClick={() => {
                        setReviewFilter("all");
                        setSelectedSessionId(result.sessionId);
                      }}
                      className="btn-line min-h-10 px-4 text-sm"
                    >
                      <Eye size={16} />
                      Xem chi tiết
                    </button>
                    <button
                      onClick={() => onRetake(result.quizId)}
                      className="btn-ink min-h-10 px-4 text-sm"
                    >
                      <RotateCcw size={16} />
                      Làm lại
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <Dialog
        open={selectedSessionId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedSessionId(null);
        }}
      >
        <DialogContent className="max-h-[88vh] overflow-hidden rounded-xl p-0 sm:max-w-5xl bg-[var(--bg-surface)] border-border-card">
          <DialogHeader className="px-5 py-4 border-b border-[var(--border-default)]">
            <DialogTitle className="text-lg font-semibold text-content-heading">
              Chi tiết bài làm
            </DialogTitle>
            <DialogDescription className="text-content-muted">
              Xem lại từng câu, đáp án đã chọn và đáp án đúng.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(88vh-96px)] overflow-y-auto p-5">
            {detailLoading ? (
              <div className="py-8 text-center text-sm text-content-muted">
                Đang tải chi tiết bài làm...
              </div>
            ) : detail ? (
              <>
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-content-heading">
                      {detail.quizTitle}
                    </h3>
                    <p className="mt-1 text-[13px] tabular-nums text-content-muted">
                      {formatDateTime(detail.startedAt)} - {formatDateTime(detail.completedAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-3 py-0.5 text-base font-bold tabular-nums leading-tight",
                        getToneClasses(detail.percentage),
                      )}
                    >
                      {normalizeQuestionCount(detail.score, detail.totalQuestions)}/{detail.totalQuestions}
                    </span>
                    <span className="rounded-full bg-[var(--status-neutral-bg)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
                      {detail.limitedTime ? `Giới hạn ${formatDuration(detail.limitedTime)}` : "Không giới hạn"}
                    </span>
                    <span className="rounded-full bg-[var(--status-neutral-bg)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
                      Tổng thời gian {formatDuration(getDurationFromRange(detail.startedAt, detail.completedAt))}
                    </span>
                    {detail.previousAttempt && (
                      <ComparisonBadge percentage={detail.percentage} previous={detail.previousAttempt} />
                    )}
                  </div>
                </div>

                {(() => {
                  const wrongCount = detail.questions.filter((q) => !q.correct).length;
                  return wrongCount > 0 ? (
                    <div className="mb-4 flex gap-2">
                      <button
                        onClick={() => setReviewFilter("all")}
                        className={cn(
                          "h-8 rounded-full border px-3.5 text-sm font-medium transition-colors",
                          reviewFilter === "all"
                            ? "bg-[var(--text-primary)] text-[var(--text-inverse)] border-[var(--text-primary)]"
                            : "bg-transparent text-content-muted border-[var(--border-strong)] hover:border-[var(--text-primary)]",
                        )}
                      >
                        Tất cả ({detail.questions.length})
                      </button>
                      <button
                        onClick={() => setReviewFilter("wrong")}
                        className={cn(
                          "h-8 rounded-full border px-3.5 text-sm font-medium transition-colors",
                          reviewFilter === "wrong"
                            ? "bg-[var(--accent-danger)] text-[var(--text-inverse)] border-[var(--accent-danger)]"
                            : "bg-transparent text-content-muted border-[var(--border-strong)] hover:border-[var(--text-primary)]",
                        )}
                      >
                        Câu sai ({wrongCount})
                      </button>
                    </div>
                  ) : null;
                })()}

                <div className="border-t border-[var(--border-default)]">
                  {detail.questions.map((question, index) => {
                    if (reviewFilter === "wrong" && question.correct) return null;
                    return (
                    <article
                      key={question.questionId}
                      className={cn(
                        "border-b border-b-[var(--border-default)] py-4 pl-4 pr-1",
                        question.correct
                          ? ""
                          : "",
                      )}
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-sm font-display text-sm font-extrabold",
                            question.correct
                              ? "bg-[var(--status-success)] text-[var(--text-inverse)]"
                              : "bg-[var(--accent-danger)] text-[var(--text-inverse)]",
                          )}
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            {question.correct ? (
                              <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--status-success)]" size={16} />
                            ) : (
                              <XCircle className="mt-0.5 shrink-0 text-accent-danger" size={16} />
                            )}
                            <p className="text-sm font-semibold leading-6 text-content-heading">
                              {question.content}
                            </p>
                          </div>
                        </div>
                      </div>

                      <QuestionAnswerReview
                        question={question}
                        answer={question.submittedAnswer}
                        correct={question.correct}
                      />

                      {question.explanation && (
                        <p className="mt-3 border-l border-[var(--border-strong)] pl-3 text-sm leading-6 text-content-muted">
                          {question.explanation}
                        </p>
                      )}
                    </article>
                    );
                  })}
                </div>
              </>
            ) : selectedResult ? (
              <p className="py-8 text-center text-sm text-content-muted">
                Chưa tải được chi tiết cho lần làm này.
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
