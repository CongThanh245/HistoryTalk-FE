"use client";

import React from "react";
import { useRouter } from "next/navigation";
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

interface QuizDetailPageProps {
  quiz: QuizSet;
  onStart: () => void;
}

export function QuizDetailPage({ quiz, onStart }: QuizDetailPageProps) {
  const router = useRouter();

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
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
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

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Lượt làm", value: quiz.playCount.toLocaleString("vi-VN") },
                  { label: "Cấp độ", value: LEVEL_LABELS[quiz.level] ?? quiz.level },
                  { label: "Câu hỏi", value: "Tải khi bắt đầu" },
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
                Sau khi bắt đầu, hệ thống sẽ tạo phiên làm bài và lưu kết quả vào lịch sử của bạn.
              </p>
              <button
                onClick={onStart}
                className="mt-5 h-12 w-full rounded-lg text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
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
