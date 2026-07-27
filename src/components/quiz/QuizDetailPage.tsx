"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Star, Timer } from "lucide-react";
import type { QuizSet } from "@/services/quiz.service";
import { cn } from "@/lib/utils/cn";

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
          className="mb-5 text-sm font-medium transition-opacity hover:opacity-70 text-content-muted"
        >
          Quay lại
        </button>

        <section className="rounded-xl border border-card-light-border bg-card-light-bg p-6 md:p-8 shadow-[0_16px_36px_rgba(27,38,50,0.08)]">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full px-3 py-1 text-xs font-semibold bg-accent-gold/12 text-gold-on-light border border-accent-gold/24">
                  {ERA_LABELS[quiz.era] ?? quiz.era}
                </span>
                <span className="rounded-full px-3 py-1 text-xs font-semibold bg-[rgba(27,38,50,0.06)] text-content-heading border border-card-light-border">
                  {LEVEL_LABELS[quiz.level] ?? quiz.level}
                </span>
              </div>

              <h1 className="text-3xl font-bold leading-tight md:text-4xl text-content-heading">
                {quiz.title}
              </h1>
              {quiz.contextTitle && (
                <p className="mt-3 text-base leading-7 text-content-muted">
                  {quiz.contextTitle}
                </p>
              )}
              {(quiz.grade || quiz.chapterTitle) && (
                <p className="mt-1 text-sm text-content-muted">
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
                        color="var(--gold-on-light)"
                        fill={i <= Math.round(quiz.rating!) ? "var(--gold-on-light)" : "transparent"}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-content-muted">
                    {quiz.rating.toFixed(1)}/5
                  </span>
                </div>
              ) : null}

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Lượt làm", value: quiz.playCount.toLocaleString("vi-VN") },
                  { label: "Cấp độ", value: LEVEL_LABELS[quiz.level] ?? quiz.level },
                  { label: "Câu hỏi", value: "Tải khi bắt đầu" },
                  ...(quiz.userPlayCount
                    ? [{ label: "Bạn đã làm", value: `${quiz.userPlayCount} lần` }]
                    : []),
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-card-light-border bg-[rgba(27,38,50,0.035)] px-4 py-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-content-subtle">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-bold text-content-heading">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-xl border border-accent-gold/24 bg-accent-gold/[0.08] p-5">
              <p className="text-sm font-semibold text-content-heading">
                Sẵn sàng luyện tập?
              </p>
              <p className="mt-2 text-sm leading-6 text-content-muted">
                Chọn giới hạn thời gian nếu muốn làm bài theo đồng hồ đếm ngược.
                {quiz.durationSeconds ? (
                  <> Gợi ý: <b>{Math.round(quiz.durationSeconds / 60)} phút</b>.</>
                ) : null}
              </p>

              <p className="mt-4 text-xs font-semibold text-content-subtle">
                Chế độ làm bài
              </p>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode("exam")}
                  className={cn(
                    "flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-colors border",
                    mode === "exam"
                      ? "bg-[var(--abyssal-blue)] text-[var(--text-on-dark)] border-[var(--abyssal-blue)]"
                      : "bg-card-light-bg text-content-muted border-card-light-border",
                  )}
                >
                  <Timer size={13} />
                  Chế độ thi
                </button>
                <button
                  onClick={() => setMode("practice")}
                  className={cn(
                    "flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-colors border",
                    mode === "practice"
                      ? "bg-[var(--abyssal-blue)] text-[var(--text-on-dark)] border-[var(--abyssal-blue)]"
                      : "bg-card-light-bg text-content-muted border-card-light-border",
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

              <div className="mt-4 grid grid-cols-2 gap-2">
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
                        "h-9 rounded-lg text-xs font-bold transition-colors border",
                        active
                          ? "bg-[var(--abyssal-blue)] text-[var(--text-on-dark)] border-[var(--abyssal-blue)]"
                          : "bg-card-light-bg text-content-muted border-card-light-border",
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <label className="mt-4 block">
                <span className="text-xs font-semibold text-content-subtle">
                  Tùy chỉnh theo phút
                </span>
                <input
                  type="number"
                  min={1}
                  value={customMinutes}
                  onChange={(event) => setCustomMinutes(event.target.value)}
                  placeholder="Ví dụ: 20"
                  className="mt-1 h-10 w-full rounded-lg border border-card-light-border bg-transparent px-3 text-sm outline-none text-content-heading"
                />
              </label>

              <button
                onClick={() => onStart(resolvedLimitedTime, mode === "practice")}
                className="mt-5 h-12 w-full rounded-lg text-sm font-bold transition-colors duration-200 bg-[var(--abyssal-blue)] text-[var(--text-on-dark)] shadow-[0_10px_22px_rgba(27,38,50,0.20)]"
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
