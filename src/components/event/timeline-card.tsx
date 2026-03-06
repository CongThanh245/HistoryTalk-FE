"use client";

import { useRef } from "react";
import { MapPin, ChevronRight } from "lucide-react";
import { Card } from "@/components/commons/card";
import type { HistoricalEvent, EventCategory } from "@/services/event.service";

export const CATEGORY_CONFIG: Record<EventCategory, { label: string; color: string; bg: string; image: string }> = {
  war:      { label: "Chiến tranh", color: "var(--accent-danger)",  bg: "rgba(184,50,42,0.10)",   image: "/war.jpg" },
  politics: { label: "Chính trị",   color: "var(--accent-gold)",    bg: "rgba(201,162,77,0.10)",  image: "/war.jpg" },
  culture:  { label: "Văn hoá",     color: "var(--accent-blue)",    bg: "rgba(143,179,200,0.10)", image: "/war.jpg" },
  science:  { label: "Khoa học",    color: "var(--accent-teal)",    bg: "rgba(47,111,115,0.12)",  image: "/war.jpg" },
  religion: { label: "Tôn giáo",    color: "var(--accent-bronze)",  bg: "rgba(196,106,47,0.10)",  image: "/war.jpg" },
  other:    { label: "Khác",        color: "var(--content-muted)",  bg: "rgba(122,116,105,0.10)", image: "/war.jpg" },
  // TODO: thay ảnh riêng từng category khi có assets
};

// ─────────────────────────────────────────────────────────
// Variant 1: Timeline vertical (trang events cũ — 2 cột trái/phải)
// ─────────────────────────────────────────────────────────

interface TimelineCardProps {
  event: HistoricalEvent;
  index: number;
  onClick: (event: HistoricalEvent) => void;
}

export function TimelineCard({ event, index, onClick }: TimelineCardProps) {
  const cat = CATEGORY_CONFIG[event.category];
  const isLeft = index % 2 === 0;
  const yearLabel = event.yearLabel ?? `${Math.abs(event.year)} ${event.year < 0 ? "TCN" : "SCN"}`;

  return (
    <div className={`relative flex items-center ${isLeft ? "flex-row" : "flex-row-reverse"}`}>
      <Card
        className="w-[calc(50%-28px)]"
        imageSrc={event.imageUrl ?? cat.image}
        imageAlt={event.title}
        imageHeight={300}
        imageSizes="(max-width: 768px) 100vw, 400px"
        badge={{ label: cat.label, color: "#fff", bg: `${cat.color}cc` }}
        accentColor={cat.color}
        onClick={() => onClick(event)}
      >
        <span
          className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full tracking-wide mb-2"
          style={{ background: cat.bg, color: cat.color }}
        >
          {yearLabel}
        </span>
        <h3 className="text-sm font-semibold mb-1.5 leading-snug" style={{ color: "var(--content-heading)" }}>
          {event.title}
        </h3>
        <p className="text-xs leading-relaxed line-clamp-2 mb-3" style={{ color: "var(--content-muted)" }}>
          {event.summary}
        </p>
        <div className="flex items-center justify-between">
          {event.location ? (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" style={{ color: "var(--content-subtle)" }} />
              <span className="text-[11px]" style={{ color: "var(--content-subtle)" }}>{event.location}</span>
            </div>
          ) : <div />}
          <div
            className="flex items-center gap-0.5 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: cat.color }}
          >
            Xem chi tiết <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </Card>

      {/* Center dot */}
      <div className="w-14 flex justify-center shrink-0 z-10">
        <div
          className="w-3.5 h-3.5 rounded-full border-2"
          style={{
            background: cat.color,
            borderColor: "var(--bg-content)",
            boxShadow: `0 0 0 3px ${cat.bg}, 0 0 10px ${cat.color}60`,
          }}
        />
      </div>
      <div className="w-[calc(50%-28px)]" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Variant 2: Strip card — nằm ngang, dùng trong timeline băng chuyền
// ─────────────────────────────────────────────────────────

interface StripCardProps {
  event: HistoricalEvent;
  direction: 1 | -1;   // 1 = slide từ phải vào, -1 = slide từ trái vào
  onOpenDetail: (event: HistoricalEvent) => void;
}

export function TimelineStripCard({ event, direction, onOpenDetail }: StripCardProps) {
  const cat       = CATEGORY_CONFIG[event.category];
  const yearLabel = event.yearLabel ?? `${Math.abs(event.year)} ${event.year < 0 ? "TCN" : "SCN"}`;
  // CSS animation thay GSAP translateX — không tràn ra ngoài viewport gây scrollbar ngang
  const animClass = direction === 1 ? "strip-card-enter-right" : "strip-card-enter-left";

  return (
    <div className={animClass} style={{ willChange: "opacity, transform" }}>
      <Card
        imageSrc={event.imageUrl ?? cat.image}
        imageAlt={event.title}
        imageHeight={260}
        imageWidth={320}
        imageSizes="(max-width: 768px) 100vw, 900px"
        badge={{ label: cat.label, color: "#fff", bg: `${cat.color}cc` }}
        accentColor={cat.color}
        onClick={() => onOpenDetail(event)}
        layout="horizontal"
      >
        <span
          className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full tracking-wide mb-2"
          style={{ background: cat.bg, color: cat.color }}
        >
          {yearLabel}
        </span>
        <h2
          className="text-xl sm:text-2xl font-bold leading-snug mb-2"
          style={{ color: "var(--content-heading)"}}
        >
          {event.title}
        </h2>
        <p
          className="text-sm leading-relaxed line-clamp-3 mb-4 italic"
          style={{ color: "var(--content-muted)" }}
        >
          {event.summary}
        </p>
        <div className="flex items-center justify-between mt-auto">
          {event.location ? (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" style={{ color: "var(--content-subtle)" }} />
              <span className="text-[11px]" style={{ color: "var(--content-subtle)" }}>{event.location}</span>
            </div>
          ) : <div />}
          <div
            className="flex items-center gap-1 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: cat.color }}
          >
            Xem chi tiết <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Skeletons
// ─────────────────────────────────────────────────────────

export function TimelineCardSkeleton({ index }: { index: number }) {
  const isLeft = index % 2 === 0;
  return (
    <div className={`relative flex items-center ${isLeft ? "flex-row" : "flex-row-reverse"}`}>
      <div
        className="w-[calc(50%-28px)] rounded-xl border overflow-hidden animate-pulse"
        style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
      >
        <div className="w-full h-32" style={{ background: "var(--card-light-border)" }} />
        <div className="px-4 pb-4 pt-3 space-y-2">
          <div className="h-4 w-20 rounded-full" style={{ background: "var(--card-light-border)" }} />
          <div className="h-4 w-3/4 rounded"    style={{ background: "var(--card-light-border)" }} />
          <div className="h-3 w-full rounded"   style={{ background: "var(--card-light-border)" }} />
          <div className="h-3 w-5/6 rounded"    style={{ background: "var(--card-light-border)" }} />
        </div>
      </div>
      <div className="w-14 flex justify-center shrink-0">
        <div className="w-3.5 h-3.5 rounded-full" style={{ background: "var(--card-light-border)" }} />
      </div>
      <div className="w-[calc(50%-28px)]" />
    </div>
  );
}

export function TimelineStripCardSkeleton() {
  return (
    <div
      className="w-full rounded-xl border overflow-hidden animate-pulse flex"
      style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)", minHeight: 220 }}
    >
      <div className="w-80 shrink-0" style={{ background: "var(--card-light-border)" }} />
      <div className="flex-1 p-6 space-y-3">
        <div className="h-4 w-20 rounded-full" style={{ background: "var(--card-light-border)" }} />
        <div className="h-6 w-2/3 rounded"    style={{ background: "var(--card-light-border)" }} />
        <div className="h-4 w-full rounded"   style={{ background: "var(--card-light-border)" }} />
        <div className="h-4 w-5/6 rounded"    style={{ background: "var(--card-light-border)" }} />
      </div>
    </div>
  );
}