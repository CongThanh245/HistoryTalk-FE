"use client";

import { useRef, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";

export interface TimelineItem {
  id: string;
  year: number;
  yearLabel: string;
  accentColor?: string;
}

interface TimelineStripProps {
  items: TimelineItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function TimelineStrip({ items, activeId, onSelect }: TimelineStripProps) {
  const trackRef    = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const offsetRef   = useRef(0);

  const activeIdx = items.findIndex((i) => i.id === activeId);

  // ── Scroll track so active dot is centred ────────────────

  const scrollToIdx = useCallback((idx: number) => {
    const track = trackRef.current;
    const outer = track?.parentElement;
    if (!track || !outer) return;

    const item = track.children[idx] as HTMLElement | undefined;
    if (!item) return;

    const outerW     = outer.clientWidth;
    const itemCenter = item.offsetLeft + item.offsetWidth / 2;
    const maxOffset  = track.scrollWidth - outerW;
    const target     = Math.max(0, Math.min(itemCenter - outerW / 2, maxOffset));

    offsetRef.current = target;
    gsap.to(track, { x: -target, duration: 0.38, ease: "power2.out" });

    // Update progress line
    setTimeout(() => {
      if (!progressRef.current || !track) return;
      const dot = item.querySelector<HTMLElement>(".tl-dot");
      if (!dot) return;
      const dotCenter = item.offsetLeft + dot.offsetLeft + dot.offsetWidth / 2 - target;
      progressRef.current.style.width = Math.max(0, dotCenter) + "px";
    }, 40);
  }, []);

  useEffect(() => {
    scrollToIdx(activeIdx);
  }, [activeIdx, scrollToIdx]);

  const handlePrev = () => {
    if (activeIdx > 0) onSelect(items[activeIdx - 1].id);
  };
  const handleNext = () => {
    if (activeIdx < items.length - 1) onSelect(items[activeIdx + 1].id);
  };

  const btnBase =
    "w-7 h-7 md:w-8 md:h-8 shrink-0 rounded-full border flex items-center justify-center transition-all duration-150 " +
    "hover:border-[var(--accent-gold)] hover:text-[var(--gold-on-light)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer";

  return (
    <div className="flex items-center gap-1 md:gap-2">
      {/* Prev arrow */}
      <button
        onClick={handlePrev}
        disabled={activeIdx === 0}
        className={btnBase}
        style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)", color: "var(--content-heading)" }}
      >
        <CaretLeftIcon className="w-3.5 h-3.5" />
      </button>

      {/* Track outer — clipping container */}
      <div className="flex-1 overflow-hidden relative h-16 md:h-[72px]">
        {/* Axis line */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: "50%", transform: "translateY(-50%)", height: 2,
            background: "linear-gradient(to right, transparent 0%, var(--card-light-border) 3%, var(--card-light-border) 97%, transparent 100%)",
          }}
        />

        {/* Progress fill */}
        <div
          ref={progressRef}
          className="absolute pointer-events-none"
          style={{
            top: "50%", transform: "translateY(-50%)", left: 0, height: 2, width: 0,
            background: "linear-gradient(to right, var(--gold-soft, #c9a24d), var(--accent-gold, #a07828))",
            borderRadius: 1, transition: "width 0.38s ease",
          }}
        />

        {/* Scrollable items — khoảng cách đều nhau */}
        <div
          ref={trackRef}
          className="absolute top-0 flex items-center h-16 md:h-[72px]"
          style={{ willChange: "transform", paddingLeft: 16, paddingRight: 16 }}
        >
          {items.map((item, i) => {
            const isActive = item.id === activeId;
            const dotColor = item.accentColor ?? "var(--accent-gold)";
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className="tl-item flex flex-col items-center relative cursor-pointer group w-[64px] md:w-20 h-16 md:h-[72px] bg-transparent border-0 p-0"
              >
                {/* Year label — alternating top/bottom */}
                <span
                  className={cn(
                    "absolute text-[9px] md:text-[10px] font-bold tracking-wide transition-colors duration-150 whitespace-nowrap",
                    i % 2 === 0 ? "bottom-1.5 md:bottom-2.5" : "top-1.5 md:top-2.5"
                  )}
                  style={{
                    fontFamily: "Georgia, serif",
                    color: isActive ? "var(--gold-on-light, #a07828)" : "var(--content-subtle)",
                  }}
                >
                  {item.yearLabel}
                </span>

                {/* Dot */}
                <div
                  className="tl-dot absolute rounded-full transition-all duration-200"
                  style={{
                    top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: isActive ? 14 : 10,
                    height: isActive ? 14 : 10,
                    background: isActive ? dotColor : "var(--card-light-bg)",
                    border: `2px solid ${isActive ? dotColor : "var(--card-light-border)"}`,
                    boxShadow: isActive ? `0 0 0 4px ${dotColor}22` : "none",
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Next arrow */}
      <button
        onClick={handleNext}
        disabled={activeIdx === items.length - 1}
        className={btnBase}
        style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)", color: "var(--content-heading)" }}
      >
        <CaretRightIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
