"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { Bookmark, Loader2, LocateFixed, LogIn, Move, Plus, SquarePen, Trash2, X } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils/cn";
import type { MapPin } from "@/services/map-pin.service";

/** Study notes (USER map pins) a learner keeps on a battle: anchored to the context and its year. */

export const STUDY_NOTE_ROLES = ["CUSTOMER", "SCHOOL_STUDENT", "TEACHER"] as const;
export const STUDY_NOTE_LABEL_MAX = 100;
export const STUDY_NOTE_TEXT_MAX = 2000;
/** Overlay-pin id prefix, so study notes share the custom-layer marker layer without clashing. */
export const STUDY_NOTE_PREFIX = "study:";
/** Matches `--jade` (light theme); Leaflet canvas markers need a literal colour. */
export const STUDY_NOTE_COLOR = "#1E8A6E";

const LABEL = "mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]";
const FIELD =
  "w-full rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-base outline-none focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)] disabled:bg-[var(--bg-deep)] md:text-sm";

const formatYear = (year: number) => (year < 0 ? `${Math.abs(year)} TCN` : String(year));

/** "Ghi chú của tôi" block of the battle side panel. */
type StudyNotesSectionProps =
  | { mode: "guest" }
  | {
      mode: "learner";
      notes: MapPin[];
      loading: boolean;
      selectedId: string | null;
      /** A note is being placed or saved: adding is paused. */
      busy: boolean;
      onSelect: (pin: MapPin) => void;
      onAdd: () => void;
      onEdit: (pin: MapPin) => void;
      onMove: (pin: MapPin) => void;
      onDelete: (pin: MapPin) => void;
    };

/** guest: sign-in hint · learner: list with add / edit / move / delete. */
export function StudyNotesSection(props: StudyNotesSectionProps) {
  if (props.mode === "guest") {
    return (
      <section>
        <p className={LABEL}>Ghi chú của tôi</p>
        <div className="flex items-start gap-2 rounded-[2px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-main)] p-3 text-[13px] leading-5 text-[var(--text-secondary)]">
          <Bookmark size={15} className="mt-0.5 shrink-0 text-[var(--jade)]" aria-hidden="true" />
          <p className="min-w-0">
            <Link href={ROUTES.LOGIN} className="inline-flex items-center gap-1 font-bold text-[var(--text-primary)] underline-offset-4 hover:underline">
              <LogIn size={13} aria-hidden="true" /> Đăng nhập để ghi chú
            </Link>{" "}
            — đánh dấu những điểm bạn muốn ôn lại trên trận đánh này. Chỉ mình bạn thấy.
          </p>
        </div>
      </section>
    );
  }

  const { notes, loading, selectedId, busy, onSelect, onAdd, onEdit, onMove, onDelete } = props;
  return (
    <section>
      <div className="flex items-baseline justify-between gap-2">
        <p className={LABEL}>
          Ghi chú của tôi
          {!loading && notes.length > 0 && <span className="ml-1.5 font-semibold normal-case tracking-normal tabular-nums">{notes.length}</span>}
        </p>
        {notes.length > 0 && (
          <button
            type="button"
            onClick={onAdd}
            disabled={busy}
            className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--jade)] hover:underline disabled:opacity-45"
          >
            <Plus size={13} /> Thêm ghi chú
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">Đang tải ghi chú…</p>
      ) : notes.length === 0 ? (
        <div className="rounded-[2px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-main)] p-3">
          <p className="text-[13px] leading-5 text-[var(--text-secondary)]">
            Đánh dấu một địa điểm của trận đánh kèm lời ghi chú để ôn lại sau. Chỉ mình bạn thấy.
          </p>
          <button type="button" onClick={onAdd} disabled={busy} className="btn-ink mt-2.5 h-9 min-h-0 px-3 text-xs disabled:opacity-45">
            <LocateFixed size={15} /> Thêm ghi chú
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border-default)] rounded-[2px] border border-[var(--border-default)]">
          {notes.map((pin) => {
            const selected = pin.pinId === selectedId;
            return (
              <li key={pin.pinId} className={cn(selected && "bg-[var(--sidebar-hover-bg)]")}>
                <button
                  type="button"
                  onClick={() => onSelect(pin)}
                  aria-expanded={selected}
                  className="flex w-full items-start gap-2.5 px-3 py-2 text-left outline-none hover:bg-[var(--sidebar-hover-bg)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-gold)]"
                >
                  <span className="map-layer-swatch map-layer-swatch--personal mt-1" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-[13px] font-semibold leading-snug text-[var(--text-primary)]", !selected && "truncate")}>
                      {pin.label}
                    </span>
                    {pin.description?.trim() && (
                      <span
                        className={cn(
                          "mt-0.5 block whitespace-pre-wrap text-[12px] leading-5 text-[var(--text-secondary)]",
                          !selected && "line-clamp-1",
                        )}
                      >
                        {pin.description}
                      </span>
                    )}
                  </span>
                </button>
                {selected && (
                  <div className="flex flex-wrap gap-1.5 px-3 pb-2.5 pl-[30px]">
                    <NoteAction onClick={() => onEdit(pin)} disabled={busy}>
                      <SquarePen size={13} /> Sửa
                    </NoteAction>
                    <NoteAction onClick={() => onMove(pin)} disabled={busy}>
                      <Move size={13} /> Đổi vị trí
                    </NoteAction>
                    <NoteAction onClick={() => onDelete(pin)} disabled={busy} danger>
                      <Trash2 size={13} /> Xóa
                    </NoteAction>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function NoteAction({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-[2px] border px-2.5 text-[11px] font-bold transition-colors disabled:opacity-45",
        danger
          ? "border-[var(--accent-danger)] text-[var(--accent-danger)] hover:bg-[var(--status-danger-bg)]"
          : "border-[var(--text-primary)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]",
      )}
    >
      {children}
    </button>
  );
}

export interface StudyNoteDraft {
  label: string;
  note: string;
}

/** Side-panel form to add or edit a study note; the position is picked on the map. */
export function StudyNoteForm({
  battleTitle,
  year,
  initial,
  coordinates,
  placing,
  submitting,
  onPickOnMap,
  onCancel,
  onSubmit,
}: {
  battleTitle: string;
  year: number;
  initial: MapPin | null;
  coordinates: { latitude: number; longitude: number } | null;
  placing: boolean;
  submitting: boolean;
  onPickOnMap: () => void;
  onCancel: () => void;
  onSubmit: (draft: StudyNoteDraft) => Promise<void>;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [note, setNote] = useState(initial?.description ?? "");
  const trimmed = label.trim();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!coordinates || !trimmed || submitting) return;
    await onSubmit({ label: trimmed, note: note.trim() });
  };

  return (
    <form onSubmit={submit} className="flex min-h-full flex-col">
      <div className="border-b border-[var(--text-primary)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--jade)]">
              <Bookmark size={13} aria-hidden="true" /> Ghi chú của tôi
            </p>
            <h2 className="archive-title mt-1 text-[22px]">{initial ? "Sửa ghi chú" : "Thêm ghi chú"}</h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
              {battleTitle} · {formatYear(year)}
            </p>
          </div>
          <button type="button" onClick={onCancel} className="grid h-8 w-8 shrink-0 place-items-center rounded-[2px] hover:bg-[var(--sidebar-hover-bg)]" aria-label="Hủy">
            <X size={17} />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-5 p-5">
        {placing ? (
          <div className="flex items-start gap-3 rounded-[2px] border border-[var(--jade)] bg-[var(--bg-main)] p-4 text-sm leading-6 text-[var(--text-primary)]">
            <LocateFixed className="mt-1 shrink-0 text-[var(--jade)]" size={18} />
            <span>Chạm vào bản đồ để đặt ghi chú. Nhấn Esc để hủy.</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[2px] border border-[var(--border-default)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            <span className="tabular-nums">
              {coordinates ? `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}` : "Chưa chọn vị trí"}
            </span>
            <button type="button" onClick={onPickOnMap} className="inline-flex items-center gap-1 font-bold text-[var(--jade)] hover:underline">
              <Move size={13} /> Chọn lại vị trí
            </button>
          </div>
        )}

        <label className="block">
          <span className="mb-2 flex items-baseline justify-between text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            Tiêu đề *
            <span className="font-semibold normal-case tracking-normal tabular-nums">
              {label.length}/{STUDY_NOTE_LABEL_MAX}
            </span>
          </span>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={STUDY_NOTE_LABEL_MAX}
            required
            autoFocus
            placeholder="Ví dụ: Bãi cọc ngầm"
            className={cn(FIELD, "h-11")}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Ghi chú</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={STUDY_NOTE_TEXT_MAX}
            rows={5}
            placeholder="Điều bạn muốn nhớ về địa điểm này…"
            className={cn(FIELD, "resize-y py-2.5 leading-6")}
          />
        </label>

        <p className="text-xs leading-relaxed text-[var(--text-tertiary)]">Chỉ mình bạn nhìn thấy ghi chú này.</p>
      </div>

      <div className="flex gap-2 border-t border-[var(--text-primary)] p-4">
        <button type="button" onClick={onCancel} className="btn-line h-10 min-h-0 flex-1 px-3 text-xs">
          Hủy
        </button>
        <button type="submit" disabled={!coordinates || !trimmed || submitting} className="btn-crimson h-10 min-h-0 flex-[1.4] px-3 text-xs disabled:opacity-45">
          {submitting ? <Loader2 className="animate-spin" size={16} /> : <Bookmark size={16} />} Lưu ghi chú
        </button>
      </div>
    </form>
  );
}
