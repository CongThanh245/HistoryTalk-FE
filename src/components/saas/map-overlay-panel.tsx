"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, CalendarClock, LocateFixed, MapPin, Move, Plus, Save, SquarePen, Trash2, X } from "lucide-react";
import type { MapCoordinates } from "@/components/historical-map/map-overlay.types";
import { formatDueDate, isPinOverdue, todayIso } from "@/features/saas/hooks-map";
import type { ClassMapPin, LocalContext, PersonalMapPin } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

/* ───────────────────────── Shell ─────────────────────────
 * Floats top-right of the map on desktop, bottom sheet on phones. */
export function MapOverlayPanel({
  eyebrow,
  title,
  onClose,
  children,
  footer,
  className,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        "absolute z-[530] flex flex-col rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-soft)]",
        "inset-x-3 bottom-3 max-h-[62%] md:inset-x-auto md:bottom-auto md:right-4 md:top-4 md:max-h-[calc(100%-120px)] md:w-[340px]",
        className,
      )}
    >
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--text-primary)] px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{eyebrow}</p>
          <h2 className="archive-title is-plain mt-1 text-[19px]">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[2px] hover:bg-[var(--sidebar-hover-bg)]"
        >
          <X size={17} />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
      {footer && <div className="shrink-0 border-t border-[var(--text-primary)] px-4 py-3">{footer}</div>}
    </section>
  );
}

const formatYear = (year: number) => (year < 0 ? `${Math.abs(year)} TCN` : String(year));
const formatCoords = (c: MapCoordinates) => `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`;

function Tag({ tone, children }: { tone: "class" | "assignment" | "personal" | "local" | "danger"; children: React.ReactNode }) {
  const tones = {
    class: "bg-[var(--men-lam)] text-white",
    assignment: "bg-[var(--gold-leaf)] text-[#111111]",
    personal: "bg-[var(--jade)] text-white",
    local: "border border-[var(--men-lam)] text-[var(--men-lam)]",
    danger: "border border-[var(--accent-danger)] text-[var(--accent-danger)]",
  } as const;
  return (
    <span className={cn("inline-flex items-center rounded-[2px] px-2 py-0.5 text-[11px] font-bold tracking-[0.04em]", tones[tone])}>
      {children}
    </span>
  );
}

const lineBtn =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-[2px] border border-[var(--text-primary)] px-2 text-xs font-bold transition-colors hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]";
const dangerBtn =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-[2px] border border-[var(--accent-danger)] px-2 text-xs font-bold text-[var(--accent-danger)] hover:bg-[var(--status-danger-bg)]";

function EditActions({ onEdit, onMove, onDelete }: { onEdit: () => void; onMove: () => void; onDelete: () => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <button type="button" onClick={onEdit} className={lineBtn}>
        <SquarePen size={14} /> Sửa
      </button>
      <button type="button" onClick={onMove} className={lineBtn}>
        <Move size={14} /> Di chuyển
      </button>
      <button type="button" onClick={onDelete} className={dangerBtn}>
        <Trash2 size={14} /> Xóa
      </button>
    </div>
  );
}

/* ───────────────────────── Details ───────────────────────── */
export function ClassPinDetails({
  pin,
  className,
  canEdit,
  assignmentsHref,
  assignmentsLabel,
  onClose,
  onEdit,
  onMove,
  onDelete,
}: {
  pin: ClassMapPin;
  className?: string;
  canEdit: boolean;
  assignmentsHref?: string;
  assignmentsLabel?: string;
  onClose: () => void;
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  const isAssignment = pin.kind === "ASSIGNMENT";
  const overdue = isPinOverdue(pin);
  const footer =
    canEdit || (isAssignment && assignmentsHref) ? (
      <div className="space-y-2">
        {isAssignment && assignmentsHref && (
          <Link href={assignmentsHref} className="btn-crimson h-10 min-h-0 w-full px-3 text-xs">
            <BookOpen size={15} /> {assignmentsLabel ?? "Xem bài tập"} <ArrowUpRight size={15} />
          </Link>
        )}
        {canEdit && <EditActions onEdit={onEdit} onMove={onMove} onDelete={onDelete} />}
      </div>
    ) : undefined;

  return (
    <MapOverlayPanel eyebrow={className ? `Bản đồ lớp ${className}` : "Bản đồ lớp"} title={pin.label} onClose={onClose} footer={footer}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Tag tone={isAssignment ? "assignment" : "class"}>{isAssignment ? "Bài tập" : "Địa danh lịch sử địa phương"}</Tag>
        {typeof pin.year === "number" && <Tag tone="local">{formatYear(pin.year)}</Tag>}
        {overdue && <Tag tone="danger">Quá hạn</Tag>}
      </div>
      {isAssignment && pin.dueDate && (
        <p className={cn("mt-3 inline-flex items-center gap-2 text-sm font-semibold", overdue ? "text-[var(--accent-danger)]" : "text-[var(--text-primary)]")}>
          <CalendarClock size={16} aria-hidden="true" /> Hạn nộp: {formatDueDate(pin.dueDate)}
        </p>
      )}
      {pin.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{pin.description}</p>}
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
        <MapPin size={13} aria-hidden="true" /> {formatCoords(pin)}
      </p>
    </MapOverlayPanel>
  );
}

export function LocalContextDetails({
  context,
  href,
  onClose,
}: {
  context: LocalContext;
  href?: string;
  onClose: () => void;
}) {
  return (
    <MapOverlayPanel
      eyebrow="Bối cảnh địa phương"
      title={context.title}
      onClose={onClose}
      footer={
        href ? (
          <Link href={href} className="btn-crimson h-10 min-h-0 w-full px-3 text-xs">
            <BookOpen size={15} /> Xem bối cảnh <ArrowUpRight size={15} />
          </Link>
        ) : undefined
      }
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--men-lam)]">
        {[formatYear(context.year), context.location].filter(Boolean).join(" · ")}
      </p>
      {context.summary && <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{context.summary}</p>}
      <p className="mt-3 text-xs text-[var(--text-tertiary)]">Chỉ đọc · nội dung do giáo viên soạn và nhà trường đã duyệt.</p>
    </MapOverlayPanel>
  );
}

export function PersonalPinDetails({
  pin,
  onClose,
  onEdit,
  onMove,
  onDelete,
}: {
  pin: PersonalMapPin;
  onClose: () => void;
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  return (
    <MapOverlayPanel
      eyebrow="Ghim của tôi"
      title={pin.label}
      onClose={onClose}
      footer={<EditActions onEdit={onEdit} onMove={onMove} onDelete={onDelete} />}
    >
      <Tag tone="personal">Ghi chú học tập · chỉ mình bạn thấy</Tag>
      {pin.note ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{pin.note}</p>
      ) : (
        <p className="mt-3 text-sm text-[var(--text-tertiary)]">Chưa có ghi chú.</p>
      )}
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
        <MapPin size={13} aria-hidden="true" /> {formatCoords(pin)}
      </p>
    </MapOverlayPanel>
  );
}

/* ───────────────────────── Forms ───────────────────────── */
const inputClass =
  "w-full rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm outline-none focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)]";

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
      {children}
    </label>
  );
}

/** Position block shared by both forms: coordinates, re-pick on map, placement hint. */
function PositionField({
  coordinates,
  placing,
  onPick,
  extra,
}: {
  coordinates: MapCoordinates | null;
  placing: boolean;
  onPick: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <div>
      <FieldLabel>Vị trí *</FieldLabel>
      {placing || !coordinates ? (
        <p className="flex items-start gap-2 rounded-[2px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-main)] p-3 text-sm text-[var(--text-secondary)]">
          <LocateFixed size={16} className="mt-0.5 shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
          Bấm lên bản đồ để đặt ghim. Nhấn Esc để hủy.
        </p>
      ) : (
        <div className="flex items-center justify-between gap-2 rounded-[2px] border border-[var(--border-default)] px-3 py-2">
          <span className="text-sm font-semibold tabular-nums">{formatCoords(coordinates)}</span>
          <button type="button" onClick={onPick} className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--gold-on-light)] hover:underline">
            <LocateFixed size={13} /> Chọn lại
          </button>
        </div>
      )}
      {extra}
    </div>
  );
}

/** Compact bar replacing the form on phones while the user taps the map. */
function PlacingBar({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="absolute inset-x-3 bottom-3 z-[530] flex items-center justify-between gap-3 rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] px-3 py-2 text-sm font-semibold shadow-[var(--shadow-soft)] md:hidden">
      <span className="inline-flex items-center gap-2">
        <LocateFixed size={16} className="text-[var(--accent-gold)]" aria-hidden="true" /> Bấm lên bản đồ để đặt ghim
      </span>
      <button type="button" onClick={onCancel} className="btn-line h-8 min-h-0 px-3 text-xs">
        Hủy
      </button>
    </div>
  );
}

export interface ClassPinDraft {
  kind: ClassMapPin["kind"];
  label: string;
  description: string;
  year?: number;
  dueDate?: string;
}

export function ClassPinForm({
  initial,
  className,
  coordinates,
  placing,
  localContexts,
  onPickOnMap,
  onUseContext,
  onCancel,
  onSubmit,
}: {
  initial?: ClassMapPin;
  className?: string;
  coordinates: MapCoordinates | null;
  placing: boolean;
  localContexts: LocalContext[];
  onPickOnMap: () => void;
  onUseContext: (context: LocalContext) => void;
  onCancel: () => void;
  onSubmit: (draft: ClassPinDraft) => void;
}) {
  const [kind, setKind] = React.useState<ClassMapPin["kind"]>(initial?.kind ?? "LOCAL_HISTORY");
  const [label, setLabel] = React.useState(initial?.label ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [year, setYear] = React.useState(initial?.year !== undefined ? String(initial.year) : "");
  const [dueDate, setDueDate] = React.useState(initial?.dueDate?.slice(0, 10) ?? "");
  const [contextId, setContextId] = React.useState("");

  const needsDue = kind === "ASSIGNMENT";
  const yearValue = year.trim() === "" ? undefined : Number(year);
  const yearInvalid = yearValue !== undefined && !Number.isInteger(yearValue);
  const valid = Boolean(coordinates) && label.trim().length > 0 && !yearInvalid && (!needsDue || Boolean(dueDate));

  const applyContext = (id: string) => {
    setContextId(id);
    const ctx = localContexts.find((c) => c.id === id);
    if (!ctx) return;
    if (!label.trim()) setLabel(ctx.title);
    if (!description.trim()) setDescription(ctx.summary);
    if (!year.trim()) setYear(String(ctx.year));
    onUseContext(ctx);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit({
      kind,
      label: label.trim(),
      description: description.trim(),
      year: yearValue,
      dueDate: needsDue ? dueDate : undefined,
    });
  };

  return (
    <>
      {placing && <PlacingBar onCancel={onCancel} />}
      <form onSubmit={submit} className={cn(placing && "max-md:hidden")}>
        <MapOverlayPanel
          eyebrow={className ? `Bản đồ lớp ${className}` : "Bản đồ lớp"}
          title={initial ? "Sửa ghim lớp" : "Thêm ghim lớp"}
          onClose={onCancel}
          footer={
            <div className="flex gap-2">
              <button type="button" onClick={onCancel} className="btn-line h-10 min-h-0 flex-1 px-3 text-xs">
                Hủy
              </button>
              <button type="submit" disabled={!valid} className="btn-crimson h-10 min-h-0 flex-[1.4] px-3 text-xs disabled:opacity-45">
                {initial ? <Save size={15} /> : <Plus size={15} />} {initial ? "Lưu thay đổi" : "Lưu ghim"}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <PositionField
              coordinates={coordinates}
              placing={placing}
              onPick={onPickOnMap}
              extra={
                localContexts.length > 0 && (
                  <div className="mt-2">
                    <FieldLabel htmlFor="map-pin-context">Đặt từ bối cảnh địa phương</FieldLabel>
                    <select
                      id="map-pin-context"
                      value={contextId}
                      onChange={(e) => applyContext(e.target.value)}
                      className={cn(inputClass, "h-10")}
                    >
                      <option value="">— Chọn bối cảnh có tọa độ —</option>
                      {localContexts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              }
            />

            <fieldset>
              <legend className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Loại ghim *</legend>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["LOCAL_HISTORY", "Địa danh lịch sử"],
                    ["ASSIGNMENT", "Bài tập"],
                  ] as const
                ).map(([value, text]) => (
                  <label
                    key={value}
                    className={cn(
                      "flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[2px] border text-xs font-bold",
                      kind === value
                        ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
                        : "border-[var(--border-strong)] hover:border-[var(--text-primary)]",
                    )}
                  >
                    <input type="radio" name="map-pin-kind" value={value} checked={kind === value} onChange={() => setKind(value)} className="sr-only" />
                    <span className={cn("map-layer-swatch", value === "ASSIGNMENT" ? "map-layer-swatch--assignment" : "map-layer-swatch--class")} aria-hidden="true" />
                    {text}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <FieldLabel htmlFor="map-pin-label">Tên ghim *</FieldLabel>
              <input
                id="map-pin-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={120}
                required
                placeholder={needsDue ? "Ví dụ: Bài tập: Dinh Độc Lập 30/4/1975" : "Ví dụ: Bến Nhà Rồng"}
                className={cn(inputClass, "h-10")}
              />
            </div>

            <div>
              <FieldLabel htmlFor="map-pin-desc">Mô tả</FieldLabel>
              <textarea
                id="map-pin-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder={needsDue ? "Yêu cầu học sinh cần làm…" : "Vì sao địa danh này quan trọng…"}
                className={cn(inputClass, "resize-none py-2 leading-6")}
              />
            </div>

            <div className={cn("grid gap-3", needsDue ? "grid-cols-2" : "grid-cols-1")}>
              <div>
                <FieldLabel htmlFor="map-pin-year">Năm</FieldLabel>
                <input
                  id="map-pin-year"
                  inputMode="numeric"
                  value={year}
                  onChange={(e) => setYear(e.target.value.replace(/[^\d-]/g, ""))}
                  placeholder="1945"
                  className={cn(inputClass, "h-10", yearInvalid && "border-[var(--accent-danger)]")}
                />
              </div>
              {needsDue && (
                <div>
                  <FieldLabel htmlFor="map-pin-due">Hạn nộp *</FieldLabel>
                  <input
                    id="map-pin-due"
                    type="date"
                    value={dueDate}
                    min={initial?.dueDate ? undefined : todayIso()}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className={cn(inputClass, "h-10")}
                  />
                </div>
              )}
            </div>
          </div>
        </MapOverlayPanel>
      </form>
    </>
  );
}

export function PersonalPinForm({
  initial,
  coordinates,
  placing,
  onPickOnMap,
  onCancel,
  onSubmit,
}: {
  initial?: PersonalMapPin;
  coordinates: MapCoordinates | null;
  placing: boolean;
  onPickOnMap: () => void;
  onCancel: () => void;
  onSubmit: (draft: { label: string; note: string }) => void;
}) {
  const [label, setLabel] = React.useState(initial?.label ?? "");
  const [note, setNote] = React.useState(initial?.note ?? "");
  const valid = Boolean(coordinates) && label.trim().length > 0;

  return (
    <>
      {placing && <PlacingBar onCancel={onCancel} />}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSubmit({ label: label.trim(), note: note.trim() });
        }}
        className={cn(placing && "max-md:hidden")}
      >
        <MapOverlayPanel
          eyebrow="Ghim của tôi"
          title={initial ? "Sửa ghim ghi chú" : "Thêm ghim ghi chú"}
          onClose={onCancel}
          footer={
            <div className="flex gap-2">
              <button type="button" onClick={onCancel} className="btn-line h-10 min-h-0 flex-1 px-3 text-xs">
                Hủy
              </button>
              <button type="submit" disabled={!valid} className="btn-crimson h-10 min-h-0 flex-[1.4] px-3 text-xs disabled:opacity-45">
                {initial ? <Save size={15} /> : <Plus size={15} />} {initial ? "Lưu thay đổi" : "Lưu ghim"}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <PositionField coordinates={coordinates} placing={placing} onPick={onPickOnMap} />
            <div>
              <FieldLabel htmlFor="personal-pin-label">Tiêu đề *</FieldLabel>
              <input
                id="personal-pin-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={120}
                required
                placeholder="Ví dụ: Ôn thi: Điện Biên Phủ"
                className={cn(inputClass, "h-10")}
              />
            </div>
            <div>
              <FieldLabel htmlFor="personal-pin-note">Ghi chú</FieldLabel>
              <textarea
                id="personal-pin-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                maxLength={1000}
                placeholder="Mốc thời gian, nhân vật, điều cần nhớ…"
                className={cn(inputClass, "resize-none py-2 leading-6")}
              />
              <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">Chỉ mình bạn nhìn thấy ghim này.</p>
            </div>
          </div>
        </MapOverlayPanel>
      </form>
    </>
  );
}
