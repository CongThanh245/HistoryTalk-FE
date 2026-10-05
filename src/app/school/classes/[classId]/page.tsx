"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ClassFormDialog } from "@/components/saas/class-form-dialog";
import { ClassRoster } from "@/components/saas/class-roster";
import { ClassTeachers } from "@/components/saas/class-teachers";
import { Panel, SaasShell, SectionHeading } from "@/components/saas/saas-ui";
import { ROUTES } from "@/constants/routes";
import { useSchoolData } from "@/features/saas/hooks";
import { useDemoSchoolId } from "@/features/saas/store";

/** School Admin: one class — roster (row 7) and its teachers. */
export default function SchoolClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  return (
    <SaasShell title="Chi tiết lớp" description="Danh sách học sinh, thêm, chuyển lớp hoặc xóa học sinh khỏi lớp.">
      <ClassDetail classId={classId} />
    </SaasShell>
  );
}

function ClassDetail({ classId }: { classId: string }) {
  const schoolId = useDemoSchoolId();
  const { classes, students, teachers, teacherById, classByStudent } = useSchoolData(schoolId);
  const [editOpen, setEditOpen] = React.useState(false);
  const classroom = classes.find((c) => c.id === classId);

  if (!classroom) {
    return (
      <EmptyState
        title="Không tìm thấy lớp"
        description="Lớp có thể đã bị xóa."
        action={
          <Link href={ROUTES.SCHOOL.CLASSES} className="archive-link">
            Về danh sách lớp
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={ROUTES.SCHOOL.CLASSES} className="archive-link">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Tất cả lớp
        </Link>
        <button type="button" className="btn-line" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" aria-hidden="true" /> Sửa thông tin lớp
        </button>
      </div>

      <Panel>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="archive-title is-plain text-3xl">Lớp {classroom.name}</p>
            <p className="mt-1 text-sm text-content-muted">
              Khối {classroom.grade} · Năm học {classroom.schoolYear} · {classroom.studentIds.length} học sinh
            </p>
          </div>
        </div>
        <ClassTeachers classroom={classroom} teacherById={teacherById} />
      </Panel>

      <div className="space-y-4">
        <SectionHeading title="Học sinh" />
        <ClassRoster
          classroom={classroom}
          pool={students}
          moveTargets={classes.filter((c) => c.id !== classroom.id)}
          classByStudent={classByStudent}
        />
      </div>

      <ClassFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        schoolId={schoolId}
        editing={classroom}
        teachers={teachers}
        existingClasses={classes}
      />
    </div>
  );
}
