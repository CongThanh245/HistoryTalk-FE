"use client";
import {
  type QuizSetV2,
  type QuizGrade,
  type QuizResult,
} from "@/services/quiz.service";
// components/quiz/QuizPageClient.tsx — v2
// Bỏ filter difficulty, thêm filter theo lớp, card mới
import { useQuizSets } from "@/features/quiz/hooks";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMyQuizResults } from "@/features/quiz/hooks";

import { QuizStatsBar } from "./quiz-stats-bar";
import { QuizRecentResults } from "./quiz-recent-result";

import { Search, BookOpen } from "lucide-react";
import { QuizCard } from "./quiz-card";

type GradeFilter = "ALL" | QuizGrade;

const GRADE_FILTERS: { label: string; value: GradeFilter }[] = [
  { label: "Tất cả", value: "ALL" },
  { label: "Lịch sử 12", value: 12 },
  { label: "Lịch sử 11", value: 11 },
  { label: "Lịch sử 10", value: 10 },
];

const GRADE_COLORS: Record<number, string> = {
  10: "#3b82f6",
  11: "#8b5cf6",
  12: "#f97316",
};

export function QuizPageClient() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<GradeFilter>("ALL");
  const { data: quizData, isLoading: quizLoading } = useQuizSets();
  const allQuizzes = quizData?.content ?? [];

  const { data: resultsData, isLoading: resultsLoading } = useMyQuizResults();
  const results: QuizResult[] = resultsData?.content ?? [];
  const filteredQuizzes = useMemo(() => {
    return allQuizzes.filter((q) => {
      const matchSearch =
        !search ||
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.chapterTitle?.toLowerCase().includes(search.toLowerCase());
      const matchGrade = selectedGrade === "ALL" || q.grade === selectedGrade;
      return matchSearch && matchGrade;
    });
  }, [allQuizzes, search, selectedGrade]); // ← thêm allQuizzes vào đây

  // Group theo lớp khi filter "Tất cả"
  const groupedByGrade = useMemo(() => {
    if (selectedGrade !== "ALL") return null;
    const groups: Record<number, QuizSetV2[]> = {};
    filteredQuizzes.forEach((q) => {
      if (!q.grade) return; // ← skip quiz không có grade
      if (!groups[q.grade]) groups[q.grade] = [];
      groups[q.grade].push(q);
    });
    return groups;
  }, [filteredQuizzes]);
  console.log("quizData", quizData);
  console.log("allQuizzes", allQuizzes);
  console.log("filteredQuizzes", filteredQuizzes);
  console.log("groupedByGrade", groupedByGrade);
  const avgScore = useMemo(() => {
    if (!results.length) return 0;
    const total = results.reduce(
      (acc, r) => acc + Math.round((r.score / r.totalQuestions) * 100),
      0,
    );
    return Math.round(total / results.length);
  }, [results]);

  const handleStartQuiz = (quizId: string) => {
    router.push(`/quiz/${quizId}`);
  };

  return (
    <div
      className="min-h-screen px-6 py-8"
      style={{ background: "var(--bg-content)" }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "var(--content-heading)" }}
        >
          Trắc nghiệm lịch sử
        </h1>
        <p className="text-sm" style={{ color: "var(--content-muted)" }}>
          Ôn tập theo từng bài — Lịch sử 10, 11, 12
        </p>
      </div>

      {/* Stats */}
      <QuizStatsBar
        totalQuizzes={quizData?.totalElements ?? 0}
        completedCount={results.length}
        averageScore={avgScore}
        streakDays={7}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: quiz list */}
        <div className="flex-1 min-w-0">
          {/* Search + grade filter */}
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
                placeholder="Tìm kiếm bài học..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--content-heading)" }}
              />
            </div>

            <div className="flex gap-2">
              {GRADE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setSelectedGrade(f.value)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={
                    selectedGrade === f.value
                      ? {
                          background:
                            f.value === "ALL"
                              ? "var(--abyssal-blue)"
                              : GRADE_COLORS[f.value as number],
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

          {/* Count */}
          <p className="text-sm mb-4" style={{ color: "var(--content-muted)" }}>
            {filteredQuizzes.length} đề thi
          </p>

          {/* Quiz grid — grouped or flat */}
          {groupedByGrade && Object.keys(groupedByGrade).length > 0 ? (
            <div className="space-y-8">
              {([12, 11, 10] as QuizGrade[]).map((grade) => {
                const items = groupedByGrade[grade];
                if (!items?.length) return null;
                return (
                  <div key={grade}>
                    {/* Section header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-1 h-6 rounded-full"
                        style={{ background: GRADE_COLORS[grade] }}
                      />
                      <h2
                        className="text-base font-bold"
                        style={{ color: "var(--content-heading)" }}
                      >
                        Lịch sử {grade}
                      </h2>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: `${GRADE_COLORS[grade]}15`,
                          color: GRADE_COLORS[grade],
                        }}
                      >
                        {items.length} bài
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {items.map((quiz) => (
                        <QuizCard
                          key={quiz.quizId}
                          quiz={quiz}
                          onStart={handleStartQuiz}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredQuizzes.map((quiz) => (
                <QuizCard
                  key={quiz.quizId}
                  quiz={quiz}
                  onStart={handleStartQuiz}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: recent results */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <QuizRecentResults results={results} isLoading={resultsLoading} />
        </div>
      </div>
    </div>
  );
}
