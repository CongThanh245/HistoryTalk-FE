"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { HistoricalEvent, EventEra } from "@/services/event.service";
import { EventTimeline } from "./event-timeline";
import { EventDetailModal } from "./event-detail-drawer";

export function EventsClient() {
  // ← bỏ props
  const router = useRouter();
  const [era, setEra] = useState<EventEra>("all");
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(
    null,
  );

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
