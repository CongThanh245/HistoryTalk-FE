"use client";

import Image from "next/image";
import { MapPin, ChevronRight } from "lucide-react";
import type { HistoricalEvent, EventCategory } from "@/services/event.service";

export const CATEGORY_CONFIG: Record<
  EventCategory,
  { label: string; color: string; bg: string; image: string }
> = {
  war: {
    label: "Chiến tranh",
    color: "var(--accent-danger)",
    bg: "rgba(184,50,42,0.10)",
    image: "/war.jpg",
  },
  politics: {
    label: "Chính trị",
    color: "var(--accent-gold)",
    bg: "rgba(201,162,77,0.10)",
    image: "/war.jpg",
  },
  culture: {
    label: "Văn hoá",
    color: "var(--accent-blue)",
    bg: "rgba(143,179,200,0.10)",
    image: "/war.jpg",
  },
  science: {
    label: "Khoa học",
    color: "var(--accent-teal)",
    bg: "rgba(47,111,115,0.12)",
    image: "/war.jpg",
  },
  religion: {
    label: "Tôn giáo",
    color: "var(--accent-bronze)",
    bg: "rgba(196,106,47,0.10)",
    image: "/war.jpg",
  },
  other: {
    label: "Khác",
    color: "var(--content-muted)",
    bg: "rgba(122,116,105,0.10)",
    image: "/war.jpg",
  },
  // TODO: thay từng ảnh riêng khi có đủ assets
  // war: { ..., image: "/images/events/war.jpg" }
  // politics: { ..., image: "/images/events/politics.jpg" }
};

interface TimelineCardProps {
  event: HistoricalEvent;
  index: number;
  onClick: (event: HistoricalEvent) => void;
}

export function TimelineCard({ event, index, onClick }: TimelineCardProps) {
  const cat = CATEGORY_CONFIG[event.category];
  const isLeft = index % 2 === 0;
  const yearLabel =
    event.yearLabel ??
    `${Math.abs(event.year)} ${event.year < 0 ? "TCN" : "SCN"}`;

  // Ưu tiên ảnh từ API nếu có, fallback về ảnh theo category
  const imageSrc = event.imageUrl ?? cat.image;

  return (
    <div
      className={`relative flex items-center ${isLeft ? "flex-row" : "flex-row-reverse"}`}
    >
      {/* Card */}
      <div
        className="w-[calc(50%-28px)] group cursor-pointer rounded-xl border overflow-hidden transition-all duration-200
          hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 relative"
        style={{
          background: "var(--card-light-bg)",
          borderColor: "var(--card-light-border)",
        }}
        onClick={() => onClick(event)}
      >
        {/* Hover border glow */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10"
          style={{ boxShadow: `inset 0 0 0 1px ${cat.color}40` }}
        />

        {/* Ảnh minh họa */}
        <div className="relative w-full h-32 overflow-hidden">
          <Image
            src={imageSrc}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          {/* Gradient overlay phía dưới ảnh */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, transparent 40%, var(--card-light-bg) 100%)",
            }}
          />
          {/* Category badge nổi trên ảnh */}
          <div className="absolute top-2.5 right-2.5">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm"
              style={{
                background: `${cat.color}cc`,
                color: "#fff",
              }}
            >
              {cat.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-4 pt-1">
          {/* Year badge */}
          <span
            className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full tracking-wide mb-2"
            style={{ background: cat.bg, color: cat.color }}
          >
            {yearLabel}
          </span>

          <h3
            className="text-sm font-semibold mb-1.5 leading-snug"
            style={{ color: "var(--content-heading)" }}
          >
            {event.title}
          </h3>

          <p
            className="text-xs leading-relaxed line-clamp-2 mb-3"
            style={{ color: "var(--content-muted)" }}
          >
            {event.summary}
          </p>

          <div className="flex items-center justify-between">
            {event.location ? (
              <div className="flex items-center gap-1">
                <MapPin
                  className="w-3 h-3 shrink-0"
                  style={{ color: "var(--content-subtle)" }}
                />
                <span
                  className="text-[11px]"
                  style={{ color: "var(--content-subtle)" }}
                >
                  {event.location}
                </span>
              </div>
            ) : (
              <div />
            )}
            <div
              className="flex items-center gap-0.5 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: cat.color }}
            >
              Xem chi tiết <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

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

      {/* Spacer */}
      <div className="w-[calc(50%-28px)]" />
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────
export function TimelineCardSkeleton({ index }: { index: number }) {
  const isLeft = index % 2 === 0;
  return (
    <div
      className={`relative flex items-center ${isLeft ? "flex-row" : "flex-row-reverse"}`}
    >
      <div
        className="w-[calc(50%-28px)] rounded-xl border overflow-hidden animate-pulse"
        style={{
          background: "var(--card-light-bg)",
          borderColor: "var(--card-light-border)",
        }}
      >
        {/* Image placeholder */}
        <div
          className="w-full h-32"
          style={{ background: "var(--card-light-border)" }}
        />
        <div className="px-4 pb-4 pt-3 space-y-2">
          <div
            className="h-4 w-20 rounded-full"
            style={{ background: "var(--card-light-border)" }}
          />
          <div
            className="h-4 w-3/4 rounded"
            style={{ background: "var(--card-light-border)" }}
          />
          <div
            className="h-3 w-full rounded"
            style={{ background: "var(--card-light-border)" }}
          />
          <div
            className="h-3 w-5/6 rounded"
            style={{ background: "var(--card-light-border)" }}
          />
        </div>
      </div>
      <div className="w-14 flex justify-center shrink-0">
        <div
          className="w-3.5 h-3.5 rounded-full"
          style={{ background: "var(--card-light-border)" }}
        />
      </div>
      <div className="w-[calc(50%-28px)]" />
    </div>
  );
}
