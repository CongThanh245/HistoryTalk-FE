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
    <aside className="flex h-full flex-col bg-[var(--bg-surface)] border-r border-[var(--text-primary)]">
      <div className="flex-shrink-0 px-4 pb-4 pt-5 border-b border-[var(--text-primary)]">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="archive-title text-[20px]">
            Danh sách đề
          </h3>
          <span className="font-display text-lg font-extrabold leading-none text-accent-gold">
            {quizzes.length}
          </span>
        </div>

        <div className="flex h-10 items-center gap-2 rounded-[2px] px-3 bg-[var(--bg-elevated)] border border-[var(--border-strong)] transition-colors focus-within:border-[var(--text-primary)]">
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

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-content-muted">
            Không tìm thấy đề nào
          </p>
        ) : (
          <div>
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
