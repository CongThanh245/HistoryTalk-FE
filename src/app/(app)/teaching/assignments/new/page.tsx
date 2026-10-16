"use client";

// Giao bai tap tren API that (POST /teacher/assignments); lop lay tu GET /teacher/classrooms.
import * as React from "react";
import { useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { SaasShell } from "@/components/saas/saas-ui";
import { ClassroomCardsSkeleton, ClassroomLoadError } from "@/components/saas/api-classroom-ui";
import { AssignmentWizard } from "@/components/saas/teaching-assignment-wizard";
import { ASSIGNMENT_TYPES } from "@/components/saas/teacher-class-assignments";
import { useRole } from "@/features/auth/usePermission";
import { apiErrorMessage, useMyApiClassrooms } from "@/features/saas/hooks-api";
import type { AssignmentType } from "@/services/assignment.service";

/** Giao bài tập kèm deadline (Role Matrix row 16). Accepts ?classId= and ?type= to prefill. */
export default function NewAssignmentPage() {
  return (
    <SaasShell live variant="app" title="Giao bài tập" description="Chọn lớp, loại bài và nội dung, rồi đặt hạn nộp.">
      <React.Suspense fallback={null}>
        <NewAssignment />
      </React.Suspense>
    </SaasShell>
  );
}

function NewAssignment() {
  const role = useRole();
  const params = useSearchParams();
  const { classes, isLoading, isError, error, refetch } = useMyApiClassrooms(role);
  const rawType = params.get("type");
  const type = ASSIGNMENT_TYPES.includes(rawType as AssignmentType) ? (rawType as AssignmentType) : null;

  if (role !== "TEACHER") {
    return <EmptyState title="Dành cho giáo viên" description="Chỉ giáo viên phụ trách lớp mới giao được bài tập." />;
  }
  if (isLoading) return <ClassroomCardsSkeleton count={1} />;
  if (isError) {
    return <ClassroomLoadError message={apiErrorMessage(error, "Vui lòng kiểm tra kết nối rồi thử lại.")} onRetry={() => void refetch()} />;
  }
  if (classes.length === 0) {
    return <EmptyState title="Chưa có lớp giảng dạy" description="Bạn cần được phân công lớp trước khi giao bài." />;
  }
  return <AssignmentWizard classes={classes} initialClassId={params.get("classId")} initialType={type} />;
}
