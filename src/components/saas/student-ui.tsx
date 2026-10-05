"use client";

import { BookOpen, ClipboardCheck, MessageCircle, type LucideIcon } from "lucide-react";
import type { AssignmentType, SubmissionStatus } from "@/features/saas/types";
import type { AssignmentBucket } from "@/features/saas/hooks-student";
import { cn } from "@/lib/utils/cn";

/** Shared look of the student learning screens: type colours, status badges, score chip. */

export const ASSIGNMENT_TYPE_META: Record<AssignmentType, { label: string; color: string; icon: LucideIcon }> = {
  EVENT: { label: "Đọc sự kiện", color: "var(--jade)", icon: BookOpen },
  CHAT: { label: "Trò chuyện", color: "var(--accent-gold)", icon: MessageCircle },
  TEST: { label: "Bài kiểm tra", color: "var(--men-lam)", icon: ClipboardCheck },
};

const PILL = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[2px] border px-2 py-0.5 text-[11px] font-bold";

export function AssignmentTypeBadge({ type, className }: { type: AssignmentType; className?: string }) {
  const meta = ASSIGNMENT_TYPE_META[type];
  const Icon = meta.icon;
  return (
    <span
      className={cn(PILL, className)}
      style={{
        color: meta.color,
        borderColor: `color-mix(in srgb, ${meta.color} 45%, transparent)`,
        background: `color-mix(in srgb, ${meta.color} 10%, transparent)`,
      }}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

/** Square tile with the type icon, used as the visual anchor of assignment cards. */
export function AssignmentTypeTile({ type, size = 44 }: { type: AssignmentType; size?: number }) {
  const meta = ASSIGNMENT_TYPE_META[type];
  const Icon = meta.icon;
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[2px] text-white"
      style={{ width: size, height: size, background: meta.color }}
      aria-hidden="true"
    >
      <Icon className="h-5 w-5" strokeWidth={2.4} />
    </span>
  );
}

const STATUS_META: Record<SubmissionStatus, { label: string; className: string }> = {
  NOT_STARTED: { label: "Chưa làm", className: "border-[var(--border-strong)] bg-[var(--status-neutral-bg)] text-[var(--text-secondary)]" },
  IN_PROGRESS: { label: "Đang làm", className: "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]" },
  SUBMITTED: { label: "Đã nộp", className: "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]" },
  LATE: { label: "Nộp muộn", className: "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]" },
  MISSING: { label: "Chưa nộp", className: "border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--accent-danger)]" },
};

/** Submission status; an overdue item with no hand-in reads "Quá hạn". */
export function SubmissionStatusBadge({ status, bucket }: { status: SubmissionStatus | undefined; bucket?: AssignmentBucket }) {
  const s = status ?? "NOT_STARTED";
  if (bucket === "OVERDUE" && (s === "NOT_STARTED" || s === "IN_PROGRESS" || s === "MISSING")) {
    return <span className={cn(PILL, STATUS_META.MISSING.className)}>Quá hạn</span>;
  }
  return <span className={cn(PILL, STATUS_META[s].className)}>{STATUS_META[s].label}</span>;
}

/** Score as "8,5 / 10" in the gold-leaf score accent. */
export function ScoreChip({ score, max, size = "md" }: { score: number; max?: number; size?: "md" | "lg" }) {
  return (
    <span className="inline-flex items-baseline gap-1 tabular-nums" aria-label={`Điểm ${formatScore(score)} trên ${max ?? 10}`}>
      <strong
        className={cn("font-display font-extrabold text-[var(--gold-leaf)]", size === "lg" ? "text-5xl" : "text-2xl")}
      >
        {formatScore(score)}
      </strong>
      <span className="text-xs font-bold text-content-muted">/ {max ?? 10}</span>
    </span>
  );
}

export const formatScore = (n: number) => (Math.round(n * 100) / 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 });

/** Thin progress meter in a learning accent. */
export function ProgressMeter({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-[2px] bg-[var(--status-neutral-bg)] ring-1 ring-inset ring-[var(--border-default)]"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
    >
      <div className="h-full motion-safe:transition-[width] motion-safe:duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}
