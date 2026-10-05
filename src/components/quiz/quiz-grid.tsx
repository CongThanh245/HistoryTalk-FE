// components/quiz/QuizGrid.tsx
// Grid hiển thị danh sách quiz cards + skeleton loading

"use client";

import React from "react";
import type { QuizSet } from "@/services/quiz.service";
import { QuizCard } from "./quiz-card";

function QuizCardSkeleton() {
  return (
    <div className="rounded-[2px] overflow-hidden animate-pulse bg-[var(--bg-surface)] border border-[var(--text-primary)]">
      <div className="h-20 sm:h-36 bg-[var(--bg-deep)]" />
      <div className="p-3 sm:p-4 space-y-2">
        <div className="h-4 bg-[var(--border-default)] w-4/5" />
        <div className="h-3 bg-[var(--border-default)] w-3/5" />
        <div className="h-3 bg-[var(--border-default)] w-2/5" />
      </div>
    </div>
  );
}

interface QuizGridProps {
  quizzes: QuizSet[];
  isLoading: boolean;
  onStart: (quizId: string) => void;
}

export function QuizGrid({ quizzes, isLoading, onStart }: QuizGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <QuizCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-[2px] bg-[var(--bg-surface)] border border-[var(--text-primary)]">
        <div className="text-4xl mb-3">📚</div>
        <p className="archive-title text-[22px]">
          Không tìm thấy bộ câu hỏi
        </p>
        <p className="text-sm mt-1 text-content-muted">
          Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {quizzes.map((quiz) => (
        <QuizCard key={quiz.quizId} quiz={quiz} onStart={onStart} />
      ))}
    </div>
  );
}
