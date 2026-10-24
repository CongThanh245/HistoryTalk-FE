"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Star, Timer } from "lucide-react";
import type { QuizSet } from "@/services/quiz.service";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/store/auth.store";
import { useMyQuizResults } from "@/features/quiz/hooks";
import { QuizHistoryView } from "./quiz-history-view";

const ERA_LABELS: Record<QuizSet["era"], string> = {
  ALL: "Tổng hợp",
  ANCIENT: "Cổ đại",
  MEDIEVAL: "Trung đại",
  MODERN: "Cận đại",
  CONTEMPORARY: "Hiện đại",
};

const LEVEL_LABELS: Record<QuizSet["level"], string> = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
};

const TIME_PRESETS = [
  { label: "Không giới hạn", seconds: undefined },
  { label: "5 phút", seconds: 5 * 60 },
  { label: "10 phút", seconds: 10 * 60 },
  { label: "15 phút", seconds: 15 * 60 },
  { label: "30 phút", seconds: 30 * 60 },
] as const;

interface QuizDetailPageProps {
  quiz: QuizSet;
  onStart: (limitedTime?: number, practiceMode?: boolean) => void;
}

export function QuizDetailPage({ quiz, onStart }: QuizDetailPageProps) {
  const router = useRouter();
  const [selectedTime, setSelectedTime] = useState<number | undefined>();
  const [customMinutes, setCustomMinutes] = useState("");
  // Che do luyen tap: hien dung/sai ngay sau moi cau, chay song song che do thi hien tai.
  const [mode, setMode] = useState<"exam" | "practice">("exam");

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  // Lich su lam bai rieng cho quiz nay (BE loc theo quizId).
  const { data: historyData, isLoading: historyLoading } = useMyQuizResults(
    { quizId: quiz.quizId, size: 20 },
    isAuthenticated,
  );
  const quizHistory = useMemo(
    () => historyData?.content ?? [],
    [historyData?.content],
  );

  const resolvedLimitedTime = useMemo(() => {
    const minutes = Number(customMinutes);
    if (Number.isFinite(minutes) && minutes > 0) {
      return Math.round(minutes * 60);
    }
    return selectedTime;
  }, [customMinutes, selectedTime]);

  return (
    <main className="min-h-full px-5 pb-7 pt-2.5 md:px-8 bg-[var(--bg-content)]">
      {/* Same row as the list toggle in the top-left corner. */}
      <div className="mb-4 pl-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-content-heading"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Quay lại
        </button>
      </div>
      <div className="mx-auto max-w-4xl">

        <section className="relative rounded-xl border border-border-card bg-[var(--bg-surface)] p-5 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[var(--status-neutral-bg)] px-2.5 py-0.5 text-xs font-medium text-content-heading">
                  {ERA_LABELS[quiz.era] ?? quiz.era}
                </span>
                <span className="rounded-full bg-[var(--status-neutral-bg)] px-2.5 py-0.5 text-xs font-medium text-content-heading">
                  {LEVEL_LABELS[quiz.level] ?? quiz.level}
                </span>
              </div>

              <h1 className="archive-title is-plain text-[26px] md:text-[34px]">
                {quiz.title}
              </h1>
              {quiz.contextTitle && (
                <p className="mt-2 text-sm font-medium text-[var(--gold-on-light)]">
                  {quiz.contextTitle}
                </p>
              )}
              {(quiz.grade || quiz.chapterTitle) && (
                <p className="mt-1 text-sm text-text-tertiary">
                  {quiz.grade ? `Lớp ${quiz.grade}` : ""}
                  {quiz.grade && quiz.chapterTitle ? " · " : ""}
                  {quiz.chapterNumber ? `Chương ${quiz.chapterNumber}: ` : ""}
                  {quiz.chapterTitle ?? ""}
                </p>
              )}

              {quiz.rating ? (
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={16}
                        color="var(--accent-gold)"
                        fill={i <= Math.round(quiz.rating!) ? "var(--accent-gold)" : "transparent"}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-content-heading">
                    {quiz.rating.toFixed(1)}/5
                  </span>
                </div>
              ) : null}

              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  { label: "Lượt làm", value: quiz.playCount.toLocaleString("vi-VN") },
                  { label: "Cấp độ", value: LEVEL_LABELS[quiz.level] ?? quiz.level },
                  ...(quiz.userPlayCount
                    ? [{ label: "Bạn đã làm", value: `${quiz.userPlayCount} lần` }]
                    : []),
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-border-card bg-[var(--bg-elevated)] px-4 py-3"
                  >
                    <p className="text-[13px] text-[var(--text-secondary)]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-lg font-bold leading-tight tabular-nums text-content-heading">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {isAuthenticated && (
                <div className="mt-8">
                  <QuizHistoryView
                    results={quizHistory}
                    isLoading={historyLoading}
                    onRetake={() => onStart(resolvedLimitedTime, mode === "practice")}
                  />
                </div>
              )}
            </div>

            <aside className="rounded-xl border border-border-card bg-[var(--bg-elevated)] p-5 lg:sticky lg:top-6">
              <p className="text-lg font-semibold text-content-heading">
                Sẵn sàng luyện tập?
              </p>
              <p className="mt-2 text-sm leading-6 text-content-muted">
                Chọn giới hạn thời gian nếu muốn làm bài theo đồng hồ đếm ngược.
                {quiz.durationSeconds ? (
                  <> Gợi ý: <b>{Math.round(quiz.durationSeconds / 60)} phút</b>.</>
                ) : null}
              </p>

              <p className="mt-4 text-[13.5px] font-semibold text-content-heading">
                Chế độ làm bài
              </p>
              <div role="group" aria-label="Chế độ làm bài" className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={mode === "exam"}
                  onClick={() => setMode("exam")}
                  className={cn(
                    "flex h-10 items-center justify-center gap-1.5 rounded-lg border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]",
                    mode === "exam"
                      ? "border-[var(--accent-gold)] bg-[var(--accent-gold-active-bg)] font-semibold text-content-heading"
                      : "border-[var(--border-default)] bg-[var(--bg-surface)] font-medium text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-content-heading",
                  )}
                >
                  <Timer size={15} aria-hidden="true" />
                  Chế độ thi
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "practice"}
                  onClick={() => setMode("practice")}
                  className={cn(
                    "flex h-10 items-center justify-center gap-1.5 rounded-lg border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]",
                    mode === "practice"
                      ? "border-[var(--accent-gold)] bg-[var(--accent-gold-active-bg)] font-semibold text-content-heading"
                      : "border-[var(--border-default)] bg-[var(--bg-surface)] font-medium text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-content-heading",
                  )}
                >
                  <BookOpen size={15} aria-hidden="true" />
                  Luyện tập
                </button>
              </div>
              <p className="mt-2 text-[13px] leading-5 text-content-muted">
                {mode === "exam"
                  ? "Làm hết bài rồi mới biết đáp án đúng/sai, giống thi thật."
                  : "Biết ngay đúng/sai sau mỗi câu, phù hợp để ôn bài."}
              </p>

              <p className="mt-5 text-[13.5px] font-semibold text-content-heading">Thời gian</p>
              <div role="group" aria-label="Giới hạn thời gian" className="mt-2 grid grid-cols-2 gap-2">
                {TIME_PRESETS.map((preset) => {
                  const active = selectedTime === preset.seconds && customMinutes.trim() === "";
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setSelectedTime(preset.seconds);
                        setCustomMinutes("");
                      }}
                      className={cn(
                        "h-10 rounded-lg border text-sm transition-colors first:col-span-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]",
                        active
                          ? "border-[var(--accent-gold)] bg-[var(--accent-gold-active-bg)] font-semibold text-content-heading"
                          : "border-[var(--border-default)] bg-[var(--bg-surface)] font-medium text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-content-heading",
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <label className="mt-3 block">
                <span className="text-[13px] text-[var(--text-secondary)]">
                  Hoặc nhập số phút
                </span>
                <input
                  type="number"
                  min={1}
                  value={customMinutes}
                  onChange={(event) => setCustomMinutes(event.target.value)}
                  placeholder="Ví dụ: 20"
                  className="mt-1 h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-content-heading outline-none transition-colors focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20"
                />
              </label>

              <button
                onClick={() => onStart(resolvedLimitedTime, mode === "practice")}
                className="btn-crimson mt-5 h-12 w-full"
              >
                Bắt đầu làm bài
              </button>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
