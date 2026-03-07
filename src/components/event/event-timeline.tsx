  "use client";

  import { useEffect, useRef } from "react";
  import type { HistoricalEvent, EventEra } from "@/services/event.service";
  import { EraFilter } from "../commons/era-filter";
  import { TimelineStrip, type TimelineItem } from "../commons/timeline-strip";
  import { TimelineStripCard, TimelineStripCardSkeleton } from "./timeline-card";
  import { useTimelineEvents } from "@/features/events/hooks";
  import { useTimelineNavigation } from "@/features/events/use-timeline";

  interface EventTimelineProps {
    era: EventEra;
    onEraChange: (era: EventEra) => void;
    onSelectEvent: (event: HistoricalEvent) => void;
  }

  export function EventTimeline({
    era,
    onEraChange,
    onSelectEvent,
  }: EventTimelineProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { events, showSkeleton } = useTimelineEvents(era);
    const { resolvedActiveId, direction, handleSelect, handleWheel, reset } =
      useTimelineNavigation(events);

    const activeEvent = events.find((e) => e.id === resolvedActiveId) ?? null;
    const activeIdx = events.findIndex((e) => e.id === resolvedActiveId);

    // Wheel listener
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      el.addEventListener("wheel", handleWheel, { passive: false });
      return () => {
        el.removeEventListener("wheel", handleWheel);
      };
    }, [handleWheel]);

    // Reset khi đổi era
    useEffect(() => {
      reset();
    }, [era, reset]);

    const timelineItems: TimelineItem[] = events.map((ev) => ({
      id: ev.id,
      year: ev.year,
      yearLabel:
        ev.yearLabel ?? `${Math.abs(ev.year)} ${ev.year < 0 ? "TCN" : "SCN"}`,
      category: ev.category,
      categoryColor: getCatColor(ev.category),
    }));

    return (
      <div ref={containerRef} className="space-y-5 overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <EraFilter
            active={era}
            onChange={(e) => {
              onEraChange(e);
              reset();
            }}
            counts={undefined}
          />
          {!showSkeleton && (
            <span className="text-xs" style={{ color: "var(--content-subtle)" }}>
              {events.length} sự kiện
            </span>
          )}
        </div>

        {showSkeleton ? (
          <div
            className="h-[72px] rounded-lg animate-pulse"
            style={{
              background: "var(--card-light-bg)",
              border: "1px solid var(--card-light-border)",
            }}
          />
        ) : (
          <div
            className="rounded-xl px-2 py-1"
            style={{
              background: "var(--card-light-bg)",
              border: "1px solid var(--card-light-border)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <TimelineStrip
              items={timelineItems}
              activeId={resolvedActiveId}
              onSelect={handleSelect}
            />
          </div>
        )}

        {!showSkeleton && events.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {events.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => handleSelect(ev.id)}
                  className="transition-all duration-200 rounded-full cursor-pointer"
                  style={{
                    width: ev.id === resolvedActiveId ? 18 : 6,
                    height: 6,
                    background:
                      ev.id === resolvedActiveId
                        ? getCatColor(ev.category)
                        : "var(--card-light-border)",
                    border: "none",
                    padding: 0,
                  }}
                />
              ))}
            </div>
            <span
              className="text-[11px]"
              style={{ color: "var(--content-subtle)" }}
            >
              {activeIdx + 1} / {events.length}
            </span>
          </div>
        )}

        <div className="overflow-hidden">
          {showSkeleton ? (
            <TimelineStripCardSkeleton />
          ) : activeEvent ? (
            <TimelineStripCard
              key={resolvedActiveId}
              event={activeEvent}
              direction={direction}
              onOpenDetail={onSelectEvent}
            />
          ) : (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: "var(--content-muted)" }}>
                Không có sự kiện nào trong thời đại này.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const CAT_COLORS: Record<string, string> = {
    war: "var(--accent-danger)",
    politics: "var(--accent-gold)",
    culture: "var(--accent-blue)",
    science: "var(--accent-teal)",
    religion: "var(--accent-bronze)",
    other: "var(--content-muted)",
  };

  function getCatColor(cat: string): string {
    return CAT_COLORS[cat] ?? CAT_COLORS.other;
  }
