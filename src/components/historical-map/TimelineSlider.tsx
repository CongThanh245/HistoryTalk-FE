"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TimelineSliderProps {
  currentYear: number;
  onChange: (year: number) => void;
  battleYears: number[];
  visibleCount?: number;
}

export function TimelineSlider({
  currentYear,
  onChange,
  battleYears,
  visibleCount,
}: TimelineSliderProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const years = useMemo(
    () => (battleYears.length > 0 ? battleYears : [currentYear]),
    [battleYears, currentYear],
  );
  const currentIdx = years.indexOf(currentYear);
  const nearestIdx = years.findIndex((year) => year >= currentYear);
  const safeIdx =
    currentIdx >= 0
      ? currentIdx
      : nearestIdx >= 0
        ? nearestIdx
        : years.length - 1;

  const goPrev = () => {
    const idx = currentIdx >= 0 ? currentIdx : safeIdx;
    if (idx > 0) onChange(years[idx - 1]);
  };

  const goNext = () => {
    const idx = currentIdx >= 0 ? currentIdx : safeIdx;
    if (idx < years.length - 1) onChange(years[idx + 1]);
    else setIsPlaying(false);
  };

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      const idx = years.indexOf(currentYear);
      if (idx < 0 || idx >= years.length - 1) {
        setIsPlaying(false);
      } else {
        onChange(years[idx + 1]);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, currentYear, years, onChange]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYear, years]);

  const formatYear = (year: number) =>
    year < 0 ? `${Math.abs(year)} TCN` : `${year}`;

  const minYear = years[0] ?? currentYear;
  const maxYear = years[years.length - 1] ?? currentYear;
  const progressPct =
    years.length > 1 ? (safeIdx / (years.length - 1)) * 100 : 0;

  return (
    <div className="z-10 shrink-0 border-t border-[#decbaa] bg-[#fff8e8] px-3 py-3 shadow-[0_-8px_24px_rgba(71,49,25,0.10)] md:px-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex min-w-[180px] items-center justify-between gap-3 rounded-lg border border-[#e2cfab] bg-white/70 px-3 py-2 md:justify-start">
          <div>
            <div className="text-[11px] font-bold uppercase text-[#8a6a3e]">
              Mốc đang xem
            </div>
            <div className="mt-0.5 text-2xl font-black leading-none tabular-nums text-[#7a3d25]">
              {formatYear(currentYear)}
            </div>
          </div>
          <div className="text-right text-xs font-semibold text-[#6d5a45] md:text-left">
            <div>
              {safeIdx + 1}/{years.length} mốc
            </div>
            <div className="mt-1 flex items-center justify-end gap-1 md:justify-start">
              <MapPin size={12} />
              {visibleCount ?? 0} địa danh
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            disabled={safeIdx === 0}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[#e2cfab] bg-white/75 text-[#4f3b29] transition-colors hover:bg-white disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a4b2b]"
            aria-label="Mốc trước"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={() => setIsPlaying((value) => !value)}
            disabled={years.length <= 1}
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-md border transition-colors disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a4b2b]",
              isPlaying
                ? "border-[#7a3d25] bg-[#7a3d25] text-white"
                : "border-[#e2cfab] bg-white/75 text-[#4f3b29] hover:bg-white",
            )}
            aria-label={isPlaying ? "Tạm dừng" : "Tự động chạy timeline"}
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} />}
          </button>

          <button
            onClick={goNext}
            disabled={safeIdx >= years.length - 1}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[#e2cfab] bg-white/75 text-[#4f3b29] transition-colors hover:bg-white disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a4b2b]"
            aria-label="Mốc tiếp theo"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-[#8a6a3e]">
            <span>{formatYear(minYear)}</span>
            <span>{formatYear(maxYear)}</span>
          </div>

          <div className="relative flex h-10 items-center">
            <div className="pointer-events-none absolute inset-x-0 h-1 rounded-full bg-[#e5d4b5]" />
            <div
              className="pointer-events-none absolute left-0 h-1 rounded-full bg-[#7a3d25] transition-[width] duration-150"
              style={{ width: `${progressPct}%` }}
            />

            {years.map((year, index) => {
              const pct = years.length > 1 ? (index / (years.length - 1)) * 100 : 50;
              const isActive = year === currentYear;
              const isPast = index <= safeIdx;
              return (
                <button
                  key={year}
                  onClick={() => onChange(year)}
                  title={formatYear(year)}
                  className="group pointer-events-auto absolute top-1/2 z-[5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8a4b2b]"
                  style={{
                    left: `${pct}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div
                    className={cn(
                      "rounded-full border-2 transition-all duration-150",
                      isPast
                        ? "border-[#7a3d25] bg-[#7a3d25]"
                        : "border-[#9b8565] bg-[#f8f3e7]",
                    )}
                    style={{
                      width: isActive ? 18 : 10,
                      height: isActive ? 18 : 10,
                      boxShadow: isActive
                        ? "0 0 0 5px rgba(122, 61, 37, 0.18)"
                        : "none",
                    }}
                  />
                  <span className="pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#2c2118] px-1.5 py-0.5 text-[9px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {formatYear(year)}
                  </span>
                </button>
              );
            })}

            <input
              type="range"
              min={0}
              max={years.length - 1}
              step={1}
              value={safeIdx}
              onChange={(event) => onChange(years[Number(event.target.value)])}
              className="absolute inset-x-0 top-1/2 z-10 h-10 w-full -translate-y-1/2 cursor-pointer opacity-0"
              aria-label="Chọn mốc thời gian"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
