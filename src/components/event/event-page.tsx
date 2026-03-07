"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { HistoricalEvent, EventEra } from "@/services/event.service";
import { EventTimeline } from "./event-timeline";
import { EventDetailModal } from "./event-detail-drawer";
export function EventsClient({ events }: { events: HistoricalEvent[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [era, setEra] = useState<EventEra>("all");

  const eventId = searchParams.get("event");
  const selectedEvent = events.find((e) => e.id === eventId) ?? null; // bỏ MOCK_EVENT

  const handleSelectEvent = (event: HistoricalEvent) => {
    router.push(`?event=${event.id}`, { scroll: false });
  };

  const handleClose = () => {
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
