"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, ArrowUpRight, Bookmark, LocateFixed, MapPin, MousePointerClick, Plus, RefreshCw, Swords } from "lucide-react";
import type { BattleOverviewItem, StudyNoteSummary } from "@/components/historical-map/map-overlay.types";
import { matchesQuery } from "@/components/saas/map-search";
import { formatDueDate, isoToLocalDate, type ClassPinView, type PinDue } from "@/features/saas/hooks-map";
import type { LocalContext, PersonalMapPin } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

/* ───────────────────────── Building blocks ───────────────────────── */

const SECTION_LABEL = "text-xs font-semibold text-[var(--text-tertiary)]";

function ListHeader({ title, meta, action }: { title: string; meta?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 pb-1.5 pt-2.5">
      <p className={SECTION_LABEL}>
        {title}
        {meta !== undefined && <span className="ml-1.5 font-semibold normal-case tracking-normal tabular-nums">{meta}</span>}
      </p>
      {action}
    </div>
  );
}

function ListSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="px-3 pb-2">
      <label className="block">
        <span className="sr-only">{placeholder}</span>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && value) {
              e.stopPropagation();
              onChange("");
            }
          }}
          placeholder={placeholder}
          className="h-8 w-full rounded-sm border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 text-[13px] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)]"
        />
      </label>
    </div>
  );
}

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5 px-3 pb-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-sm border px-2 text-[11px] font-bold transition-colors motion-reduce:transition-none",
            value === o.value
              ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
              : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]",
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="tabular-nums opacity-75">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Row = a button that flies to the item, plus optional trailing link (never nested interactives). */
function ListRow({
  selected,
  onPick,
  swatch,
  title,
  meta,
  chip,
  trailing,
}: {
  selected: boolean;
  onPick: () => void;
  swatch: string;
  title: string;
  meta?: React.ReactNode;
  chip?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <li className={cn("flex items-stretch", selected && "bg-[var(--sidebar-hover-bg)]")}>
      <button
        type="button"
        onClick={onPick}
        aria-current={selected ? "true" : undefined}
        className="flex min-w-0 flex-1 items-start gap-2.5 px-3 py-2 text-left outline-none hover:bg-[var(--sidebar-hover-bg)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-gold)]"
      >
        <span className={cn("map-layer-swatch mt-1", swatch)} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold leading-snug text-[var(--text-primary)]">{title}</span>
          {(meta || chip) && (
            <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] leading-snug text-[var(--text-tertiary)]">
              {chip}
              {meta}
            </span>
          )}
        </span>
      </button>
      {trailing && <span className="flex shrink-0 items-center pr-2">{trailing}</span>}
    </li>
  );
}

const DUE_CHIP: Record<PinDue["state"], string> = {
  DONE: "bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success-border)]",
  OVERDUE: "border-[var(--accent-danger)] text-[var(--accent-danger)]",
  DUE_SOON: "border-[var(--accent-gold)] bg-[var(--accent-gold-active-bg)] text-[var(--gold-on-light)]",
  OPEN: "border-[var(--border-strong)] text-[var(--text-secondary)]",
};

export function DueChip({ due, className }: { due: PinDue; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-sm border px-1.5 py-px text-[10.5px] font-bold leading-4", DUE_CHIP[due.state], className)}>
      {due.label}
    </span>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="px-3 pb-3 text-[13px] leading-5 text-[var(--text-tertiary)]">{children}</p>;
}

const trailingLink =
  "inline-flex h-7 items-center gap-0.5 rounded-sm px-1.5 text-xs font-semibold text-[var(--gold-on-light)] outline-none hover:bg-[var(--accent-gold-active-bg)] focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]";

const formatYear = (year: number) => (year < 0 ? `${Math.abs(year)} TCN` : String(year));

/** Tabs when a role has more than one list (student: class map + notes). */
export function ListTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="tablist" aria-label="Danh sách trên bản đồ" className="flex border-b border-[var(--border-default)]">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "flex-1 px-2 py-2 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-gold)]",
            value === t.value
              ? "border-b-2 border-border-card text-[var(--text-primary)]"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1 tabular-nums opacity-75">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ───────────────────────── Personal notes ───────────────────────── */

const NOTE_SWATCH: Record<NonNullable<PersonalMapPin["color"]>, string> = {
  jade: "map-layer-swatch--personal",
  "men-lam": "map-layer-swatch--class",
  gold: "map-layer-swatch--assignment",
  crimson: "map-layer-swatch--crimson",
  ink: "map-layer-swatch--ink",
};

export const noteSwatch = (pin: PersonalMapPin) => NOTE_SWATCH[pin.color ?? "jade"];

export function PersonalNotesList({
  pins,
  selectedId,
  onPick,
  onAdd,
  limit,
  loading,
}: {
  pins: PersonalMapPin[];
  /** Selected note id (without prefix). */
  selectedId: string | null;
  onPick: (id: string) => void;
  /** Undefined when adding is not possible (layer hidden, placement running, limit reached). */
  onAdd?: () => void;
  limit: number;
  loading?: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const [tag, setTag] = React.useState("ALL");
  const tags = React.useMemo(
    () => Array.from(new Set(pins.map((p) => p.tag?.trim()).filter((t): t is string => Boolean(t)))).sort((a, b) => a.localeCompare(b, "vi")),
    [pins],
  );
  const activeTag = tag === "ALL" || tags.includes(tag) ? tag : "ALL";
  const shown = pins
    .filter((p) => (activeTag === "ALL" || p.tag?.trim() === activeTag) && matchesQuery(query, p.label, p.note, p.tag))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <ListHeader
        title="Ghi chú của tôi"
        meta={loading ? undefined : `${pins.length}/${limit}`}
        action={
          onAdd && pins.length > 0 ? (
            <button type="button" onClick={onAdd} className={trailingLink}>
              <Plus size={13} /> Thêm
            </button>
          ) : undefined
        }
      />
      {loading ? (
        <EmptyNote>Đang tải ghi chú…</EmptyNote>
      ) : pins.length === 0 ? (
        <div className="mx-3 mb-3 rounded-sm border border-dashed border-[var(--border-strong)] bg-[var(--bg-main)] p-3">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)]">
            <Bookmark size={15} className="text-[var(--jade)]" aria-hidden="true" /> Chưa có ghi chú nào
          </p>
          <ol className="mt-2 space-y-1.5 text-[12px] leading-5 text-[var(--text-secondary)]">
            <li className="flex gap-2">
              <span className="font-bold tabular-nums text-[var(--text-tertiary)]">1</span>
              <span>Bấm «Thêm ghi chú».</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold tabular-nums text-[var(--text-tertiary)]">2</span>
              <span className="inline-flex items-start gap-1">
                <MousePointerClick size={13} className="mt-1 shrink-0" aria-hidden="true" /> Chạm vào nơi muốn ghi nhớ trên bản đồ (Esc để hủy).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold tabular-nums text-[var(--text-tertiary)]">3</span>
              <span>Đặt tiêu đề, ghi chú, màu và nhãn rồi lưu. Chỉ mình bạn nhìn thấy.</span>
            </li>
          </ol>
          {onAdd && (
            <button type="button" onClick={onAdd} className="btn-ink mt-3 h-9 min-h-0 w-full px-3 text-xs">
              <LocateFixed size={15} /> Thêm ghi chú đầu tiên
            </button>
          )}
        </div>
      ) : (
        <>
          {pins.length > 4 && <ListSearch value={query} onChange={setQuery} placeholder="Tìm trong ghi chú…" />}
          {tags.length > 0 && (
            <FilterChips
              label="Lọc theo nhãn"
              value={activeTag}
              onChange={setTag}
              options={[{ value: "ALL", label: "Tất cả" }, ...tags.map((t) => ({ value: t, label: t, count: pins.filter((p) => p.tag?.trim() === t).length }))]}
            />
          )}
          {shown.length === 0 ? (
            <EmptyNote>Không có ghi chú khớp bộ lọc.</EmptyNote>
          ) : (
            <ul className="pb-1">
              {shown.map((p) => (
                <ListRow
                  key={p.id}
                  selected={selectedId === p.id}
                  onPick={() => onPick(p.id)}
                  swatch={noteSwatch(p)}
                  title={p.label}
                  chip={p.tag ? <span className="font-bold text-[var(--text-secondary)]">{p.tag}</span> : undefined}
                  meta={p.note ? <span className="truncate">{p.note}</span> : undefined}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/* ───────────────────────── Study notes (API) ───────────────────────── */

/**
 * The viewer's own study notes (USER map pins), grouped by battle. Each note is anchored to a battle
 * and its year, so it is added from the battle's side panel; picking one opens that battle.
 */
export function StudyNotesList({
  notes,
  loading,
  selectedId,
  onPick,
  onAdd,
}: {
  notes: StudyNoteSummary[];
  loading: boolean;
  selectedId: string | null;
  onPick: (note: StudyNoteSummary) => void;
  /** Present while a battle is selected (the note goes on that battle). */
  onAdd?: () => void;
}) {
  const [query, setQuery] = React.useState("");
  const shown = notes.filter((n) => matchesQuery(query, n.label, n.note ?? undefined, n.battleTitle));
  const groups = React.useMemo(() => {
    const map = new Map<string, { title: string; year: number; items: StudyNoteSummary[] }>();
    for (const n of shown) {
      const group = map.get(n.contextId) ?? { title: n.battleTitle, year: n.year, items: [] };
      group.items.push(n);
      map.set(n.contextId, group);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].year - b[1].year);
  }, [shown]);

  return (
    <div>
      <ListHeader
        title="Ghi chú của tôi"
        meta={loading ? undefined : notes.length}
        action={
          onAdd ? (
            <button type="button" onClick={onAdd} className={trailingLink}>
              <Plus size={13} /> Thêm
            </button>
          ) : undefined
        }
      />
      {loading && notes.length === 0 ? (
        <EmptyNote>Đang tải ghi chú…</EmptyNote>
      ) : notes.length === 0 ? (
        <div className="mx-3 mb-3 rounded-sm border border-dashed border-[var(--border-strong)] bg-[var(--bg-main)] p-3">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)]">
            <Bookmark size={15} className="text-[var(--jade)]" aria-hidden="true" /> Chưa có ghi chú nào
          </p>
          <ol className="mt-2 space-y-1.5 text-[12px] leading-5 text-[var(--text-secondary)]">
            <li className="flex gap-2">
              <span className="font-bold tabular-nums text-[var(--text-tertiary)]">1</span>
              <span>Chọn một trận đánh trên bản đồ.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold tabular-nums text-[var(--text-tertiary)]">2</span>
              <span className="inline-flex items-start gap-1">
                <MousePointerClick size={13} className="mt-1 shrink-0" aria-hidden="true" /> Bấm «Thêm ghi chú» rồi chạm vào nơi muốn ghi nhớ.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold tabular-nums text-[var(--text-tertiary)]">3</span>
              <span>Đặt tiêu đề, viết ghi chú rồi lưu. Chỉ mình bạn nhìn thấy.</span>
            </li>
          </ol>
          {onAdd && (
            <button type="button" onClick={onAdd} className="btn-ink mt-3 h-9 min-h-0 w-full px-3 text-xs">
              <LocateFixed size={15} /> Thêm ghi chú cho trận này
            </button>
          )}
        </div>
      ) : (
        <>
          {notes.length > 4 && <ListSearch value={query} onChange={setQuery} placeholder="Tìm trong ghi chú…" />}
          {groups.length === 0 ? (
            <EmptyNote>Không có ghi chú khớp từ khóa.</EmptyNote>
          ) : (
            groups.map(([contextId, group]) => (
              <div key={contextId} className="pb-1">
                <p className="flex items-center gap-1.5 px-3 pb-0.5 pt-1.5 text-[11px] font-bold text-[var(--text-secondary)]">
                  <Swords size={12} className="shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
                  <span className="truncate">{group.title}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-[var(--text-tertiary)]">· {formatYear(group.year)}</span>
                </p>
                <ul>
                  {group.items.map((n) => (
                    <ListRow
                      key={n.pinId}
                      selected={selectedId === n.pinId}
                      onPick={() => onPick(n)}
                      swatch="map-layer-swatch--personal"
                      title={n.label}
                      meta={n.note?.trim() ? <span className="truncate">{n.note}</span> : undefined}
                    />
                  ))}
                </ul>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

/* ───────────────────────── Class map ───────────────────────── */

type ClassFilter = "ALL" | "LOCAL_HISTORY" | "ASSIGNMENT" | "CONTEXT";

/**
 * Class layer list.
 * - student: sorted by due date, due chips (Sắp hạn / Quá hạn / Đã nộp), links to the assignment and local page.
 * - manage: teacher editor list with search and kind filter.
 * - readonly: School Admin / Content Admin preview.
 */
export function ClassMapList({
  mode,
  className,
  views,
  contexts,
  selectedId,
  onPickPin,
  onPickContext,
  assignmentHref,
  contextHref,
  onAdd,
  loading,
}: {
  mode: "student" | "manage" | "readonly";
  className?: string;
  views: ClassPinView[];
  contexts: LocalContext[];
  /** Selected overlay id ("class:<id>" / "local:<id>"). */
  selectedId: string | null;
  onPickPin: (id: string) => void;
  onPickContext: (id: string) => void;
  assignmentHref?: (view: ClassPinView) => string | undefined;
  contextHref?: (context: LocalContext) => string | undefined;
  onAdd?: () => void;
  loading?: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<ClassFilter>("ALL");
  const total = views.length + contexts.length;

  const sortedViews = React.useMemo(() => {
    const rank = (v: ClassPinView) => (v.pin.kind !== "ASSIGNMENT" ? 2 : v.due?.state === "DONE" ? 1 : 0);
    return [...views].sort(
      (a, b) =>
        rank(a) - rank(b) ||
        (a.dueAt ?? "").localeCompare(b.dueAt ?? "") ||
        (a.pin.year ?? 0) - (b.pin.year ?? 0) ||
        a.pin.label.localeCompare(b.pin.label, "vi"),
    );
  }, [views]);

  const counts = {
    LOCAL_HISTORY: views.filter((v) => v.pin.kind === "LOCAL_HISTORY").length,
    ASSIGNMENT: views.filter((v) => v.pin.kind === "ASSIGNMENT").length,
    CONTEXT: contexts.length,
  };

  const shownViews = sortedViews.filter(
    (v) =>
      (filter === "ALL" || filter === v.pin.kind) &&
      matchesQuery(query, v.pin.label, v.pin.description, v.assignment?.title),
  );
  const shownContexts = contexts.filter(
    (c) => (filter === "ALL" || filter === "CONTEXT") && matchesQuery(query, c.title, c.location, c.summary),
  );

  const title = mode === "student" ? "Trên bản đồ tư liệu" : mode === "manage" ? "Ghim của lớp" : "Bản đồ tư liệu";

  return (
    <div>
      <ListHeader
        title={title}
        meta={loading ? undefined : className ? `${className} · ${total}` : total}
        action={
          onAdd && total > 0 ? (
            <button type="button" onClick={onAdd} className={trailingLink}>
              <Plus size={13} /> Thêm
            </button>
          ) : undefined
        }
      />
      {loading ? (
        <EmptyNote>Đang tải bản đồ tư liệu…</EmptyNote>
      ) : total === 0 ? (
        mode === "manage" ? (
          <div className="mx-3 mb-3 rounded-sm border border-dashed border-[var(--border-strong)] bg-[var(--bg-main)] p-3">
            <p className="text-[13px] font-semibold">Lớp chưa có ghim nào</p>
            <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">
              Ghim địa danh lịch sử, đặt ghim từ bối cảnh địa phương đã xuất bản, hoặc gắn bài tập có hạn nộp.
            </p>
            {onAdd && (
              <button type="button" onClick={onAdd} className="btn-ink mt-3 h-9 min-h-0 w-full px-3 text-xs">
                <Plus size={15} /> Thêm ghim lớp
              </button>
            )}
          </div>
        ) : (
          <EmptyNote>{mode === "student" ? "Giáo viên chưa ghim điểm nào cho lớp." : "Lớp chưa có ghim nào."}</EmptyNote>
        )
      ) : (
        <>
          {(mode !== "student" || total > 6) && (
            <ListSearch value={query} onChange={setQuery} placeholder="Tìm ghim của lớp…" />
          )}
          {mode !== "student" && (
            <FilterChips
              label="Lọc loại ghim"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "ALL", label: "Tất cả", count: total },
                { value: "LOCAL_HISTORY", label: "Địa danh", count: counts.LOCAL_HISTORY },
                { value: "ASSIGNMENT", label: "Bài tập", count: counts.ASSIGNMENT },
                ...(counts.CONTEXT > 0 ? [{ value: "CONTEXT" as const, label: "Bối cảnh", count: counts.CONTEXT }] : []),
              ]}
            />
          )}
          {shownViews.length + shownContexts.length === 0 ? (
            <EmptyNote>Không có ghim khớp bộ lọc.</EmptyNote>
          ) : (
            <ul className="pb-1">
              {shownViews.map((v) => {
                const isAssignment = v.pin.kind === "ASSIGNMENT";
                const href = isAssignment ? assignmentHref?.(v) : undefined;
                return (
                  <ListRow
                    key={v.pin.id}
                    selected={selectedId === `class:${v.pin.id}`}
                    onPick={() => onPickPin(v.pin.id)}
                    swatch={isAssignment ? "map-layer-swatch--assignment" : "map-layer-swatch--class"}
                    title={v.pin.label}
                    chip={isAssignment && v.due ? <DueChip due={v.due} /> : undefined}
                    meta={
                      isAssignment ? (
                        <span>
                          {v.dueAt ? `Hạn ${formatDueDate(isoToLocalDate(v.dueAt))}` : "Chưa có hạn"}
                          {v.due && v.due.state !== "DONE" ? ` · ${v.due.relative}` : ""}
                        </span>
                      ) : (
                        <span>Địa danh{typeof v.pin.year === "number" ? ` · ${formatYear(v.pin.year)}` : ""}</span>
                      )
                    }
                    trailing={
                      href ? (
                        <Link href={href} className={trailingLink} aria-label={`Mở bài tập ${v.assignment?.title ?? v.pin.label}`}>
                          {mode === "student" && v.due?.state !== "DONE" ? "Làm bài" : "Mở"} <ArrowUpRight size={12} />
                        </Link>
                      ) : undefined
                    }
                  />
                );
              })}
              {shownContexts.map((c) => {
                const href = contextHref?.(c);
                return (
                  <ListRow
                    key={c.id}
                    selected={selectedId === `local:${c.id}`}
                    onPick={() => onPickContext(c.id)}
                    swatch="map-layer-swatch--local"
                    title={c.title}
                    meta={<span>{c.scope === "SCHOOL" ? "Của trường" : "Bối cảnh lớp"} · {formatYear(c.year)}</span>}
                    trailing={
                      href ? (
                        <Link href={href} className={trailingLink} aria-label={`Đọc bối cảnh ${c.title}`}>
                          Đọc <ArrowUpRight size={12} />
                        </Link>
                      ) : undefined
                    }
                  />
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/* ───────────────────────── Battle overview (Content Admin) ───────────────────────── */

type BattleFilter = "ALL" | "UNPINNED" | "INCOMPLETE";

/** One step of a battle's setup as a dot + word: filled when done, hollow when still to do. */
function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1", ok ? "text-[var(--status-success)]" : "text-[var(--text-tertiary)]")}
      title={`${label}: ${ok ? "đã có" : "chưa có"}`}
    >
      <span
        aria-hidden="true"
        className={cn("h-1.5 w-1.5 rounded-full", ok ? "bg-[var(--status-success)]" : "border border-[var(--border-strong)]")}
      />
      <span className="sr-only">{ok ? "Đã có" : "Chưa có"}</span> {label}
    </span>
  );
}

export function BattleOverviewList({
  battles,
  loading,
  error,
  onRetry,
  selectedId,
  onPick,
  title = "Tổng quan trận đánh",
  noun = "trận đánh",
  intro,
}: {
  battles: BattleOverviewItem[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  selectedId: string | null;
  onPick: (id: string) => void;
  title?: string;
  /** What the items are called in messages ("trận đánh", "bối cảnh"). */
  noun?: string;
  /** Short how-to shown above the list. */
  intro?: React.ReactNode;
}) {
  const [filter, setFilter] = React.useState<BattleFilter>("ALL");
  const [query, setQuery] = React.useState("");
  const pinned = battles.filter((b) => b.coordinates).length;
  // Narration and the battle map are both "content to write", so they share one filter.
  const incomplete = battles.filter((b) => !b.hasNarration || !b.hasBattleMap).length;

  const shown = battles
    .filter((b) =>
      filter === "UNPINNED" ? !b.coordinates : filter === "INCOMPLETE" ? !b.hasNarration || !b.hasBattleMap : true,
    )
    .filter((b) => matchesQuery(query, b.title, b.location, String(b.year)))
    .sort((a, b) => a.year - b.year);

  return (
    <div>
      <ListHeader title={title} meta={loading ? undefined : battles.length} />
      {intro}
      {error ? (
        <div className="mx-3 mb-3 flex items-start gap-2 rounded-sm border border-[var(--accent-danger)] p-3 text-[13px]">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--accent-danger)]" aria-hidden="true" />
          <div>
            <p className="font-semibold">Không tải được danh sách {noun}</p>
            <button type="button" onClick={onRetry} className="btn-line mt-2 h-8 min-h-0 px-2.5 text-xs">
              <RefreshCw size={13} /> Thử lại
            </button>
          </div>
        </div>
      ) : loading ? (
        <ul className="space-y-2 px-3 pb-3" aria-label="Đang tải">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-10 animate-pulse rounded-sm bg-[var(--bg-main)] motion-reduce:animate-none" />
          ))}
        </ul>
      ) : battles.length === 0 ? (
        <EmptyNote>Chưa có bối cảnh lịch sử nào. Tạo bối cảnh trong mục Bối cảnh để ghim lên bản đồ.</EmptyNote>
      ) : (
        <>
          <FilterChips
            label={`Lọc ${noun}`}
            value={filter}
            onChange={setFilter}
            // Nhom da xong (0 muc) khong can loc; bo dem thay cho o thong ke rieng.
            options={[
              { value: "ALL" as const, label: "Tất cả", count: battles.length },
              { value: "UNPINNED" as const, label: "Chưa ghim", count: battles.length - pinned },
              { value: "INCOMPLETE" as const, label: "Thiếu nội dung", count: incomplete },
            ].filter((o) => o.value === "ALL" || o.value === filter || o.count > 0)}
          />
          {battles.length > 6 && <ListSearch value={query} onChange={setQuery} placeholder="Lọc theo tên, năm, địa điểm…" />}
          {shown.length === 0 ? (
            <EmptyNote>{filter === "ALL" ? `Không có ${noun} khớp từ khóa.` : `Tốt lắm — không còn ${noun} nào trong nhóm này.`}</EmptyNote>
          ) : (
            <ul className="pb-1">
              {shown.map((b) => (
                <li key={b.id} className={cn(selectedId === b.id && "bg-[var(--sidebar-hover-bg)]")}>
                  <button
                    type="button"
                    onClick={() => onPick(b.id)}
                    aria-current={selectedId === b.id ? "true" : undefined}
                    className="flex w-full items-start gap-2.5 px-3 py-2 text-left outline-none hover:bg-[var(--sidebar-hover-bg)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-gold)]"
                  >
                    {b.coordinates ? (
                      <Swords size={14} className="mt-0.5 shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
                    ) : (
                      <MapPin size={14} className="mt-0.5 shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold leading-snug">{b.title}</span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-[var(--text-tertiary)]">
                        {[formatYear(b.year), b.location].filter(Boolean).join(" · ")}
                      </span>
                      {/* Mot dong cham trang thai thay cho ba nhan: day = da co, rong = con thieu. */}
                      <span className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10.5px] font-semibold leading-4">
                        <StatusDot ok={!!b.coordinates} label="Ghim" />
                        <StatusDot ok={b.hasNarration} label="Thuyết minh" />
                        <StatusDot ok={b.hasBattleMap} label="Lược đồ" />
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
