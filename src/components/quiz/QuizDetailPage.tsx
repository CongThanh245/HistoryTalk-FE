"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Star, Timer } from "lucide-react";
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
    <main className="min-h-full px-5 py-7 md:px-8 bg-[var(--bg-content)]">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => router.back()}
          className="archive-link mb-5"
        >
          Quay lại
        </button>

        <section className="relative rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] p-6 md:p-8">
          {/* 史 — "sử", history */}
          <span className="archive-seal absolute right-5 top-5 hidden md:inline-grid w-[52px] h-[52px] text-[22px]" aria-hidden="true">史</span>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-[2px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] bg-[var(--text-primary)] text-[var(--text-inverse)]">
                  {ERA_LABELS[quiz.era] ?? quiz.era}
                </span>
                <span className="rounded-[2px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-content-heading border border-[var(--text-primary)]">
                  {LEVEL_LABELS[quiz.level] ?? quiz.level}
                </span>
              </div>

              <h1 className="archive-title is-plain mt-1 text-[32px] md:text-[44px] md:pr-16">
                {quiz.title}
              </h1>
              {quiz.contextTitle && (
                <p className="mt-3 text-[12px] font-bold uppercase tracking-[0.1em] text-accent-gold">
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
                  <span className="font-display text-lg font-extrabold leading-none text-content-heading">
                    {quiz.rating.toFixed(1)}/5
                  </span>
                </div>
              ) : null}

              <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[var(--text-primary)]">
                {[
                  { label: "Lượt làm", value: quiz.playCount.toLocaleString("vi-VN") },
                  { label: "Cấp độ", value: LEVEL_LABELS[quiz.level] ?? quiz.level },
                  ...(quiz.userPlayCount
                    ? [{ label: "Bạn đã làm", value: `${quiz.userPlayCount} lần` }]
                    : []),
                ].map((item) => (
                  <div
                    key={item.label}
                    className="border-r border-b border-[var(--text-primary)] bg-[var(--bg-elevated)] px-4 py-3"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-content-muted">
                      {item.label}
                    </p>
                    <p className="mt-1 font-display text-2xl font-extrabold leading-none text-content-heading">
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

            <aside className="rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-elevated)] p-5 border-t-[3px] border-t-[var(--accent-gold)]">
              <p className="archive-title text-[22px]">
                Sẵn sàng luyện tập?
              </p>
              <p className="mt-2 text-sm leading-6 text-content-muted">
                Chọn giới hạn thời gian nếu muốn làm bài theo đồng hồ đếm ngược.
                {quiz.durationSeconds ? (
                  <> Gợi ý: <b>{Math.round(quiz.durationSeconds / 60)} phút</b>.</>
                ) : null}
              </p>

              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.1em] text-content-muted">
                Chế độ làm bài
              </p>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setMode("exam")}
                  className={cn(
                    "flex h-9 items-center justify-center gap-1.5 rounded-[2px] text-[11px] font-bold uppercase tracking-[0.06em] transition-colors border",
                    mode === "exam"
                      ? "bg-[var(--text-primary)] text-[var(--text-inverse)] border-[var(--text-primary)]"
                      : "bg-[var(--bg-surface)] text-content-muted border-[var(--border-strong)] hover:border-[var(--text-primary)] hover:text-content-heading",
                  )}
                >
                  <Timer size={13} />
                  Chế độ thi
                </button>
                <button
                  onClick={() => setMode("practice")}
                  className={cn(
                    "flex h-9 items-center justify-center gap-1.5 rounded-[2px] text-[11px] font-bold uppercase tracking-[0.06em] transition-colors border",
                    mode === "practice"
                      ? "bg-[var(--text-primary)] text-[var(--text-inverse)] border-[var(--text-primary)]"
                      : "bg-[var(--bg-surface)] text-content-muted border-[var(--border-strong)] hover:border-[var(--text-primary)] hover:text-content-heading",
                  )}
                >
                  <BookOpen size={13} />
                  Luyện tập
                </button>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-content-subtle">
                {mode === "exam"
                  ? "Làm hết bài rồi mới biết đáp án đúng/sai, giống thi thật."
                  : "Biết ngay đúng/sai sau mỗi câu, phù hợp để ôn bài."}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-1.5">
                {TIME_PRESETS.map((preset) => {
                  const active = selectedTime === preset.seconds && customMinutes.trim() === "";
                  return (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setSelectedTime(preset.seconds);
                        setCustomMinutes("");
                      }}
                      className={cn(
                        "h-9 rounded-[2px] text-[11px] font-bold uppercase tracking-[0.06em] transition-colors border",
                        active
                          ? "bg-[var(--text-primary)] text-[var(--text-inverse)] border-[var(--text-primary)]"
                          : "bg-[var(--bg-surface)] text-content-muted border-[var(--border-strong)] hover:border-[var(--text-primary)] hover:text-content-heading",
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <label className="mt-4 block">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-content-muted">
                  Tùy chỉnh theo phút
                </span>
                <input
                  type="number"
                  min={1}
                  value={customMinutes}
                  onChange={(event) => setCustomMinutes(event.target.value)}
                  placeholder="Ví dụ: 20"
                  className="mt-1 h-10 w-full rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm outline-none text-content-heading transition-colors focus:border-[var(--text-primary)]"
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
