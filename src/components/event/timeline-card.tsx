"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { MapPinIcon, CaretRightIcon } from "@phosphor-icons/react";
import { Card } from "@/components/commons/card";
import { isValidUrl } from "@/lib/utils/url";
import type { HistoricalEvent } from "@/services/event.service";

const EVENT_CARD_STYLE = {
  color: "var(--accent-gold)",
  bg: "rgba(201,162,77,0.10)",
  image: "/war.jpg",
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
  const style = EVENT_CARD_STYLE;
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
        imageSrc={event.imageUrl ?? style.image}
        imageAlt={event.title}
        imageHeight={300}
        imageSizes="(max-width: 768px) 100vw, 400px"
        accentColor={style.color}
        onClick={() => onClick(event)}
      >
        <span
          className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full tracking-wide mb-2"
          style={{ background: style.bg, color: style.color }}
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
            className="flex items-center gap-0.5 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: style.color }}
          >
            Xem chi tiết <CaretRightIcon className="w-3 h-3" />
          </div>
        </div>
      </Card>

      {/* Center dot */}
      <div className="w-14 flex justify-center shrink-0 z-10">
        <div
          className="w-3.5 h-3.5 rounded-full border-2"
          style={{
            background: style.color,
            borderColor: "var(--bg-content)",
            boxShadow: `0 0 0 3px ${style.bg}, 0 0 10px ${style.color}60`,
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
  direction: 1 | -1; // 1 = slide từ phải vào, -1 = slide từ trái vào
  onOpenDetail: (event: HistoricalEvent) => void;
}

export function TimelineStripCard({
  event,
  direction,
  onOpenDetail,
}: StripCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const style = EVENT_CARD_STYLE;
  const yearLabel =
    event.yearLabel ??
    `${Math.abs(event.year)} ${event.year < 0 ? "TCN" : "SCN"}`;
  
  const animClass =
    direction === 1 ? "strip-card-enter-right" : "strip-card-enter-left";

  const imageSrc = event.imageUrl ?? style.image;

  return (
    <div 
      className={animClass} 
      style={{ willChange: "opacity, transform" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={() => onOpenDetail(event)}
        className="group relative w-full flex flex-col md:flex-row text-left rounded-xl border overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1"
        style={{
          background: "var(--card-light-bg)",
          borderColor: "var(--card-light-border)",
        }}
      >
        {/* Glow border on hover */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20"
          style={{ boxShadow: `inset 0 0 0 1.5px ${style.color}50` }}
        />

        {/* Image Container */}
        <div
          className="relative w-full md:w-[480px] h-[260px] md:h-[320px] overflow-hidden shrink-0"
        >
          <Image
            src={isValidUrl(imageSrc) ? imageSrc : "/card.jpg"}
            alt={event.title}
            fill
            className="object-cover transition-all duration-700 ease-out grayscale group-hover:grayscale-0 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 500px"
          />
          {/* Gradient transition from image to card bg */}
          <div
            className="absolute inset-0 z-10 bg-gradient-to-t from-[var(--card-light-bg)] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[var(--card-light-bg)]"
          />
        </div>

        {/* Content Container */}
        <div className="flex-1 px-5 py-6 md:px-7 md:py-8 flex flex-col justify-center relative z-10">
          {/* Year badge with glow effect */}
          <div>
            <span
              className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wide mb-3 transition-all duration-300"
              style={{
                background: style.bg,
                color: style.color,
                boxShadow: isHovered ? `0 0 10px ${style.color}60` : "none",
                transform: isHovered ? "scale(1.05)" : "scale(1)",
              }}
            >
              {yearLabel}
            </span>
          </div>

          <h2
            className="text-xl sm:text-2xl font-extrabold leading-snug mb-2.5 transition-colors duration-300"
            style={{ color: isHovered ? style.color : "var(--content-heading)" }}
          >
            {event.title}
          </h2>
          
          <p
            className="text-sm leading-relaxed line-clamp-3 mb-5 italic"
            style={{ color: "var(--content-muted)" }}
          >
            {event.summary}
          </p>

          <div className="flex items-center justify-between mt-auto pt-2">
            {event.location ? (
              <div className="flex items-center gap-1.5">
                <MapPinIcon
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: "var(--content-subtle)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: "var(--content-subtle)" }}
                >
                  {event.location}
                </span>
              </div>
            ) : (
              <div />
            )}
            
            <div
              className="flex items-center gap-1 text-xs font-bold transition-all duration-300 translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
              style={{ color: style.color }}
            >
              Xem chi tiết <CaretRightIcon className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Chronological Progress Line at the bottom */}
        <div
          className="absolute bottom-0 left-0 h-1 transition-all duration-700 ease-out w-0 group-hover:w-full z-20"
          style={{ background: style.color }}
        />
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
      <div
        className="w-[calc(50%-28px)] rounded-xl border overflow-hidden animate-pulse"
        style={{
          background: "var(--card-light-bg)",
          borderColor: "var(--card-light-border)",
        }}
      >
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

export function TimelineStripCardSkeleton() {
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
        className="w-80 shrink-0"
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
      </div>
    </div>
  );
}
