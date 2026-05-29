"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { HistoricalEvent, EventEra } from "@/services/event.service";
import { EventTimeline } from "./event-timeline";
import { EventDetailModal } from "./event-detail-drawer";
import { useEventDetail } from "@/features/events/hooks";

export function EventsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdFromUrl = searchParams.get("event");

  const [era, setEra] = useState<EventEra>("all");
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(
    null,
  );

  // Fetch event detail if event ID is in URL
  const { data: eventDetail } = useEventDetail(eventIdFromUrl || undefined);

  // Auto-open modal when event detail is loaded from URL param
  useEffect(() => {
    if (eventDetail) {
      setSelectedEvent(eventDetail);
    }
  }, [eventDetail]);

  const handleSelectEvent = (event: HistoricalEvent) => {
    setSelectedEvent(event);
    router.push(`?event=${event.id}`, { scroll: false });
  };

  const handleClose = () => {
    setSelectedEvent(null);
    router.push("?", { scroll: false });
  };

  return (
    <>
      <EventTimeline
        era={era}
        onEraChange={setEra}
        onSelectEvent={handleSelectEvent}
      />
      <EventDetailModal event={selectedEvent} onClose={handleClose} />
    </>
  );
}
