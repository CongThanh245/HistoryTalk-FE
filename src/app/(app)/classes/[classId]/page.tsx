"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, ClipboardList, Map as MapIcon } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SaasShell } from "@/components/saas/saas-ui";
import { ClassCodeCopy, ClassroomStatusPill, classroomMeta } from "@/components/saas/api-classroom-ui";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { apiErrorMessage, apiErrorStatus, useApiClassroom } from "@/features/saas/hooks-api";
import type { ApiClassroom } from "@/services/school.service";
import { TeacherClassStats } from "@/components/saas/teacher-classroom-analytics";
import { ClassRosterManager } from "@/components/saas/class-roster-manager";
import { TeacherClassAssignments } from "@/components/saas/teacher-class-assignments";
import { StudentClassAssignments } from "@/components/saas/student-class-assignments";
import { KIND_LABEL, MaterialCard, useAssignmentTasks } from "@/components/saas/class-material-card";
import { AssignmentTypeTile, ScoreChip, assignmentBucket, formatDateTime } from "@/components/saas/student-assignment-card";
import { SegmentedFilter } from "@/components/saas/teaching-ui";
import { useMyAssignments } from "@/features/saas/hooks-assignment-api";
import { useStudentLocalContent } from "@/features/saas/hooks-local-content";
import type { StudentAssignment } from "@/services/assignment.service";
import type { LocalItem, LocalKind } from "@/services/local-content.service";
import { cn } from "@/lib/utils/cn";

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
      description={
        classroom
          ? `${classroomMeta(classroom)} · ${classroom.studentCount} học sinh${role === "SCHOOL_STUDENT" && classroom.teacher?.fullName ? ` · GV ${classroom.teacher.fullName}` : ""}`
          : undefined
      }
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
      <div className="h-[72px] animate-pulse rounded-sm border border-[var(--border-strong)] bg-[var(--bg-elevated)] motion-reduce:animate-none" aria-busy="true" />
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
      <Tabs value={tab} onValueChange={setTab} className="gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
          <div className="flex flex-wrap items-center gap-2">
            <InactiveStatus classroom={classroom} />
            <span className="text-xs text-content-muted">Mã lớp</span>
            <ClassCodeCopy code={classroom.classCode} />
          </div>
        </div>
        <TabsContent value="assignments">
          <TeacherClassAssignments classId={classroom.id} />
        </TabsContent>
        <TabsContent value="students">
          <ClassRosterManager classId={classroom.id} canManage />
        </TabsContent>
        <TabsContent value="stats">
          <TeacherClassStats classId={classroom.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ───────────────────────── Student ───────────────────────── */

const STUDENT_TABS = ["assignments", "materials", "grades"] as const;
type StudentTab = (typeof STUDENT_TABS)[number];

/** Hoc sinh: trang lop la noi tap trung moi thu cua lop (bai tap, tu lieu, diem). */
function StudentView({ classroom }: { classroom: ApiClassroom }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get("tab");
  const tab: StudentTab = STUDENT_TABS.includes(requested as StudentTab) ? (requested as StudentTab) : "assignments";
  const setTab = (v: string) => router.replace(`${pathname}?tab=${v}`, { scroll: false });

  const mine = useMyAssignments({ classroomId: classroom.id, size: 100 });
  const list = mine.data?.items ?? [];
  const todo = list.filter((a) => ["TODO", "DUE_SOON", "OVERDUE"].includes(assignmentBucket(a))).length;
  const done = list.filter((a) => assignmentBucket(a) === "DONE");
  const scored = done.filter((a) => a.score !== null);
  const avg = scored.length ? scored.reduce((sum, a) => sum + (a.score ?? 0), 0) / scored.length : null;

  // Tu lieu cua lop: chia se toan truong + rieng lop nay.
  const local = useStudentLocalContent(true);
  const materials = local.items.filter(
    (i) => i.isPublished && (i.contentScope === "SCHOOL_WIDE" || (i.classIds ?? []).includes(classroom.id)),
  );

  return (
    <div className="space-y-6">
      <InactiveStatus classroom={classroom} />
      {classroom.description?.trim() && (
        <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{classroom.description}</p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat label="Bài cần làm" value={mine.isLoading ? "…" : todo} tone={todo ? "warn" : "ok"} onClick={() => setTab("assignments")} />
        <QuickStat label="Đã nộp" value={mine.isLoading ? "…" : `${done.length}/${list.length}`} onClick={() => setTab("assignments")} />
        <QuickStat label="Điểm trung bình" value={avg == null ? "—" : avg.toFixed(1)} hint="/ 10" onClick={() => setTab("grades")} />
        <QuickStat label="Tư liệu của lớp" value={local.isLoading ? "…" : materials.length} onClick={() => setTab("materials")} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="gap-5">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="h-10 w-max min-w-full sm:min-w-0">
            <TabsTrigger value="assignments" className="px-4">
              Bài tập{todo ? ` (${todo} cần làm)` : ""}
            </TabsTrigger>
            <TabsTrigger value="materials" className="px-4">
              Tư liệu ({materials.length})
            </TabsTrigger>
            <TabsTrigger value="grades" className="px-4">
              Điểm
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="assignments">
          <StudentClassAssignments classId={classroom.id} />
        </TabsContent>
        <TabsContent value="materials">
          <ClassMaterials items={materials} loading={local.isLoading} />
        </TabsContent>
        <TabsContent value="grades">
          <ClassGrades assignments={done} avg={avg} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuickStat({
  label,
  value,
  hint,
  tone,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "warn" | "ok";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-sm border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3 text-left motion-safe:transition-colors hover:border-[var(--text-primary)]"
    >
      <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-content-muted">{label}</span>
      <span
        className={cn(
          "font-display text-[26px] font-extrabold leading-tight tabular-nums",
          tone === "warn" ? "text-[var(--accent-gold)]" : tone === "ok" ? "text-[var(--jade)]" : "text-content-heading",
        )}
      >
        {value}
      </span>
      {hint && <span className="ml-1 text-xs text-content-muted">{hint}</span>}
    </button>
  );
}

function ClassMaterials({ items, loading }: { items: LocalItem[]; loading: boolean }) {
  const tasks = useAssignmentTasks(true);
  const [kind, setKind] = React.useState<LocalKind | "ALL">("ALL");
  if (loading) return <div className="h-40 animate-pulse rounded-sm bg-[var(--bg-elevated)] motion-reduce:animate-none" aria-busy="true" />;
  if (items.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        size="sm"
        title="Lớp chưa có tư liệu"
        description="Khi thầy cô đăng bối cảnh hoặc nhân vật cho lớp, bạn sẽ thấy ở đây."
        action={
          <Link href={ROUTES.EVENTS} className="btn-line">
            Khám phá thư viện HistoryTalk
          </Link>
        }
      />
    );
  }
  const pendingFirst = (i: LocalItem) => (tasks.get(i.id) && !tasks.get(i.id)!.done ? 1 : 0);
  const sorted = items.slice().sort((a, b) => pendingFirst(b) - pendingFirst(a) || b.updatedAt.localeCompare(a.updatedAt));
  const shown = sorted.filter((i) => kind === "ALL" || i.type === kind);
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedFilter
          variant="pills"
          label="Loại tư liệu"
          value={kind}
          onChange={setKind}
          options={[
            { value: "ALL" as const, label: "Tất cả", count: items.length },
            ...(Object.keys(KIND_LABEL) as LocalKind[]).map((k) => ({
              value: k,
              label: KIND_LABEL[k],
              count: items.filter((i) => i.type === k).length,
            })),
          ]}
        />
        <Link href={ROUTES.CLASS_MAP} className="btn-line">
          <MapIcon className="h-4 w-4" aria-hidden="true" /> Xem sự kiện trên bản đồ
        </Link>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((item) => (
          <li key={`${item.type}-${item.id}`}>
            <MaterialCard item={item} task={tasks.get(item.id)} teacher={false} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ClassGrades({ assignments, avg }: { assignments: StudentAssignment[]; avg: number | null }) {
  if (assignments.length === 0) {
    return <EmptyState icon={ClipboardList} size="sm" title="Chưa có điểm" description="Điểm sẽ hiện ở đây sau khi bạn nộp bài." />;
  }
  const sorted = assignments.slice().sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
  return (
    <div className="space-y-3">
      {avg != null && (
        <p className="text-sm text-content-muted">
          Điểm trung bình của bạn ở lớp này: <b className="text-content-heading">{avg.toFixed(1)} / 10</b>
        </p>
      )}
      <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
        {sorted.map((a) => (
          <li key={a.assignmentId}>
            <Link href={ROUTES.MY_ASSIGNMENT_DETAIL(a.assignmentId)} className="group flex items-center gap-3 py-2.5">
              <AssignmentTypeTile type={a.assignmentType} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold text-content-text group-hover:text-[var(--accent-gold)]">{a.title}</span>
                <span className="block text-[12px] text-content-muted">Nộp lúc {formatDateTime(a.submittedAt)}</span>
              </span>
              {a.score !== null ? <ScoreChip score={a.score} /> : <span className="text-xs text-content-muted">Chưa có điểm</span>}
            </Link>
          </li>
        ))}
      </ul>
      <Link href={ROUTES.GRADES} className="archive-link">
        Xem bảng điểm tất cả các lớp
      </Link>
    </div>
  );
}

/* ───────────────────────── Shared ───────────────────────── */

/** Chi hien trang thai khi lop khong con hoat dong (luu tru...): lop dang hoc thi khong can nhan. */
function InactiveStatus({ classroom }: { classroom: ApiClassroom }) {
  return classroom.status === "ACTIVE" ? null : <ClassroomStatusPill status={classroom.status} />;
}
