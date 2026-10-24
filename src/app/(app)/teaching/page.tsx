"use client";

// Tong quan giang day tren API that: lop (GET /teacher/classrooms), thong ke lop
// (GET /teacher/dashboard/classrooms/{id}) va bai tap (GET /teacher/assignments/classroom/{id}).
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Users } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { SaasShell, SectionHeading } from "@/components/saas/saas-ui";
import { StaffFormSelect } from "@/components/staff/staff-form";
import { ClassCodeCopy, ClassroomCardsSkeleton, ClassroomLoadError, ClassroomStatusPill, classroomMeta } from "@/components/saas/api-classroom-ui";
import { TeacherClassKpis, TeacherClassStudents } from "@/components/saas/teacher-classroom-analytics";
import { TeacherClassAssignments } from "@/components/saas/teacher-class-assignments";
import { TeacherLatestAssignments } from "@/components/saas/teacher-latest-assignments";
import { formatNumber } from "@/components/saas/saas-ui";
import { ClassStudentsTokenDialog } from "@/app/school/_components/token-usage";
import { useTeacherClassesOverview } from "@/features/dashboard/hooks";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { apiErrorMessage, useMyApiClassrooms } from "@/features/saas/hooks-api";
import { cn } from "@/lib/utils/cn";

/** Toi da bao nhieu lop thi chon bang nut; nhieu hon thi dung dropdown. */
const MAX_CLASS_TABS = 6;

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
  // Token cac lop GV phu trach (GET /teacher/dashboard/classes-overview).
  const overview = useTeacherClassesOverview(role === "TEACHER");
  const tokensOf = (id: string) => overview.data?.classrooms.find((c) => c.classroomId === id);
  const [tokenDialog, setTokenDialog] = React.useState(false);

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
    <div className="space-y-10">
      <TeacherLatestAssignments classIds={classes.map((c) => c.id)} />

      <section aria-label="Lớp của tôi" className="rounded-sm border border-border-card bg-[var(--bg-surface)]">
        {classes.length > 1 && (
          <div className="flex flex-col gap-2 border-b border-[var(--border-default)] px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-sm font-medium text-content-muted">Lớp của tôi</span>
            {classes.length <= MAX_CLASS_TABS ? (
              <div role="tablist" aria-label="Chọn lớp" className="inline-flex flex-wrap gap-0.5 rounded-lg bg-[var(--status-neutral-bg)] p-0.5">
                {classes.map((c) => {
                  const active = c.id === current.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setClass(c.id)}
                      className={cn(
                        "h-8 rounded-md px-3 text-sm transition-colors",
                        active
                          ? "bg-[var(--bg-elevated)] font-semibold text-content-heading shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                          : "font-medium text-[var(--text-tertiary)] hover:text-content-heading",
                      )}
                    >
                      {c.className}
                      {tokensOf(c.id) && (
                        <span className="ml-1.5 text-xs font-normal tabular-nums text-content-subtle">
                          · {formatNumber(tokensOf(c.id)!.tokensUsedTotal)} token
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <StaffFormSelect
                value={current.id}
                onValueChange={setClass}
                options={classes.map((c) => ({ value: c.id, label: `Lớp ${c.className}` }))}
                className="w-full sm:w-[240px]"
              />
            )}
          </div>
        )}
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
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
            {tokensOf(current.id) && (
              <button type="button" className="archive-link text-xs" onClick={() => setTokenDialog(true)}>
                {formatNumber(tokensOf(current.id)!.tokensUsedTotal)} token đã dùng · xem từng học sinh
              </button>
            )}
            <ClassCodeCopy code={current.classCode} />
            <Link href={ROUTES.CLASS_DETAIL(current.id)} className="btn-line">
              Mở lớp <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
      {truncated && <p className="text-xs text-content-muted">Chỉ tải 100 lớp đầu tiên.</p>}
      <ClassStudentsTokenDialog
        classroom={tokenDialog && tokensOf(current.id) ? tokensOf(current.id)! : null}
        onOpenChange={(o) => !o && setTokenDialog(false)}
      />

      <TeacherClassKpis classId={current.id} />

      <TeacherClassAssignments classId={current.id} className={current.className} />

      <div className="space-y-4">
        <SectionHeading title={`Học sinh lớp ${current.className}`} description="Điểm quiz, tin nhắn AI và token hôm nay của từng học sinh." />
        <TeacherClassStudents classId={current.id} />
      </div>
    </div>
  );
}
