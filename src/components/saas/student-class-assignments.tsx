"use client";

// Bai tap cua hoc sinh trong mot lop: GET /student/assignments?classroomId= (API that).
import Link from "next/link";
import { ChevronRight, ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AssignmentListSkeleton,
  AssignmentLoadError,
  AssignmentTypeTile,
  DueLine,
  ScoreChip,
  SubmissionStatusBadge,
  assignmentBucket,
  parseLocal,
} from "@/components/saas/student-assignment-card";
import { ROUTES } from "@/constants/routes";
import { useMyAssignments } from "@/features/saas/hooks-assignment-api";
import { apiErrorMessage } from "@/features/saas/hooks-api";
import type { StudentAssignment } from "@/services/assignment.service";

// Viec con mo len dau (han gan nhat truoc), bai da xong / mien xuong cuoi.
const RANK = { DUE_SOON: 0, TODO: 1, OVERDUE: 2, DONE: 3, EXEMPTED: 4 } as const;

function sortForClass(items: StudentAssignment[]) {
  const due = (a: StudentAssignment) => parseLocal(a.deadline)?.getTime() ?? 0;
  return items.slice().sort((x, y) => RANK[assignmentBucket(x)] - RANK[assignmentBucket(y)] || due(x) - due(y));
}

/** Danh sach gon bai tap cua em trong mot lop. */
export function StudentClassAssignments({ classId }: { classId: string }) {
  const { data, isLoading, isError, error, refetch } = useMyAssignments({ classroomId: classId, size: 50 });

  if (isLoading) return <AssignmentListSkeleton count={2} />;
  if (isError) {
    return <AssignmentLoadError message={apiErrorMessage(error, "Vui lòng kiểm tra kết nối rồi thử lại.")} onRetry={() => void refetch()} />;
  }
  const items = sortForClass(data?.items ?? []);
  if (items.length === 0) {
    return <EmptyState icon={ClipboardList} title="Lớp chưa có bài tập" description="Khi thầy cô giao bài cho lớp, bài sẽ hiện ở đây." size="sm" />;
  }

  return (
    <div className="space-y-2">
      <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
        {items.map((a) => (
          <li key={a.assignmentId}>
            <Link href={ROUTES.MY_ASSIGNMENT_DETAIL(a.assignmentId)} className="group flex items-center gap-3 py-2.5">
              <AssignmentTypeTile type={a.assignmentType} size={32} />
              <span className="min-w-0 flex-1 space-y-0.5">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-[14px] font-semibold text-content-text group-hover:text-[var(--accent-gold)]">{a.title}</span>
                  <SubmissionStatusBadge assignment={a} />
                </span>
                <DueLine assignment={a} compact />
              </span>
              {a.score !== null && <ScoreChip score={a.score} />}
              <ChevronRight className="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      {(data?.totalElements ?? 0) > items.length && (
        <Link href={ROUTES.MY_ASSIGNMENTS} className="archive-link">
          Xem tất cả {data?.totalElements} bài
        </Link>
      )}
    </div>
  );
}
