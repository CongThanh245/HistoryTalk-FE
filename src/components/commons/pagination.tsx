"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  // Tính dải trang hiển thị — luôn hiện tối đa 5 nút
  const getPages = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const btnBase =
    "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer";

  return (
    <div className="flex items-center justify-center gap-1.5 pt-4">
      {/* Prev */}
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className={`${btnBase} disabled:opacity-30 disabled:cursor-not-allowed`}
        style={{
          background: "var(--card-light-bg)",
          border: "1px solid var(--card-light-border)",
          color: "var(--content-text)",
        }}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Pages */}
      {getPages().map((p, i) =>
        p === "..." ? (
          <span
            key={`dots-${i}`}
            className="w-8 h-8 flex items-center justify-center text-sm"
            style={{ color: "var(--content-muted)" }}
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={btnBase}
            style={
              page === p
                ? {
                    background: "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
                    color: "var(--bg-deep)",
                    boxShadow: "0 2px 8px var(--accent-gold-glow)",
                    border: "none",
                  }
                : {
                    background: "var(--card-light-bg)",
                    border: "1px solid var(--card-light-border)",
                    color: "var(--content-text)",
                  }
            }
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className={`${btnBase} disabled:opacity-30 disabled:cursor-not-allowed`}
        style={{
          background: "var(--card-light-bg)",
          border: "1px solid var(--card-light-border)",
          color: "var(--content-text)",
        }}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}