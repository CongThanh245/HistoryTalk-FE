// components/quiz/QuizFilterBar.tsx
// Bộ lọc era + search

"use client";

import React from "react";
import { Search } from "lucide-react";
import type { QuizEra } from "@/services/quiz.service";

const ERA_FILTERS: { label: string; value: QuizEra }[] = [
  { label: "Tất cả", value: "ALL" },
  { label: "Cổ đại", value: "ANCIENT" },
  { label: "Trung đại", value: "MEDIEVAL" },
  { label: "Cận đại", value: "MODERN" },
  { label: "Hiện đại", value: "CONTEMPORARY" },
];

interface QuizFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  selectedEra: QuizEra;
  onEraChange: (v: QuizEra) => void;
}

export function QuizFilterBar({
  search,
  onSearchChange,
  selectedEra,
  onEraChange,
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
                    background: "var(--era-filter-active-bg, var(--accent-gold))",
                    color: "var(--era-filter-active-text, var(--text-inverse))",
                    border: "1px solid var(--era-filter-active-bg, var(--accent-gold))",
                  }
                : {
                    background: "var(--era-filter-bg, var(--card-light-bg))",
                    color: "var(--era-filter-text, var(--content-text))",
                    border: "1px solid var(--era-filter-border, var(--border-default))",
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
