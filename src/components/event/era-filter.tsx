"use client";

import { ERA_CONFIG, type EventEra } from "@/services/event.service";

const ERAS = Object.entries(ERA_CONFIG) as [EventEra, (typeof ERA_CONFIG)[EventEra]][];

interface EraFilterProps {
  active: EventEra;
  onChange: (era: EventEra) => void;
  counts?: Partial<Record<EventEra, number>>; // TODO: lấy từ API
}

export function EraFilter({ active, onChange, counts }: EraFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {ERAS.map(([era, cfg]) => {
        const isActive = active === era;
        const count = counts?.[era];

        return (
          <button
            key={era}
            onClick={() => onChange(era)}
            className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 cursor-pointer"
            style={
              isActive
                ? {
                    background: "var(--burning-flame)",
                    color: "var(--bg-deep)",
                    boxShadow: "0 2px 10px var(--accent-gold-glow)",
                  }
                : {
                    background: "var(--card-light-bg)",
                    border: "1px solid var(--card-light-border)",
                    color: "var(--content-text)",
                  }
            }
          >
            {cfg.label}
            {count !== undefined && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  background: isActive ? "rgba(0,0,0,0.15)" : "var(--card-light-border)",
                  color: isActive ? "var(--bg-deep)" : "var(--content-muted)",
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}