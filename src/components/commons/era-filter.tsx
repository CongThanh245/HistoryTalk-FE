"use client";

import { ERA_CONFIG, type EventEra } from "@/services/event.service";
import { cn } from "@/lib/utils/cn";

const ERAS = Object.entries(ERA_CONFIG) as [EventEra, (typeof ERA_CONFIG)[EventEra]][];

interface EraFilterProps {
  active: EventEra;
  onChange: (era: EventEra) => void;
  counts?: Partial<Record<EventEra, number>>; // TODO: lấy từ API
}

export function EraFilter({ active, onChange, counts }: EraFilterProps) {
  return (
    <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
      {ERAS.map(([era, cfg]) => {
        const isActive = active === era;
        const count = counts?.[era];

        return (
          <button
            key={era}
            onClick={() => onChange(era)}
            className={cn(
              "relative flex items-center gap-1 md:gap-1.5 px-3 md:px-3.5 h-8 rounded-[2px] text-[11px] font-bold uppercase tracking-[0.1em] transition-colors duration-150 cursor-pointer border",
              isActive
                ? "bg-[var(--era-filter-active-bg,var(--accent-gold))] text-[var(--era-filter-active-text,var(--text-inverse))] border-[var(--era-filter-active-bg,var(--accent-gold))]"
                : "bg-transparent border-[var(--border-default)] text-[var(--era-filter-text,var(--content-text))] hover:border-[var(--text-primary)]",
            )}
          >
            {cfg.label}
            {count !== undefined && (
              <span
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded-[2px]",
                  isActive
                    ? "bg-[rgba(0,0,0,0.15)] text-[var(--era-filter-active-text,var(--text-inverse))]"
                    : "bg-[var(--card-light-border)] text-[var(--era-filter-count-text,var(--content-muted))]",
                )}
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
