"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassFormDialog, academicYearLabel } from "@/components/saas/class-form-dialog";
import { ClassRosterManager } from "@/components/saas/class-roster-manager";
import { Panel, SectionHeading, formatDate, formatNumber } from "@/components/saas/saas-ui";
import { ROUTES } from "@/constants/routes";
import { apiErrorStatus, useApiClassroom } from "@/features/saas/hooks-api";
import { ClassStatusBadge } from "../../_components/classroom";
import { CopyTag, ErrorBlock, SchoolShell } from "../../_components/shared";

/** School Admin: one classroom (GET /classrooms/{id}) with its teacher in charge and its roster (/classrooms/{id}/students). */
export default function SchoolClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  return (
    <SchoolShell title="Chi tiết lớp" description="Thông tin lớp, mã lớp, giáo viên phụ trách và danh sách học sinh.">
      <ClassDetail classId={classId} />
    </SchoolShell>
  );
}

function ClassDetail({ classId }: { classId: string }) {
  const room = useApiClassroom(classId);
  const [editOpen, setEditOpen] = React.useState(false);

  const back = (
    <Link href={ROUTES.SCHOOL.CLASSES} className="archive-link">
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Tất cả lớp
    </Link>
  );

  if (room.isPending) {
    return (
      <div className="space-y-6" role="status" aria-label="Đang tải thông tin lớp">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (room.isError) {
    const status = apiErrorStatus(room.error);
    if (status === 404 || status === 403) {
      return <EmptyState title="Không tìm thấy lớp" description="Lớp có thể đã bị xóa hoặc không thuộc trường của bạn." action={back} />;
    }
    return (
      <div className="space-y-4">
        {back}
        <ErrorBlock error={room.error} fallback="Không tải được thông tin lớp." onRetry={() => void room.refetch()} />
      </div>
    );
  }

  const c = room.data;
  const teacher = c.teacher;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {back}
        <button type="button" className="btn-line" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" aria-hidden="true" /> Sửa thông tin lớp
        </button>
      </div>

      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="archive-title is-plain text-3xl">Lớp {c.className}</p>
            <p className="text-sm text-content-muted">
              Khối {c.gradeLevel ?? "—"} · Năm học {academicYearLabel(c.academicYear)} · {formatNumber(c.studentCount ?? 0)} học sinh · tạo ngày{" "}
              {formatDate(c.createdAt)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <CopyTag value={c.classCode} label="mã lớp" />
              <ClassStatusBadge status={c.status} />
            </div>
          </div>
        </div>
        {c.description && <p className="whitespace-pre-line text-sm text-content-text">{c.description}</p>}

        <div className="space-y-2 border-t border-[var(--border-default)] pt-4">
          <h3 className="text-sm font-bold text-content-heading">Giáo viên phụ trách</h3>
          {teacher ? (
            <div className="max-w-md rounded-[2px] border border-[var(--border-strong)] px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-content-heading">{teacher.fullName}</p>
              <p className="truncate text-xs text-content-muted">
                {[teacher.email, teacher.phoneNumber, teacher.subjectDepartment].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[var(--status-warning)]">
              Lớp chưa có giáo viên phụ trách.{" "}
              <button type="button" className="archive-link" onClick={() => setEditOpen(true)}>
                Phân công
              </button>
            </p>
          )}
        </div>
      </Panel>

      <div className="space-y-4">
        <SectionHeading title="Học sinh" description="Thêm học sinh có sẵn của trường, nhập từ CSV, chuyển lớp hoặc xóa khỏi lớp." />
        <ClassRosterManager classId={c.id} canManage />
      </div>

      <ClassFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editing={c}
        onSaved={(saved) => {
          toast.success(`Đã cập nhật lớp ${saved.className}`);
          void room.refetch();
        }}
      />
    </div>
  );
}
