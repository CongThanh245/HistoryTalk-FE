"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  CalendarClock,
  Copy,
  Link2,
  LocateFixed,
  MapPin,
  Move,
  Plus,
  Save,
  SquarePen,
  Trash2,
  X,
} from "lucide-react";
import { isInsideMapBounds, type MapCoordinates } from "@/components/historical-map/map-overlay.types";
import { DueChip, noteSwatch } from "@/components/saas/map-pin-lists";
import {
  PERSONAL_PIN_COLORS,
  formatDueDate,
  isoToLocalDate,
  todayIso,
  type ClassPinView,
} from "@/features/saas/hooks-map";
import type { Assignment, ClassMapPin, Classroom, LocalContext, PersonalMapPin, PersonalPinColor } from "@/features/saas/types";
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
        "map-overlay-sheet absolute z-[530] flex flex-col rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-soft)]",
        "inset-x-2 bottom-2 max-h-[70%] md:inset-x-auto md:bottom-auto md:right-4 md:top-4 md:max-h-[calc(100%-120px)] md:w-[340px]",
        className,
      )}
    >
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--text-primary)] px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{eyebrow}</p>
          <h2 className="archive-title is-plain mt-1 text-[19px] leading-[1.25]">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[2px] hover:bg-[var(--sidebar-hover-bg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)]"
        >
          <X size={17} />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">{children}</div>
      {footer && <div className="shrink-0 border-t border-[var(--text-primary)] px-4 py-3">{footer}</div>}
    </section>
  );
}

const formatYear = (year: number) => (year < 0 ? `${Math.abs(year)} TCN` : String(year));
const formatCoords = (c: MapCoordinates) => `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`;

function Tag({ tone, children }: { tone: "class" | "assignment" | "personal" | "local" | "danger" | "neutral"; children: React.ReactNode }) {
  const tones = {
    class: "bg-[var(--men-lam)] text-white",
    assignment: "bg-[var(--gold-leaf)] text-[#111111]",
    personal: "bg-[var(--jade)] text-white",
    local: "border border-[var(--men-lam)] text-[var(--men-lam)]",
    danger: "border border-[var(--accent-danger)] text-[var(--accent-danger)]",
    neutral: "border border-[var(--border-strong)] text-[var(--text-secondary)]",
  } as const;
  return (
    <span className={cn("inline-flex items-center rounded-[2px] px-2 py-0.5 text-[11px] font-bold tracking-[0.04em]", tones[tone])}>
      {children}
    </span>
  );
}

const lineBtn =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-[2px] border border-[var(--text-primary)] px-2 text-xs font-bold transition-colors hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)] disabled:opacity-45 motion-reduce:transition-none";
const dangerBtn =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-[2px] border border-[var(--accent-danger)] px-2 text-xs font-bold text-[var(--accent-danger)] hover:bg-[var(--status-danger-bg)]";

function EditActions({ onEdit, onMove, onDelete }: { onEdit: () => void; onMove: () => void; onDelete: () => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <button type="button" onClick={onEdit} className={lineBtn}>
        <SquarePen size={14} /> Sửa
      </button>
      <button type="button" onClick={onMove} className={lineBtn} title="Bấm lên bản đồ để đặt lại vị trí">
        <Move size={14} /> Di chuyển
      </button>
      <button type="button" onClick={onDelete} className={dangerBtn}>
        <Trash2 size={14} /> Xóa
      </button>
    </div>
  );
}

function Coordinates({ value }: { value: MapCoordinates }) {
  return (
    <p className="mt-3 inline-flex items-center gap-1.5 text-xs tabular-nums text-[var(--text-tertiary)]">
      <MapPin size={13} aria-hidden="true" /> {formatCoords(value)}
    </p>
  );
}

/* ───────────────────────── Details ───────────────────────── */
export function ClassPinDetails({
  view,
  className,
  canEdit,
  studentView,
  assignmentHref,
  fallbackAssignmentsHref,
  duplicateTargets,
  onDuplicate,
  onCopyLink,
  onClose,
  onEdit,
  onMove,
  onDelete,
}: {
  view: ClassPinView;
  className?: string;
  canEdit: boolean;
  /** Student wording ("Làm bài", "Đã nộp"). */
  studentView: boolean;
  /** Page of the linked assignment. */
  assignmentHref?: string;
  /** Assignment list when the pin has no linked assignment. */
  fallbackAssignmentsHref?: string;
  /** Other classes the teacher may copy the pin to. */
  duplicateTargets?: Classroom[];
  onDuplicate?: (classId: string) => void;
  onCopyLink?: () => void;
  onClose: () => void;
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  const { pin, assignment, due, dueAt } = view;
  const isAssignment = pin.kind === "ASSIGNMENT";
  const [duplicating, setDuplicating] = React.useState(false);
  const [target, setTarget] = React.useState("");
  const href = isAssignment ? assignmentHref ?? fallbackAssignmentsHref : undefined;
  const canDuplicate = canEdit && onDuplicate && (duplicateTargets?.length ?? 0) > 0;

  const footer =
    canEdit || href ? (
      <div className="space-y-2">
        {href && (
          <Link href={href} className="btn-crimson h-10 min-h-0 w-full px-3 text-xs">
            <BookOpen size={15} />
            {assignmentHref ? (studentView ? (due?.state === "DONE" ? "Xem bài đã nộp" : "Làm bài tập") : "Mở bài tập") : "Xem danh sách bài tập"}
            <ArrowUpRight size={15} />
          </Link>
        )}
        {canEdit && <EditActions onEdit={onEdit} onMove={onMove} onDelete={onDelete} />}
        {canDuplicate &&
          (duplicating ? (
            <div className="flex gap-2">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Nhân bản sang lớp</span>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="h-9 w-full rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 text-xs font-semibold outline-none focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)]"
                >
                  <option value="">— Chọn lớp —</option>
                  {duplicateTargets!.map((c) => (
                    <option key={c.id} value={c.id}>
                      Lớp {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={!target}
                onClick={() => {
                  onDuplicate!(target);
                  setDuplicating(false);
                  setTarget("");
                }}
                className="btn-ink h-9 min-h-0 px-3 text-xs disabled:opacity-45"
              >
                Nhân bản
              </button>
              <button type="button" onClick={() => setDuplicating(false)} aria-label="Hủy nhân bản" className="grid h-9 w-9 place-items-center rounded-[2px] hover:bg-[var(--sidebar-hover-bg)]">
                <X size={15} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setDuplicating(true)} className={cn(lineBtn, "w-full")}>
              <Copy size={14} /> Nhân bản sang lớp khác
            </button>
          ))}
      </div>
    ) : undefined;

  return (
    <MapOverlayPanel eyebrow={className ? `Bản đồ lớp ${className}` : "Bản đồ lớp"} title={pin.label} onClose={onClose} footer={footer}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Tag tone={isAssignment ? "assignment" : "class"}>{isAssignment ? "Bài tập" : "Địa danh lịch sử địa phương"}</Tag>
        {typeof pin.year === "number" && <Tag tone="local">{formatYear(pin.year)}</Tag>}
        {due && <DueChip due={due} className="px-2 py-0.5 text-[11px]" />}
      </div>
      {isAssignment && dueAt && (
        <p
          className={cn(
            "mt-3 flex items-center gap-2 text-sm font-semibold",
            due?.state === "OVERDUE" ? "text-[var(--accent-danger)]" : "text-[var(--text-primary)]",
          )}
        >
          <CalendarClock size={16} aria-hidden="true" /> Hạn nộp: {formatDueDate(isoToLocalDate(dueAt))}
          {due && due.state !== "DONE" && <span className="font-normal text-[var(--text-tertiary)]">· {due.relative}</span>}
        </p>
      )}
      {isAssignment && assignment && (
        <p className="mt-2 text-[13px] leading-5 text-[var(--text-secondary)]">
          Gắn với bài tập <b className="text-[var(--text-primary)]">{assignment.title}</b>
        </p>
      )}
      {isAssignment && !assignment && !studentView && canEdit && (
        <p className="mt-2 text-[12px] leading-5 text-[var(--text-tertiary)]">Chưa gắn bài tập cụ thể — học sinh sẽ được đưa tới danh sách bài tập.</p>
      )}
      {pin.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{pin.description}</p>}
      <div className="flex items-center justify-between gap-2">
        <Coordinates value={pin} />
        {onCopyLink && (
          <button
            type="button"
            onClick={onCopyLink}
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--gold-on-light)] hover:underline"
          >
            <Link2 size={13} /> Sao chép liên kết
          </button>
        )}
      </div>
    </MapOverlayPanel>
  );
}

export function LocalContextDetails({
  context,
  href,
  onClose,
  onCreatePin,
}: {
  context: LocalContext;
  href?: string;
  onClose: () => void;
  /** Teacher: start a class pin prefilled from this context. */
  onCreatePin?: () => void;
}) {
  return (
    <MapOverlayPanel
      eyebrow={context.scope === "SCHOOL" ? "Bối cảnh địa phương · Của trường" : "Bối cảnh địa phương · Của lớp"}
      title={context.title}
      onClose={onClose}
      footer={
        href || onCreatePin ? (
          <div className="space-y-2">
            {href && (
              <Link href={href} className="btn-crimson h-10 min-h-0 w-full px-3 text-xs">
                <BookOpen size={15} /> Đọc bối cảnh <ArrowUpRight size={15} />
              </Link>
            )}
            {onCreatePin && (
              <button type="button" onClick={onCreatePin} className={cn(lineBtn, "w-full")}>
                <Plus size={14} /> Tạo ghim lớp từ bối cảnh này
              </button>
            )}
          </div>
        ) : undefined
      }
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--men-lam)]">
        {[formatYear(context.year), context.location].filter(Boolean).join(" · ")}
      </p>
      {context.summary && <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{context.summary}</p>}
      <p className="mt-3 text-xs text-[var(--text-tertiary)]">Chỉ đọc · nội dung lịch sử địa phương đã xuất bản cho lớp.</p>
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
      eyebrow="Ghi chú của tôi"
      title={pin.label}
      onClose={onClose}
      footer={<EditActions onEdit={onEdit} onMove={onMove} onDelete={onDelete} />}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)]">
          <span className={cn("map-layer-swatch", noteSwatch(pin))} aria-hidden="true" /> Chỉ mình bạn thấy
        </span>
        {pin.tag && <Tag tone="neutral">{pin.tag}</Tag>}
      </div>
      {pin.note ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{pin.note}</p>
      ) : (
        <p className="mt-3 text-sm text-[var(--text-tertiary)]">Chưa có nội dung ghi chú.</p>
      )}
      <Coordinates value={pin} />
    </MapOverlayPanel>
  );
}

/* ───────────────────────── Forms ───────────────────────── */
const inputClass =
  "w-full rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm outline-none focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)] disabled:bg-[var(--bg-deep)] disabled:text-[var(--text-secondary)]";
const invalidClass = "border-[var(--accent-danger)]";

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
      {children}
    </label>
  );
}

function FieldError({ id, children }: { id: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-[12px] leading-snug text-[var(--accent-danger)]">
      <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" /> {children}
    </p>
  );
}

const positionError = (c: MapCoordinates | null) =>
  !c ? "Chọn vị trí trên bản đồ." : !isInsideMapBounds(c) ? "Vị trí nằm ngoài vùng bản đồ (Việt Nam và Biển Đông)." : undefined;

/** Position block shared by both forms: coordinates, re-pick on map, placement hint. */
function PositionField({
  coordinates,
  placing,
  onPick,
  error,
  extra,
}: {
  coordinates: MapCoordinates | null;
  placing: boolean;
  onPick: () => void;
  error?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div>
      <FieldLabel>Vị trí *</FieldLabel>
      {placing || !coordinates ? (
        <p className="flex items-start gap-2 rounded-[2px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-main)] p-3 text-sm text-[var(--text-secondary)]">
          <LocateFixed size={16} className="mt-0.5 shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
          {placing ? "Bấm lên bản đồ để đặt ghim. Nhấn Esc để hủy." : "Chưa có vị trí."}
          {!placing && (
            <button type="button" onClick={onPick} className="ml-auto shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--gold-on-light)] hover:underline">
              Chọn trên bản đồ
            </button>
          )}
        </p>
      ) : (
        <div className={cn("flex items-center justify-between gap-2 rounded-[2px] border px-3 py-2", error ? invalidClass : "border-[var(--border-default)]")}>
          <span className="text-sm font-semibold tabular-nums">{formatCoords(coordinates)}</span>
          <button type="button" onClick={onPick} className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--gold-on-light)] hover:underline">
            <LocateFixed size={13} /> Chọn lại
          </button>
        </div>
      )}
      <FieldError id="map-pin-position-error">{error}</FieldError>
      {extra}
    </div>
  );
}

/** Compact bar replacing the form on phones while the user taps the map. */
function PlacingBar({ onCancel, text }: { onCancel: () => void; text: string }) {
  return (
    <div className="map-overlay-sheet absolute inset-x-2 bottom-2 z-[530] flex items-center justify-between gap-3 rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] px-3 py-2 text-sm font-semibold shadow-[var(--shadow-soft)] md:hidden">
      <span className="inline-flex items-center gap-2">
        <LocateFixed size={16} className="text-[var(--accent-gold)]" aria-hidden="true" /> {text}
      </span>
      <button type="button" onClick={onCancel} className="btn-line h-8 min-h-0 px-3 text-xs">
        Hủy
      </button>
    </div>
  );
}

function FormFooter({ isEdit, onCancel }: { isEdit: boolean; onCancel: () => void }) {
  return (
    <div className="flex gap-2">
      <button type="button" onClick={onCancel} className="btn-line h-10 min-h-0 flex-1 px-3 text-xs">
        Hủy
      </button>
      <button type="submit" className="btn-crimson h-10 min-h-0 flex-[1.4] px-3 text-xs">
        {isEdit ? <Save size={15} /> : <Plus size={15} />} {isEdit ? "Lưu thay đổi" : "Lưu ghim"}
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
  assignmentId?: string;
}

export function ClassPinForm({
  initial,
  initialContextId,
  className,
  coordinates,
  placing,
  localContexts,
  assignments,
  assignmentsHref,
  onPickOnMap,
  onUseContext,
  onCancel,
  onSubmit,
}: {
  initial?: ClassMapPin;
  /** Prefill from this context (opened from a context's details). */
  initialContextId?: string;
  className?: string;
  coordinates: MapCoordinates | null;
  placing: boolean;
  /** Published local contexts with coordinates the pin can be placed on. */
  localContexts: LocalContext[];
  /** Assignments of the class an ASSIGNMENT pin can point at. */
  assignments: Assignment[];
  assignmentsHref?: string;
  onPickOnMap: () => void;
  onUseContext: (context: LocalContext) => void;
  onCancel: () => void;
  onSubmit: (draft: ClassPinDraft) => void;
}) {
  const startContext = initialContextId ? localContexts.find((c) => c.id === initialContextId) : undefined;
  const [kind, setKind] = React.useState<ClassMapPin["kind"]>(initial?.kind ?? "LOCAL_HISTORY");
  const [label, setLabel] = React.useState(initial?.label ?? startContext?.title ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? startContext?.summary ?? "");
  const [year, setYear] = React.useState(
    initial?.year !== undefined ? String(initial.year) : startContext ? String(startContext.year) : "",
  );
  const [dueDate, setDueDate] = React.useState(initial?.dueDate?.slice(0, 10) ?? "");
  const [assignmentId, setAssignmentId] = React.useState(
    initial?.assignmentId && assignments.some((a) => a.id === initial.assignmentId) ? initial.assignmentId : "",
  );
  const [contextId, setContextId] = React.useState(startContext?.id ?? "");
  const [submitted, setSubmitted] = React.useState(false);

  const needsDue = kind === "ASSIGNMENT";
  const linked = needsDue ? assignments.find((a) => a.id === assignmentId) : undefined;
  const effectiveDue = linked ? isoToLocalDate(linked.dueAt) : dueDate;
  const yearValue = year.trim() === "" || year.trim() === "-" ? undefined : Number(year);
  const errors = {
    position: positionError(coordinates),
    label: label.trim() ? undefined : "Nhập tên ghim.",
    year: yearValue !== undefined && !Number.isInteger(yearValue) ? "Năm phải là số nguyên (số âm = trước Công nguyên)." : undefined,
    due: needsDue && !effectiveDue ? "Chọn hạn nộp hoặc gắn một bài tập của lớp." : undefined,
  };
  const valid = !Object.values(errors).some(Boolean);
  const show = (key: keyof typeof errors) => (submitted ? errors[key] : undefined);

  const applyContext = (id: string) => {
    setContextId(id);
    const ctx = localContexts.find((c) => c.id === id);
    if (!ctx) return;
    if (!label.trim()) setLabel(ctx.title);
    if (!description.trim()) setDescription(ctx.summary);
    if (!year.trim()) setYear(String(ctx.year));
    onUseContext(ctx);
  };

  const applyAssignment = (id: string) => {
    setAssignmentId(id);
    const a = assignments.find((x) => x.id === id);
    if (!a) return;
    if (!label.trim()) setLabel(`Bài tập: ${a.title}`);
    if (!description.trim()) setDescription(a.instructions);
    setDueDate(isoToLocalDate(a.dueAt));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!valid) return;
    onSubmit({
      kind,
      label: label.trim(),
      description: description.trim(),
      year: yearValue,
      dueDate: needsDue ? effectiveDue : undefined,
      assignmentId: linked?.id,
    });
  };

  return (
    <>
      {placing && <PlacingBar onCancel={onCancel} text="Bấm lên bản đồ để đặt ghim" />}
      <form onSubmit={submit} noValidate className={cn(placing && "max-md:hidden")}>
        <MapOverlayPanel
          eyebrow={className ? `Bản đồ lớp ${className}` : "Bản đồ lớp"}
          title={initial ? "Sửa ghim lớp" : "Thêm ghim lớp"}
          onClose={onCancel}
          footer={<FormFooter isEdit={Boolean(initial)} onCancel={onCancel} />}
        >
          <div className="space-y-4">
            <PositionField
              coordinates={coordinates}
              placing={placing}
              onPick={onPickOnMap}
              error={show("position") ?? (coordinates && !isInsideMapBounds(coordinates) ? errors.position : undefined)}
              extra={
                localContexts.length > 0 ? (
                  <div className="mt-2">
                    <FieldLabel htmlFor="map-pin-context">Hoặc đặt tại bối cảnh địa phương</FieldLabel>
                    <select
                      id="map-pin-context"
                      value={contextId}
                      onChange={(e) => applyContext(e.target.value)}
                      className={cn(inputClass, "h-10")}
                    >
                      <option value="">— Chọn bối cảnh đã xuất bản —</option>
                      {localContexts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} · {formatYear(c.year)}{c.scope === "SCHOOL" ? " · Của trường" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="mt-1.5 text-[11px] leading-snug text-[var(--text-tertiary)]">
                    Bối cảnh địa phương đã xuất bản có tọa độ sẽ xuất hiện ở đây để đặt ghim nhanh.
                  </p>
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
                      "flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[2px] border text-xs font-bold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--accent-gold)]",
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

            {needsDue && (
              <div>
                <FieldLabel htmlFor="map-pin-assignment">Gắn bài tập của lớp</FieldLabel>
                {assignments.length > 0 ? (
                  <select id="map-pin-assignment" value={assignmentId} onChange={(e) => applyAssignment(e.target.value)} className={cn(inputClass, "h-10")}>
                    <option value="">— Không gắn (tự đặt hạn nộp) —</option>
                    {assignments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} · hạn {formatDueDate(isoToLocalDate(a.dueAt))}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[12px] leading-5 text-[var(--text-tertiary)]">
                    Lớp chưa có bài tập nào.{" "}
                    {assignmentsHref && (
                      <Link href={assignmentsHref} className="font-bold text-[var(--gold-on-light)] hover:underline">
                        Giao bài tập
                      </Link>
                    )}
                  </p>
                )}
              </div>
            )}

            <div>
              <FieldLabel htmlFor="map-pin-label">Tên ghim *</FieldLabel>
              <input
                id="map-pin-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={120}
                aria-invalid={Boolean(show("label"))}
                aria-describedby={show("label") ? "map-pin-label-error" : undefined}
                placeholder={needsDue ? "Ví dụ: Bài tập: Dinh Độc Lập 30/4/1975" : "Ví dụ: Bến Nhà Rồng"}
                className={cn(inputClass, "h-10", show("label") && invalidClass)}
              />
              <FieldError id="map-pin-label-error">{show("label")}</FieldError>
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
                  aria-invalid={Boolean(errors.year)}
                  className={cn(inputClass, "h-10", errors.year && invalidClass)}
                />
              </div>
              {needsDue && (
                <div>
                  <FieldLabel htmlFor="map-pin-due">Hạn nộp *</FieldLabel>
                  <input
                    id="map-pin-due"
                    type="date"
                    value={effectiveDue}
                    min={initial?.dueDate || linked ? undefined : todayIso()}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={Boolean(linked)}
                    aria-invalid={Boolean(show("due"))}
                    className={cn(inputClass, "h-10", show("due") && invalidClass)}
                  />
                </div>
              )}
            </div>
            <FieldError id="map-pin-year-error">{errors.year}</FieldError>
            {needsDue && linked && <p className="-mt-2 text-[11px] text-[var(--text-tertiary)]">Hạn nộp lấy theo bài tập đã gắn.</p>}
            <FieldError id="map-pin-due-error">{show("due")}</FieldError>
            {submitted && !valid && (
              <p className="text-[12px] font-semibold text-[var(--accent-danger)]">Kiểm tra lại các trường được đánh dấu.</p>
            )}
          </div>
        </MapOverlayPanel>
      </form>
    </>
  );
}

export interface PersonalPinDraft {
  label: string;
  note: string;
  color?: PersonalPinColor;
  tag?: string;
}

export function PersonalPinForm({
  initial,
  coordinates,
  placing,
  knownTags,
  onPickOnMap,
  onCancel,
  onSubmit,
}: {
  initial?: PersonalMapPin;
  coordinates: MapCoordinates | null;
  placing: boolean;
  /** Tags already used, suggested while typing. */
  knownTags: string[];
  onPickOnMap: () => void;
  onCancel: () => void;
  onSubmit: (draft: PersonalPinDraft) => void;
}) {
  const [label, setLabel] = React.useState(initial?.label ?? "");
  const [note, setNote] = React.useState(initial?.note ?? "");
  const [color, setColor] = React.useState<PersonalPinColor>(initial?.color ?? "jade");
  const [tag, setTag] = React.useState(initial?.tag ?? "");
  const [submitted, setSubmitted] = React.useState(false);
  const errors = { position: positionError(coordinates), label: label.trim() ? undefined : "Nhập tiêu đề ghi chú." };
  const valid = !errors.position && !errors.label;
  const tagListId = React.useId();

  return (
    <>
      {placing && <PlacingBar onCancel={onCancel} text="Chạm vào nơi muốn ghi chú" />}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (valid) onSubmit({ label: label.trim(), note: note.trim(), color, tag: tag.trim() || undefined });
        }}
        className={cn(placing && "max-md:hidden")}
      >
        <MapOverlayPanel
          eyebrow="Ghi chú của tôi"
          title={initial ? "Sửa ghi chú" : "Thêm ghi chú"}
          onClose={onCancel}
          footer={<FormFooter isEdit={Boolean(initial)} onCancel={onCancel} />}
        >
          <div className="space-y-4">
            <PositionField coordinates={coordinates} placing={placing} onPick={onPickOnMap} error={submitted ? errors.position : undefined} />
            <div>
              <FieldLabel htmlFor="personal-pin-label">Tiêu đề *</FieldLabel>
              <input
                id="personal-pin-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={120}
                aria-invalid={submitted && Boolean(errors.label)}
                aria-describedby={submitted && errors.label ? "personal-pin-label-error" : undefined}
                placeholder="Ví dụ: Ôn thi: Điện Biên Phủ"
                className={cn(inputClass, "h-10", submitted && errors.label && invalidClass)}
              />
              <FieldError id="personal-pin-label-error">{submitted ? errors.label : undefined}</FieldError>
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
              <p className="mt-1 text-right text-[11px] tabular-nums text-[var(--text-tertiary)]">{note.length}/1000</p>
            </div>
            <div className="grid grid-cols-[1fr_auto] items-end gap-3">
              <div className="min-w-0">
                <FieldLabel htmlFor="personal-pin-tag">Nhãn</FieldLabel>
                <input
                  id="personal-pin-tag"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  maxLength={24}
                  list={tagListId}
                  placeholder="Ôn thi, Tham quan…"
                  className={cn(inputClass, "h-10")}
                />
                <datalist id={tagListId}>
                  {knownTags.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
              <fieldset>
                <legend className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Màu</legend>
                <div className="flex h-10 items-center gap-1.5">
                  {PERSONAL_PIN_COLORS.map((c) => (
                    <label key={c.value} title={c.label} className="relative grid h-7 w-7 cursor-pointer place-items-center rounded-[2px] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--accent-gold)]">
                      <input
                        type="radio"
                        name="personal-pin-color"
                        value={c.value}
                        checked={color === c.value}
                        onChange={() => setColor(c.value)}
                        className="sr-only"
                        aria-label={c.label}
                      />
                      <span
                        className={cn(
                          "map-layer-swatch h-5 w-5",
                          noteSwatch({ color: c.value } as PersonalMapPin),
                          color === c.value && "outline-2 outline-offset-2 outline-[var(--text-primary)]",
                        )}
                        aria-hidden="true"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <p className="text-[11px] text-[var(--text-tertiary)]">Chỉ mình bạn nhìn thấy ghi chú này.</p>
          </div>
        </MapOverlayPanel>
      </form>
    </>
  );
}
