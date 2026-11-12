"use client";

import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StaffTabStepperProps<K extends string> {
  tabs: { key: K; label: string }[];
  active: K;
  onChange: (key: K) => void;
  /** Small muted line under the step label (e.g. "Có thay đổi chưa lưu"). */
  hint?: string;
}

/** Back / Next through form tabs in order, so staff do not have to guess which tab comes next. */
export function StaffTabStepper<K extends string>({ tabs, active, onChange, hint }: StaffTabStepperProps<K>) {
  const index = Math.max(0, tabs.findIndex((t) => t.key === active));
  const prev = tabs[index - 1];
  const next = tabs[index + 1];

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!prev}
        onClick={() => prev && onChange(prev.key)}
        title={prev ? `Quay lại: ${prev.label}` : undefined}
        className="rounded-sm bg-transparent border-border-card hover:bg-[var(--status-neutral-bg)] text-[var(--content-heading)] hover:text-[var(--content-heading)]"
      >
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        Quay lại
      </Button>
      <div className="min-w-0 px-1 text-center">
        <p className="whitespace-nowrap text-sm font-semibold text-[var(--content-heading)]">
          Bước {index + 1}/{tabs.length} · {tabs[index]?.label}
        </p>
        {hint && <p className="truncate text-xs text-[var(--content-muted)]">{hint}</p>}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!next}
        onClick={() => next && onChange(next.key)}
        title={next ? `Kế tiếp: ${next.label}` : undefined}
        className="rounded-sm bg-transparent border-border-card hover:bg-[var(--status-neutral-bg)] text-[var(--content-heading)] hover:text-[var(--content-heading)]"
      >
        Kế tiếp
        <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
