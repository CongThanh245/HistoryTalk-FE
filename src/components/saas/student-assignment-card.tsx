"use client";

// Bai tap cua hoc sinh, chay tren API that (GET /student/assignments). Khong co mock.
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  Clock,
  MessageCircle,
  RefreshCw,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import type { AssignmentType, StudentAssignment, SubmissionStatus } from "@/services/assignment.service";
import { cn } from "@/lib/utils/cn";

// ─── Meta ──────────────────────────────────────────────────────────────────

export const ASSIGNMENT_TYPE_META: Record<
  AssignmentType,
  { label: string; color: string; icon: LucideIcon; requirementUnit: string | null; defaultRequirement: number | null }
> = {
  CONTEXT_READING: { label: "Đọc bối cảnh", color: "var(--jade)", icon: BookOpen, requirementUnit: "giây đọc", defaultRequirement: 60 },
  AI_CHAT_ROLEPLAY: { label: "Trò chuyện AI", color: "var(--accent-gold)", icon: MessageCircle, requirementUnit: "tin nhắn", defaultRequirement: 5 },
  QUIZ_TEST: { label: "Bài kiểm tra", color: "var(--men-lam)", icon: ClipboardCheck, requirementUnit: null, defaultRequirement: null },
};

const PILL = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold";
const SUCCESS = "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]";
const WARNING = "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]";
const DANGER = "border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--accent-danger)]";
const NEUTRAL = "border-[var(--border-strong)] bg-[var(--status-neutral-bg)] text-[var(--text-secondary)]";

export const SUBMISSION_STATUS_META: Record<SubmissionStatus, { label: string; className: string }> = {
  NOT_STARTED: { label: "Chưa làm", className: NEUTRAL },
  IN_PROGRESS: { label: "Đang làm", className: WARNING },
  SUBMITTED: { label: "Đã nộp", className: SUCCESS },
  LATE_SUBMITTED: { label: "Nộp muộn", className: WARNING },
  MISSED: { label: "Bỏ lỡ", className: DANGER },
  EXEMPTED: { label: "Được miễn", className: NEUTRAL },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

export type AssignmentBucket = "TODO" | "DUE_SOON" | "DONE" | "OVERDUE" | "EXEMPTED";

const DUE_SOON_MS = 48 * 3600 * 1000;

/** BE tra LocalDateTime khong mui gio -> parse theo gio may. */
export function parseLocal(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateTime(value: string | null | undefined) {
  const d = parseLocal(value);
  if (!d) return "—";
  return d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
}

export const isDone = (s: SubmissionStatus) => s === "SUBMITTED" || s === "LATE_SUBMITTED";

export function assignmentBucket(a: StudentAssignment, now = Date.now()): AssignmentBucket {
  if (a.submissionStatus === "EXEMPTED") return "EXEMPTED";
  if (isDone(a.submissionStatus)) return "DONE";
  const due = parseLocal(a.deadline)?.getTime();
  if (a.submissionStatus === "MISSED" || a.expired || (due !== undefined && due < now)) return "OVERDUE";
  if (due !== undefined && due - now <= DUE_SOON_MS) return "DUE_SOON";
  return "TODO";
}

/** "còn 3 giờ" / "quá hạn 2 ngày". */
export function relativeTime(value: string, now = Date.now()) {
  const d = parseLocal(value);
  if (!d) return "";
  const diff = d.getTime() - now;
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const text = mins < 60 ? `${mins} phút` : mins < 60 * 24 ? `${Math.round(mins / 60)} giờ` : `${Math.round(mins / 1440)} ngày`;
  return diff >= 0 ? `còn ${text}` : `quá hạn ${text}`;
}

export const formatScore = (n: number) => (Math.round(n * 100) / 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 });

export function formatSeconds(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m} phút ${s} giây` : `${s} giây`;
}

/** Yeu cau toi thieu kem don vi; null = BE dung mac dinh. */
export function requirementText(a: Pick<StudentAssignment, "assignmentType" | "minRequirement">) {
  const meta = ASSIGNMENT_TYPE_META[a.assignmentType];
  if (!meta.requirementUnit) return null;
  if (a.minRequirement === null) return `${meta.defaultRequirement} ${meta.requirementUnit} (mặc định)`;
  return `${a.minRequirement} ${meta.requirementUnit}`;
}

/** Link mo noi dung bai: su kien (bo boi canh), nhan vat de chat, quiz. */
export function targetHref(a: Pick<StudentAssignment, "assignmentType" | "targetId">) {
  switch (a.assignmentType) {
    case "CONTEXT_READING":
      return `${ROUTES.EVENTS}?event=${encodeURIComponent(a.targetId)}`;
    case "AI_CHAT_ROLEPLAY":
      return ROUTES.CHAT(a.targetId);
    case "QUIZ_TEST":
      return ROUTES.QUIZ_DETAIL(a.targetId);
  }
}

// ─── Badges ────────────────────────────────────────────────────────────────

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

export function AssignmentTypeTile({ type, size = 44 }: { type: AssignmentType; size?: number }) {
  const meta = ASSIGNMENT_TYPE_META[type];
  const Icon = meta.icon;
  return (
    <span className="grid shrink-0 place-items-center rounded-sm text-white" style={{ width: size, height: size, background: meta.color }} aria-hidden="true">
      <Icon className="h-5 w-5" strokeWidth={2.4} />
    </span>
  );
}

/** Trang thai nop; bai chua nop ma het han doc la "Quá hạn". */
export function SubmissionStatusBadge({ assignment }: { assignment: StudentAssignment }) {
  const s = assignment.submissionStatus;
  if ((s === "NOT_STARTED" || s === "IN_PROGRESS") && assignmentBucket(assignment) === "OVERDUE") {
    return <span className={cn(PILL, DANGER)}>Quá hạn</span>;
  }
  return <span className={cn(PILL, SUBMISSION_STATUS_META[s].className)}>{SUBMISSION_STATUS_META[s].label}</span>;
}

export function ScoreChip({ score, size = "md" }: { score: number; size?: "md" | "lg" }) {
  return (
    <span className="inline-flex items-baseline gap-1 tabular-nums" aria-label={`Điểm ${formatScore(score)} trên 10`}>
      <strong className={cn("font-bold tabular-nums text-[var(--gold-leaf)]", size === "lg" ? "text-5xl" : "text-2xl")}>{formatScore(score)}</strong>
      <span className="text-xs font-bold text-content-muted">/ 10</span>
    </span>
  );
}

/** Han nop tuyet doi + dem nguoc, to mau theo do gap. */
export function DueLine({ assignment: a, compact }: { assignment: StudentAssignment; compact?: boolean }) {
  const bucket = assignmentBucket(a);
  const settled = bucket === "DONE" || bucket === "EXEMPTED";
  const tone = settled
    ? "text-content-muted"
    : bucket === "OVERDUE"
      ? "text-[var(--accent-danger)]"
      : bucket === "DUE_SOON"
        ? "text-[var(--accent-gold)]"
        : "text-content-text";
  return (
    <span className={cn("flex flex-wrap items-center gap-x-1.5 text-[13px]", tone)}>
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        {compact ? "Hạn" : "Hạn nộp"} {formatDateTime(a.deadline)}
      </span>
      {!settled && <span className="font-bold">· {relativeTime(a.deadline)}</span>}
    </span>
  );
}

/** Cac so lieu tien do BE tra ve (chi hien truong co gia tri). */
export function AssignmentFacts({ assignment: a, className }: { assignment: StudentAssignment; className?: string }) {
  const req = requirementText(a);
  // Chi hien thong tin dung loai bai va da xay ra (khong in "0 giây", "—" cho bai chua lam).
  const facts: { label: string; value: string }[] = [
    ...(req ? [{ label: "Yêu cầu", value: req }] : []),
    ...(a.assignmentType === "AI_CHAT_ROLEPLAY" && a.messageCount ? [{ label: "Tin nhắn đã tính", value: `${a.messageCount}` }] : []),
    ...(a.assignmentType === "CONTEXT_READING" && a.readingDurationSeconds
      ? [{ label: "Thời gian đọc", value: formatSeconds(a.readingDurationSeconds) }]
      : []),
    ...(a.submittedAt
      ? [{ label: "Nộp lúc", value: formatDateTime(a.submittedAt) }]
      : a.startedAt
        ? [{ label: "Bắt đầu", value: formatDateTime(a.startedAt) }]
        : []),
  ];
  if (facts.length === 0) return null;
  return (
    <dl className={cn("flex flex-wrap gap-x-5 gap-y-1 text-[12px]", className)}>
      {facts.map((f) => (
        <div key={f.label} className="flex gap-1.5">
          <dt className="text-content-muted">{f.label}:</dt>
          <dd className="font-semibold tabular-nums text-content-text">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────

export function StudentAssignmentCard({ assignment: a }: { assignment: StudentAssignment }) {
  return (
    <Link
      href={ROUTES.MY_ASSIGNMENT_DETAIL(a.assignmentId)}
      className="group flex gap-3 rounded-sm border border-border-card bg-[var(--bg-surface)] p-4 motion-safe:transition-colors hover:bg-[var(--bg-elevated)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)] sm:gap-4"
    >
      <AssignmentTypeTile type={a.assignmentType} />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <AssignmentTypeBadge type={a.assignmentType} />
          <SubmissionStatusBadge assignment={a} />
        </div>
        <h3 className="archive-title is-plain text-xl group-hover:text-[var(--accent-gold)]">{a.title}</h3>
        <p className="inline-flex flex-wrap items-center gap-x-1.5 text-[13px] text-content-muted">
          <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
          Lớp {a.className}
          <span>· {a.targetTitle ?? "Không rõ nội dung"}</span>
        </p>
        <DueLine assignment={a} />
        <AssignmentFacts assignment={a} />
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        {a.score !== null ? <ScoreChip score={a.score} /> : <span />}
        <ChevronRight className="h-4 w-4 text-content-muted" aria-hidden="true" />
      </div>
    </Link>
  );
}

// ─── Loading / error ───────────────────────────────────────────────────────

export function AssignmentListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Đang tải bài tập">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-[150px] animate-pulse rounded-sm border border-[var(--border-strong)] bg-[var(--bg-elevated)] motion-reduce:animate-none" />
      ))}
    </div>
  );
}

export function AssignmentLoadError({ title = "Không tải được bài tập", message, onRetry }: { title?: string; message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-start gap-3 rounded-sm border border-[var(--accent-danger)] bg-[var(--bg-surface)] p-4">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-danger)]" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-content-heading">{title}</p>
        <p className="mt-0.5 text-sm text-content-muted">{message}</p>
      </div>
      <button type="button" onClick={onRetry} className="btn-ink min-h-0 px-3 py-2 text-xs">
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Thử lại
      </button>
    </div>
  );
}
