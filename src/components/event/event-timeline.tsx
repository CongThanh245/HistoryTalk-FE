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
      accentColor: EVENT_ACCENT_COLOR,
    }));

    return (
      <div ref={containerRef} className="space-y-4 md:space-y-3 overflow-hidden">
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
            <span className="text-xs" style={{ color: "var(--content-muted)" }}>
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
          <div className="-mt-1 flex items-center gap-2">
            <div className="flex gap-1" role="group" aria-label="Chọn sự kiện theo thứ tự">
              {events.map((ev, index) => {
                const isActive = ev.id === resolvedActiveId;
                const yearLabel =
                  ev.yearLabel ??
                  `${Math.abs(ev.year)} ${ev.year < 0 ? "TCN" : "SCN"}`;
                return (
                <button
                  key={ev.id}
                  onClick={() => handleSelect(ev.id)}
                  aria-label={`Chọn sự kiện ${index + 1}: ${ev.title}, ${yearLabel}`}
                  aria-current={isActive ? "step" : undefined}
                  className="grid h-5 w-5 place-items-center rounded-full cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)]"
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="block rounded-full transition-all duration-200"
                    style={{
                      width: isActive ? 18 : 6,
                      height: 6,
                      background: isActive
                        ? EVENT_ACCENT_COLOR
                        : "var(--card-light-border)",
                    }}
                  />
                </button>
              );
            })}
            </div>
            <span
              className="text-[11px]"
              style={{ color: "var(--content-muted)" }}
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

  const EVENT_ACCENT_COLOR = "var(--accent-gold)";
