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
  /** Markers per class, shown in the class switcher. */
  classCounts?: Record<string, number>;
  /** Shown under the class picker when the role has no class. */
  emptyClassText?: string;
  onAddClassPin?: () => void;
  onAddPersonalPin?: () => void;
  addDisabled?: boolean;
  /** Why "add note" is disabled (e.g. note limit reached). */
  personalAddHint?: React.ReactNode;
  /** Small print at the bottom (mock-data notice, read-only hint…). */
  footnote?: React.ReactNode;
  /** Role-specific list below the layers (notes, class pins, battle overview). */
  children?: React.ReactNode;
  /** Phones: the control is a bottom sheet opened from a button. */
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  className?: string;
}

const SWATCH: Record<MapLayerKey, string> = {
  global: "map-layer-swatch--global",
  class: "map-layer-swatch--class",
  personal: "map-layer-swatch--personal",
  local: "map-layer-swatch--local",
};

/** Button that opens the layer control on phones. */
export function MapLayerToggle({
  open,
  onOpenChange,
  visible,
  total,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visible: number;
  total: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpenChange(!open)}
      aria-expanded={open}
      aria-label={`Lớp bản đồ, đang bật ${visible}/${total}`}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] px-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-primary)] shadow-[var(--shadow-soft)] md:hidden",
        open && "bg-[var(--text-primary)] text-[var(--text-inverse)]",
        className,
      )}
    >
      <Layers size={16} aria-hidden="true" />
      <span className="tabular-nums">{visible}/{total}</span>
    </button>
  );
}

/**
 * Layer switcher: toggles with counts, class switcher, legend, add buttons and a role-specific list.
 * Desktop: floating card (collapsible). Phones: bottom sheet opened by `MapLayerToggle`.
 */
export function MapLayerControl({
  rows,
  onToggle,
  classes,
  classId,
  onClassChange,
  classCounts,
  emptyClassText,
  onAddClassPin,
  onAddPersonalPin,
  addDisabled,
  personalAddHint,
  footnote,
  children,
  mobileOpen,
  onMobileOpenChange,
  className,
}: MapLayerControlProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [legendOpen, setLegendOpen] = React.useState(true);
  const bodyId = React.useId();
  const classRow = rows.find((r) => r.key === "class");
  const personalRow = rows.find((r) => r.key === "personal");
  const localRow = rows.find((r) => r.key === "local");
  const visibleCount = rows.filter((r) => r.checked).length;
  const showLegend = Boolean(classRow?.checked || personalRow?.checked || localRow?.checked);

  const run = (fn: () => void) => () => {
    onMobileOpenChange(false);
    fn();
  };

  return (
    <section
      aria-label="Lớp bản đồ"
      className={cn(
        "flex min-h-0 flex-col rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-soft)]",
        mobileOpen
          ? "map-overlay-sheet max-md:absolute max-md:inset-x-2 max-md:bottom-2 max-md:z-[540] max-md:max-h-[72%]"
          : "max-md:hidden",
        className,
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--text-primary)] px-3 py-2">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          className="hidden min-w-0 flex-1 items-center gap-2 rounded-[2px] text-left text-[11px] font-bold uppercase tracking-[0.12em] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] md:inline-flex"
        >
          <Layers size={14} className="shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
          <span className="truncate">Lớp bản đồ</span>
          <span className="font-semibold normal-case tracking-normal text-[var(--text-tertiary)] tabular-nums">
            · bật {visibleCount}/{rows.length}
          </span>
          <ChevronDown size={15} className={cn("ml-auto shrink-0 transition-transform motion-reduce:transition-none", collapsed && "-rotate-90")} aria-hidden="true" />
        </button>
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] md:hidden">
          <Layers size={14} className="text-[var(--accent-gold)]" aria-hidden="true" /> Lớp bản đồ
        </span>
        <button
          type="button"
          onClick={() => onMobileOpenChange(false)}
          aria-label="Đóng lớp bản đồ"
          className="grid h-8 w-8 place-items-center rounded-[2px] hover:bg-[var(--sidebar-hover-bg)] md:hidden"
        >
          <X size={16} />
        </button>
      </header>

      <div id={bodyId} className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", collapsed && "md:hidden")}>
        <ul className="divide-y divide-[var(--border-default)]">
          {rows.map((row) => (
            <li key={row.key} className="px-3 py-2">
              <label className={cn("flex items-start gap-2.5", row.locked ? "cursor-default" : "cursor-pointer")}>
                <input
                  type="checkbox"
                  checked={row.checked}
                  disabled={row.locked}
                  onChange={(e) => onToggle(row.key, e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)]"
                />
                <span className={cn("map-layer-swatch mt-0.5", SWATCH[row.key])} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-snug">{row.label}</span>
                  {row.hint && <span className="block text-[11px] leading-snug text-[var(--text-tertiary)]">{row.hint}</span>}
                </span>
                <span className="shrink-0 text-xs font-bold tabular-nums text-[var(--text-secondary)]" aria-label={`${row.count} mục`}>
                  {row.count}
                </span>
              </label>

              {row.key === "class" && (
                <div className="mt-2 space-y-2 pl-[26px]">
                  {classes.length > 1 ? (
                    <label className="relative block">
                      <span className="sr-only">Chọn lớp</span>
                      <select
                        value={classId ?? ""}
                        onChange={(e) => onClassChange(e.target.value)}
                        className="h-9 w-full appearance-none rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] pl-2.5 pr-8 text-sm font-semibold outline-none focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)]"
                      >
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            Lớp {c.name} · {classCounts?.[c.id] ?? 0} ghim
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    </label>
                  ) : classes.length === 1 ? (
                    <p className="text-xs font-semibold text-[var(--text-secondary)]">
                      Lớp {classes[0].name} · {classes[0].schoolYear}
                    </p>
                  ) : (
                    <p className="text-xs leading-snug text-[var(--text-tertiary)]">{emptyClassText ?? "Chưa có lớp nào."}</p>
                  )}
                  {onAddClassPin && (
                    <button
                      type="button"
                      onClick={run(onAddClassPin)}
                      disabled={addDisabled || !classId}
                      className="btn-ink h-9 min-h-0 w-full px-3 text-xs disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Plus size={15} /> Thêm ghim lớp
                    </button>
                  )}
                </div>
              )}

              {row.key === "personal" && onAddPersonalPin && (
                <div className="mt-2 space-y-1.5 pl-[26px]">
                  <button
                    type="button"
                    onClick={run(onAddPersonalPin)}
                    disabled={addDisabled}
                    className="btn-line h-9 min-h-0 w-full px-3 text-xs disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Plus size={15} /> Thêm ghi chú
                  </button>
                  {personalAddHint && <p className="text-[11px] leading-snug text-[var(--text-tertiary)]">{personalAddHint}</p>}
                </div>
              )}
            </li>
          ))}
        </ul>

        {showLegend && (
          <div className="border-t border-[var(--border-default)] px-3 py-2">
            <button
              type="button"
              onClick={() => setLegendOpen((v) => !v)}
              aria-expanded={legendOpen}
              className="flex w-full items-center justify-between rounded-[2px] text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)] outline-none hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
            >
              Chú giải
              <ChevronDown size={13} className={cn("transition-transform motion-reduce:transition-none", !legendOpen && "-rotate-90")} aria-hidden="true" />
            </button>
            {legendOpen && (
              <div className="mt-1.5 grid gap-1 text-[11px] leading-snug text-[var(--text-secondary)]">
                <LegendItem swatch="map-layer-swatch--global">Trận đánh (bản đồ chung)</LegendItem>
                {classRow?.checked && (
                  <>
                    <LegendItem swatch="map-layer-swatch--class">Địa danh lịch sử của lớp</LegendItem>
                    <LegendItem swatch="map-layer-swatch--assignment">
                      Bài tập · huy hiệu <b>2N</b> sắp hạn, <b>!</b> quá hạn, <b>✓</b> đã nộp
                    </LegendItem>
                    <LegendItem swatch="map-layer-swatch--local">Bối cảnh của lớp đã xuất bản</LegendItem>
                  </>
                )}
                {localRow?.checked && <LegendItem swatch="map-layer-swatch--local">Bối cảnh giáo viên soạn (đã duyệt)</LegendItem>}
                {personalRow?.checked && <LegendItem swatch="map-layer-swatch--personal">Ghi chú của tôi</LegendItem>}
              </div>
            )}
          </div>
        )}

        {children && <div className="border-t border-[var(--text-primary)]">{children}</div>}

        {footnote && (
          <div className="border-t border-[var(--border-default)] px-3 py-2 text-[11px] leading-snug text-[var(--text-tertiary)]">{footnote}</div>
        )}
      </div>
    </section>
  );
}

function LegendItem({ swatch, children }: { swatch: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-start gap-2">
      <span className={cn("map-layer-swatch mt-px", swatch)} aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}
