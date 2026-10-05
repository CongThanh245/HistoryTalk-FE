"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Users } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { SaasShell } from "@/components/saas/saas-ui";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { useSchoolData } from "@/features/saas/hooks";
import { useDemoSchoolId, useDemoTeacherId, useMyClasses, useSaasStore } from "@/features/saas/store";
import { TODAY, assignmentState, formatPercent, isOpenState, useTeachingData } from "@/features/saas/hooks-teaching";

/** Teacher + School Student: the classes they take part in (Role Matrix row 8, view only). */
export default function MyClassesPage() {
  const role = useRole();
  return (
    <SaasShell
      variant="app"
      title="Lớp của tôi"
      description={
        role === "TEACHER"
          ? "Các lớp bạn chủ nhiệm hoặc giảng dạy Lịch sử. Mở lớp để quản lý danh sách học sinh."
          : "Lớp học của bạn, giáo viên phụ trách và các điểm học tập trên bản đồ của lớp."
      }
    >
      <MyClasses role={role} />
    </SaasShell>
  );
}

function MyClasses({ role }: { role: string | null }) {
  const classes = useMyClasses(role);
  const { teacherById } = useSchoolData(useDemoSchoolId());
  const teacherId = useDemoTeacherId();
  const classPins = useSaasStore((s) => s.classPins);
  const teaching = useTeachingData(role);

  if (role !== "TEACHER" && role !== "SCHOOL_STUDENT") {
    return <EmptyState title="Không có lớp học" description="Mục này dành cho tài khoản giáo viên và học sinh của trường." />;
  }
  if (classes.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Bạn chưa thuộc lớp nào"
        description={role === "TEACHER" ? "Quản trị trường sẽ phân công lớp cho bạn." : "Liên hệ giáo viên chủ nhiệm hoặc quản trị trường."}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {classes.map((c) => {
        const isHomeroom = role === "TEACHER" && c.homeroomTeacherId === teacherId;
        const teacherNames = Array.from(new Set([c.homeroomTeacherId, ...c.teacherIds].filter((x): x is string => !!x)))
          .map((id) => teacherById.get(id)?.fullName)
          .filter(Boolean);
        const pins = classPins.filter((p) => p.classId === c.id);
        const assignments = pins.filter((p) => p.kind === "ASSIGNMENT").length;
        const classAssignments = teaching.assignments.filter((a) => a.classId === c.id);
        const openCount = classAssignments.filter((a) => isOpenState(assignmentState(a))).length;
        let done = 0;
        let total = 0;
        for (const a of classAssignments) {
          if (new Date(a.openAt) > TODAY) continue;
          const p = teaching.progress.get(a.id);
          done += p?.done ?? 0;
          total += p?.total ?? 0;
        }
        return (
          <Link
            key={c.id}
            href={ROUTES.CLASS_DETAIL(c.id)}
            className="group flex flex-col rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] transition-colors hover:border-[var(--accent-gold)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border-strong)] p-4">
              <div className="min-w-0">
                <h2 className="archive-title is-plain text-2xl group-hover:text-[var(--accent-gold)]">Lớp {c.name}</h2>
                <p className="mt-0.5 text-xs text-content-muted">
                  Khối {c.grade} · Năm học {c.schoolYear}
                </p>
              </div>
              {isHomeroom && (
                <span className="shrink-0 rounded-[2px] bg-[var(--accent-gold)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                  Chủ nhiệm
                </span>
              )}
            </div>
            <dl className="grid flex-1 grid-cols-[auto_1fr] gap-x-4 gap-y-2 p-4 text-sm">
              <dt className="text-content-muted">Sĩ số</dt>
              <dd className="font-semibold tabular-nums">{c.studentIds.length} học sinh</dd>
              <dt className="text-content-muted">Giáo viên</dt>
              <dd className="min-w-0">{teacherNames.length ? teacherNames.join(", ") : "—"}</dd>
              <dt className="text-content-muted">Bản đồ lớp</dt>
              <dd className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[var(--men-lam)]" aria-hidden="true" />
                {pins.length} điểm{assignments ? ` · ${assignments} bài tập` : ""}
              </dd>
              {role === "TEACHER" && (
                <>
                  <dt className="text-content-muted">Bài tập</dt>
                  <dd className="tabular-nums">
                    {openCount} đang mở · nộp {formatPercent(total ? done / total : null)}
                  </dd>
                </>
              )}
            </dl>
            <div className="flex justify-end border-t border-[var(--border-default)] px-4 py-3">
              <span className="archive-link">
                {role === "TEACHER" ? "Quản lý lớp" : "Xem lớp"} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
