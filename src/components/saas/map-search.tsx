"use client";

import * as React from "react";
import { Search, Swords, X } from "lucide-react";
import type { BattleOverviewItem, OverlayPin } from "@/components/historical-map/map-overlay.types";
import { cn } from "@/lib/utils/cn";

/** Lower-case, accent-free text so "dien bien" finds "Điện Biên Phủ". */
export function normalizeVi(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export const matchesQuery = (query: string, ...fields: (string | undefined)[]) => {
  const q = normalizeVi(query);
  return q.length === 0 || fields.some((f) => f && normalizeVi(f).includes(q));
};

const VARIANT_LABEL: Record<OverlayPin["variant"], string> = {
  class: "Địa danh lớp",
  assignment: "Bài tập",
  local: "Kho tư liệu",
  personal: "Ghi chú của tôi",
};

type Result =
  | { type: "battle"; id: string; label: string; meta: string }
  | { type: "pin"; id: string; label: string; meta: string; variant: OverlayPin["variant"] };

const formatYear = (year: number) => (year < 0 ? `${Math.abs(year)} TCN` : String(year));

/**
 * Search box over the map: battles of the global layer plus the overlay pins currently shown.
 * Combobox keyboard model: ↑/↓ move, Enter picks, Esc clears then closes.
 */
export function MapSearchBox({
  battles,
  pins,
  showBattles,
  onPickBattle,
  onPickPin,
  className,
}: {
  battles: BattleOverviewItem[];
  pins: OverlayPin[];
  /** False when the global layer is unticked. */
  showBattles: boolean;
  onPickBattle: (id: string) => void;
  onPickPin: (id: string) => void;
  className?: string;
}) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const listId = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const results = React.useMemo<Result[]>(() => {
    if (!query.trim()) return [];
    const battleHits: Result[] = showBattles
      ? battles
          .filter((b) => matchesQuery(query, b.title, b.location, String(b.year)))
          .slice(0, 6)
          .map((b) => ({
            type: "battle",
            id: b.id,
            label: b.title,
            meta: [formatYear(b.year), b.location, b.coordinates ? "" : "chưa ghim"].filter(Boolean).join(" · "),
          }))
      : [];
    const pinHits: Result[] = pins
      .filter((p) => matchesQuery(query, p.label, p.meta))
      .slice(0, 8)
      .map((p) => ({ type: "pin", id: p.id, label: p.label, meta: p.meta ?? VARIANT_LABEL[p.variant], variant: p.variant }));
    return [...battleHits, ...pinHits];
  }, [query, battles, pins, showBattles]);

  const activeIndex = Math.min(active, Math.max(0, results.length - 1));
  const expanded = open && query.trim().length > 0;

  const pick = (result: Result | undefined) => {
    if (!result) return;
    if (result.type === "battle") onPickBattle(result.id);
    else onPickPin(result.id);
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (results.length ? (Math.min(i, results.length - 1) + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (results.length ? (Math.min(i, results.length - 1) - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      if (expanded) {
        e.preventDefault();
        pick(results[activeIndex]);
      }
    } else if (e.key === "Escape") {
      // Keep Escape inside the box (the map would otherwise close a panel or the whole screen).
      e.stopPropagation();
      if (query) setQuery("");
      else inputRef.current?.blur();
      setOpen(false);
    }
  };

  const battleResults = results.filter((r) => r.type === "battle");
  const pinResults = results.filter((r) => r.type === "pin");

  const renderOption = (r: Result) => {
    const index = results.indexOf(r);
    return (
      <li
        key={`${r.type}:${r.id}`}
        id={`${listId}-${index}`}
        role="option"
        aria-selected={index === activeIndex}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => pick(r)}
        onMouseEnter={() => setActive(index)}
        className={cn(
          "flex cursor-pointer items-start gap-2.5 px-3 py-2",
          index === activeIndex && "bg-[var(--sidebar-hover-bg)]",
        )}
      >
        {r.type === "battle" ? (
          <Swords size={14} className="mt-0.5 shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
        ) : (
          <span className={cn("map-layer-swatch mt-0.5", `map-layer-swatch--${r.variant}`)} aria-hidden="true" />
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold leading-snug">{r.label}</span>
          {r.meta && <span className="block truncate text-[11px] leading-snug text-[var(--text-tertiary)]">{r.meta}</span>}
        </span>
      </li>
    );
  };

  return (
    <div className={cn("relative", className)}>
      <label className="relative block">
        <span className="sr-only">Tìm trên bản đồ</span>
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={expanded && results.length ? `${listId}-${activeIndex}` : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder={showBattles ? "Tìm trận đánh, ghim…" : "Tìm ghim trên bản đồ…"}
          autoComplete="off"
          className="h-10 w-full rounded-sm border border-border-card bg-[var(--bg-surface)] pl-9 pr-9 text-sm text-[var(--text-primary)] shadow-[var(--shadow-soft)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)] [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Xóa từ khóa"
            className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-sm text-[var(--text-tertiary)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--text-primary)]"
          >
            <X size={14} />
          </button>
        )}
      </label>
      {expanded && (
        <div className="absolute inset-x-0 top-full z-[560] mt-1 max-h-[min(50vh,360px)] overflow-y-auto rounded-sm border border-border-card bg-[var(--bg-surface)] py-1 shadow-[var(--shadow-soft)]">
          <ul id={listId} role="listbox" aria-label="Kết quả tìm kiếm">
            {battleResults.length > 0 && (
              <li role="presentation" className="px-3 pb-1 pt-1.5 text-xs font-semibold text-[var(--text-tertiary)]">
                Trận đánh
              </li>
            )}
            {battleResults.map(renderOption)}
            {pinResults.length > 0 && (
              <li role="presentation" className="px-3 pb-1 pt-2 text-xs font-semibold text-[var(--text-tertiary)]">
                Ghim đang hiển thị
              </li>
            )}
            {pinResults.map(renderOption)}
          </ul>
          {results.length === 0 && <p className="px-3 py-2 text-sm text-[var(--text-tertiary)]">Không tìm thấy kết quả phù hợp.</p>}
        </div>
      )}
    </div>
  );
}
