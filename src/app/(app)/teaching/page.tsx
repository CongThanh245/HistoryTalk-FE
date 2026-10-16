"use client";

// Tong quan giang day tren API that: lop (GET /teacher/classrooms), thong ke lop
// (GET /teacher/dashboard/classrooms/{id}) va bai tap (GET /teacher/assignments/classroom/{id}).
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Plus, Users } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { SaasShell, SectionHeading } from "@/components/saas/saas-ui";
import { StaffFormSelect } from "@/components/staff/staff-form";
import { ClassCodeCopy, ClassroomCardsSkeleton, ClassroomLoadError, ClassroomStatusPill, classroomMeta } from "@/components/saas/api-classroom-ui";
import { TeacherClassStats } from "@/components/saas/teacher-classroom-analytics";
import { TeacherClassAssignments, newAssignmentHref } from "@/components/saas/teacher-class-assignments";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { apiErrorMessage, useMyApiClassrooms } from "@/features/saas/hooks-api";

/** Teacher dashboard: assignments and AI interaction of the classes they teach (Role Matrix row 24). */
export default function TeachingDashboardPage() {
  return (
    <SaasShell live variant="app" title="Tổng quan giảng dạy" description="Bài tập đã giao, tiến độ nộp bài, kết quả quiz và mức độ tương tác với AI của từng lớp bạn dạy.">
      <React.Suspense fallback={null}>
        <Dashboard />
      </React.Suspense>
    </SaasShell>
  );
}

function Dashboard() {
  const role = useRole();
  const router = useRouter();
  const params = useSearchParams();
  const { classes, truncated, isLoading, isError, error, refetch } = useMyApiClassrooms(role);

  if (role !== "TEACHER") {
    return <EmptyState icon={Users} title="Dành cho giáo viên" description="Mục này dành cho tài khoản giáo viên của trường." />;
  }
  if (isLoading) return <ClassroomCardsSkeleton count={3} />;
  if (isError) {
    return <ClassroomLoadError message={apiErrorMessage(error, "Vui lòng kiểm tra kết nối rồi thử lại.")} onRetry={() => void refetch()} />;
  }
  if (classes.length === 0) {
    return <EmptyState icon={Users} title="Chưa có lớp giảng dạy" description="Quản trị trường sẽ phân công lớp cho bạn. Khi đó số liệu sẽ hiện ở đây." />;
  }

  const requested = params.get("classId");
  const current = classes.find((c) => c.id === requested) ?? classes[0];
  const setClass = (v: string) => router.replace(`${ROUTES.TEACHING.HOME}?classId=${encodeURIComponent(v)}`, { scroll: false });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StaffFormSelect
          value={current.id}
          onValueChange={setClass}
          options={classes.map((c) => ({ value: c.id, label: `Lớp ${c.className}` }))}
          className="w-full sm:w-[240px]"
        />
        <div className="flex flex-wrap gap-2">
          <Link href={`${ROUTES.TEACHING.ASSIGNMENTS}?classId=${encodeURIComponent(current.id)}`} className="btn-line">
            Bài tập
          </Link>
          <Link href={newAssignmentHref(current.id)} className="btn-crimson">
            <Plus className="h-4 w-4" aria-hidden="true" /> Giao bài tập
          </Link>
        </div>
      </div>
      {truncated && <p className="text-xs text-content-muted">Chỉ tải 100 lớp đầu tiên.</p>}

      <div className="flex flex-col gap-3 rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="archive-title is-plain text-2xl">Lớp {current.className}</h2>
            <ClassroomStatusPill status={current.status} />
          </div>
          <p className="mt-0.5 text-xs text-content-muted">
            {classroomMeta(current)} · {current.studentCount} học sinh
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ClassCodeCopy code={current.classCode} />
          <Link href={ROUTES.CLASS_DETAIL(current.id)} className="archive-link">
            Mở lớp <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <TeacherClassAssignments classId={current.id} />

      <div className="space-y-4">
        <SectionHeading title="Thống kê lớp" description="Kết quả quiz, tin nhắn AI và tỷ lệ nộp bài của học sinh trong lớp." />
        <TeacherClassStats classId={current.id} />
      </div>
    </div>
  );
}
