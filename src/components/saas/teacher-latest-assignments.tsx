"use client";

// Bai dang giao sap den han tren moi lop GV day. Cung query key voi trang "Bài tập đã giao" nen dung chung cache.
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { ChevronRight, Plus } from "lucide-react";

import { relativeTime } from "@/components/saas/student-assignment-card";
import { ASSIGNMENT_TYPE_META, parseLocalDateTime } from "@/components/saas/teacher-class-assignments";
import { ProgressBar } from "@/components/saas/teaching-ui";
import { ROUTES } from "@/constants/routes";
import { assignmentKeys } from "@/features/saas/hooks-assignment-api";
import { assignmentService, type TeacherAssignment, type TeacherAssignmentListParams } from "@/services/assignment.service";
import { cn } from "@/lib/utils/cn";

/** Same page size as the assignments page, so both read one cache entry per class. */
const LIST_PARAMS: TeacherAssignmentListParams = { page: 0, size: 100 };
const SHOWN = 4;
/** Under this much time left the deadline turns warning-coloured. */
const SOON_MS = 48 * 60 * 60 * 1000;

const dueAt = (a: TeacherAssignment) => parseLocalDateTime(a.deadline)?.getTime() ?? Infinity;
const shortDate = (a: TeacherAssignment) =>
  parseLocalDateTime(a.deadline)?.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) ?? "—";

/**
 * What a teacher opens the dashboard for: which open assignments close next and how many students have handed in.
 * Open assignments whose deadline is still ahead, nearest first.
 */
export function TeacherLatestAssignments({ classIds }: { classIds: string[] }) {
  const results = useQueries({
    queries: classIds.map((id) => ({
      queryKey: assignmentKeys.byClassroom(id, LIST_PARAMS),
      queryFn: () => assignmentService.listByClassroom(id, LIST_PARAMS),
    })),
  });
  const loading = results.some((r) => r.isPending);
  const now = Date.now();
  const upcoming = results
    .flatMap((r) => r.data?.items ?? [])
    .filter((a) => a.status === "ACTIVE" && dueAt(a) >= now)
    .sort((x, y) => dueAt(x) - dueAt(y))
    .slice(0, SHOWN);

  if (!loading && results.length > 0 && results.every((r) => r.isError)) return null;

  return (
    <section aria-labelledby="upcoming-assignments" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="upcoming-assignments" className="text-base font-semibold text-content-heading">
          Sắp đến hạn
        </h2>
        <Link href={ROUTES.TEACHING.ASSIGNMENTS} className="archive-link hover:text-[var(--accent-gold)]">
          Tất cả bài tập <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {loading && upcoming.length === 0 ? (
          Array.from({ length: SHOWN }).map((_, i) => (
            <div key={i} className="h-[132px] w-64 shrink-0 animate-pulse rounded-xl border border-border-card bg-[var(--bg-surface)] motion-reduce:animate-none sm:w-auto" aria-hidden="true" />
          ))
        ) : upcoming.length === 0 ? (
          <div className="col-span-full flex flex-col items-start gap-3 rounded-xl border border-dashed border-[var(--border-strong)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-content-muted">Không có bài nào đang mở. Giao bài mới để học sinh có việc cần làm.</p>
            <Link href={ROUTES.TEACHING.ASSIGNMENT_NEW} className="btn-crimson shrink-0">
              <Plus className="h-4 w-4" aria-hidden="true" /> Giao bài tập
            </Link>
          </div>
        ) : (
          upcoming.map((a) => {
            const done = a.submittedCount + a.lateSubmittedCount;
            const soon = dueAt(a) - now <= SOON_MS;
            return (
              <Link
                key={a.assignmentId}
                href={ROUTES.TEACHING.ASSIGNMENT_DETAIL(a.assignmentId)}
                className="group flex w-64 shrink-0 snap-start flex-col gap-2 rounded-xl border border-border-card bg-[var(--bg-surface)] p-3.5 transition-[border-color,box-shadow] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-soft)] sm:w-auto"
              >
                <p className="text-xs text-content-muted">
                  Lớp {a.className} · {ASSIGNMENT_TYPE_META[a.assignmentType]?.label ?? "Bài tập"}
                </p>
                <p className="line-clamp-2 min-h-[2.5em] text-[15px] font-semibold leading-snug text-content-heading group-hover:text-[var(--accent-gold)]">{a.title}</p>
                <p className={cn("text-[13px] tabular-nums", soon ? "font-semibold text-[var(--status-warning)]" : "text-[var(--text-secondary)]")}>
                  Hạn {shortDate(a)} · {relativeTime(a.deadline, now)}
                </p>
                <ProgressBar done={done} total={a.totalStudents} label={`${done}/${a.totalStudents} học sinh đã nộp`} className="min-w-0" />
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
