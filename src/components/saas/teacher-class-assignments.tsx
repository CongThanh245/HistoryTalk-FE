"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, BookOpenText, CalendarClock, ClipboardCheck, MessagesSquare, Plus } from "lucide-react";

import { SectionHeading } from "@/components/saas/saas-ui";
import { ClassroomLoadError, NoDataYet } from "@/components/saas/api-classroom-ui";
import { ROUTES } from "@/constants/routes";
import { apiErrorMessage, apiErrorStatus } from "@/features/saas/hooks-api";
import { useClassroomAssignments } from "@/features/saas/hooks-assignment-api";
import type { AssignmentStatus, AssignmentType, SubmissionStatus, TeacherAssignment } from "@/services/assignment.service";
import { cn } from "@/lib/utils/cn";

/**
 * Bai tap cua giao vien tren API that (GET /teacher/assignments/classroom/{id}).
 * File nay cung chua nhan / badge / helper dung chung cho cac man /teaching/assignments.
 */

/* ───────────────────────── Labels & badges ───────────────────────── */

const PILL = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[2px] border px-2 py-0.5 text-[11px] font-bold";
const SUCCESS = "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]";
const WARNING = "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]";
const DANGER = "border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--accent-danger)]";
const NEUTRAL = "border-[var(--border-strong)] bg-[var(--status-neutral-bg)] text-[var(--text-secondary)]";
const INK = "border-[var(--text-primary)] bg-transparent text-[var(--text-primary)]";

export const ASSIGNMENT_TYPES: AssignmentType[] = ["CONTEXT_READING", "AI_CHAT_ROLEPLAY", "QUIZ_TEST"];

export const ASSIGNMENT_TYPE_META: Record<
  AssignmentType,
  { label: string; hint: string; target: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  CONTEXT_READING: {
    label: "Đọc bối cảnh",
    hint: "Học sinh đọc một bối cảnh lịch sử trong thời gian tối thiểu.",
    target: "Bối cảnh lịch sử",
    icon: BookOpenText,
    color: "text-[var(--accent-gold)]",
  },
  AI_CHAT_ROLEPLAY: {
    label: "Trò chuyện AI",
    hint: "Học sinh trò chuyện với nhân vật lịch sử, đủ số tin nhắn tối thiểu.",
    target: "Nhân vật lịch sử",
    icon: MessagesSquare,
    color: "text-[var(--jade)]",
  },
  QUIZ_TEST: {
    label: "Bài kiểm tra",
    hint: "Học sinh làm một bộ đề (trắc nghiệm, điền chỗ trống, nối cặp); hệ thống tự chấm theo thang 10.",
    target: "Bộ đề",
    icon: ClipboardCheck,
    color: "text-[var(--men-lam)]",
  },
};

export function ApiAssignmentTypeBadge({ type, className }: { type: AssignmentType; className?: string }) {
  const meta = ASSIGNMENT_TYPE_META[type];
  if (!meta) return <span className={cn(PILL, NEUTRAL, className)}>{type}</span>;
  const Icon = meta.icon;
  return (
    <span className={cn(PILL, INK, className)}>
      <Icon className={cn("h-3 w-3", meta.color)} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export const ASSIGNMENT_STATUS_META: Record<AssignmentStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Đang giao", className: SUCCESS },
  ARCHIVED: { label: "Đã lưu trữ", className: NEUTRAL },
  CANCELLED: { label: "Đã hủy", className: DANGER },
};

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  const meta = ASSIGNMENT_STATUS_META[status] ?? { label: status, className: NEUTRAL };
  return <span className={cn(PILL, meta.className)}>{meta.label}</span>;
}

export const SUBMISSION_STATUS_META: Record<SubmissionStatus, { label: string; className: string }> = {
  NOT_STARTED: { label: "Chưa bắt đầu", className: NEUTRAL },
  IN_PROGRESS: { label: "Đang làm", className: WARNING },
  SUBMITTED: { label: "Đã nộp", className: SUCCESS },
  LATE_SUBMITTED: { label: "Nộp muộn", className: WARNING },
  MISSED: { label: "Bỏ lỡ", className: DANGER },
  EXEMPTED: { label: "Được miễn", className: NEUTRAL },
};

export function ApiSubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const meta = SUBMISSION_STATUS_META[status] ?? { label: status, className: NEUTRAL };
  return <span className={cn(PILL, meta.className)}>{meta.label}</span>;
}

/** Badge "Đã hết hạn" tinh tu deadline cua BE (BE khong tra co nay cho giao vien). */
export function DeadlineBadge({ deadline }: { deadline: string }) {
  const past = isPastDeadline(deadline);
  return (
    <span className={cn(PILL, past ? NEUTRAL : SUCCESS)}>
      <CalendarClock className="h-3 w-3" aria-hidden="true" />
      {past ? "Đã hết hạn" : "Còn hạn"}
    </span>
  );
}

/* ───────────────────────── Helpers ───────────────────────── */

/** LocalDateTime cua BE ("YYYY-MM-DDTHH:mm:ss", khong mui gio) -> Date theo gio may. */
export function parseLocalDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatLocalDateTime(value: string | null | undefined): string {
  const d = parseLocalDateTime(value);
  if (!d) return value ? value : "—";
  return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function isPastDeadline(deadline: string | null | undefined): boolean {
  const d = parseLocalDateTime(deadline);
  return d ? d.getTime() < Date.now() : false;
}

/** LocalDateTime -> gia tri cho <input type="datetime-local">. */
export const toDateTimeInput = (value: string | null | undefined) => (value ? value.slice(0, 16) : "");

/** Gia tri <input type="datetime-local"> -> "YYYY-MM-DDTHH:mm:00" cho BE. */
export const fromDateTimeInput = (value: string) => (value.length >= 16 ? `${value.slice(0, 16)}:00` : "");

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} giây`;
  return s === 0 ? `${m} phút` : `${m} phút ${s} giây`;
}

/** Y nghia minRequirement theo loai bai (QUIZ: BE bo qua). */
export function requirementText(type: AssignmentType, min: number | null | undefined): string {
  if (type === "QUIZ_TEST") return "Làm và nộp bài kiểm tra";
  if (min == null) return "—";
  return type === "AI_CHAT_ROLEPLAY" ? `Tối thiểu ${min} tin nhắn` : `Đọc tối thiểu ${formatDuration(min)}`;
}

/** So bai da nop (dung han + muon) tren tong hoc sinh duoc giao. */
export function AssignmentCounts({ assignment, className }: { assignment: TeacherAssignment; className?: string }) {
  const a = assignment;
  const done = a.submittedCount + a.lateSubmittedCount;
  const pct = a.totalStudents > 0 ? Math.round((done / a.totalStudents) * 100) : 0;
  return (
    <div className={cn("min-w-[180px] space-y-1", className)}>
      <div className="flex items-center gap-2">
        <div
          className="h-2 flex-1 overflow-hidden rounded-[2px] bg-[var(--status-neutral-bg)] ring-1 ring-inset ring-[var(--border-default)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label={`${done}/${a.totalStudents} đã nộp`}
        >
          <svg className="block h-full w-full" aria-hidden="true">
            <rect width={`${pct}%`} height="100%" className="fill-[var(--jade)]" />
          </svg>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-content-muted">
          {done}/{a.totalStudents}
        </span>
      </div>
      <p className="text-[11px] tabular-nums text-content-muted">
        <span className="text-[var(--status-success)]">{a.submittedCount} đúng hạn</span> ·{" "}
        <span className="text-[var(--status-warning)]">{a.lateSubmittedCount} muộn</span> · {a.inProgressCount} đang làm ·{" "}
        {a.notStartedCount} chưa bắt đầu
      </p>
    </div>
  );
}

export const newAssignmentHref = (classId?: string | null) =>
  classId ? `${ROUTES.TEACHING.ASSIGNMENT_NEW}?classId=${encodeURIComponent(classId)}` : ROUTES.TEACHING.ASSIGNMENT_NEW;

/* ───────────────────────── Class tab ───────────────────────── */

const RECENT_SIZE = 10;

/** Danh sach bai tap gon cua mot lop (tab bai tap trong chi tiet lop, trang chu giang day). */
export function TeacherClassAssignments({ classId }: { classId: string }) {
  const query = useClassroomAssignments(classId, { page: 0, size: RECENT_SIZE });
  const items = query.data?.items ?? [];
  const total = query.data?.totalElements ?? 0;
  // Lop chua co bai: nut giao bai nam trong empty state, khong lap lai o header.
  const isEmpty = query.isSuccess && items.length === 0;
  const newButton = (
    <Link href={newAssignmentHref(classId)} className="btn-crimson">
      <Plus className="h-4 w-4" aria-hidden="true" /> Giao bài mới
    </Link>
  );

  return (
    <div className="space-y-4">
      <SectionHeading
        title="Bài tập của lớp"
        description="Bài mới giao hiện trên cùng."
        actions={
          isEmpty ? undefined : (
            <>
              {newButton}
              {total > 0 && (
                <Link href={`${ROUTES.TEACHING.ASSIGNMENTS}?classId=${encodeURIComponent(classId)}`} className="btn-line">
                  Tất cả bài tập
                </Link>
              )}
            </>
          )
        }
      />

      {query.isPending ? (
        <div className="h-[132px] animate-pulse rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] motion-reduce:animate-none" aria-busy="true" />
      ) : query.isError ? (
        apiErrorStatus(query.error) === 403 || apiErrorStatus(query.error) === 404 ? (
          <NoDataYet title="Không xem được bài tập của lớp này" description={apiErrorMessage(query.error, "Lớp không tồn tại hoặc bạn không phụ trách lớp này.")} />
        ) : (
          <ClassroomLoadError message={apiErrorMessage(query.error, "Không tải được bài tập của lớp.")} onRetry={() => void query.refetch()} />
        )
      ) : items.length === 0 ? (
        <NoDataYet
          title="Lớp chưa có bài tập nào"
          description="Giao bài đọc bối cảnh, trò chuyện với nhân vật AI hoặc bài kiểm tra để bắt đầu theo dõi tiến độ của lớp."
          action={newButton}
        />
      ) : (
        <>
          <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
            {items.map((a) => (
              <li key={a.assignmentId} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ApiAssignmentTypeBadge type={a.assignmentType} />
                    <AssignmentStatusBadge status={a.status} />
                    {a.status === "ACTIVE" && <DeadlineBadge deadline={a.deadline} />}
                  </div>
                  <Link
                    href={ROUTES.TEACHING.ASSIGNMENT_DETAIL(a.assignmentId)}
                    className="block font-semibold text-content-heading hover:text-[var(--accent-gold)]"
                  >
                    {a.title}
                  </Link>
                  <p className="text-xs text-content-muted">
                    {a.targetTitle || "—"} · Hạn {formatLocalDateTime(a.deadline)} · {requirementText(a.assignmentType, a.minRequirement)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <AssignmentCounts assignment={a} />
                  <Link href={ROUTES.TEACHING.ASSIGNMENT_DETAIL(a.assignmentId)} className="archive-link" aria-label={`Chi tiết ${a.title}`}>
                    Chi tiết <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          {total > items.length && (
            <p className="text-xs text-content-muted">
              Đang hiển thị {items.length}/{total} bài.{" "}
              <Link href={`${ROUTES.TEACHING.ASSIGNMENTS}?classId=${encodeURIComponent(classId)}`} className="archive-link">
                Xem tất cả
              </Link>
            </p>
          )}
        </>
      )}
    </div>
  );
}
