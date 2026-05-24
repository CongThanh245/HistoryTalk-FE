"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useQuizSets, useMyQuizResults } from "@/features/quiz/hooks";
import { useAuthStore } from "@/store/auth.store";
import { type QuizEra, type QuizResult } from "@/services/quiz.service";
import { QuizStatsBar } from "./quiz-stats-bar";
import { QuizRecentResults } from "./quiz-recent-result";
import { QuizCard } from "./quiz-card";

type EraFilter = "ALL" | Exclude<QuizEra, "ALL">;

const ERA_FILTERS: { label: string; value: EraFilter }[] = [
  { label: "Tất cả", value: "ALL" },
  { label: "Cổ đại", value: "ANCIENT" },
  { label: "Trung đại", value: "MEDIEVAL" },
  { label: "Cận đại", value: "MODERN" },
  { label: "Hiện đại", value: "CONTEMPORARY" },
];

export function QuizPageClient() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [search, setSearch] = useState("");
  const [selectedEra, setSelectedEra] = useState<EraFilter>("ALL");

  const { data: quizData } = useQuizSets();
  const allQuizzes = useMemo(() => quizData?.content ?? [], [quizData?.content]);

  const { data: resultsData, isLoading: resultsLoading } = useMyQuizResults(
    undefined,
    isAuthenticated,
  );
  const results: QuizResult[] = useMemo(
    () => resultsData?.content ?? [],
    [resultsData?.content],
  );

  const filteredQuizzes = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return allQuizzes.filter((q) => {
      const matchSearch =
        !keyword ||
        q.title.toLowerCase().includes(keyword) ||
        q.contextTitle?.toLowerCase().includes(keyword);
      const matchEra = selectedEra === "ALL" || q.era === selectedEra;
      return matchSearch && matchEra;
    });
  }, [allQuizzes, search, selectedEra]);

  const avgScore = useMemo(() => {
    if (!results.length) return 0;
    const total = results.reduce((acc, r) => acc + r.percentage, 0);
    return Math.round(total / results.length);
  }, [results]);

  const handleStartQuiz = (quizId: string) => {
    router.push(`/quiz/${quizId}`);
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-content)" }}>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <section
          className="mb-6 rounded-xl border px-5 py-5 md:px-6"
          style={{
            background: "var(--card-light-bg)",
            borderColor: "var(--card-light-border)",
            boxShadow: "0 10px 28px rgba(27,38,50,0.06)",
          }}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: "var(--gold-on-light)" }}
              >
                Luyện tập theo chủ đề
              </p>
              <h1 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--content-heading)" }}>
                Trắc nghiệm lịch sử
              </h1>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--content-muted)" }}>
                Chọn một bộ đề, làm nhanh theo bối cảnh lịch sử và xem lại đáp án ngay sau khi nộp bài.
              </p>
            </div>

            <div
              className="flex h-11 w-full items-center gap-3 rounded-lg px-4 lg:w-[360px]"
              style={{
                background: "rgba(27,38,50,0.05)",
                border: "1px solid var(--card-light-border)",
              }}
            >
              <Search size={16} style={{ color: "var(--content-muted)" }} />
              <input
                type="text"
                placeholder="Tìm quiz hoặc bối cảnh..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--content-heading)" }}
              />
            </div>
          </div>
        </section>

        <QuizStatsBar
          totalQuizzes={quizData?.totalElements ?? 0}
          completedCount={resultsData?.totalElements ?? results.length}
          averageScore={avgScore}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--content-heading)" }}>
                  Danh sách đề
                </h2>
                <p className="text-sm" style={{ color: "var(--content-muted)" }}>
                  {filteredQuizzes.length} đề phù hợp
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {ERA_FILTERS.map((f) => {
                  const active = selectedEra === f.value;
                  return (
                    <button
                      key={f.value}
                      onClick={() => setSelectedEra(f.value)}
                      className="h-9 rounded-lg px-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
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
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {filteredQuizzes.length === 0 ? (
              <div
                className="rounded-xl border px-6 py-16 text-center"
                style={{
                  background: "var(--card-light-bg)",
                  borderColor: "var(--card-light-border)",
                }}
              >
                <p className="font-semibold" style={{ color: "var(--content-heading)" }}>
                  Không tìm thấy bộ câu hỏi
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--content-muted)" }}>
                  Thử đổi bộ lọc hoặc từ khóa tìm kiếm.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredQuizzes.map((quiz, index) => (
                  <div
                    key={quiz.quizId}
                    className="animate-[quiz-card-in_260ms_ease-out_both]"
                    style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                  >
                    <QuizCard quiz={quiz} onStart={handleStartQuiz} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <QuizRecentResults results={results} isLoading={resultsLoading} />
          </aside>
        </div>
      </div>

      <style>{`
        @keyframes quiz-card-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
