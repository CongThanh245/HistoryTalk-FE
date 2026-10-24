"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { QuizSet } from "@/services/quiz.service";
import { QuizCard } from "./quiz-card";

interface QuizSidebarProps {
  quizzes: QuizSet[];
  activeQuizId: string;
  onSelectQuiz: (quizId: string) => void;
}

export function QuizSidebar({
  quizzes,
  activeQuizId,
  onSelectQuiz,
}: QuizSidebarProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return quizzes;

    return quizzes.filter(
      (q) =>
        q.title.toLowerCase().includes(keyword) ||
        q.contextTitle?.toLowerCase().includes(keyword),
    );
  }, [quizzes, search]);

  return (
    <aside className="flex h-full flex-col bg-[var(--bg-surface)]">
      <div className="flex-shrink-0 border-b border-[var(--border-default)] px-4 pb-3 pt-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-base font-semibold text-content-heading">
            Danh sách đề
          </h3>
          <span className="text-sm tabular-nums text-content-muted">
            {quizzes.length}
          </span>
        </div>

        <label className="flex h-9 items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 transition-colors focus-within:border-[var(--accent-gold)]">
          <Search size={15} className="shrink-0 text-content-muted" aria-hidden="true" />
          <span className="sr-only">Tìm đề</span>
          <input
            type="search"
            placeholder="Tìm đề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none text-content-heading"
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-content-muted">
            Không tìm thấy đề nào
          </p>
        ) : (
          <div className="space-y-0.5 p-2">
            {filtered.map((q) => (
              <QuizCard
                key={q.quizId}
                quiz={q}
                isActive={q.quizId === activeQuizId}
                onStart={onSelectQuiz}
                compact
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
