"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, UserRound } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SaasShell, SectionHeading } from "@/components/saas/saas-ui";
import { ClassCodeCopy, ClassroomStatusPill, classroomMeta } from "@/components/saas/api-classroom-ui";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { apiErrorMessage, apiErrorStatus, useApiClassroom } from "@/features/saas/hooks-api";
import type { ApiClassroom } from "@/services/school.service";
import { TeacherClassStats } from "@/components/saas/teacher-classroom-analytics";
import { ClassRosterManager } from "@/components/saas/class-roster-manager";
import { TeacherClassAssignments } from "@/components/saas/teacher-class-assignments";
import { StudentClassAssignments } from "@/components/saas/student-class-assignments";

/**
 * Class page for its teacher and students. The class itself comes from `GET /classrooms/{id}`;
 * roster: `GET /classrooms/{id}/students` (teacher); statistics: `GET /teacher/dashboard/classrooms/{id}`;
 * assignments: `/teacher/assignments/classroom/{id}` or `/student/assignments?classroomId=`.
 * Giao vien vao lop thay bai tap truoc (viec hay lam nhat); hoc sinh chi thay bai tap cua lop.
 */
export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const role = useRole();
  const allowed = role === "TEACHER" || role === "SCHOOL_STUDENT";
  const query = useApiClassroom(classId, allowed);
  const classroom = query.data;

  return (
    <SaasShell
      variant="app"
      title={classroom ? `Lớp ${classroom.className}` : "Lớp học"}
      description={classroom ? `${classroomMeta(classroom)} · ${classroom.studentCount} học sinh` : undefined}
    >
      <React.Suspense fallback={null}>
        <ClassDetail allowed={allowed} role={role} query={query} />
      </React.Suspense>
    </SaasShell>
  );
}

function ClassDetail({ allowed, role, query }: { allowed: boolean; role: string | null; query: ReturnType<typeof useApiClassroom> }) {
  const { data: classroom, isLoading, isError, error, refetch } = query;

  const back = (
    <Link href={ROUTES.CLASSES} className="archive-link">
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Lớp học
    </Link>
  );

  if (!allowed) {
    return <EmptyState title="Không có lớp học" description="Mục này dành cho tài khoản giáo viên và học sinh của trường." action={back} />;
  }
  if (isLoading) {
    return (
      <div className="h-[72px] animate-pulse rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] motion-reduce:animate-none" aria-busy="true" />
    );
  }
  if (isError || !classroom) {
    const status = apiErrorStatus(error);
    const notFound = status === 403 || status === 404;
    return (
      <EmptyState
        title={notFound ? "Không xem được lớp này" : "Không tải được thông tin lớp"}
        description={notFound ? "Lớp không tồn tại hoặc bạn không thuộc lớp này." : apiErrorMessage(error, "Vui lòng thử lại sau.")}
        action={
          notFound ? (
            back
          ) : (
            <button type="button" onClick={() => void refetch()} className="btn-ink min-h-0 px-3 py-2 text-xs">
              Thử lại
            </button>
          )
        }
      />
    );
  }

  return role === "TEACHER" ? <TeacherView classroom={classroom} /> : <StudentView classroom={classroom} />;
}

/* ───────────────────────── Teacher ───────────────────────── */

const TEACHER_TABS = ["assignments", "students", "stats"] as const;
type TeacherTab = (typeof TEACHER_TABS)[number];

function TeacherView({ classroom }: { classroom: ApiClassroom }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get("tab");
  const tab: TeacherTab = TEACHER_TABS.includes(requested as TeacherTab) ? (requested as TeacherTab) : "assignments";
  // Giu tab tren URL de tai lai trang / quay lai van dung tab.
  const setTab = (v: string) => router.replace(`${pathname}?tab=${v}`, { scroll: false });

  return (
    <div className="space-y-8">
      <InfoBar classroom={classroom}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-content-muted">Mã lớp</span>
          <ClassCodeCopy code={classroom.classCode} />
        </div>
      </InfoBar>

      <Tabs value={tab} onValueChange={setTab} className="gap-6">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="h-10 w-max min-w-full sm:min-w-0">
            <TabsTrigger value="assignments" className="px-4">
              Bài tập
            </TabsTrigger>
            <TabsTrigger value="students" className="px-4">
              Học sinh ({classroom.studentCount})
            </TabsTrigger>
            <TabsTrigger value="stats" className="px-4">
              Thống kê
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="assignments">
          <TeacherClassAssignments classId={classroom.id} />
        </TabsContent>
        <TabsContent value="students">
          <Section title="Danh sách học sinh" description="Thêm, nhập danh sách, chuyển lớp hoặc xóa học sinh khỏi lớp.">
            <ClassRosterManager classId={classroom.id} canManage />
          </Section>
        </TabsContent>
        <TabsContent value="stats">
          <Section title="Thống kê lớp" description="Kết quả quiz, tỷ lệ nộp bài và mức dùng trợ lý AI của từng học sinh.">
            <TeacherClassStats classId={classroom.id} />
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ───────────────────────── Student ───────────────────────── */

function StudentView({ classroom }: { classroom: ApiClassroom }) {
  return (
    <div className="space-y-8">
      <InfoBar classroom={classroom}>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs text-content-muted">Giáo viên</span>
          <TeacherLine classroom={classroom} />
        </div>
      </InfoBar>
      {classroom.description?.trim() && (
        <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{classroom.description}</p>
      )}
      <Section title="Bài tập của lớp" description="Bài cần làm và hạn nộp do thầy cô giao.">
        <StudentClassAssignments classId={classroom.id} />
      </Section>
    </div>
  );
}

/* ───────────────────────── Shared ───────────────────────── */

/** Mot dong thong tin gon duoi tieu de trang: trang thai lop + noi dung theo vai tro. */
function InfoBar({ classroom, children }: { classroom: ApiClassroom; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <ClassroomStatusPill status={classroom.status} className="self-start sm:self-auto" />
      {children}
    </div>
  );
}

function TeacherLine({ classroom }: { classroom: ApiClassroom }) {
  const teacher = classroom.teacher;
  if (!teacher?.fullName) return <span className="text-content-muted">Chưa phân công</span>;
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-content-heading">
      <UserRound className="h-3.5 w-3.5 shrink-0 text-content-muted" aria-hidden="true" /> {teacher.fullName}
    </span>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <SectionHeading title={title} description={description} />
      {children}
    </div>
  );
}
