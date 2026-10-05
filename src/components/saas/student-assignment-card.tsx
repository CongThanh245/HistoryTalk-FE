"use client";

import Link from "next/link";
import { ChevronRight, Clock, UsersRound } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import {
  assignmentWindow,
  formatDateTime,
  isDone,
  relativeTime,
  type StudentAssignmentRow,
} from "@/features/saas/hooks-student";
import {
  ASSIGNMENT_TYPE_META,
  AssignmentTypeBadge,
  AssignmentTypeTile,
  ProgressMeter,
  ScoreChip,
  SubmissionStatusBadge,
} from "@/components/saas/student-ui";
import { cn } from "@/lib/utils/cn";

/** Due line: absolute deadline + relative countdown, tinted by urgency. */
export function DueLine({ row, compact }: { row: StudentAssignmentRow; compact?: boolean }) {
  const { assignment: a, submission, bucket } = row;
  const win = assignmentWindow(a);
  const done = isDone(submission?.status);
  const tone =
    done ? "text-content-muted" : bucket === "OVERDUE" ? "text-[var(--accent-danger)]" : bucket === "DUE_SOON" ? "text-[var(--accent-gold)]" : "text-content-text";
  return (
    <span className={cn("flex flex-wrap items-center gap-x-1.5 text-[13px]", tone)}>
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {win.notOpen ? (
        <span>Mở lúc {formatDateTime(a.openAt)}</span>
      ) : (
        <>
          <span>{compact ? "Hạn" : "Hạn nộp"} {formatDateTime(a.dueAt)}</span>
          {!done && <span className="font-bold">· {relativeTime(a.dueAt)}</span>}
          {!done && bucket === "OVERDUE" && a.allowLate && <span>· vẫn nhận nộp muộn</span>}
        </>
      )}
    </span>
  );
}

export function StudentAssignmentCard({ row }: { row: StudentAssignmentRow }) {
  const { assignment: a, submission, classroom, teacher, bucket } = row;
  const meta = ASSIGNMENT_TYPE_META[a.type];
  const showScore = a.type === "TEST" && typeof submission?.score === "number";

  return (
    <Link
      href={ROUTES.MY_ASSIGNMENT_DETAIL(a.id)}
      className="group flex gap-3 rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] p-4 motion-safe:transition-colors hover:bg-[var(--bg-elevated)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)] sm:gap-4"
    >
      <AssignmentTypeTile type={a.type} />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <AssignmentTypeBadge type={a.type} />
          <SubmissionStatusBadge status={submission?.status} bucket={bucket} />
          {a.type === "TEST" && a.graded && (
            <span className="rounded-[2px] border border-[var(--border-strong)] px-2 py-0.5 text-[11px] font-bold text-content-muted">Tính điểm</span>
          )}
        </div>
        <h3 className="archive-title is-plain text-xl group-hover:text-[var(--accent-gold)]">{a.title}</h3>
        <p className="inline-flex flex-wrap items-center gap-x-1.5 text-[13px] text-content-muted">
          <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
          Lớp {classroom.name}
          {teacher && <span>· GV {teacher.fullName}</span>}
        </p>
        <DueLine row={row} />
        {a.type === "CHAT" && a.minMessages && !isDone(submission?.status) && (
          <div className="flex items-center gap-2 pt-1">
            <ProgressMeter value={submission?.messageCount ?? 0} max={a.minMessages} color={meta.color} label="Tiến độ tin nhắn" />
            <span className="shrink-0 text-[12px] font-bold tabular-nums text-content-muted">
              {Math.min(submission?.messageCount ?? 0, a.minMessages)}/{a.minMessages}
            </span>
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        {showScore ? <ScoreChip score={submission!.score!} max={a.maxScore} /> : <span />}
        <ChevronRight className="h-4 w-4 text-content-muted" aria-hidden="true" />
      </div>
    </Link>
  );
}
