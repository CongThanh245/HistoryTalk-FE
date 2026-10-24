"use client";

// Shared bits of the School Admin account lists (teachers, students): server-side sort headers,
// the active filter and the sequential bulk runner with a progress toast.

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

import { apiErrorMessage } from "@/features/saas/hooks-api";
import type { ListParams } from "@/services/school.service";
import { cn } from "@/lib/utils/cn";

export type SortDirection = NonNullable<ListParams["sortDirection"]>;

export const PAGE_SIZES = [10, 20, 50];

export const HEAD = "px-3 text-[13px] font-semibold text-[var(--text-secondary)]";

export function SortHeader<C extends string>({
  label,
  column,
  sortBy,
  direction,
  onSort,
}: {
  label: string;
  column: C;
  sortBy: C;
  direction: SortDirection;
  onSort: (column: C) => void;
}) {
  const active = sortBy === column;
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      aria-label={`Sắp xếp theo ${label.toLowerCase()}${active ? (direction === "asc" ? " (đang tăng dần)" : " (đang giảm dần)") : ""}`}
      className={cn(
        "-ml-1.5 inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-sm px-1.5 text-[13px] font-semibold transition-colors hover:bg-[var(--status-neutral-bg)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]",
        active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]",
      )}
    >
      {label}
      <Icon className={cn("h-3.5 w-3.5", !active && "opacity-50")} aria-hidden="true" />
    </button>
  );
}

/** `aria-sort` value of a server-sorted column header. */
export const ariaSort = (column: string, sortBy: string, direction: SortDirection) =>
  column === sortBy ? (direction === "asc" ? "ascending" : "descending") : "none";

/** Sort state of a server-paged list: clicking the active column flips the direction. */
export function useServerSort<C extends string>(initial: C, dateColumn: C) {
  const [sortBy, setSortBy] = React.useState<C>(initial);
  const [direction, setDirection] = React.useState<SortDirection>("desc");
  const onSort = (column: C) => {
    if (column === sortBy) setDirection((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(column);
      setDirection(column === dateColumn ? "desc" : "asc");
    }
  };
  return { sortBy, direction, onSort };
}

export type ActiveFilter = "ALL" | "ACTIVE" | "LOCKED";

export const activeParam = (f: ActiveFilter) => (f === "ALL" ? undefined : f === "ACTIVE");

const ACTIVE_OPTIONS: { value: ActiveFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "LOCKED", label: "Đã khóa" },
];

/** Segmented "Tất cả / Đang hoạt động / Đã khóa" filter. */
export function ActiveFilterTabs({ value, onChange, className }: { value: ActiveFilter; onChange: (v: ActiveFilter) => void; className?: string }) {
  return (
    <div
      role="group"
      aria-label="Lọc theo trạng thái"
      className={cn(
        "grid h-10 grid-cols-3 gap-0.5 rounded-lg bg-[var(--status-neutral-bg)] p-0.5 sm:inline-grid sm:w-auto",
        className,
      )}
    >
      {ACTIVE_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "whitespace-nowrap rounded-md px-2 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)] sm:px-3",
            value === o.value
              ? "bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
              : "font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export interface BulkOutcome<T> {
  ok: T[];
  failed: { item: T; message: string }[];
}

/**
 * Runs `run` for each item one after another (the backend has no bulk endpoint) and keeps a single toast
 * updated with the progress; ends with a success toast or a warning listing the failures.
 */
export async function runBulk<T>({
  items,
  run,
  name,
  progressLabel,
  doneLabel,
}: {
  items: T[];
  run: (item: T) => Promise<unknown>;
  /** Shown in the failure list, e.g. the person's name. */
  name: (item: T) => string;
  /** e.g. "Đang khóa tài khoản" → "Đang khóa tài khoản 3/10…" */
  progressLabel: string;
  /** e.g. (n) => `Đã khóa ${n} tài khoản` */
  doneLabel: (count: number) => string;
}): Promise<BulkOutcome<T>> {
  const id = toast.loading(`${progressLabel} 0/${items.length}…`);
  const out: BulkOutcome<T> = { ok: [], failed: [] };
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      await run(item);
      out.ok.push(item);
    } catch (error) {
      out.failed.push({ item, message: apiErrorMessage(error, "Lỗi không xác định") });
    }
    toast.loading(`${progressLabel} ${i + 1}/${items.length}…`, { id });
  }
  if (!out.failed.length) {
    toast.success(doneLabel(out.ok.length), { id });
  } else {
    const shown = out.failed.slice(0, 3).map((f) => `${name(f.item)}: ${f.message}`);
    const more = out.failed.length > 3 ? ` và ${out.failed.length - 3} tài khoản khác` : "";
    const head = out.ok.length ? `${doneLabel(out.ok.length)}; ${out.failed.length} tài khoản lỗi.` : `Không thực hiện được (${out.failed.length} tài khoản lỗi).`;
    (out.ok.length ? toast.warning : toast.error)(head, { id, description: `${shown.join(" · ")}${more}`, duration: 10_000 });
  }
  return out;
}
