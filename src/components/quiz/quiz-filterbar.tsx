// components/quiz/QuizFilterBar.tsx
// Bộ lọc era + difficulty + search

"use client";

import React from "react";
import { Search } from "lucide-react";
import type { QuizEra, QuizDifficulty } from "@/services/quiz.service";

const ERA_FILTERS: { label: string; value: QuizEra }[] = [
  { label: "Tất cả", value: "ALL" },
  { label: "Cổ đại", value: "ANCIENT" },
  { label: "Trung đại", value: "MEDIEVAL" },
  { label: "Cận đại", value: "MODERN" },
  { label: "Hiện đại", value: "CONTEMPORARY" },
];

const DIFFICULTY_FILTERS: { label: string; value: QuizDifficulty | "ALL" }[] = [
  { label: "Tất cả", value: "ALL" },
  { label: "Dễ", value: "EASY" },
  { label: "Trung bình", value: "MEDIUM" },
  { label: "Khó", value: "HARD" },
];

interface QuizFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  selectedEra: QuizEra;
  onEraChange: (v: QuizEra) => void;
  selectedDifficulty: QuizDifficulty | "ALL";
  onDifficultyChange: (v: QuizDifficulty | "ALL") => void;
}

export function QuizFilterBar({
  search,
  onSearchChange,
  selectedEra,
  onEraChange,
  selectedDifficulty,
  onDifficultyChange,
}: QuizFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Search */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
        style={{
          background: "var(--card-light-bg)",
          border: "1px solid var(--border-default)",
        }}
      >
        <Search size={16} style={{ color: "var(--content-muted)" }} />
        <input
          type="text"
          placeholder="Tìm kiếm bộ câu hỏi..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--content-heading)" }}
        />
      </div>

      {/* Era filter */}
      <div className="flex gap-2 flex-wrap">
        {ERA_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => onEraChange(f.value)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={
              selectedEra === f.value
                ? {
                    background: "var(--accent-gold)",
                    color: "var(--text-inverse)",
                    border: "1px solid var(--accent-gold)",
                  }
                : {
                    background: "var(--card-light-bg)",
                    color: "var(--content-text)",
                    border: "1px solid var(--border-default)",
                  }
            }
          >
            {f.label}
          </button>
        ))}

        {/* Divider */}
        <div
          className="w-px mx-1 self-stretch"
          style={{ background: "var(--border-default)" }}
        />

        {/* Difficulty filter */}
        {DIFFICULTY_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => onDifficultyChange(f.value)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={
              selectedDifficulty === f.value
                ? {
                    background: "var(--abyssal-blue)",
                    color: "var(--accent-gold-soft)",
                    border: "1px solid var(--accent-gold-soft)",
                  }
                : {
                    background: "var(--card-light-bg)",
                    color: "var(--content-muted)",
                    border: "1px solid var(--border-default)",
                  }
            }
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}