"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight, GraduationCap, PartyPopper, UserRound, Users } from "lucide-react";
import { MockDataNotice } from "@/components/saas/mock-data-notice";
import { useHydrated } from "@/components/saas/saas-ui";
import { DueLine } from "@/components/saas/student-assignment-card";
import { localContentHref } from "@/components/saas/student-local-content-list";
import { AssignmentTypeBadge, AssignmentTypeTile, formatScore } from "@/components/saas/student-ui";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import {
  localTitle,
  studentNow,
  useClassLocalContent,
  useStudentAssignments,
  useStudentGradeBook,
  type StudentAssignmentRow,
} from "@/features/saas/hooks-student";
import { DEMO_STUDENT_ID } from "@/features/saas/mock-data";
import { useSaasStore } from "@/features/saas/store";
import type { Classroom, LocalContent } from "@/features/saas/types";
import { useAuthStore } from "@/store/auth.store";

/**
 * "Hôm nay của em": the school student's day at the top of /home (Role Matrix rows 14, 17, 25).
 * Renders nothing for every other role, so the B2C home is unchanged.
 */
export function StudentToday() {
  const role = useRole();
  const hydrated = useHydrated();
  if (!hydrated || role !== "SCHOOL_STUDENT") return null;
  return <TodayBody role={role} />;
}

const MAX_ROWS = 4;
const KIND_LABEL: Record<LocalContent["kind"], string> = { CONTEXT: "Bối cảnh", CHARACTER: "Nhân vật", QUIZ: "Luyện tập" };

function greeting(now: Date) {
  const h = now.getHours();
  return h < 11 ? "Chào buổi sáng" : h < 13 ? "Chào buổi trưa" : h < 18 ? "Chào buổi chiều" : "Chào buổi tối";
}

function TodayBody({ role }: { role: string }) {
  const { rows, classes } = useStudentAssignments(role);
  const user = useAuthStore((s) => s.user);
  const schools = useSaasStore((s) => s.schools);
  const students = useSaasStore((s) => s.students);
  const teachers = useSaasStore((s) => s.teachers);

  const now = studentNow();
  const classroom = classes[0];
  const school = schools.find((s) => s.id === classroom?.schoolId);
  const name = user?.fullName || students.find((s) => s.id === DEMO_STUDENT_ID)?.fullName || user?.userName || "em";
  const firstName = name.trim().split(/\s+/).pop();

  // Actionable work first: overdue items that still take late hand-ins, then due soon, then the rest of the open list.
  const { list, overdueLate, overdueClosed, dueSoon } = useMemo(() => {
    const overdue = rows.filter((r) => r.bucket === "OVERDUE");
    const late = overdue.filter((r) => r.assignment.allowLate);
    const soon = rows.filter((r) => r.bucket === "DUE_SOON");
    const todo = rows.filter((r) => r.bucket === "TODO");
    return {
      list: [...late, ...soon, ...todo].slice(0, MAX_ROWS),
      overdueLate: late.length,
      overdueClosed: overdue.length - late.length,
      dueSoon: soon.length,
    };
  }, [rows]);

  if (!classroom) return null;

  const dateLabel = now.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
  const classNames = classes.map((c) => c.name).join(", ");
  const summary = [
    overdueLate ? `${overdueLate} bài quá hạn còn nộp muộn được` : null,
    dueSoon ? `${dueSoon} bài sắp đến hạn trong 48 giờ` : null,
  ].filter(Boolean);

  return (
    <section aria-labelledby="student-today-title" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[var(--text-primary)] pb-4">
        <div className="min-w-0 space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-content-muted first-letter:uppercase">{dateLabel}</p>
          <h2 id="student-today-title" className="archive-title text-3xl sm:text-4xl">
            Hôm nay của em
          </h2>
          <p className="text-[15px] leading-relaxed text-content-text">
            {greeting(now)}, <strong>{firstName}</strong>! Lớp {classNames}
            {school && <> · {school.name}</>}
          </p>
        </div>
        <p className="text-[13px] text-content-muted">
          {summary.length ? `Em có ${summary.join(" và ")}.` : "Không có bài nào gấp hôm nay."}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="min-w-0 space-y-3 lg:col-span-2">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="archive-title is-plain text-xl">Bài cần làm</h3>
            <Link href={ROUTES.MY_ASSIGNMENTS} className="archive-link">
              Tất cả bài tập <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          {list.length === 0 ? (
            <div className="flex items-center gap-3 rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] p-4">
              <PartyPopper className="h-5 w-5 shrink-0 text-[var(--jade)]" aria-hidden="true" />
              <p className="text-[14px] text-content-text">Không còn bài nào cần làm. Em giỏi lắm!</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border-default)] rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)]">
              {list.map((row) => (
                <AssignmentRow key={row.assignment.id} row={row} />
              ))}
            </ul>
          )}
          {overdueClosed > 0 && (
            <p className="text-[12px] text-content-muted">
              {overdueClosed} bài đã quá hạn và không nhận nộp muộn, xem trong{" "}
              <Link href={ROUTES.MY_ASSIGNMENTS} className="font-bold text-content-text underline underline-offset-4 hover:text-[var(--accent-gold)]">
                Bài tập của em
              </Link>
              .
            </p>
          )}
        </div>

        <div className="grid min-w-0 content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <ClassCard classroom={classroom} teacherName={teachers.find((t) => t.id === classroom.homeroomTeacherId)?.fullName} />
          <LatestLocal classroom={classroom} role={role} />
          <GradesCard role={role} />
        </div>
      </div>

      <MockDataNotice />
    </section>
  );
}

function AssignmentRow({ row }: { row: StudentAssignmentRow }) {
  return (
    <li>
      <Link
        href={ROUTES.MY_ASSIGNMENT_DETAIL(row.assignment.id)}
        className="group flex gap-3 p-3 sm:p-4 motion-safe:transition-colors hover:bg-[var(--bg-elevated)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent-gold)]"
      >
        <AssignmentTypeTile type={row.assignment.type} size={40} />
        <span className="min-w-0 flex-1 space-y-1">
          <span className="flex flex-wrap items-center gap-2">
            <AssignmentTypeBadge type={row.assignment.type} />
            {row.bucket === "OVERDUE" && (
              <span className="text-[11px] font-bold text-[var(--accent-danger)]">Quá hạn</span>
            )}
          </span>
          <span className="block text-[15px] font-bold leading-snug text-content-text group-hover:text-[var(--accent-gold)]">
            {row.assignment.title}
          </span>
          <DueLine row={row} compact />
        </span>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 self-center text-content-muted" aria-hidden="true" />
      </Link>
    </li>
  );
}

const SIDE_CARD = "rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] p-4";
const SIDE_LABEL = "flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em]";

function ClassCard({ classroom, teacherName }: { classroom: Classroom; teacherName?: string }) {
  return (
    <div className={SIDE_CARD}>
      <p className={`${SIDE_LABEL} text-[var(--men-lam)]`}>
        <Users className="h-3.5 w-3.5" aria-hidden="true" /> Lớp của em
      </p>
      <p className="archive-title is-plain mt-1.5 text-2xl">Lớp {classroom.name}</p>
      <p className="mt-1 flex items-center gap-1.5 text-[13px] text-content-muted">
        <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {teacherName ? `GVCN ${teacherName}` : "Chưa có giáo viên chủ nhiệm"} · {classroom.studentIds.length} học sinh
      </p>
      <Link href={ROUTES.CLASS_DETAIL(classroom.id)} className="archive-link mt-3">
        Vào lớp <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

function LatestLocal({ classroom, role }: { classroom: Classroom; role: string }) {
  const items = useClassLocalContent(classroom.id, role);
  const latest = useMemo(
    () => [...items].filter((x) => x.status === "PUBLISHED").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0],
    [items],
  );
  return (
    <div className={SIDE_CARD}>
      <p className={`${SIDE_LABEL} text-[var(--jade)]`}>
        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Lịch sử địa phương mới
      </p>
      {latest ? (
        <Link href={localContentHref(classroom.id, latest.id)} className="group mt-1.5 block">
          <span className="text-[11px] font-bold text-content-muted">{KIND_LABEL[latest.kind]}</span>
          <span className="block text-[15px] font-bold leading-snug text-content-text group-hover:text-[var(--accent-gold)]">
            {localTitle(latest)}
          </span>
          <span className="archive-link mt-2">
            Xem tư liệu <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>
      ) : (
        <p className="mt-1.5 text-[13px] text-content-muted">Thầy cô chưa xuất bản tư liệu địa phương nào cho lớp em.</p>
      )}
    </div>
  );
}

function GradesCard({ role }: { role: string }) {
  const book = useStudentGradeBook(role);
  const average = book.find((b) => b.average !== null)?.average ?? null;
  return (
    <Link
      href={ROUTES.GRADES}
      className={`${SIDE_CARD} group flex items-center gap-3 motion-safe:transition-colors hover:bg-[var(--bg-elevated)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)] sm:col-span-2 lg:col-span-1`}
    >
      <GraduationCap className="h-6 w-6 shrink-0 text-[var(--gold-leaf)]" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-content-text group-hover:text-[var(--accent-gold)]">Bảng điểm</span>
        <span className="block text-[12px] text-content-muted">
          {average !== null ? (
            <>
              Điểm trung bình <strong className="tabular-nums text-[var(--gold-leaf)]">{formatScore(average)}</strong> / 10
            </>
          ) : (
            "Chưa có bài kiểm tra nào được chấm"
          )}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
    </Link>
  );
}
