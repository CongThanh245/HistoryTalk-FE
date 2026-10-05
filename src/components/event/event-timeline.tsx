"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import type { HistoricalEvent, EventEra } from "@/services/event.service";
import { TimelineStripCard, TimelineStripCardSkeleton } from "./timeline-card";
import { useTimelineEvents } from "@/features/events/hooks";
import { useTimelineNavigation } from "@/features/events/use-timeline";
import { isValidUrl } from "@/lib/utils/url";
import { cn } from "@/lib/utils/cn";
import { EraFilter } from "@/components/commons/era-filter";
import type { EventView } from "@/lib/catalog-url-state";

interface EventTimelineProps {
  era: EventEra;
  view: EventView;
  onViewChange: (view: EventView) => void;
  onEraChange: (era: EventEra) => void;
  onSelectEvent: (event: HistoricalEvent) => void;
}

const EVENT_CARD_IMAGE = "/card.jpg";
const TIMELINE_SCROLL_DURATION = 900;

export function EventTimeline({
  era,
  view,
  onViewChange,
  onEraChange,
  onSelectEvent,
}: EventTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const timelineTrackRef = useRef<HTMLDivElement>(null);
  const activeMarkerRef = useRef<HTMLButtonElement>(null);
  const scrollAnimationRef = useRef<number>(0);
  const { events, showSkeleton } = useTimelineEvents(era);
  const { resolvedActiveId, direction, handleSelect, handleWheel, reset } =
    useTimelineNavigation(events);

  const activeEvent = events.find((e) => e.id === resolvedActiveId) ?? null;
  // Year of the card that was on screen before this one, so the new card counts from it
  // (state adjusted during render when the active event changes).
  const [yearTrail, setYearTrail] = useState<{ id?: string; year?: number; previous?: number }>({});
  if (activeEvent && yearTrail.id !== activeEvent.id) {
    setYearTrail({ id: activeEvent.id, year: activeEvent.year, previous: yearTrail.year });
  }
  const previousYear = yearTrail.previous;
  const activeIdx = events.findIndex((e) => e.id === resolvedActiveId);
  const animationSeed = `${view}-${era}-${resolvedActiveId}-${events.length}`;

  const staggeredEvents = useMemo(
    () =>
      events.map((event, index) => ({
        event,
        delaySlot: (index * 7) % 10,
      })),
    [events],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || view !== "time") return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel, view]);

  useEffect(() => {
    reset();
  }, [era, reset]);

  useEffect(() => {
    if (view !== "time") return;
    const timeline = timelineScrollRef.current;
    const track = timelineTrackRef.current;
    const activeMarker = activeMarkerRef.current;
    if (!timeline || !track || !activeMarker) return;

    const target =
      track.offsetLeft +
      activeMarker.offsetLeft +
      activeMarker.offsetWidth / 2 -
      timeline.clientWidth / 2;
    const maxScroll = timeline.scrollWidth - timeline.clientWidth;
    const clampedTarget = Math.max(0, Math.min(target, maxScroll));
    const start = timeline.scrollLeft;
    const distance = clampedTarget - start;
    const startedAt = performance.now();

    cancelAnimationFrame(scrollAnimationRef.current);

    const animate = (now: number) => {
      const elapsed = now - startedAt;
      const progress = Math.min(elapsed / TIMELINE_SCROLL_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      timeline.scrollLeft = start + distance * eased;

      if (progress < 1) {
        scrollAnimationRef.current = requestAnimationFrame(animate);
      }
    };

    scrollAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(scrollAnimationRef.current);
    };
  }, [resolvedActiveId, view]);

  const tabs: { value: EventView; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "time", label: "Theo thời gian" },
  ];

  return (
    <div ref={containerRef} className="space-y-3 overflow-hidden">
      <div className="border-b border-[var(--text-primary)]">
        <div className="flex w-fit items-end gap-8 md:gap-10">
          {tabs.map((tab) => {
            const active = view === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onViewChange(tab.value)}
                className={cn(
                  "relative h-10 px-0.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main",
                  active
                    ? "text-content-heading"
                    : "text-content-muted hover:text-content-heading",
                )}
                aria-pressed={active}
              >
                {tab.label}
                <span
                  className={cn(
                    "absolute -bottom-px left-0 h-[3px] bg-accent-gold transition-all duration-200",
                    active ? "w-full opacity-100" : "w-0 opacity-0",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      <EraFilter active={era} onChange={onEraChange} />

      {showSkeleton ? (
        <EventGridSkeleton />
      ) : events.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-content-muted">
            Không có sự kiện nào trong thời đại này.
          </p>
        </div>
      ) : view === "all" ? (
        <div
          key={animationSeed}
          className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {staggeredEvents.map(({ event, delaySlot }) => (
            <EventPosterCard
              key={event.id}
              event={event}
              delaySlot={delaySlot}
              onSelect={onSelectEvent}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div
            ref={timelineScrollRef}
            className="timeline-scroll-hidden -mx-2 overflow-x-auto px-[45vw] pt-1"
          >
            <div ref={timelineTrackRef} className="relative flex min-w-max items-start">
              <div className="absolute left-0 right-0 top-[29px] h-px bg-card-light-border" />
              {events.map((event) => {
                const isActive = event.id === resolvedActiveId;
                return (
                  <button
                    key={event.id}
                    ref={isActive ? activeMarkerRef : null}
                    type="button"
                    onClick={() => handleSelect(event.id)}
                    aria-current={isActive ? "step" : undefined}
                    aria-label={`Chọn sự kiện ${event.title}`}
                    className="relative flex h-[58px] w-28 shrink-0 flex-col items-center bg-transparent p-0 text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main"
                  >
                    <span
                      className={cn(
                        "text-sm font-semibold leading-none transition-colors duration-150",
                        isActive
                          ? "text-content-heading"
                          : "text-content-muted hover:text-content-heading",
                      )}
                    >
                      {formatTimelineYear(event)}
                    </span>
                    <span className="mt-2 h-[15px] w-px bg-content-muted/70" />
                    <span
                      className={cn(
                        "mt-1.5 h-0 w-0 border-x-[6px] border-b-[7px] border-x-transparent transition-all duration-150",
                        isActive
                          ? "border-b-content-muted opacity-100"
                          : "border-b-transparent opacity-0",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden">
            {activeEvent ? (
              <TimelineStripCard
                key={resolvedActiveId}
                event={activeEvent}
                direction={direction}
                onOpenDetail={onSelectEvent}
                fromYear={previousYear}
              />
            ) : (
              <TimelineStripCardSkeleton />
            )}
          </div>

          <div className="sr-only">{activeIdx + 1} / {events.length}</div>
        </div>
      )}
    </div>
  );
}

function EventPosterCard({
  event,
  delaySlot,
  onSelect,
}: {
  event: HistoricalEvent;
  delaySlot: number;
  onSelect: (event: HistoricalEvent) => void;
}) {
  const imageSrc =
    event.imageUrl && isValidUrl(event.imageUrl)
      ? event.imageUrl
      : EVENT_CARD_IMAGE;

  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      className={cn(
        "event-card-rise group relative aspect-[1.05] min-h-[220px] overflow-hidden bg-card-light-border text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main",
        EVENT_CARD_DELAY_CLASSES[delaySlot],
      )}
    >
      <Image
        src={imageSrc}
        alt={event.title}
        fill
        className="live-develop-on-view object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <span className="absolute left-0 top-0 px-2.5 py-1 text-[11px] font-bold tracking-[0.12em] bg-[var(--accent-gold)] text-white">
        {formatTimelineYear(event)}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-4 text-white transition-transform duration-300 ease-out group-hover:-translate-y-1">
        <h3 className="line-clamp-2 font-display text-[22px] font-bold leading-[1.2] drop-shadow underline decoration-transparent decoration-2 underline-offset-4 transition-[text-decoration-color] duration-300 group-hover:decoration-white/80">
          {event.title}
        </h3>
        {event.location ? (
          <div className="mt-2 flex items-center gap-1.5 pt-2 border-t border-white/25 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/85">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        ) : null}
      </div>
    </button>
  );
}

const EVENT_CARD_DELAY_CLASSES = [
  "event-card-delay-0",
  "event-card-delay-1",
  "event-card-delay-2",
  "event-card-delay-3",
  "event-card-delay-4",
  "event-card-delay-5",
  "event-card-delay-6",
  "event-card-delay-7",
  "event-card-delay-8",
  "event-card-delay-9",
];

function EventGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="aspect-[1.05] min-h-[220px] animate-pulse bg-card-light-border"
        />
      ))}
    </div>
  );
}

function formatTimelineYear(event: HistoricalEvent) {
  if (event.yearLabel) return event.yearLabel.replace(/\s*SCN$/i, "");
  return event.year < 0 ? `${Math.abs(event.year)}TCN` : `${event.year}`;
}
