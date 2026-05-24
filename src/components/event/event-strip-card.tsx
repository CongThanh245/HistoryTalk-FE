"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { MapPinIcon, CaretRightIcon } from "@phosphor-icons/react";
import { Card } from "@/components/commons/card";
import type { HistoricalEvent } from "@/services/event.service";

const EVENT_CARD_STYLE = {
  color: "var(--accent-gold)",
  bg: "rgba(201,162,77,0.10)",
  image: "/war.jpg",
};

interface EventStripCardProps {
  event: HistoricalEvent;
  direction: 1 | -1;
  onOpenDetail: (event: HistoricalEvent) => void;
}

export function EventStripCard({
  event,
  direction,
  onOpenDetail,
}: EventStripCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const style = EVENT_CARD_STYLE;
  const yearLabel =
    event.yearLabel ??
    `${Math.abs(event.year)} ${event.year < 0 ? "TCN" : "SCN"}`;

  useEffect(() => {
    if (!wrapRef.current) return;
    gsap.fromTo(
      wrapRef.current,
      { x: direction * 52, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.38, ease: "power2.out" },
    );
  }, [event.id, direction]);

  return (
    <div ref={wrapRef}>
      <Card
        imageSrc={event.imageUrl ?? style.image}
        imageAlt={event.title}
        imageHeight={300}
        imageSizes="(max-width: 768px) 100vw, 900px"
        accentColor={style.color}
        onClick={() => onOpenDetail(event)}
        layout="horizontal"
      >
        {/* Year badge */}
        <span
          className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full tracking-wide mb-2"
          style={{ background: style.bg, color: style.color }}
        >
          {yearLabel}
        </span>

        {/* Title */}
        <h2
          className="text-xl sm:text-2xl font-bold leading-snug mb-2"
          style={{
            color: "var(--content-heading)",
          }}
        >
          {event.title}
        </h2>

        {/* Summary */}
        <p
          className="text-sm leading-relaxed line-clamp-3 mb-4 italic"
          style={{ color: "var(--content-muted)" }}
        >
          {event.summary}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          {event.location ? (
            <div className="flex items-center gap-1">
              <MapPinIcon
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
            className="flex items-center gap-1 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: style.color }}
          >
            Xem chi tiết <CaretRightIcon className="w-3 h-3" />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────

export function EventStripCardSkeleton() {
  return (
    <div
      className="w-full rounded-xl border overflow-hidden animate-pulse flex"
      style={{
        background: "var(--card-light-bg)",
        borderColor: "var(--card-light-border)",
        minHeight: 220,
      }}
    >
      <div
        className="w-72 shrink-0"
        style={{ background: "var(--card-light-border)" }}
      />
      <div className="flex-1 p-6 space-y-3">
        <div
          className="h-4 w-20 rounded-full"
          style={{ background: "var(--card-light-border)" }}
        />
        <div
          className="h-6 w-2/3 rounded"
          style={{ background: "var(--card-light-border)" }}
        />
        <div
          className="h-4 w-full rounded"
          style={{ background: "var(--card-light-border)" }}
        />
        <div
          className="h-4 w-5/6 rounded"
          style={{ background: "var(--card-light-border)" }}
        />
        <div
          className="h-4 w-4/5 rounded"
          style={{ background: "var(--card-light-border)" }}
        />
      </div>
    </div>
  );
}
