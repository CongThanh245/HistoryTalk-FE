"use client";

import React, { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
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
    <div
      className="flex flex-col h-full"
      style={{
        background: "var(--bg-content)",
        borderRight: "1px solid var(--card-light-border)",
      }}
    >
      <div
        className="flex-shrink-0 px-4 pt-4 pb-3"
        style={{ borderBottom: "1px solid var(--card-light-border)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={15} style={{ color: "var(--accent-gold)" }} />
          <h3
            className="text-sm font-bold"
            style={{ color: "var(--content-heading)" }}
          >
            Danh sách đề
          </h3>
          <span
            className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{
              background: "var(--accent-gold-active-bg)",
              color: "var(--accent-gold)",
            }}
          >
            {quizzes.length}
          </span>
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--card-light-border)",
          }}
        >
          <Search size={13} style={{ color: "var(--text-on-dark)" }} />
          <input
            type="text"
            placeholder="Tìm đề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: "var(--text-on-dark)" }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {filtered.length === 0 ? (
          <p
            className="text-center text-xs py-6"
            style={{ color: "var(--content-muted)" }}
          >
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
    </div>
  );
}
