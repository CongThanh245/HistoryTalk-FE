"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  HistoricalEvent,
  EventEra,
  GetEventsParams,
} from "@/services/event.service";
import { ERA_CONFIG, getEraFromYear } from "@/services/event.service";
import { TimelineCard, TimelineCardSkeleton } from "./timeline-card";

// TODO: xoá import mock khi có API
import { MOCK_EVENTS, MOCK_PAGE_LIMIT } from "./event.mock";
import { eventQueryKeys } from "@/shared/query-key";
import { EraFilter } from "./era-filter";
import { CustomPagination } from "../commons/pagination";

const PAGE_LIMIT = MOCK_PAGE_LIMIT;

interface EventTimelineProps {
  era: EventEra;
  page: number;
  onEraChange: (era: EventEra) => void;
  onPageChange: (page: number) => void;
  onSelectEvent: (event: HistoricalEvent) => void;
}

export function EventTimeline({
  era,
  page,
  onEraChange,
  onPageChange,
  onSelectEvent,
}: EventTimelineProps) {
  const params: GetEventsParams = { era, page, limit: PAGE_LIMIT };

  const { data, isLoading } = useQuery({
    queryKey: eventQueryKeys.list(params),
    queryFn: async () => {
      // TODO: thay bằng eventService.getEvents(params) khi có API
      await new Promise((r) => setTimeout(r, 500));

      // Filter mock theo era ở client
      const [from, to] = ERA_CONFIG[era].range;
      const filtered = MOCK_EVENTS.filter(
        (e) => e.year >= from && e.year <= to,
      ).sort((a, b) => a.year - b.year);

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
      const data = filtered.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT);

      return { data, total, page, limit: PAGE_LIMIT, totalPages };
    },
    placeholderData: (prev) => prev, // giữ data cũ khi đổi page/filter, tránh flash
  });

  // Đếm số lượng mỗi era để hiện badge
  const eraCounts = Object.fromEntries(
    (
      ["all", "ancient", "medieval", "modern", "contemporary"] as EventEra[]
    ).map((e) => {
      const [from, to] = ERA_CONFIG[e].range;
      return [
        e,
        MOCK_EVENTS.filter((ev) => ev.year >= from && ev.year <= to).length,
      ];
    }),
  ) as Record<EventEra, number>;

  const events = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <EraFilter
          active={era}
          onChange={(e) => {
            onEraChange(e);
            onPageChange(1);
          }}
          counts={eraCounts}
        />
        {!isLoading && (
          <span className="text-xs" style={{ color: "var(--content-subtle)" }}>
            {total} sự kiện
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Đường dọc */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, var(--card-light-border) 5%, var(--card-light-border) 95%, transparent 100%)",
          }}
        />

        <div className="relative flex flex-col gap-6 py-2">
          {isLoading ? (
            Array.from({ length: PAGE_LIMIT }).map((_, i) => (
              <TimelineCardSkeleton key={i} index={i} />
            ))
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: "var(--content-muted)" }}>
                Không có sự kiện nào trong thời đại này.
              </p>
            </div>
          ) : (
            events.map((event, i) => (
              <TimelineCard
                key={event.id}
                event={event}
                index={i}
                onClick={onSelectEvent}
              />
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      <CustomPagination page={page} totalPages={totalPages} onChange={onPageChange} />
    </div>
  );
}
