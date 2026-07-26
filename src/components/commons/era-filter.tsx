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
              "relative flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3.5 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-medium transition-all duration-150 cursor-pointer border",
              isActive
                ? "bg-[var(--era-filter-active-bg,var(--accent-gold))] text-[var(--era-filter-active-text,var(--text-inverse))] border-[var(--era-filter-active-bg,var(--accent-gold))] shadow-[0_4px_14px_var(--accent-gold-glow)]"
                : "bg-[var(--era-filter-bg,var(--card-light-bg))] border-[var(--era-filter-border,var(--card-light-border))] text-[var(--era-filter-text,var(--content-text))]",
            )}
          >
            {cfg.label}
            {count !== undefined && (
              <span
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
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
