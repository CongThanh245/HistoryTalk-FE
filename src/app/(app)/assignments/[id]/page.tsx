"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, UsersRound } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, SaasShell } from "@/components/saas/saas-ui";
import { DueLine } from "@/components/saas/student-assignment-card";
import { StudentAssignmentWork } from "@/components/saas/student-assignment-work";
import { AssignmentTypeBadge, SubmissionStatusBadge } from "@/components/saas/student-ui";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { useStudentAssignments } from "@/features/saas/hooks-student";

/** Học sinh làm một bài được giao: đọc sự kiện, trò chuyện, làm bài kiểm tra (Role Matrix row 17). */
export default function MyAssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const role = useRole();
  return (
    <SaasShell variant="app" title="Làm bài tập" description="Hoàn thành bài trước hạn nộp. Tiến độ được lưu tự động.">
      {role === "SCHOOL_STUDENT" ? (
        <AssignmentDetail id={id} role={role} />
      ) : (
        <EmptyState title="Trang dành cho học sinh" description="Chỉ tài khoản học sinh của trường mới làm được bài tập được giao." />
      )}
    </SaasShell>
  );
}

function AssignmentDetail({ id, role }: { id: string; role: string }) {
  const { rows, studentId } = useStudentAssignments(role);
  const row = rows.find((r) => r.assignment.id === id);

  const back = (
    <Link href={ROUTES.MY_ASSIGNMENTS} className="archive-link">
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Bài tập được giao
    </Link>
  );

  if (!row) {
    return <EmptyState title="Không tìm thấy bài tập" description="Bài không tồn tại, đã bị xóa hoặc không thuộc lớp của em." action={back} />;
  }

  const { assignment: a, submission, classroom, teacher, bucket } = row;

  return (
    <div className="space-y-5">
      {back}
      <Panel>
        <div className="flex flex-wrap items-center gap-1.5">
          <AssignmentTypeBadge type={a.type} />
          <SubmissionStatusBadge status={submission?.status} bucket={bucket} />
          {a.type === "TEST" && (
            <span className="rounded-[2px] border border-[var(--border-strong)] px-2 py-0.5 text-[11px] font-bold text-content-muted">
              Thang điểm {a.maxScore ?? 10}
              {a.graded ? " · Tính điểm" : ""}
            </span>
          )}
        </div>
        <h2 className="archive-title is-plain text-2xl sm:text-3xl">{a.title}</h2>
        <p className="inline-flex flex-wrap items-center gap-x-1.5 text-[13px] text-content-muted">
          <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
          Lớp {classroom.name}
          {teacher && <span>· GV {teacher.fullName}</span>}
        </p>
        <DueLine row={row} />
        {a.instructions && (
          <div className="border-t border-[var(--border-default)] pt-3">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-content-muted">Yêu cầu</p>
            <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-content-text">{a.instructions}</p>
          </div>
        )}
      </Panel>

      <StudentAssignmentWork row={row} studentId={studentId} role={role} />
    </div>
  );
}
