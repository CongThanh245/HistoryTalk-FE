"use client";

// components/quiz/QuizSidebar.tsx
// Sidebar trái trong trang làm bài — danh sách quiz để chuyển nhanh

import React, { useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { QuizSetV2 } from "@/services/quiz.service";
import { QuizCard } from "./quiz-card";

type GradeFilter = "ALL" | 10 | 11 | 12;

interface QuizSidebarProps {
  quizzes: QuizSetV2[];
  activeQuizId: string;
  onSelectQuiz: (quizId: string) => void;
}

export function QuizSidebar({
  quizzes,
  activeQuizId,
  onSelectQuiz,
}: QuizSidebarProps) {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("ALL");

  const filtered = quizzes.filter((q) => {
    const matchSearch =
      !search ||
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.chapterTitle?.toLowerCase().includes(search.toLowerCase());
    const matchGrade = gradeFilter === "ALL" || q.grade === gradeFilter;
    return matchSearch && matchGrade;
  });

  // Group by grade
  const grouped = filtered.reduce<Record<number, QuizSetV2[]>>((acc, q) => {
    if (!q.grade) return acc; // ← skip
    if (!acc[q.grade]) acc[q.grade] = [];
    acc[q.grade].push(q);
    return acc;
  }, {});

  const grades = [12, 11, 10] as const;
  const gradeColors = { 10: "#3b82f6", 11: "#8b5cf6", 12: "#f97316" };

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: "var(--bg-content)",
        borderRight: "1px solid var(--card-light-border)",
      }}
    >
      {/* Header */}
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

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--card-light-border)",
          }}
        >
          <Search size={13} style={{ color: "var(--content-muted)" }} />
          <input
            type="text"
            placeholder="Tìm đề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: "var(--content-heading)" }}
          />
        </div>

        {/* Grade filters */}
        <div className="flex gap-1.5">
          {(["ALL", 12, 11, 10] as GradeFilter[]).map((g) => (
            <button
              key={g}
              onClick={() => setGradeFilter(g)}
              className="flex-1 py-1 rounded-lg text-xs font-medium transition-all"
              style={
                gradeFilter === g
                  ? {
                      background:
                        g === "ALL"
                          ? "var(--abyssal-blue)"
                          : gradeColors[g as 10 | 11 | 12],
                      color: "white",
                    }
                  : {
                      background: "var(--bg-surface)",
                      color: "var(--content-muted)",
                      border: "1px solid var(--card-light-border)",
                    }
              }
            >
              {g === "ALL" ? "Tất cả" : `Lớp ${g}`}
            </button>
          ))}
        </div>
      </div>

      {/* Quiz list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {filtered.length === 0 ? (
          <p
            className="text-center text-xs py-6"
            style={{ color: "var(--content-muted)" }}
          >
            Không tìm thấy đề nào
          </p>
        ) : gradeFilter !== "ALL" ? (
          // Single grade list
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
        ) : (
          // Grouped by grade
          grades.map((grade) => {
            const items = grouped[grade];
            if (!items?.length) return null;
            return (
              <div key={grade}>
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: gradeColors[grade] }}
                  />
                  <span
                    className="text-xs font-bold"
                    style={{ color: gradeColors[grade] }}
                  >
                    Lịch sử {grade}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--content-subtle)" }}
                  >
                    ({items.length})
                  </span>
                </div>
                <div className="space-y-1">
                  {items.map((q) => (
                    <QuizCard
                      key={q.quizId}
                      quiz={q}
                      isActive={q.quizId === activeQuizId}
                      onStart={onSelectQuiz}
                      compact
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
