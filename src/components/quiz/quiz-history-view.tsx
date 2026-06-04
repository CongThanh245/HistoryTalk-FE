"use client";

import React, { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, Eye, RotateCcw, XCircle } from "lucide-react";
import { useQuizSessionDetail } from "@/features/quiz/hooks";
import type { QuizResult, QuizSessionQuestion } from "@/services/quiz.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const OPTION_LABELS = ["A", "B", "C", "D"];

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

function getTone(percentage: number) {
  if (percentage >= 80) {
    return { bg: "rgba(16,185,129,0.10)", fg: "#047857" };
  }
  if (percentage >= 50) {
    return { bg: "rgba(201,162,77,0.14)", fg: "var(--gold-on-light)" };
  }
  return { bg: "rgba(184,50,42,0.10)", fg: "var(--accent-danger)" };
}

function getOptionTone(question: QuizSessionQuestion, optionIndex: number) {
  const isAnswer = optionIndex === question.correctAnswer;
  const isWrongPick =
    optionIndex === question.selectedAnswer && optionIndex !== question.correctAnswer;

  if (isAnswer) {
    return {
      background: "rgba(16,185,129,0.10)",
      color: "#065f46",
      fontWeight: 700,
    };
  }
  if (isWrongPick) {
    return {
      background: "rgba(184,50,42,0.08)",
      color: "var(--accent-danger)",
      fontWeight: 700,
    };
  }
  return {
    background: "rgba(27,38,50,0.025)",
    color: "var(--content-muted)",
    fontWeight: 500,
  };
}

export function QuizHistoryView({
  results,
  isLoading,
  onRetake,
}: QuizHistoryViewProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { data: detail, isLoading: detailLoading } =
    useQuizSessionDetail(selectedSessionId);
  const selectedResult = useMemo(
    () => results.find((item) => item.sessionId === selectedSessionId),
    [results, selectedSessionId],
  );
  const detailTone = detail ? getTone(detail.percentage) : null;

  return (
    <>
      <section
        className="rounded-xl border"
        style={{
          background: "var(--card-light-bg)",
          borderColor: "var(--card-light-border)",
        }}
      >
        <div
          className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-end sm:justify-between"
          style={{ borderBottom: "1px solid var(--card-light-border)" }}
        >
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--content-heading)" }}>
              Lịch sử làm bài
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--content-muted)" }}>
              Xem lại các lần nộp trước đây của bạn.
            </p>
          </div>
          <span
            className="rounded-md px-2.5 py-1 text-xs font-bold"
            style={{
              background: "rgba(27,38,50,0.05)",
              color: "var(--content-muted)",
            }}
          >
            {results.length} lần làm
          </span>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm" style={{ color: "var(--content-muted)" }}>
            Đang tải lịch sử...
          </div>
        ) : results.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold" style={{ color: "var(--content-heading)" }}>
              Chưa có lịch sử làm bài
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--content-muted)" }}>
              Sau khi nộp bài, kết quả sẽ xuất hiện ở đây.
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--card-light-border)" }}>
            {results.map((result) => {
              const tone = getTone(result.percentage);
              return (
                <article
                  key={result.sessionId}
                  className="grid gap-4 px-5 py-4 transition-colors hover:bg-black/[0.025] md:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-bold" style={{ color: "var(--content-heading)" }}>
                        {result.quizTitle}
                      </h3>
                      <span
                        className="rounded-md px-2 py-1 text-xs font-bold"
                        style={{ background: tone.bg, color: tone.fg }}
                      >
                        {result.score}/{result.totalQuestions}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-xs" style={{ color: "var(--content-muted)" }}>
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
                      onClick={() => setSelectedSessionId(result.sessionId)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition-colors"
                      style={{
                        background: "var(--card-light-bg)",
                        color: "var(--content-heading)",
                        border: "1px solid var(--card-light-border)",
                      }}
                    >
                      <Eye size={16} />
                      Xem chi tiết
                    </button>
                    <button
                      onClick={() => onRetake(result.quizId)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition-colors"
                      style={{
                        background: "var(--abyssal-blue)",
                        color: "var(--text-on-dark)",
                        boxShadow: "0 8px 18px rgba(27,38,50,0.14)",
                      }}
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
        <DialogContent
          className="max-h-[88vh] overflow-hidden p-0 sm:max-w-5xl"
          style={{
            background: "var(--card-light-bg)",
            borderColor: "var(--card-light-border)",
          }}
        >
          <DialogHeader
            className="px-5 py-4"
            style={{ borderBottom: "1px solid var(--card-light-border)" }}
          >
            <DialogTitle style={{ color: "var(--content-heading)" }}>
              Chi tiết bài làm
            </DialogTitle>
            <DialogDescription style={{ color: "var(--content-muted)" }}>
              Xem lại từng câu, đáp án đã chọn và đáp án đúng.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(88vh-96px)] overflow-y-auto p-5">
            {detailLoading ? (
              <div className="py-8 text-center text-sm" style={{ color: "var(--content-muted)" }}>
                Đang tải chi tiết bài làm...
              </div>
            ) : detail ? (
              <>
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--content-subtle)" }}>
                      Chi tiết bài làm
                    </p>
                    <h3 className="mt-1 text-lg font-bold" style={{ color: "var(--content-heading)" }}>
                      {detail.quizTitle}
                    </h3>
                    <p className="mt-1 text-sm" style={{ color: "var(--content-muted)" }}>
                      {formatDateTime(detail.startedAt)} - {formatDateTime(detail.completedAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {detailTone && (
                      <span
                        className="rounded-md px-3 py-1.5 text-sm font-bold"
                        style={{ background: detailTone.bg, color: detailTone.fg }}
                      >
                        {detail.score}/{detail.totalQuestions}
                      </span>
                    )}
                    <span
                      className="rounded-md px-3 py-1.5 text-sm font-bold"
                      style={{ background: "rgba(27,38,50,0.05)", color: "var(--content-muted)" }}
                    >
                      {detail.limitedTime ? `Giới hạn ${formatDuration(detail.limitedTime)}` : "Không giới hạn"}
                    </span>
                    <span
                      className="rounded-md px-3 py-1.5 text-sm font-bold"
                      style={{ background: "rgba(27,38,50,0.05)", color: "var(--content-muted)" }}
                    >
                      Tổng thời gian {formatDuration(getDurationFromRange(detail.startedAt, detail.completedAt))}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {detail.questions.map((question, index) => (
                    <article
                      key={question.questionId}
                      className="rounded-xl border p-4"
                      style={{
                        borderColor: question.correct
                          ? "rgba(16,185,129,0.28)"
                          : "rgba(184,50,42,0.24)",
                        background: "rgba(27,38,50,0.018)",
                      }}
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                          style={{
                            background: question.correct
                              ? "rgba(16,185,129,0.12)"
                              : "rgba(184,50,42,0.10)",
                            color: question.correct ? "#047857" : "var(--accent-danger)",
                          }}
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            {question.correct ? (
                              <CheckCircle2 className="mt-0.5 shrink-0" size={16} color="#047857" />
                            ) : (
                              <XCircle className="mt-0.5 shrink-0" size={16} color="var(--accent-danger)" />
                            )}
                            <p className="text-sm font-semibold leading-6" style={{ color: "var(--content-heading)" }}>
                              {question.content}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {question.options.map((option, optionIndex) => {
                          const tone = getOptionTone(question, optionIndex);
                          const selected = question.selectedAnswer === optionIndex;
                          return (
                            <div
                              key={optionIndex}
                              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                              style={tone}
                            >
                              <span
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                                style={{
                                  background:
                                    optionIndex === question.correctAnswer
                                      ? "#047857"
                                      : selected
                                        ? "var(--accent-danger)"
                                        : "var(--card-light-bg)",
                                  color:
                                    optionIndex === question.correctAnswer || selected
                                      ? "#fff"
                                      : "var(--content-muted)",
                                  border:
                                    optionIndex === question.correctAnswer || selected
                                      ? "none"
                                      : "1px solid var(--card-light-border)",
                                }}
                              >
                                {OPTION_LABELS[optionIndex]}
                              </span>
                              <span className="min-w-0">{option}</span>
                            </div>
                          );
                        })}
                      </div>

                      {question.explanation && (
                        <p className="mt-3 text-sm leading-6" style={{ color: "var(--content-muted)" }}>
                          {question.explanation}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </>
            ) : selectedResult ? (
              <p className="py-8 text-center text-sm" style={{ color: "var(--content-muted)" }}>
                Chưa tải được chi tiết cho lần làm này.
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
