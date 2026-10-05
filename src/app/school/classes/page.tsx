"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { StaffFormSelect } from "@/components/staff/staff-form";
import { EmptyState } from "@/components/ui/empty-state";
import { ClassFormDialog } from "@/components/saas/class-form-dialog";
import { IconAction, NeutralBadge, SaasShell, SearchInput, normalizeText } from "@/components/saas/saas-ui";
import { ROUTES } from "@/constants/routes";
import { useSchoolData } from "@/features/saas/hooks";
import { useDemoSchoolId, useSaasStore } from "@/features/saas/store";
import type { Classroom } from "@/features/saas/types";

/** School Admin: CRUD classes of the whole school (Role Matrix row 6). */
export default function SchoolClassesPage() {
  return (
    <SaasShell title="Lớp học" description="Tạo lớp, phân công giáo viên chủ nhiệm và giáo viên dạy Lịch sử cho từng lớp.">
      <ClassesContent />
    </SaasShell>
  );
}

function ClassesContent() {
  const schoolId = useDemoSchoolId();
  const { classes, teachers, teacherById } = useSchoolData(schoolId);
  const removeClass = useSaasStore((s) => s.removeClass);

  const [grade, setGrade] = React.useState("ALL");
  const [search, setSearch] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Classroom | null>(null);
  const [deleting, setDeleting] = React.useState<Classroom | null>(null);

  const grades = Array.from(new Set(classes.map((c) => c.grade))).sort((a, b) => a - b);
  const filtered = classes.filter(
    (c) => (grade === "ALL" || c.grade === Number(grade)) && (!search || normalizeText(c.name).includes(normalizeText(search))),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm lớp..." />
        <StaffFormSelect
          value={grade}
          onValueChange={setGrade}
          options={[{ value: "ALL", label: "Tất cả khối" }, ...grades.map((g) => ({ value: String(g), label: `Khối ${g}` }))]}
          className="w-full sm:w-44"
        />
        <div className="hidden flex-1 sm:block" />
        <button
          type="button"
          className="btn-crimson w-full sm:w-auto"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Tạo lớp
        </button>
      </div>

      <p className="text-sm text-content-muted">{filtered.length} lớp</p>

      {filtered.length === 0 ? (
        <EmptyState title="Chưa có lớp phù hợp" description="Tạo lớp mới hoặc đổi bộ lọc khối." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const homeroom = c.homeroomTeacherId ? teacherById.get(c.homeroomTeacherId) : undefined;
            const others = c.teacherIds.map((id) => teacherById.get(id)).filter((t) => !!t);
            return (
              <article key={c.id} className="flex flex-col rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)]">
                <div className="flex items-start justify-between gap-3 border-b border-[var(--border-strong)] p-4">
                  <div className="min-w-0">
                    <h3 className="archive-title is-plain text-2xl">Lớp {c.name}</h3>
                    <p className="mt-0.5 text-xs text-content-muted">
                      Khối {c.grade} · Năm học {c.schoolYear}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <IconAction
                      label={`Sửa lớp ${c.name}`}
                      onClick={() => {
                        setEditing(c);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </IconAction>
                    <IconAction label={`Xóa lớp ${c.name}`} tone="danger" onClick={() => setDeleting(c)}>
                      <Trash2 className="h-4 w-4" />
                    </IconAction>
                  </div>
                </div>
                <dl className="grid flex-1 grid-cols-[auto_1fr] gap-x-4 gap-y-2 p-4 text-sm">
                  <dt className="text-content-muted">Chủ nhiệm</dt>
                  <dd className="min-w-0 truncate font-medium text-content-heading">
                    {homeroom ? (
                      homeroom.fullName
                    ) : (
                      <span className="text-[var(--status-warning)]">Chưa phân công</span>
                    )}
                  </dd>
                  <dt className="text-content-muted">Giáo viên</dt>
                  <dd className="min-w-0 truncate">{others.length ? others.map((t) => t.fullName).join(", ") : "—"}</dd>
                  <dt className="text-content-muted">Sĩ số</dt>
                  <dd className="font-semibold tabular-nums">{c.studentIds.length} học sinh</dd>
                </dl>
                <div className="flex items-center justify-between gap-2 border-t border-[var(--border-default)] px-4 py-3">
                  {homeroom?.status === "LOCKED" ? <NeutralBadge>GVCN đang bị khóa</NeutralBadge> : <span />}
                  <Link href={ROUTES.SCHOOL.CLASS_DETAIL(c.id)} className="archive-link">
                    Xem lớp <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ClassFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        schoolId={schoolId}
        editing={editing}
        teachers={teachers}
        existingClasses={classes}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Xóa lớp ${deleting?.name ?? ""}?`}
        description={`${deleting?.studentIds.length ?? 0} học sinh sẽ trở thành “chưa xếp lớp”. Ghim bản đồ và bài tập của lớp cũng bị xóa. Không thể hoàn tác.`}
        confirmLabel="Xóa lớp"
        variant="danger"
        onConfirm={() => {
          if (!deleting) return;
          removeClass(deleting.id);
          toast.success(`Đã xóa lớp ${deleting.name}`);
          setDeleting(null);
        }}
      />
    </div>
  );
}
