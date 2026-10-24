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
import { formatDate, formatNumber } from "@/components/saas/saas-ui";
import { ROUTES } from "@/constants/routes";
import { apiErrorStatus, useApiClassroom } from "@/features/saas/hooks-api";
import { ClassStatusBadge } from "../../_components/classroom";
import { CopyTag, ErrorBlock, SchoolShell } from "../../_components/shared";

/** School Admin: one classroom (GET /classrooms/{id}) with its teacher in charge and its roster (/classrooms/{id}/students). */
export default function SchoolClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const room = useApiClassroom(classId);
  const [editOpen, setEditOpen] = React.useState(false);
  const c = room.data;

  return (
    <SchoolShell
      title={c ? `Lớp ${c.className}` : "Chi tiết lớp"}
      description={c ? `Khối ${c.gradeLevel ?? "—"} · Năm học ${academicYearLabel(c.academicYear)}` : undefined}
      actions={
        c && (
          <button type="button" className="btn-line w-full sm:w-auto" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" aria-hidden="true" /> Sửa thông tin lớp
          </button>
        )
      }
    >
      <ClassDetail room={room} onEdit={() => setEditOpen(true)} />
      {c && (
        <ClassFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          editing={c}
          onSaved={(saved) => {
            toast.success(`Đã cập nhật lớp ${saved.className}`);
            void room.refetch();
          }}
        />
      )}
    </SchoolShell>
  );
}

function InfoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-[13px] font-semibold text-[var(--text-tertiary)]">{label}</dt>
      <dd className="min-w-0 text-sm text-content-heading">{children}</dd>
    </div>
  );
}

function ClassDetail({ room, onEdit }: { room: ReturnType<typeof useApiClassroom>; onEdit: () => void }) {
  const back = (
    <Link href={ROUTES.SCHOOL.CLASSES} className="archive-link">
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Tất cả lớp
    </Link>
  );

  if (room.isPending) {
    return (
      <div className="space-y-6" role="status" aria-label="Đang tải thông tin lớp">
        <Skeleton className="h-20 w-full" />
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
      <section aria-label="Thông tin lớp" className="space-y-3">
        <dl className="grid gap-x-8 gap-y-4 rounded-sm border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <InfoItem label="Giáo viên phụ trách">
            {teacher ? (
              <>
                <p className="truncate font-semibold">{teacher.fullName}</p>
                <p className="truncate text-xs text-content-muted">
                  {[teacher.email, teacher.phoneNumber].filter(Boolean).join(" · ")}
                </p>
              </>
            ) : (
              <p className="text-[var(--status-warning)]">
                Chưa phân công.{" "}
                <button type="button" className="archive-link" onClick={onEdit}>
                  Phân công
                </button>
              </p>
            )}
          </InfoItem>
          <InfoItem label="Mã lớp">
            <CopyTag value={c.classCode} label="mã lớp" />
          </InfoItem>
          <InfoItem label="Trạng thái">
            <ClassStatusBadge status={c.status} />
          </InfoItem>
          <InfoItem label="Sĩ số · Ngày tạo">
            <span className="tabular-nums">
              {formatNumber(c.studentCount ?? 0)} học sinh · {formatDate(c.createdAt)}
            </span>
          </InfoItem>
        </dl>
        {c.description && <p className="whitespace-pre-line text-sm text-content-muted">{c.description}</p>}
      </section>

      <section aria-labelledby="roster-title" className="space-y-4">
        <h2 id="roster-title" className="text-base font-bold text-content-heading">
          Học sinh trong lớp
        </h2>
        <ClassRosterManager classId={c.id} canManage />
      </section>
    </div>
  );
}
