"use client";

import type * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Mail, UserRound } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Panel, SaasShell, SectionHeading } from "@/components/saas/saas-ui";
import { ClassCodeCopy, ClassroomStatusPill, NoDataYet, classroomMeta } from "@/components/saas/api-classroom-ui";
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
 * Class materials and the student's classmates list have no API yet and show an empty state.
 */
export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const role = useRole();
  return (
    <SaasShell
      variant="app"
      title="Chi tiết lớp"
      description={role === "TEACHER" ? "Thông tin lớp bạn được phân công." : "Thông tin lớp của em."}
    >
      <ClassDetail classId={classId} role={role} />
    </SaasShell>
  );
}

function ClassDetail({ classId, role }: { classId: string; role: string | null }) {
  const allowed = role === "TEACHER" || role === "SCHOOL_STUDENT";
  const { data: classroom, isLoading, isError, error, refetch } = useApiClassroom(classId, allowed);

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
      <div className="space-y-8" aria-busy="true">
        {back}
        <div className="h-[132px] animate-pulse rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] motion-reduce:animate-none" />
      </div>
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

  const header = (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="archive-title is-plain text-3xl">Lớp {classroom.className}</p>
          <p className="mt-1 text-sm text-content-muted">
            {classroomMeta(classroom)} · {classroom.studentCount} học sinh
          </p>
        </div>
        <ClassroomStatusPill status={classroom.status} />
      </div>
      <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
        <dt className="text-content-muted">Mã lớp</dt>
        <dd className="min-w-0">
          <ClassCodeCopy code={classroom.classCode} />
        </dd>
        <dt className="text-content-muted">Giáo viên</dt>
        <dd className="min-w-0">
          <TeacherLine classroom={classroom} showEmail={role === "TEACHER"} />
        </dd>
        {classroom.schoolName && (
          <>
            <dt className="text-content-muted">Trường</dt>
            <dd className="min-w-0">{classroom.schoolName}</dd>
          </>
        )}
      </dl>
      {classroom.description?.trim() && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{classroom.description}</p>}
    </Panel>
  );

  const tabs =
    role === "TEACHER"
      ? [
          {
            value: "students",
            label: "Học sinh",
            content: (
              <Section title="Danh sách học sinh" description={`Sĩ số: ${classroom.studentCount} học sinh`}>
                <ClassRosterManager classId={classroom.id} canManage />
              </Section>
            ),
          },
          { value: "assignments", label: "Bài tập", content: <TeacherClassAssignments classId={classroom.id} /> },
          { value: "local", label: "Tư liệu lớp & trường", content: <NoDataYet title="Chưa có tư liệu lớp & trường" /> },
          {
            value: "stats",
            label: "Thống kê",
            content: (
              <Section title="Thống kê lớp" description="Kết quả quiz và mức dùng trợ lý AI của từng học sinh.">
                <TeacherClassStats classId={classroom.id} />
              </Section>
            ),
          },
        ]
      : [
          { value: "assignments", label: "Bài tập", content: <StudentClassAssignments classId={classroom.id} /> },
          { value: "local", label: "Tư liệu lớp & trường", content: <NoDataYet title="Chưa có tư liệu lớp & trường" /> },
          {
            value: "classmates",
            label: "Bạn cùng lớp",
            content: (
              <Section title="Bạn cùng lớp" description={`${classroom.studentCount} học sinh`}>
                {/* GET /classrooms/{id}/students chi cho SCHOOL_ADMIN va TEACHER. */}
                <NoDataYet title="Chưa xem được danh sách lớp" description="Máy chủ chưa cho học sinh xem danh sách bạn cùng lớp." />
              </Section>
            ),
          },
        ];

  return (
    <div className="space-y-8">
      {back}
      {header}
      <ClassTabs defaultValue={tabs[0].value} tabs={tabs} />
    </div>
  );
}

function TeacherLine({ classroom, showEmail }: { classroom: ApiClassroom; showEmail: boolean }) {
  const teacher = classroom.teacher;
  if (!teacher?.fullName) return <span className="text-content-muted">Chưa phân công</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="inline-flex items-center gap-1.5 font-semibold text-content-heading">
        <UserRound className="h-3.5 w-3.5 shrink-0 text-content-muted" aria-hidden="true" /> {teacher.fullName}
      </span>
      {showEmail && teacher.email && (
        <a href={`mailto:${teacher.email}`} className="inline-flex items-center gap-1 text-[13px] text-content-muted hover:text-[var(--accent-gold)]">
          <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {teacher.email}
        </a>
      )}
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

function ClassTabs({ defaultValue, tabs }: { defaultValue: string; tabs: { value: string; label: string; content: React.ReactNode }[] }) {
  return (
    <Tabs defaultValue={defaultValue} className="gap-6">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabsList className="h-10 w-max min-w-full sm:min-w-0">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="px-4">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map((t) => (
        <TabsContent key={t.value} value={t.value}>
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
