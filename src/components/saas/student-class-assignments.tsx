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

/**
 * Danh sach gon bai tap cua em: mot lop (`classId`) hoac moi lop (trang dau /classes).
 * `openOnly`: chi bai chua xong (can lam / sap het han / qua han); `limit`: so dong toi da.
 */
export function StudentClassAssignments({ classId, openOnly, limit }: { classId?: string; openOnly?: boolean; limit?: number }) {
  const { data, isLoading, isError, error, refetch } = useMyAssignments({ ...(classId && { classroomId: classId }), size: 50 });

  if (isLoading) return <AssignmentListSkeleton count={2} />;
  if (isError) {
    return <AssignmentLoadError message={apiErrorMessage(error, "Vui lòng kiểm tra kết nối rồi thử lại.")} onRetry={() => void refetch()} />;
  }
  const sorted = sortForClass(data?.items ?? []);
  const open = openOnly ? sorted.filter((a) => !["DONE", "EXEMPTED"].includes(assignmentBucket(a))) : sorted;
  const items = limit ? open.slice(0, limit) : open;
  if (items.length === 0) {
    return openOnly && sorted.length > 0 ? (
      <EmptyState icon={ClipboardList} title="Em đã làm hết bài" description="Không còn bài nào cần làm. Bài mới thầy cô giao sẽ hiện ở đây." size="sm" />
    ) : (
      <EmptyState icon={ClipboardList} title="Chưa có bài tập" description="Khi thầy cô giao bài cho lớp, bài sẽ hiện ở đây." size="sm" />
    );
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
          {openOnly ? `Xem tất cả bài tập (${data?.totalElements})` : `Xem tất cả ${data?.totalElements} bài`}
        </Link>
      )}
    </div>
  );
}
