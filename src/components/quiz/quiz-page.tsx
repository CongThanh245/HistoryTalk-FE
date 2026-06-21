"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { History, ListChecks, Search } from "lucide-react";
import { useQuizSets, useMyQuizResults } from "@/features/quiz/hooks";
import { useAuthStore } from "@/store/auth.store";
import { type QuizEra, type QuizResult } from "@/services/quiz.service";
import { QuizStatsBar } from "./quiz-stats-bar";
import { QuizRecentResults } from "./quiz-recent-result";
import { QuizHistoryView } from "./quiz-history-view";
import { QuizCard } from "./quiz-card";

type EraFilter = "ALL" | Exclude<QuizEra, "ALL">;
type QuizView = "list" | "history";

const ERA_FILTERS: { label: string; value: EraFilter }[] = [
  { label: "Tất cả", value: "ALL" },
  { label: "Cổ đại", value: "ANCIENT" },
  { label: "Trung đại", value: "MEDIEVAL" },
  { label: "Cận đại", value: "MODERN" },
  { label: "Hiện đại", value: "CONTEMPORARY" },
];

export function QuizPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [search, setSearch] = useState("");
  const [selectedEra, setSelectedEra] = useState<EraFilter>("ALL");
  const activeView: QuizView =
    searchParams.get("view") === "history" ? "history" : "list";

  const { data: quizData, isLoading: quizzesLoading } = useQuizSets();
  const allQuizzes = useMemo(() => quizData?.content ?? [], [quizData?.content]);

  const { data: resultsData, isLoading: resultsLoading } = useMyQuizResults(
    { page: 0, size: 50 },
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
    const totalScore = results.reduce((acc, r) => acc + r.score, 0);
    const totalQuestions = results.reduce((acc, r) => acc + r.totalQuestions, 0);
    const averageScore = Number((totalScore / results.length).toFixed(1));
    const averageTotal = Number((totalQuestions / results.length).toFixed(1));
    return `${averageScore}/${averageTotal}`;
  }, [results]);

  const handleStartQuiz = (quizId: string) => {
    router.push(`/quiz/${quizId}`);
  };

  const handleViewChange = (view: QuizView) => {
    router.push(view === "history" ? "/quiz?view=history" : "/quiz");
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-content)" }}>
      <div className="mx-auto max-w-7xl">
        <section
          className="mb-3 rounded-xl border px-4 py-3 md:mb-4 md:px-5 md:py-4"
          style={{
            background: "var(--card-light-bg)",
            borderColor: "var(--card-light-border)",
            boxShadow: "0 10px 28px rgba(27,38,50,0.06)",
          }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p
                className="mb-1 text-[10px] font-semibold uppercase tracking-wide md:text-xs"
                style={{ color: "var(--gold-on-light)" }}
              >
                Luyện tập theo chủ đề
              </p>
              <h1 className="text-xl font-bold md:text-2xl" style={{ color: "var(--content-heading)" }}>
                Câu đố lịch sử
              </h1>
              <p className="mt-1 line-clamp-2 text-xs leading-5 md:text-sm" style={{ color: "var(--content-muted)" }}>
                Chọn một bộ đề, làm nhanh theo bối cảnh lịch sử và xem lại đáp án ngay sau khi nộp bài.
              </p>
            </div>

            <div className="w-full md:w-[360px]">
              <div
                className="grid grid-cols-2 rounded-lg p-1"
                style={{
                  background: "rgba(27,38,50,0.05)",
                  border: "1px solid var(--card-light-border)",
                }}
              >
                {[
                  { label: "Danh sách đề", value: "list" as const, icon: ListChecks },
                  { label: "Lịch sử", value: "history" as const, icon: History },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = activeView === item.value;
                  return (
                    <button
                      key={item.value}
                      onClick={() => handleViewChange(item.value)}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md text-xs font-bold transition-all md:h-9 md:gap-2 md:text-sm"
                      style={
                        active
                          ? {
                              background: "var(--card-light-bg)",
                              color: "var(--content-heading)",
                              boxShadow: "0 4px 12px rgba(27,38,50,0.08)",
                            }
                          : { color: "var(--content-muted)" }
                      }
                    >
                      <Icon size={16} />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {activeView === "list" && (
                <div
                  className="hidden"
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
              )}
            </div>
          </div>
        </section>

        <QuizStatsBar
          totalQuizzes={quizData?.totalElements ?? 0}
          completedCount={resultsData?.totalElements ?? results.length}
          averageScore={avgScore}
        />

        {activeView === "history" ? (
          <QuizHistoryView
            results={results}
            isLoading={resultsLoading}
            onRetake={handleStartQuiz}
          />
        ) : (
          <div className="grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section className="min-w-0">
              <div className="mb-3 flex flex-col gap-3">
                <div>
                  <h2 className="text-base font-bold" style={{ color: "var(--content-heading)" }}>
                    Danh sách đề
                  </h2>
                  <p className="text-xs md:text-sm" style={{ color: "var(--content-muted)" }}>
                    {filteredQuizzes.length} đề phù hợp
                  </p>
                </div>

                <div
                  className="flex h-10 w-full items-center gap-2 rounded-lg px-3 sm:max-w-[340px]"
                  style={{
                    background: "rgba(27,38,50,0.05)",
                    border: "1px solid var(--card-light-border)",
                  }}
                >
                  <Search size={15} style={{ color: "var(--content-muted)" }} />
                  <input
                    type="text"
                    placeholder="Tìm quiz..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                    style={{ color: "var(--content-heading)" }}
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {ERA_FILTERS.map((f) => {
                    const active = selectedEra === f.value;
                    return (
                      <button
                        key={f.value}
                        onClick={() => setSelectedEra(f.value)}
                        className="h-7 rounded-lg px-2 text-xs font-semibold transition-all duration-200 md:h-8 md:px-2.5 md:hover:-translate-y-0.5"
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

              {quizzesLoading ? (
                <div
                  className="rounded-xl border px-6 py-16 text-center"
                  style={{
                    background: "var(--card-light-bg)",
                    borderColor: "var(--card-light-border)",
                  }}
                >
                  <p className="font-semibold" style={{ color: "var(--content-heading)" }}>
                    Đang tải...
                  </p>
                </div>
              ) : filteredQuizzes.length === 0 ? (
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
                <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-3">
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
              <QuizRecentResults
                results={results.slice(0, 10)}
                isLoading={resultsLoading}
                onViewAll={() => handleViewChange("history")}
              />
            </aside>
          </div>
        )}
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
