"use client";

import type * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarClock, Landmark, ListChecks } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClassRoster, givenName } from "@/components/saas/class-roster";
import { ClassTeachers } from "@/components/saas/class-teachers";
import { Panel, SaasShell, SectionHeading, formatDate } from "@/components/saas/saas-ui";
import {
  ClassMapTab,
  StudentAssignmentsTab,
  StudentLocalTab,
  TeacherAssignmentsTab,
  TeacherLocalTab,
  TeacherStatsTab,
} from "@/components/saas/teaching-class-tabs";
import { ROUTES } from "@/constants/routes";
import { useTeachingData } from "@/features/saas/hooks-teaching";
import { useRole } from "@/features/auth/usePermission";
import { useSchoolData } from "@/features/saas/hooks";
import { useDemoSchoolId, useDemoStudentId, useMyClasses, useSaasStore } from "@/features/saas/store";
import type { ClassMapPin, Classroom } from "@/features/saas/types";

/** Teacher: manage the roster of a class they teach (row 7). Student: read-only class info (row 8). */
export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const role = useRole();
  return (
    <SaasShell
      variant="app"
      title="Chi tiết lớp"
      description={
        role === "TEACHER"
          ? "Học sinh, bài tập, lịch sử địa phương, bản đồ và thống kê của lớp."
          : "Thông tin lớp, bài tập được giao, lịch sử địa phương và bạn cùng lớp."
      }
    >
      <ClassDetail classId={classId} role={role} />
    </SaasShell>
  );
}

function ClassDetail({ classId, role }: { classId: string; role: string | null }) {
  const myClasses = useMyClasses(role);
  const data = useSchoolData(useDemoSchoolId());
  const teaching = useTeachingData(role);
  const classroom = myClasses.find((c) => c.id === classId);

  const back = (
    <Link href={ROUTES.CLASSES} className="archive-link">
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Lớp của tôi
    </Link>
  );

  if (!classroom) {
    return (
      <EmptyState
        title="Không xem được lớp này"
        description="Lớp không tồn tại hoặc bạn không thuộc lớp này."
        action={back}
      />
    );
  }

  const header = (
    <Panel>
      <div>
        <p className="archive-title is-plain text-3xl">Lớp {classroom.name}</p>
        <p className="mt-1 text-sm text-content-muted">
          Khối {classroom.grade} · Năm học {classroom.schoolYear} · {classroom.studentIds.length} học sinh
        </p>
      </div>
      <ClassTeachers classroom={classroom} teacherById={data.teacherById} showEmail={role === "TEACHER"} />
    </Panel>
  );

  if (role === "TEACHER") {
    return (
      <div className="space-y-8">
        {back}
        {header}
        <ClassTabs
          defaultValue="students"
          tabs={[
            {
              value: "students",
              label: "Học sinh",
              content: (
                <ClassRoster
                  classroom={classroom}
                  pool={data.students}
                  moveTargets={myClasses.filter((c) => c.id !== classroom.id)}
                  classByStudent={data.classByStudent}
                />
              ),
            },
            { value: "assignments", label: "Bài tập", content: <TeacherAssignmentsTab data={teaching} classroom={classroom} /> },
            { value: "local", label: "Lịch sử địa phương", content: <TeacherLocalTab data={teaching} classroom={classroom} /> },
            {
              value: "map",
              label: "Bản đồ lớp",
              content: (
                <div className="space-y-8">
                  <ClassMapTab data={teaching} classroom={classroom} />
                  <ClassPins classroom={classroom} />
                </div>
              ),
            },
            { value: "stats", label: "Thống kê", content: <TeacherStatsTab data={teaching} classroom={classroom} /> },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {back}
      {header}
      <ClassTabs
        defaultValue="info"
        tabs={[
          { value: "info", label: "Thông tin", content: <ClassPins classroom={classroom} /> },
          { value: "assignments", label: "Bài tập", content: <StudentAssignmentsTab data={teaching} classroom={classroom} /> },
          { value: "local", label: "Lịch sử địa phương", content: <StudentLocalTab data={teaching} classroom={classroom} /> },
          { value: "classmates", label: "Bạn cùng lớp", content: <Classmates classroom={classroom} /> },
        ]}
      />
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

function ClassPins({ classroom }: { classroom: Classroom }) {
  const allPins = useSaasStore((s) => s.classPins);
  const pins: ClassMapPin[] = allPins
    .filter((p) => p.classId === classroom.id)
    .sort((a, b) => (a.kind === b.kind ? (a.dueDate ?? "").localeCompare(b.dueDate ?? "") : a.kind === "ASSIGNMENT" ? -1 : 1));
  const mapHref = `${ROUTES.HISTORICAL_MAP}?layer=class&classId=${encodeURIComponent(classroom.id)}`;

  return (
    <div className="space-y-4">
      <SectionHeading title="Bản đồ của lớp" description="Điểm lịch sử địa phương và bài tập giáo viên ghim cho lớp." />
      {pins.length === 0 ? (
        <p className="text-sm text-content-muted">Giáo viên chưa ghim điểm nào cho lớp.</p>
      ) : (
        <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--text-primary)]">
          {pins.map((p) => {
            const Icon = p.kind === "ASSIGNMENT" ? ListChecks : Landmark;
            return (
              <li key={p.id} className="flex items-start gap-3 py-3">
                <Icon
                  className={p.kind === "ASSIGNMENT" ? "mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-gold)]" : "mt-0.5 h-5 w-5 shrink-0 text-[var(--men-lam)]"}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-content-heading">{p.label}</p>
                  <p className="mt-0.5 text-xs text-content-muted">
                    {p.kind === "ASSIGNMENT" ? "Bài tập" : "Lịch sử địa phương"}
                    {p.year ? ` · Năm ${p.year}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{p.description}</p>
                </div>
                {p.kind === "ASSIGNMENT" && p.dueDate && (
                  <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-[2px] border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-2 py-0.5 text-[11px] font-bold text-[var(--status-warning)]">
                    <CalendarClock className="h-3 w-3" aria-hidden="true" /> Hạn {formatDate(p.dueDate)}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Link href={mapHref} className="btn-ink w-full sm:w-auto">
        Xem trên bản đồ <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

function Classmates({ classroom }: { classroom: Classroom }) {
  const { studentById } = useSchoolData(classroom.schoolId);
  const me = useDemoStudentId();
  const names = classroom.studentIds
    .map((id) => studentById.get(id))
    .filter((s) => !!s)
    .sort((a, b) => givenName(a.fullName).localeCompare(givenName(b.fullName), "vi") || a.fullName.localeCompare(b.fullName, "vi"));

  return (
    <div className="space-y-4">
      <SectionHeading title="Bạn cùng lớp" description={`${names.length} học sinh`} />
      <ol className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
        {names.map((s, i) => (
          <li key={s.id} className="flex items-baseline gap-3 border-b border-[var(--border-default)] py-2 text-sm">
            <span className="w-6 shrink-0 text-right tabular-nums text-content-muted">{i + 1}</span>
            <span className={s.id === me ? "font-bold text-[var(--accent-gold)]" : "text-content-heading"}>
              {s.fullName}
              {s.id === me && " (bạn)"}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
