"use client";

import { ERA_CONFIG, type EventEra } from "@/services/event.service";
import { cn } from "@/lib/utils/cn";

const ERAS = Object.entries(ERA_CONFIG) as [EventEra, (typeof ERA_CONFIG)[EventEra]][];

interface EraFilterProps {
  active: EventEra;
  onChange: (era: EventEra) => void;
  counts?: Partial<Record<EventEra, number>>; // TODO: lấy từ API
  /** "tabs": underlined row (the page's main filter). "chips": rounded pills, for a row under other tabs. */
  variant?: "tabs" | "chips";
}

/** Era filter; a count, when known, sits beside the label in a muted tone. */
export function EraFilter({ active, onChange, counts, variant = "tabs" }: EraFilterProps) {
  const chips = variant === "chips";
  return (
    <div role="group" aria-label="Lọc theo thời kỳ" className={cn("flex items-center", chips ? "flex-wrap gap-2" : "gap-6")}>
      {ERAS.map(([era, cfg]) => {
        const isActive = active === era;
        const count = counts?.[era];

        return (
          <button
            key={era}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(era)}
            className={cn(
              chips
                ? "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
                : "relative inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 text-[15px] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]",
              chips
                ? isActive
                  ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
                  : "border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-content-heading"
                : isActive
                  ? "border-[var(--accent-gold)] font-semibold text-content-heading"
                  : "border-transparent font-medium text-[var(--text-tertiary)] hover:text-content-heading",
            )}
          >
            {cfg.label}
            {count !== undefined && <span className="text-xs font-normal tabular-nums text-content-subtle">{count.toLocaleString("vi-VN")}</span>}
          </button>
        );
      })}
    </div>
  );
}
