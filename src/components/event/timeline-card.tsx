"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MapPin, ChevronRight } from "lucide-react";
import { Card } from "@/components/commons/card";
import { isValidUrl } from "@/lib/utils/url";
import type { HistoricalEvent } from "@/services/event.service";
import { ERA_CONFIG, getEraFromYear, mapEraLabel } from "@/constants/eras";

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
        <div className="w-3.5 h-3.5 rounded-full border-2 bg-accent-gold border-[var(--bg-surface)]" />
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
  /** Year of the previously shown event: the year counts from it to this event's year. */
  fromYear?: number;
}

const YEAR_COUNT_DURATION = 700;

/** Counts from `from` to `to` once (ease-out); jumps straight to `to` when motion is reduced. */
function useYearCount(to: number | null, from?: number) {
  const animate = to !== null && from !== undefined && from !== to;
  const [value, setValue] = useState(from ?? to);

  useEffect(() => {
    if (!animate) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = reduce ? 1 : Math.min((now - startedAt) / YEAR_COUNT_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, from, to]);

  return animate ? value : to;
}

export function TimelineStripCard({
  event,
  direction,
  onOpenDetail,
  fromYear,
}: StripCardProps) {
  const era = event.year < 0 ? "TCN" : "SCN";
  const yearNumber = event.yearLabel
    ? event.yearLabel.replace(/\s*(SCN|TCN)$/i, "")
    : String(Math.abs(event.year));
  // Only plain years count; labels such as ranges are shown as written.
  const countable = /^\d+$/.test(yearNumber);
  const countedYear = useYearCount(
    countable ? Number(yearNumber) : null,
    countable && fromYear !== undefined ? Math.abs(fromYear) : undefined,
  );

  const eraLabel = mapEraLabel(event.era) || ERA_CONFIG[getEraFromYear(event.year)].label;

  const animClass =
    direction === 1 ? "strip-card-enter-right" : "strip-card-enter-left";

  const imageSrc = event.imageUrl ?? EVENT_CARD_IMAGE;

  return (
    <div className={`${animClass} will-change-[opacity,transform]`}>
      <button
        onClick={() => onOpenDetail(event)}
        aria-label={`Xem chi tiết sự kiện ${event.title}`}
        className="group relative w-full flex flex-col md:flex-row text-left rounded-[2px] border overflow-hidden cursor-pointer transition-colors duration-300 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)]"
      >
        {/* Image */}
        <div className="relative w-full md:w-[460px] lg:w-[500px] h-[170px] sm:h-[230px] md:h-auto md:min-h-[280px] overflow-hidden shrink-0 border-b md:border-b-0 md:border-r border-[var(--text-primary)] bg-[var(--bg-deep)]">
          <Image
            src={isValidUrl(imageSrc) ? imageSrc : "/card.jpg"}
            alt={event.title}
            fill
            className="live-develop object-cover"
            sizes="(max-width: 768px) 100vw, 500px"
          />
          <span className="absolute left-0 top-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] bg-[var(--text-primary)] text-accent-brass-on-ink">
            Hồ sơ sự kiện
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col px-4 py-4 md:px-7 md:py-6">
          <div className="flex items-end justify-between gap-4 pb-3 border-b border-[var(--border-strong)]">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[44px] md:text-[56px] font-extrabold leading-[0.9] tabular-nums text-accent-gold" aria-label={yearNumber}>
                {countable ? countedYear : yearNumber}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-content-muted">
                {era}
              </span>
            </div>
            {/* 史 — "sử", history: a stamp on the paper, not on the painting */}
            <span className="archive-seal live-stamp hidden sm:inline-grid w-[46px] h-[46px] text-[20px] mb-1" aria-hidden="true">史</span>
          </div>

          <h2 className="archive-title is-plain live-ink mt-3 text-[22px] sm:text-[28px] text-[var(--text-primary)]">
            {event.title}
          </h2>

          <p className="mt-2 text-sm leading-relaxed line-clamp-3 text-content-text">
            {event.summary}
          </p>

          {/* Dossier fields fill the column and give the facts a fixed place. */}
          <dl className="mt-auto pt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-[11px] uppercase tracking-[0.08em]">
            <dt className="font-semibold text-accent-brass">Thời kỳ</dt>
            <dd className="font-bold text-content-text">{eraLabel}</dd>
            {event.location && (
              <>
                <dt className="font-semibold text-accent-brass">Địa điểm</dt>
                <dd className="flex items-center gap-1.5 min-w-0 font-bold text-content-text">
                  <MapPin className="w-3 h-3 shrink-0 text-accent-gold" />
                  <span className="line-clamp-1">{event.location}</span>
                </dd>
              </>
            )}
          </dl>

          <div className="flex justify-end mt-3 pt-3 border-t border-[var(--border-default)]">
            <span className="archive-link shrink-0">
              Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

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
    <div className="w-full rounded-[2px] border overflow-hidden animate-pulse flex bg-[var(--bg-surface)] border-[var(--text-primary)] min-h-[220px]">
      <div className="w-72 shrink-0 bg-card-light-border" />
      <div className="flex-1 p-6 space-y-3">
        <div className="h-12 w-28 bg-card-light-border" />
        <div className="h-7 w-2/3 bg-card-light-border" />
        <div className="h-4 w-full bg-card-light-border" />
        <div className="h-4 w-5/6 bg-card-light-border" />
      </div>
    </div>
  );
}
