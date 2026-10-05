"use client";

import * as React from "react";
import { BookOpenText, CalendarClock, ClipboardCheck, MessagesSquare } from "lucide-react";
import { StaffFormSelect } from "@/components/staff/staff-form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ASSIGNMENT_STATE_LABELS,
  ASSIGNMENT_TYPE_LABELS,
  LOCAL_STATUS_LABELS,
  SCORE_BAND_CLASS,
  SCORE_BAND_FILL,
  SCORE_BAND_LABELS,
  SUBMISSION_STATUS_LABELS,
  formatScore,
  scoreBand,
  type AssignmentState,
  type ScoreBand,
} from "@/features/saas/hooks-teaching";
import type { AssignmentType, Classroom, LocalContentStatus, SubmissionStatus } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

const PILL = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[2px] border px-2 py-0.5 text-[11px] font-bold";
const SUCCESS = "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]";
const WARNING = "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]";
const DANGER = "border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--accent-danger)]";
const NEUTRAL = "border-[var(--border-strong)] bg-[var(--status-neutral-bg)] text-[var(--text-secondary)]";
const INK = "border-[var(--text-primary)] bg-transparent text-[var(--text-primary)]";

/* ───────────────────────── Badges ───────────────────────── */

const TYPE_ICON: Record<AssignmentType, React.ComponentType<{ className?: string }>> = {
  EVENT: BookOpenText,
  CHAT: MessagesSquare,
  TEST: ClipboardCheck,
};
const TYPE_COLOR: Record<AssignmentType, string> = {
  EVENT: "text-[var(--accent-gold)]",
  CHAT: "text-[var(--jade)]",
  TEST: "text-[var(--men-lam)]",
};

export function AssignmentTypeBadge({ type, className }: { type: AssignmentType; className?: string }) {
  const Icon = TYPE_ICON[type];
  return (
    <span className={cn(PILL, INK, className)}>
      <Icon className={cn("h-3 w-3", TYPE_COLOR[type])} aria-hidden="true" />
      {ASSIGNMENT_TYPE_LABELS[type]}
    </span>
  );
}

const SUB_CLASS: Record<SubmissionStatus, string> = {
  NOT_STARTED: NEUTRAL,
  IN_PROGRESS: WARNING,
  SUBMITTED: SUCCESS,
  LATE: WARNING,
  MISSING: DANGER,
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return <span className={cn(PILL, SUB_CLASS[status])}>{SUBMISSION_STATUS_LABELS[status]}</span>;
}

const LOCAL_CLASS: Record<LocalContentStatus, string> = {
  DRAFT: NEUTRAL,
  PENDING: WARNING,
  PUBLISHED: SUCCESS,
  INACTIVE: DANGER,
  TRASH: cn(NEUTRAL, "line-through"),
};

export function LocalStatusBadge({ status }: { status: LocalContentStatus }) {
  return <span className={cn(PILL, LOCAL_CLASS[status])}>{LOCAL_STATUS_LABELS[status]}</span>;
}

const STATE_CLASS: Record<AssignmentState, string> = {
  UPCOMING: NEUTRAL,
  OPEN: SUCCESS,
  DUE_SOON: WARNING,
  CLOSED: NEUTRAL,
};

export function AssignmentStateBadge({ state }: { state: AssignmentState }) {
  return (
    <span className={cn(PILL, STATE_CLASS[state])}>
      {state === "DUE_SOON" && <CalendarClock className="h-3 w-3" aria-hidden="true" />}
      {ASSIGNMENT_STATE_LABELS[state]}
    </span>
  );
}

/* ───────────────────────── Scores ───────────────────────── */

/** Score on a 10-point scale, coloured by band; the band is also in the title for non-colour readers. */
export function ScoreValue({ value, className }: { value: number | null | undefined; className?: string }) {
  if (value == null) return <span className="text-content-subtle">—</span>;
  const band = scoreBand(value);
  return (
    <span title={SCORE_BAND_LABELS[band]} className={cn("font-bold tabular-nums", SCORE_BAND_CLASS[band], className)}>
      {formatScore(value)}
    </span>
  );
}

export function ScoreLegend({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1 text-xs text-content-muted", className)} aria-label="Chú giải màu điểm">
      {(Object.keys(SCORE_BAND_LABELS) as ScoreBand[]).map((b) => (
        <li key={b} className="inline-flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-[1px]", SCORE_BAND_FILL[b])} aria-hidden="true" />
          {SCORE_BAND_LABELS[b]}
        </li>
      ))}
    </ul>
  );
}

/* ───────────────────────── Progress ───────────────────────── */

/** done / total bar (jade = done). Uses an SVG rect so the width needs no inline style. */
export function ProgressBar({ done, total, className, label }: { done: number; total: number; className?: string; label?: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className={cn("flex min-w-[140px] items-center gap-2", className)}>
      <div
        className="h-2 flex-1 overflow-hidden rounded-[2px] bg-[var(--status-neutral-bg)] ring-1 ring-inset ring-[var(--border-default)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={label ?? `${done}/${total} đã nộp`}
      >
        <svg className="block h-full w-full" aria-hidden="true">
          <rect width={`${pct}%`} height="100%" className="fill-[var(--jade)]" />
        </svg>
      </div>
      <span className="shrink-0 text-xs tabular-nums text-content-muted">
        {done}/{total}
      </span>
    </div>
  );
}

/* ───────────────────────── KPI tile ───────────────────────── */

export function KpiTile({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  /** Tailwind text colour class for the value. */
  accent?: string;
}) {
  return (
    <div className="rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{label}</p>
        {icon}
      </div>
      <p className={cn("mt-1 font-display text-3xl font-extrabold leading-[1.2] tabular-nums text-content-heading", accent)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-content-muted">{hint}</p>}
    </div>
  );
}

/* ───────────────────────── Filters ───────────────────────── */

export const ALL = "__all__";

export function ClassSelect({
  classes,
  value,
  onChange,
  allLabel = "Tất cả lớp",
  className,
}: {
  classes: Classroom[];
  value: string;
  onChange: (v: string) => void;
  allLabel?: string | null;
  className?: string;
}) {
  const options = [
    ...(allLabel ? [{ value: ALL, label: allLabel }] : []),
    ...classes.map((c) => ({ value: c.id, label: `Lớp ${c.name}` })),
  ];
  return <StaffFormSelect value={value} onValueChange={onChange} options={options} className={cn("w-full sm:w-[200px]", className)} />;
}

/** Checkbox list of classes (visible classes of local content, wizard step 1). */
export function ClassCheckboxList({
  classes,
  value,
  onChange,
  disabled,
  describe,
}: {
  classes: Classroom[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  describe?: (c: Classroom) => React.ReactNode;
}) {
  if (classes.length === 0) return <p className="text-sm text-content-muted">Bạn chưa được phân công lớp nào.</p>;
  return (
    <ul className="divide-y divide-[var(--border-default)] rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)]">
      {classes.map((c) => {
        const checked = value.includes(c.id);
        return (
          <li key={c.id}>
            <label
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm",
                disabled ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:bg-[var(--status-neutral-bg)]",
              )}
            >
              <Checkbox
                checked={checked}
                disabled={disabled}
                onCheckedChange={(v) => onChange(v === true ? [...value, c.id] : value.filter((x) => x !== c.id))}
              />
              <span className="font-semibold text-content-heading">Lớp {c.name}</span>
              <span className="ml-auto text-xs text-content-muted">{describe ? describe(c) : `${c.studentIds.length} học sinh`}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

/** Row of segmented filter buttons. */
export function SegmentedFilter<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-[2px] border px-3 text-xs font-bold transition-colors",
              active
                ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
                : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]",
            )}
          >
            {o.label}
            {o.count != null && <span className="tabular-nums opacity-75">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Plain table shell matching StaffDataTable (ink rules, horizontal scroll on phones). */
export function TableShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-[2px] border-y border-[var(--text-primary)] bg-[var(--bg-surface)]", className)}>
      <table className="w-full min-w-max caption-bottom text-sm">{children}</table>
    </div>
  );
}

export const TH = "h-10 whitespace-nowrap px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]";
export const TD = "px-4 py-2.5 align-middle";
export const TR = "border-b border-[var(--border-default)] last:border-b-0 hover:bg-[var(--status-neutral-bg)]";
