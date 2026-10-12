"use client";

import { Users } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { SaasShell } from "@/components/saas/saas-ui";
import { StudentWorkspace } from "@/components/saas/student-workspace";
import { ApiClassroomCard, ClassroomCardsSkeleton, ClassroomLoadError } from "@/components/saas/api-classroom-ui";
import { useRole } from "@/features/auth/usePermission";
import { apiErrorMessage, useMyApiClassrooms } from "@/features/saas/hooks-api";

/**
 * "Không gian lớp học". School students land here (ROLE_HOME): their classes and workspace.
 * Teachers see the classes they are assigned to. Classes come from the classroom API.
 */
export default function MyClassesPage() {
  const role = useRole();
  const isStudent = role === "SCHOOL_STUDENT";
  return (
    <SaasShell
      variant="app"
      title={isStudent ? "Lớp học của em" : "Lớp học"}
      description={
        role === "TEACHER"
          ? "Các lớp bạn được phân công giảng dạy. Mở lớp để xem thông tin lớp."
          : "Lớp của em và các mục học tập trong không gian lớp học."
      }
    >
      <MyClasses role={role} />
    </SaasShell>
  );
}

function MyClasses({ role }: { role: string | null }) {
  const { classes, truncated, isLoading, isError, error, refetch } = useMyApiClassrooms(role);

  if (role !== "TEACHER" && role !== "SCHOOL_STUDENT") {
    return <EmptyState title="Không có lớp học" description="Mục này dành cho tài khoản giáo viên và học sinh của trường." />;
  }
  if (isLoading) return <ClassroomCardsSkeleton count={role === "SCHOOL_STUDENT" ? 1 : 3} />;
  if (isError) {
    return <ClassroomLoadError message={apiErrorMessage(error, "Vui lòng kiểm tra kết nối rồi thử lại.")} onRetry={() => void refetch()} />;
  }
  if (classes.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={role === "TEACHER" ? "Bạn chưa được phân công lớp nào" : "Em chưa thuộc lớp nào"}
        description={role === "TEACHER" ? "Quản trị trường sẽ phân công lớp cho bạn." : "Liên hệ giáo viên hoặc quản trị trường."}
      />
    );
  }
  if (role === "SCHOOL_STUDENT") return <StudentWorkspace classes={classes} />;

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {classes.map((c) => (
          <ApiClassroomCard key={c.id} classroom={c} role="TEACHER" />
        ))}
      </div>
      {truncated && <p className="text-xs text-content-muted">Đang hiển thị 100 lớp đầu tiên.</p>}
    </div>
  );
}
