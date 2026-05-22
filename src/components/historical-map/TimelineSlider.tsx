"use client";

// components/historical-map/TimelineSlider.tsx
// Trục thời gian lịch sử — snap vào các mốc period

import React, { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import type { HistoricalPeriod } from "@/services/period.service";

interface TimelineSliderProps {
  periods: HistoricalPeriod[];
  currentPeriodId: string;
  onChange: (periodId: string) => void;
}

export function TimelineSlider({
  periods,
  currentPeriodId,
  onChange,
}: TimelineSliderProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const currentIdx = periods.findIndex((p) => p.periodId === currentPeriodId);
  const current = periods[currentIdx];

  const goPrev = () => {
    if (currentIdx > 0) onChange(periods[currentIdx - 1].periodId);
  };

  const goNext = () => {
    if (currentIdx < periods.length - 1)
      onChange(periods[currentIdx + 1].periodId);
  };

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      if (currentIdx >= periods.length - 1) {
        setIsPlaying(false);
        return;
      }
      onChange(periods[currentIdx + 1].periodId);
    }, 2500);
    return () => clearInterval(timer);
  }, [isPlaying, currentIdx, periods, onChange]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx]);

  // Scroll selected tick into view
  useEffect(() => {
    const el = trackRef.current?.querySelector(
      `[data-period="${currentPeriodId}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentPeriodId]);

  return (
    <div
      className="flex-shrink-0 flex flex-col gap-2 px-4 py-3 z-10"
      style={{
        background: "var(--palladian)",
        borderTop: "1px solid var(--oatmeal)",
        boxShadow: "0 -2px 8px rgba(27,38,50,0.06)",
      }}
    >
      {/* Current period info */}
      <div className="flex items-baseline gap-2 px-1">
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--accent-gold)" }}
        >
          {current?.dynasty ?? "—"}
        </span>
        <span
          className="text-sm font-bold"
          style={{ color: "var(--content-heading)" }}
        >
          {current?.name}
        </span>
        <span
          className="text-xs ml-auto truncate"
          style={{ color: "var(--content-muted)" }}
        >
          {current?.description}
        </span>
      </div>

      {/* Slider track */}
      <div className="flex items-center gap-2">
        {/* Prev */}
        <button
          onClick={goPrev}
          disabled={currentIdx <= 0}
          className="flex-shrink-0 p-1.5 rounded-lg transition-colors disabled:opacity-30 hover:bg-black/5"
          style={{ color: "var(--content-heading)" }}
          aria-label="Mốc trước"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Track */}
        <div
          ref={trackRef}
          className="flex-1 relative overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          {/* Line */}
          <div
            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 rounded-full"
            style={{ background: "var(--oatmeal)" }}
          />
          {/* Progress line */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 rounded-full transition-all duration-500"
            style={{
              width: `${((currentIdx + 0.5) / periods.length) * 100}%`,
              background: "var(--accent-gold)",
            }}
          />

          {/* Ticks */}
          <div
            className="relative flex items-center justify-between gap-2 py-2"
            style={{ minWidth: `${periods.length * 80}px` }}
          >
            {periods.map((p, idx) => {
              const isActive = p.periodId === currentPeriodId;
              const isPast = idx < currentIdx;
              return (
                <button
                  key={p.periodId}
                  data-period={p.periodId}
                  onClick={() => onChange(p.periodId)}
                  className="relative flex flex-col items-center gap-1 group flex-1 min-w-[80px]"
                >
                  {/* Dot */}
                  <div
                    className="relative z-10 rounded-full transition-all duration-300"
                    style={{
                      width: isActive ? 16 : 10,
                      height: isActive ? 16 : 10,
                      background: isActive
                        ? "var(--accent-gold)"
                        : isPast
                          ? "var(--accent-gold)"
                          : "var(--bg-content)",
                      border: `2px solid ${
                        isActive || isPast
                          ? "var(--accent-gold)"
                          : "var(--oatmeal)"
                      }`,
                      boxShadow: isActive
                        ? "0 0 0 4px var(--accent-gold-glow), 0 2px 6px rgba(201,162,77,0.4)"
                        : "none",
                    }}
                  />
                  {/* Label */}
                  <span
                    className="text-[10px] font-semibold whitespace-nowrap transition-colors"
                    style={{
                      color: isActive
                        ? "var(--accent-gold)"
                        : "var(--content-muted)",
                    }}
                  >
                    {p.shortName}
                  </span>
                  {/* Hover tooltip */}
                  <span
                    className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      background: "var(--content-heading)",
                      color: "white",
                    }}
                  >
                    {p.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Next */}
        <button
          onClick={goNext}
          disabled={currentIdx >= periods.length - 1}
          className="flex-shrink-0 p-1.5 rounded-lg transition-colors disabled:opacity-30 hover:bg-black/5"
          style={{ color: "var(--content-heading)" }}
          aria-label="Mốc sau"
        >
          <ChevronRight size={18} />
        </button>

        {/* Play */}
        <button
          onClick={() => setIsPlaying((v) => !v)}
          className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-black/5"
          style={{
            color: isPlaying ? "var(--accent-gold)" : "var(--content-heading)",
          }}
          aria-label={isPlaying ? "Tạm dừng" : "Tự động chạy"}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
      </div>
    </div>
  );
}
