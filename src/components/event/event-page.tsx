"use client";

import { useState } from "react";
import { EventTimeline } from "./event-timeline";
import { EventDetailDrawer } from "./event-detail-drawer";
import type { HistoricalEvent, EventEra } from "@/services/event.service";

export function EventsClient() {
  const [era, setEra] = useState<EventEra>("all");
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(
    null,
  );

  const handleEraChange = (newEra: EventEra) => {
    setEra(newEra);
    setPage(1); // reset về trang 1 khi đổi filter
  };

  return (
    <>
      <EventTimeline
        era={era}
        page={page}
        onEraChange={handleEraChange}
        onPageChange={setPage}
        onSelectEvent={setSelectedEvent}
      />
      <EventDetailDrawer
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </>
  );
}
