"use client";

import { useState } from "react";
import { EventTimeline } from "./event-timeline";
import type { HistoricalEvent, EventEra } from "@/services/event.service";
import { EventDetailModal } from "./event-detail-drawer";

export function EventsClient() {
  const [era, setEra]                     = useState<EventEra>("all");
  const [page, setPage]                   = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null);

  return (
    <>
      <EventTimeline
        era={era}
        page={page}
        onEraChange={(e) => { setEra(e); setPage(1); }}
        onPageChange={setPage}
        onSelectEvent={setSelectedEvent}
      />

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </>
  );
}