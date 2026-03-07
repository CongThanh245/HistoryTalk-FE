import { useState, useRef, useCallback, useEffect } from "react";
import type { HistoricalEvent } from "@/services/event.service";

const STEP_COOLDOWN = 280;

export function useTimelineNavigation(events: HistoricalEvent[]) {
  const [activeId, setActiveId] = useState<string>("");
  const [direction, setDirection] = useState<1 | -1>(1);

  const activeIdRef = useRef<string>("");
  const eventsRef = useRef<HistoricalEvent[]>([]);
  const lastStepAt = useRef<number>(0);
  const rafId = useRef<number>(0);
  const pendingDir = useRef<0 | 1 | -1>(0);

  eventsRef.current = events;

  const resolvedActiveId =
    activeId && events.find((e) => e.id === activeId)
      ? activeId
      : (events[0]?.id ?? "");
  activeIdRef.current = resolvedActiveId;

  const handleSelect = useCallback((id: string) => {
    const evs = eventsRef.current;
    const curIdx = evs.findIndex((e) => e.id === activeIdRef.current);
    const newIdx = evs.findIndex((e) => e.id === id);
    setDirection(newIdx >= curIdx ? 1 : -1);
    setActiveId(id);
  }, []);

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

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      pendingDir.current = e.deltaY > 0 ? 1 : -1;
      const remaining = STEP_COOLDOWN - (Date.now() - lastStepAt.current);
      if (remaining > 0) {
        cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => {
          if (Date.now() - lastStepAt.current < STEP_COOLDOWN) return;
          fireStep();
        });
        return;
      }
      fireStep();
    },
    [fireStep],
  );

  const reset = useCallback(() => {
    pendingDir.current = 0;
    lastStepAt.current = 0;
    setActiveId("");
  }, []);

  return {
    resolvedActiveId,
    direction,
    handleSelect,
    handleWheel,
    reset,
  };
}
