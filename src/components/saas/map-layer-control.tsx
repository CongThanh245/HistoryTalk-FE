"use client";

import * as React from "react";
import { ChevronDown, Layers, Plus, X } from "lucide-react";
import type { MapLayerKey } from "@/features/saas/hooks-map";
import type { Classroom } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

export interface MapLayerRow {
  key: MapLayerKey;
  label: string;
  hint?: string;
  count: number;
  checked: boolean;
  /** Always-on layers (e.g. the global map while a Content Admin edits it). */
  locked?: boolean;
}

interface MapLayerControlProps {
  rows: MapLayerRow[];
  onToggle: (key: MapLayerKey, next: boolean) => void;
  classes: Classroom[];
  classId: string | null;
  onClassChange: (classId: string) => void;
  /** Shown under the class picker when the role has no class. */
  emptyClassText?: string;
  onAddClassPin?: () => void;
  onAddPersonalPin?: () => void;
  addDisabled?: boolean;
  /** Small print at the bottom (mock-data notice, read-only hint…). */
  footnote?: React.ReactNode;
}

const SWATCH: Record<MapLayerKey, string> = {
  global: "map-layer-swatch--global",
  class: "map-layer-swatch--class",
  personal: "map-layer-swatch--personal",
};

/** Floating layer switcher (top-left of the map). Collapses into a button on small screens. */
export function MapLayerControl({
  rows,
  onToggle,
  classes,
  classId,
  onClassChange,
  emptyClassText,
  onAddClassPin,
  onAddPersonalPin,
  addDisabled,
  footnote,
}: MapLayerControlProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const classRow = rows.find((r) => r.key === "class");
  const visibleCount = rows.filter((r) => r.checked).length;

  return (
    <div className="absolute left-4 top-4 z-[520] max-w-[calc(100%-32px)]">
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-primary)] shadow-[var(--shadow-soft)] md:hidden",
          mobileOpen && "bg-[var(--text-primary)] text-[var(--text-inverse)]",
        )}
      >
        <Layers size={15} aria-hidden="true" /> Lớp bản đồ
        <span className="tabular-nums">{visibleCount}/{rows.length}</span>
      </button>

      <section
        aria-label="Lớp bản đồ"
        className={cn(
          "mt-2 w-[272px] max-w-full rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-soft)] md:mt-0",
          mobileOpen ? "block" : "max-md:hidden",
        )}
      >
        <header className="flex items-center justify-between gap-2 border-b border-[var(--text-primary)] px-3 py-2">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em]">
            <Layers size={14} className="text-[var(--accent-gold)]" aria-hidden="true" /> Lớp bản đồ
          </span>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Mở rộng lớp bản đồ" : "Thu gọn lớp bản đồ"}
            className="hidden h-7 w-7 place-items-center rounded-[2px] hover:bg-[var(--sidebar-hover-bg)] md:grid"
          >
            <ChevronDown size={15} className={cn("transition-transform", collapsed && "-rotate-90")} />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Đóng lớp bản đồ"
            className="grid h-7 w-7 place-items-center rounded-[2px] hover:bg-[var(--sidebar-hover-bg)] md:hidden"
          >
            <X size={15} />
          </button>
        </header>

        <div className={cn("max-h-[min(60vh,440px)] overflow-y-auto", collapsed && "md:hidden")}>
          <ul className="divide-y divide-[var(--border-default)]">
            {rows.map((row) => (
              <li key={row.key} className="px-3 py-2">
                <label className={cn("flex items-start gap-2.5", row.locked ? "cursor-default" : "cursor-pointer")}>
                  <input
                    type="checkbox"
                    checked={row.checked}
                    disabled={row.locked}
                    onChange={(e) => onToggle(row.key, e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--text-primary)]"
                  />
                  <span className={cn("map-layer-swatch mt-0.5", SWATCH[row.key])} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-snug">{row.label}</span>
                    {row.hint && <span className="block text-[11px] leading-snug text-[var(--text-tertiary)]">{row.hint}</span>}
                  </span>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-[var(--text-secondary)]">{row.count}</span>
                </label>

                {row.key === "class" && (
                  <div className="mt-2 space-y-2 pl-[26px]">
                    {classes.length > 0 ? (
                      <label className="relative block">
                        <span className="sr-only">Chọn lớp</span>
                        <select
                          value={classId ?? ""}
                          onChange={(e) => onClassChange(e.target.value)}
                          className="h-9 w-full appearance-none rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] pl-2.5 pr-8 text-sm font-semibold outline-none focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)]"
                        >
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              Lớp {c.name} · {c.schoolYear}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                      </label>
                    ) : (
                      <p className="text-xs leading-snug text-[var(--text-tertiary)]">{emptyClassText ?? "Chưa có lớp nào."}</p>
                    )}
                    {classRow?.checked && (
                      <div className="grid gap-1 text-[11px] leading-snug text-[var(--text-secondary)]">
                        <LegendItem swatch="map-layer-swatch--class">Địa danh lịch sử địa phương</LegendItem>
                        <LegendItem swatch="map-layer-swatch--assignment">Bài tập có hạn nộp</LegendItem>
                        <LegendItem swatch="map-layer-swatch--local">Bối cảnh địa phương đã xuất bản</LegendItem>
                      </div>
                    )}
                    {onAddClassPin && (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileOpen(false);
                          onAddClassPin();
                        }}
                        disabled={addDisabled || !classId}
                        className="btn-ink h-9 min-h-0 w-full px-3 text-xs disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <Plus size={15} /> Thêm ghim lớp
                      </button>
                    )}
                  </div>
                )}

                {row.key === "personal" && onAddPersonalPin && (
                  <div className="mt-2 pl-[26px]">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        onAddPersonalPin();
                      }}
                      disabled={addDisabled}
                      className="btn-line h-9 min-h-0 w-full px-3 text-xs disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Plus size={15} /> Thêm ghim ghi chú
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {footnote && (
            <div className="border-t border-[var(--border-default)] px-3 py-2 text-[11px] leading-snug text-[var(--text-tertiary)]">{footnote}</div>
          )}
        </div>
      </section>
    </div>
  );
}

function LegendItem({ swatch, children }: { swatch: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("map-layer-swatch", swatch)} aria-hidden="true" />
      {children}
    </span>
  );
}
