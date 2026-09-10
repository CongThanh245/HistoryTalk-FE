"use client";

// components/historical-map/TimelineSlider.tsx
// Discrete slider — chỉ dừng tại các năm có trận chiến thực sự.

import React, { useEffect, useState } from "react";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TimelineSliderProps {
  currentYear: number;
  onChange: (year: number) => void;
  /** Danh sách năm có trận (sorted asc) — slider chỉ dừng tại đây */
  battleYears: number[];
  /** Thông báo số landmark đang visible (optional) */
  visibleCount?: number;
}

export function TimelineSlider({
  currentYear,
  onChange,
  battleYears,
  visibleCount,
}: TimelineSliderProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const years = battleYears.length > 0 ? battleYears : [currentYear];
  const currentIdx = years.indexOf(currentYear);
  // Nếu currentYear không nằm trong list, snap về index gần nhất
  const safeIdx =
    currentIdx >= 0
      ? currentIdx
      : years.findIndex((y) => y >= currentYear) ?? years.length - 1;

  const goPrev = () => {
    const idx = currentIdx >= 0 ? currentIdx : safeIdx;
    if (idx > 0) onChange(years[idx - 1]);
  };
  const goNext = () => {
    const idx = currentIdx >= 0 ? currentIdx : safeIdx;
    if (idx < years.length - 1) onChange(years[idx + 1]);
    else setIsPlaying(false);
  };

  // Auto-play: nhảy từng trận
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      const idx = years.indexOf(currentYear);
      if (idx < 0 || idx >= years.length - 1) {
        setIsPlaying(false);
      } else {
        onChange(years[idx + 1]);
      }
    }, 900);
    return () => clearInterval(timer);
  }, [isPlaying, currentYear, years, onChange]);

  // Keyboard ←/→
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYear, years]);

  const formatYear = (y: number) =>
    y < 0 ? `${Math.abs(y)} TCN` : `${y}`;

  const minYear = years[0] ?? currentYear;
  const maxYear = years[years.length - 1] ?? currentYear;
  const progressPct =
    years.length > 1
      ? ((safeIdx) / (years.length - 1)) * 100
      : 0;

  return (
    <div
      className="shrink-0 flex items-center gap-3 px-4 py-2 z-10 min-h-[52px] bg-[var(--palladian)] border-t border-[var(--oatmeal)] shadow-[0_-2px_8px_rgba(27,38,50,0.06)]"
    >
      {/* Year + counter */}
      <div className="shrink-0 flex items-baseline gap-2">
        <span className="text-xl font-black tabular-nums leading-none text-accent-gold">
          {formatYear(currentYear)}
        </span>
        <span className="text-[11px] text-content-muted">
          {safeIdx + 1}/{years.length}
        </span>
      </div>

      {/* Prev */}
      <button
        onClick={goPrev}
        disabled={safeIdx === 0}
        className="shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors disabled:opacity-30 text-content-heading"
        aria-label="Trận trước"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Draggable dot track */}
      <div className="flex-1 relative h-10 flex items-center">
          {/* Track line */}
          <div className="absolute left-0 right-0 h-1 rounded-full pointer-events-none bg-[var(--oatmeal)]" />
          {/* Progress fill */}
          <div
            className="absolute left-0 h-1 rounded-full pointer-events-none transition-[width] duration-150 bg-accent-gold"
            style={{ width: `${progressPct}%` }}
          />
          {/* Dots (clickable, visual only — range input handles dragging) */}
          {years.map((y, i) => {
            const pct = years.length > 1 ? (i / (years.length - 1)) * 100 : 50;
            const isActive = y === currentYear;
            const isPast = i <= safeIdx;
            return (
              <button
                key={y}
                onClick={() => onChange(y)}
                title={formatYear(y)}
                className="absolute group pointer-events-auto"
                style={{
                  left: `${pct}%`,
                  transform: "translate(-50%, -50%)",
                  top: "50%",
                  zIndex: 5,
                }}
              >
                <div
                  className={cn(
                    "rounded-full transition-all duration-150",
                    isPast ? "bg-accent-gold opacity-100" : "bg-content-muted opacity-45",
                  )}
                  style={{
                    width: isActive ? 16 : 8,
                    height: isActive ? 16 : 8,
                    boxShadow: isActive ? "0 0 0 4px rgba(201,162,77,0.25)" : "none",
                  }}
                />
                <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none px-1.5 py-0.5 rounded bg-content-heading text-white">
                  {formatYear(y)}
                </span>
              </button>
            );
          })}
          {/* Native range input — invisible but handles drag interaction */}
          <input
            type="range"
            min={0}
            max={years.length - 1}
            step={1}
            value={safeIdx}
            onChange={(e) => onChange(years[Number(e.target.value)])}
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full opacity-0 cursor-pointer h-10 z-10"
          />
      </div>

      {/* Next */}
      <button
        onClick={goNext}
        disabled={safeIdx >= years.length - 1}
        className="shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors disabled:opacity-30 text-content-heading"
        aria-label="Trận tiếp theo"
      >
        <ChevronRight size={16} />
      </button>

      {/* Play */}
      <button
        onClick={() => setIsPlaying((v) => !v)}
        disabled={years.length <= 1}
        className={cn(
          "shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors disabled:opacity-30",
          isPlaying ? "text-accent-gold" : "text-content-heading"
        )}
        aria-label={isPlaying ? "Tạm dừng" : "Tự động chạy"}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
    </div>
  );
}
