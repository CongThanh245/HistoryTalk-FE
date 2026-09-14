"use client";

import Image from "next/image";
import { MapPin, ChevronRight } from "lucide-react";
import { Card } from "@/components/commons/card";
import { isValidUrl } from "@/lib/utils/url";
import type { HistoricalEvent } from "@/services/event.service";

const EVENT_CARD_IMAGE = "/war.jpg";

// ─────────────────────────────────────────────────────────
// Variant 1: Timeline vertical (trang events cũ — 2 cột trái/phải)
// ─────────────────────────────────────────────────────────

interface TimelineCardProps {
  event: HistoricalEvent;
  index: number;
  onClick: (event: HistoricalEvent) => void;
}

export function TimelineCard({ event, index, onClick }: TimelineCardProps) {
  const isLeft = index % 2 === 0;
  const yearLabel =
    event.yearLabel ??
    `${Math.abs(event.year)} ${event.year < 0 ? "TCN" : "SCN"}`;

  return (
    <div
      className={`relative flex items-center ${isLeft ? "flex-row" : "flex-row-reverse"}`}
    >
      <Card
        className="w-[calc(50%-28px)]"
        imageSrc={event.imageUrl ?? EVENT_CARD_IMAGE}
        imageAlt={event.title}
        imageHeight={300}
        imageSizes="(max-width: 768px) 100vw, 400px"
        accentColor="var(--accent-gold)"
        onClick={() => onClick(event)}
      >
        <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full tracking-wide mb-2 bg-accent-gold/10 text-accent-gold">
          {yearLabel}
        </span>
        <h3 className="text-sm font-semibold mb-1.5 leading-snug text-content-heading">
          {event.title}
        </h3>
        <p className="text-xs leading-relaxed line-clamp-2 mb-3 text-content-muted">
          {event.summary}
        </p>
        <div className="flex items-center justify-between">
          {event.location ? (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0 text-content-subtle" />
              <span className="text-[11px] text-content-subtle">
                {event.location}
              </span>
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-0.5 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity text-accent-gold">
            Xem chi tiết <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </Card>

      {/* Center dot */}
      <div className="w-14 flex justify-center shrink-0 z-10">
        <div className="w-3.5 h-3.5 rounded-full border-2 bg-accent-gold border-[var(--bg-content)] shadow-[0_0_0_3px_rgba(201,162,77,0.10),0_0_10px_rgba(201,162,77,0.38)]" />
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
  direction: 1 | -1; // 1 = slide từ phải vào, -1 = slide từ trái vào
  onOpenDetail: (event: HistoricalEvent) => void;
}

export function TimelineStripCard({
  event,
  direction,
  onOpenDetail,
}: StripCardProps) {
  const yearLabel =
    event.yearLabel ??
    `${Math.abs(event.year)} ${event.year < 0 ? "TCN" : "SCN"}`;
  
  const animClass =
    direction === 1 ? "strip-card-enter-right" : "strip-card-enter-left";

  const imageSrc = event.imageUrl ?? EVENT_CARD_IMAGE;

  return (
    <div className={`${animClass} will-change-[opacity,transform]`}>
      <button
        onClick={() => onOpenDetail(event)}
        aria-label={`Xem chi tiết sự kiện ${event.title}`}
        className="group relative w-full flex flex-col md:flex-row text-left rounded-lg border overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)] bg-card-light-bg border-card-light-border"
      >
        {/* Glow border on hover */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20 shadow-[inset_0_0_0_1.5px_rgba(201,162,77,0.31)]" />

        {/* Image Container */}
        <div className="relative w-full md:w-[520px] lg:w-[560px] h-[150px] sm:h-[220px] md:h-[270px] overflow-hidden shrink-0">
          <Image
            src={isValidUrl(imageSrc) ? imageSrc : "/card.jpg"}
            alt={event.title}
            fill
            className="object-cover transition-all duration-1000 ease-out group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 560px"
          />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/24 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-[var(--card-light-bg)]/45" />
        </div>

        {/* Content Container */}
        <div className="flex-1 px-4 py-4 md:px-6 md:py-5 flex flex-col justify-center relative z-10">
          {/* Year badge with glow effect */}
          <div>
            <span className="inline-block text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wide mb-2 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_10px_var(--accent-gold-glow)] group-focus-visible:scale-105 group-focus-visible:shadow-[0_0_10px_var(--accent-gold-glow)] bg-accent-gold/10 text-accent-gold">
              {yearLabel}
            </span>
          </div>

          <h2
            className="text-base sm:text-xl font-extrabold leading-snug mb-1.5 transition-colors duration-300 text-[var(--content-heading)] group-hover:text-[var(--accent-gold)] group-focus-visible:text-[var(--accent-gold)]"
          >
            {event.title}
          </h2>
          
          <p className="text-xs sm:text-sm leading-relaxed line-clamp-2 mb-3 italic text-content-muted">
            {event.summary}
          </p>

          <div className="flex items-center justify-between mt-auto pt-1 sm:pt-2">
            {event.location ? (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-content-muted" />
                <span className="text-[11px] sm:text-xs line-clamp-1 text-content-muted">
                  {event.location}
                </span>
              </div>
            ) : (
              <div />
            )}
            
            <div className="flex items-center gap-1 text-xs font-bold transition-all duration-300 translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 text-accent-gold">
              Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Chronological Progress Line at the bottom */}
        <div className="absolute bottom-0 left-0 h-0.5 transition-all duration-700 ease-out w-0 group-hover:w-full z-20 bg-accent-gold" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Skeletons
// ─────────────────────────────────────────────────────────

export function TimelineCardSkeleton({ index }: { index: number }) {
  const isLeft = index % 2 === 0;
  return (
    <div
      className={`relative flex items-center ${isLeft ? "flex-row" : "flex-row-reverse"}`}
    >
      <div className="w-[calc(50%-28px)] rounded-xl border overflow-hidden animate-pulse bg-card-light-bg border-card-light-border">
        <div className="w-full h-32 bg-card-light-border" />
        <div className="px-4 pb-4 pt-3 space-y-2">
          <div className="h-4 w-20 rounded-full bg-card-light-border" />
          <div className="h-4 w-3/4 rounded bg-card-light-border" />
          <div className="h-3 w-full rounded bg-card-light-border" />
          <div className="h-3 w-5/6 rounded bg-card-light-border" />
        </div>
      </div>
      <div className="w-14 flex justify-center shrink-0">
        <div className="w-3.5 h-3.5 rounded-full bg-card-light-border" />
      </div>
      <div className="w-[calc(50%-28px)]" />
    </div>
  );
}

export function TimelineStripCardSkeleton() {
  return (
    <div className="w-full rounded-lg border overflow-hidden animate-pulse flex bg-card-light-bg border-card-light-border min-h-[180px]">
      <div className="w-72 shrink-0 bg-card-light-border" />
      <div className="flex-1 p-5 space-y-3">
        <div className="h-4 w-20 rounded-full bg-card-light-border" />
        <div className="h-6 w-2/3 rounded bg-card-light-border" />
        <div className="h-4 w-full rounded bg-card-light-border" />
        <div className="h-4 w-5/6 rounded bg-card-light-border" />
      </div>
    </div>
  );
}
