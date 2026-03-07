"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  HistoricalEvent,
  EventEra,
  GetEventsParams,
  EventEraBackend,
} from "@/services/event.service";
import { ERA_CONFIG } from "@/services/event.service";
import { EraFilter } from "../commons/era-filter";
import { TimelineStrip, type TimelineItem } from "../commons/timeline-strip";
import { TimelineStripCard, TimelineStripCardSkeleton } from "./timeline-card";
import { queryKeys } from "@/shared/query-key";
import { eventService } from "@/services/event.service";
const ALL_LIMIT = 100;

// Cooldown giữa 2 bước (ms) — đủ ngắn để lăn liên tục mượt
// nhưng đủ dài để mỗi bước animate xong trước khi nhảy tiếp
const STEP_COOLDOWN = 280;

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
  const [activeId, setActiveId] = useState<string>("");
  const [direction, setDirection] = useState<1 | -1>(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string>("");
  const eventsRef = useRef<HistoricalEvent[]>([]);
  const lastStepAt = useRef<number>(0); // timestamp bước cuối
  const rafId = useRef<number>(0); // requestAnimationFrame id
  const pendingDir = useRef<0 | 1 | -1>(0); // hướng đang chờ xử lý

  const params: GetEventsParams = {
    page: 1,
    limit: ALL_LIMIT,
    ...(era !== "all" && { era: era.toUpperCase() as EventEraBackend }),
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.events.list(params),
    queryFn: () => eventService.getAllClient(params),
    placeholderData: (prev) => prev,
  });

  const events = data?.content ?? [];
  eventsRef.current = events;

  const resolvedActiveId =
    activeId && events.find((e) => e.id === activeId)
      ? activeId
      : (events[0]?.id ?? "");
  activeIdRef.current = resolvedActiveId;

  const activeEvent = events.find((e) => e.id === resolvedActiveId) ?? null;
  const activeIdx = events.findIndex((e) => e.id === resolvedActiveId);

  const handleSelect = useCallback((id: string) => {
    const evs = eventsRef.current;
    const curIdx = evs.findIndex((e) => e.id === activeIdRef.current);
    const newIdx = evs.findIndex((e) => e.id === id);
    setDirection(newIdx >= curIdx ? 1 : -1);
    setActiveId(id);
  }, []);

  // ── Wheel handler ─────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    // Cập nhật hướng pending liên tục theo deltaY
    pendingDir.current = e.deltaY > 0 ? 1 : -1;

    // Nếu đang trong cooldown, dùng rAF để fire ngay khi cooldown xong
    const now = Date.now();
    const remaining = STEP_COOLDOWN - (now - lastStepAt.current);

    if (remaining > 0) {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        if (Date.now() - lastStepAt.current < STEP_COOLDOWN) return;
        fireStep();
      });
      return;
    }

    fireStep();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fireStep = useCallback(() => {
    const dir = pendingDir.current;
    if (dir === 0) return;
    const evs = eventsRef.current;
    const curIdx = evs.findIndex((ev) => ev.id === activeIdRef.current);
    const next = curIdx + dir;
    if (next < 0 || next >= evs.length) return;
    lastStepAt.current = Date.now();
    handleSelect(evs[next].id);
  }, [handleSelect]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      cancelAnimationFrame(rafId.current);
    };
  }, [handleWheel]);

  // Reset khi đổi era
  useEffect(() => {
    pendingDir.current = 0;
    lastStepAt.current = 0;
  }, [era]);

  // Era counts
  const eraCounts = undefined;

  const timelineItems: TimelineItem[] = events.map((ev) => ({
    id: ev.id,
    year: ev.year,
    yearLabel:
      ev.yearLabel ?? `${Math.abs(ev.year)} ${ev.year < 0 ? "TCN" : "SCN"}`,
    category: ev.category,
    categoryColor: getCatColor(ev.category),
  }));

  return (
    // overflow-hidden trên wrapper để GSAP translateX không làm tràn scrollbar ngang
    <div ref={containerRef} className="space-y-5 overflow-hidden">
      {/* Era filter + count */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <EraFilter
          active={era}
          onChange={(e) => {
            onEraChange(e);
            setActiveId("");
          }}
          counts={eraCounts}
        />
        {!isLoading && (
          <span className="text-xs" style={{ color: "var(--content-subtle)" }}>
            {events.length} sự kiện
          </span>
        )}
      </div>

      {/* Timeline strip */}
      {isLoading ? (
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

      {/* Position indicator dots */}
      {!isLoading && events.length > 0 && (
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

      {/* Event card — bọc overflow-hidden để clip GSAP animation */}
      <div className="overflow-hidden">
        {isLoading ? (
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

// ── Helpers ───────────────────────────────────────────────

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
