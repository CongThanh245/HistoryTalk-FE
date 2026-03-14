// components/quiz/QuizPageClient.tsx
// Client component tổng hợp toàn bộ trang Quiz

"use client";

import React, { useState, useMemo } from "react";

import {
  useQuizSets,
  useMyQuizResults,
  // useStartQuiz,
} from "@/features/quiz/hooks";
import type { QuizEra, QuizDifficulty } from "@/services/quiz.service";
import { QuizStatsBar } from "./quiz-stats-bar";
import { QuizFilterBar } from "./quiz-filterbar";
import { QuizGrid } from "./quiz-grid";
import { QuizRecentResults } from "./quiz-recent-result";
import { useRouter } from "next/navigation";

export function QuizPageClient() {
  const [search, setSearch] = useState("");
  const [selectedEra, setSelectedEra] = useState<QuizEra>("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    QuizDifficulty | "ALL"
  >("ALL");

  // Fetch data
  const { data: quizData, isLoading: quizLoading } = useQuizSets();
  const { data: results = [], isLoading: resultsLoading } = useMyQuizResults();
  // const startQuizMutation = useStartQuiz();

  // Filter locally (thay bằng server-side filter khi API sẵn sàng)
  const filteredQuizzes = useMemo(() => {
    const all = quizData?.content ?? [];
    return all.filter((q) => {
      const matchSearch =
        !search ||
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.description.toLowerCase().includes(search.toLowerCase());
      const matchEra = selectedEra === "ALL" || q.era === selectedEra;
      const matchDifficulty =
        selectedDifficulty === "ALL" ||
        q.difficulty === selectedDifficulty.toLowerCase();
      return matchSearch && matchEra && matchDifficulty;
    });
  }, [quizData, search, selectedEra, selectedDifficulty]);

  // Stats
  const avgScore = useMemo(() => {
    if (!results.length) return 0;
    const total = results.reduce(
      (acc, r) => acc + Math.round((r.score / r.totalQuestions) * 100),
      0,
    );
    return Math.round(total / results.length);
  }, [results]);
  const router = useRouter(); // ← thêm dòng này

  const handleStartQuiz = async (quizId: string) => {
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
          Kiểm tra và nâng cao kiến thức lịch sử Việt Nam qua các bộ câu hỏi
        </p>
      </div>

      {/* Stats */}
      <QuizStatsBar
        totalQuizzes={quizData?.totalElements ?? 0}
        completedCount={results.length}
        averageScore={avgScore}
        streakDays={7}
      />

      {/* Main grid layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: quiz list */}
        <div className="flex-1 min-w-0">
          <QuizFilterBar
            search={search}
            onSearchChange={setSearch}
            selectedEra={selectedEra}
            onEraChange={setSelectedEra}
            selectedDifficulty={selectedDifficulty}
            onDifficultyChange={setSelectedDifficulty}
          />

          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm" style={{ color: "var(--content-muted)" }}>
              {quizLoading
                ? "Đang tải..."
                : `${filteredQuizzes.length} bộ câu hỏi`}
            </p>
          </div>

          <QuizGrid
            quizzes={filteredQuizzes}
            isLoading={quizLoading}
            onStart={handleStartQuiz}
          />
        </div>

        {/* Right: recent results sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <QuizRecentResults results={results} isLoading={resultsLoading} />
        </div>
      </div>
    </div>
  );
}
