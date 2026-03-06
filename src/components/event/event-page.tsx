"use client";

import { useState } from "react";
import type { HistoricalEvent, EventEra } from "@/services/event.service";
import { EventTimeline } from "./event-timeline";
import { EventDetailModal } from "./event-detail-drawer";


export function EventsClient() {
  const [era, setEra] = useState<EventEra>("all");
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(
    null,
  );

  return (
    <>
      <EventTimeline
        era={era}
        onEraChange={setEra}
        onSelectEvent={setSelectedEvent}
      />

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </>
  );
}
