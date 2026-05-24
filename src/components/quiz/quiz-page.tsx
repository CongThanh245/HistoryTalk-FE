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

  const totalPlayCount = useMemo(
    () => allQuizzes.reduce((acc, q) => acc + q.playCount, 0),
    [allQuizzes],
  );

  const handleStartQuiz = (quizId: string) => {
    router.push(`/quiz/${quizId}`);
  };

  return (
    <div
      className="min-h-screen px-3 py-6 md:px-6 md:py-8"
      style={{ background: "var(--bg-content)" }}
    >
      <div className="mb-6">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "var(--content-heading)" }}
        >
          Trắc nghiệm lịch sử
        </h1>
        <p className="text-sm" style={{ color: "var(--content-muted)" }}>
          Khám phá các bộ câu hỏi theo bối cảnh lịch sử
        </p>
      </div>

      <QuizStatsBar
        totalQuizzes={quizData?.totalElements ?? 0}
        completedCount={resultsData?.totalElements ?? results.length}
        averageScore={avgScore}
        totalPlayCount={totalPlayCount}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-3 mb-5">
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
              style={{
                background: "var(--card-light-bg)",
                border: "1px solid var(--card-light-border)",
              }}
            >
              <Search size={15} style={{ color: "var(--content-muted)" }} />
              <input
                type="text"
                placeholder="Tìm kiếm quiz hoặc bối cảnh..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--content-heading)" }}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {ERA_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setSelectedEra(f.value)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={
                    selectedEra === f.value
                      ? {
                          background:
                            f.value === "ALL"
                              ? "var(--abyssal-blue)"
                              : "var(--accent-gold)",
                          color: "white",
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
              ))}
            </div>
          </div>

          <p className="text-sm mb-4" style={{ color: "var(--content-muted)" }}>
            {filteredQuizzes.length} đề thi
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredQuizzes.map((quiz) => (
              <QuizCard
                key={quiz.quizId}
                quiz={quiz}
                onStart={handleStartQuiz}
              />
            ))}
          </div>
        </div>

        <div className="w-full lg:w-72 flex-shrink-0">
          <QuizRecentResults results={results} isLoading={resultsLoading} />
        </div>
      </div>
    </div>
  );
}
