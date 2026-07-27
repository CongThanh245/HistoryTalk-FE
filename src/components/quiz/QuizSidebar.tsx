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
    <aside className="flex h-full flex-col bg-[var(--bg-content)] border-r border-card-light-border">
      <div className="flex-shrink-0 px-4 pb-4 pt-5 border-b border-card-light-border">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-sm font-bold text-content-heading">
            Danh sách đề
          </h3>
          <span className="text-xs font-semibold text-gold-on-light">
            {quizzes.length}
          </span>
        </div>

        <div className="flex h-10 items-center gap-2 rounded-lg px-3 bg-[rgba(27,38,50,0.05)] border border-card-light-border">
          <Search size={14} className="text-content-muted" />
          <input
            type="text"
            placeholder="Tìm đề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none text-content-heading"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-xs text-content-muted">
            Không tìm thấy đề nào
          </p>
        ) : (
          <div className="space-y-1">
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
