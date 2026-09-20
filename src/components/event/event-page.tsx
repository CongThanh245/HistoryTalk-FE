"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { HistoricalEvent, EventEra } from "@/services/event.service";
import { EventTimeline } from "./event-timeline";
import { EventDetailModal } from "./event-detail-drawer";
import { useEventDetail } from "@/features/events/hooks";
import { parseEra, parseEventView, type EventView } from "@/lib/catalog-url-state";

export function EventsClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const eventIdFromUrl = searchParams.get("event");

  const era = parseEra(searchParams.get("era"));
  const view = parseEventView(searchParams.get("view"));
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(
    null,
  );

  const { data: eventDetail } = useEventDetail(eventIdFromUrl || undefined);
  const visibleEvent =
    selectedEvent?.id === eventIdFromUrl
      ? selectedEvent
      : eventDetail?.id === eventIdFromUrl
        ? eventDetail
        : null;

  const updateUrl = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history.pushState(null, "", url);
    }
  };

  const handleSelectEvent = (event: HistoricalEvent) => {
    setSelectedEvent(event);
    updateUrl({ event: event.id });
  };

  const handleClose = () => {
    setSelectedEvent(null);
    updateUrl({ event: null });
  };

  return (
    <>
      <EventTimeline
        era={era}
        view={view}
        onViewChange={(nextView: EventView) =>
          updateUrl({ view: nextView === "all" ? null : nextView, era: null })
        }
        onEraChange={(nextEra: EventEra) =>
          updateUrl({ era: nextEra === "all" ? null : nextEra })
        }
        onSelectEvent={handleSelectEvent}
      />
      <EventDetailModal event={visibleEvent} onClose={handleClose} />
    </>
  );
}
