"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import type { QuizSet } from "@/services/quiz.service";

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
  onStart: (limitedTime?: number) => void;
}

export function QuizDetailPage({ quiz, onStart }: QuizDetailPageProps) {
  const router = useRouter();
  const [selectedTime, setSelectedTime] = useState<number | undefined>();
  const [customMinutes, setCustomMinutes] = useState("");

  const resolvedLimitedTime = useMemo(() => {
    const minutes = Number(customMinutes);
    if (Number.isFinite(minutes) && minutes > 0) {
      return Math.round(minutes * 60);
    }
    return selectedTime;
  }, [customMinutes, selectedTime]);

  return (
    <main className="min-h-full px-5 py-7 md:px-8" style={{ background: "var(--bg-content)" }}>
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => router.back()}
          className="mb-5 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--content-muted)" }}
        >
          Quay lại
        </button>

        <section
          className="rounded-xl border p-6 md:p-8"
          style={{
            background: "var(--card-light-bg)",
            borderColor: "var(--card-light-border)",
            boxShadow: "0 16px 36px rgba(27,38,50,0.08)",
          }}
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background: "rgba(201,162,77,0.12)",
                    color: "var(--gold-on-light)",
                    border: "1px solid rgba(201,162,77,0.24)",
                  }}
                >
                  {ERA_LABELS[quiz.era] ?? quiz.era}
                </span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background: "rgba(27,38,50,0.06)",
                    color: "var(--content-heading)",
                    border: "1px solid var(--card-light-border)",
                  }}
                >
                  {LEVEL_LABELS[quiz.level] ?? quiz.level}
                </span>
              </div>

              <h1 className="text-3xl font-bold leading-tight md:text-4xl" style={{ color: "var(--content-heading)" }}>
                {quiz.title}
              </h1>
              {quiz.contextTitle && (
                <p className="mt-3 text-base leading-7" style={{ color: "var(--content-muted)" }}>
                  {quiz.contextTitle}
                </p>
              )}
              {(quiz.grade || quiz.chapterTitle) && (
                <p className="mt-1 text-sm" style={{ color: "var(--content-muted)" }}>
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
                  <span className="text-sm font-semibold" style={{ color: "var(--content-muted)" }}>
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
                    className="rounded-lg border px-4 py-3"
                    style={{
                      background: "rgba(27,38,50,0.035)",
                      borderColor: "var(--card-light-border)",
                    }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--content-subtle)" }}>
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-bold" style={{ color: "var(--content-heading)" }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <aside
              className="rounded-xl border p-5"
              style={{
                background: "rgba(201,162,77,0.08)",
                borderColor: "rgba(201,162,77,0.24)",
              }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--content-heading)" }}>
                Sẵn sàng luyện tập?
              </p>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--content-muted)" }}>
                Chọn giới hạn thời gian nếu muốn làm bài theo đồng hồ đếm ngược.
                {quiz.durationSeconds ? (
                  <> Gợi ý: <b>{Math.round(quiz.durationSeconds / 60)} phút</b>.</>
                ) : null}
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
                      className="h-9 rounded-lg text-xs font-bold transition-colors"
                      style={
                        active
                          ? {
                              background: "var(--abyssal-blue)",
                              color: "var(--text-on-dark)",
                              border: "1px solid var(--abyssal-blue)",
                            }
                          : {
                              background: "var(--card-light-bg)",
                              color: "var(--content-muted)",
                              border: "1px solid var(--card-light-border)",
                            }
                      }
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <label className="mt-4 block">
                <span className="text-xs font-semibold" style={{ color: "var(--content-subtle)" }}>
                  Tùy chỉnh theo phút
                </span>
                <input
                  type="number"
                  min={1}
                  value={customMinutes}
                  onChange={(event) => setCustomMinutes(event.target.value)}
                  placeholder="Ví dụ: 20"
                  className="mt-1 h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none"
                  style={{
                    borderColor: "var(--card-light-border)",
                    color: "var(--content-heading)",
                  }}
                />
              </label>

              <button
                onClick={() => onStart(resolvedLimitedTime)}
                className="mt-5 h-12 w-full rounded-lg text-sm font-bold transition-colors duration-200"
                style={{
                  background: "var(--abyssal-blue)",
                  color: "var(--text-on-dark)",
                  boxShadow: "0 10px 22px rgba(27,38,50,0.20)",
                }}
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
