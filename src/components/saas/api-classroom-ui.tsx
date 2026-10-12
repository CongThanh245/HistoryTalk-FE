"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, Check, Copy, RefreshCw, UserRound } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils/cn";
import type { ApiClassroom, ClassroomStatus } from "@/services/school.service";

/** Building blocks for classes read from the classroom API (teacher / school student workspace). */

const STATUS: Record<ClassroomStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Đang học", className: "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]" },
  INACTIVE: { label: "Tạm ngừng", className: "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]" },
  ARCHIVED: { label: "Đã lưu trữ", className: "border-[var(--border-strong)] text-[var(--text-tertiary)]" },
};

export function ClassroomStatusPill({ status, className }: { status: ClassroomStatus; className?: string }) {
  const s = STATUS[status] ?? STATUS.ACTIVE;
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-[2px] border px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em]", s.className, className)}>
      {s.label}
    </span>
  );
}

/** Class code with a copy button (students share it, teachers read it out). */
export function ClassCodeCopy({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!navigator.clipboard) {
      toast.error("Trình duyệt không hỗ trợ sao chép");
      return;
    }
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        toast.success(`Đã sao chép mã lớp ${code}`);
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => toast.error("Không sao chép được mã lớp"));
  };
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1", className)}>
      <code className="truncate rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-main)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--text-primary)]">
        {code}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label={`Sao chép mã lớp ${code}`}
        title="Sao chép mã lớp"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-[2px] text-[var(--text-secondary)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-[var(--jade)]" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>
    </span>
  );
}

export const classroomMeta = (c: ApiClassroom) => `Khối ${c.gradeLevel} · Năm học ${c.academicYear}`;

/** Class card for "Lớp học" (teacher) and the student's class list. */
export function ApiClassroomCard({ classroom, role }: { classroom: ApiClassroom; role: "TEACHER" | "SCHOOL_STUDENT" }) {
  const href = ROUTES.CLASS_DETAIL(classroom.id);
  return (
    <article className="flex flex-col rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] transition-colors hover:border-[var(--accent-gold)]">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border-strong)] p-4">
        <div className="min-w-0">
          <h2 className="archive-title is-plain text-2xl">
            <Link href={href} className="hover:text-[var(--accent-gold)] focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]">
              Lớp {classroom.className}
            </Link>
          </h2>
          <p className="mt-0.5 text-xs text-content-muted">{classroomMeta(classroom)}</p>
        </div>
        <ClassroomStatusPill status={classroom.status} />
      </div>
      <dl className="grid flex-1 grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 p-4 text-sm">
        <dt className="text-content-muted">Mã lớp</dt>
        <dd className="min-w-0">
          <ClassCodeCopy code={classroom.classCode} />
        </dd>
        <dt className="text-content-muted">Sĩ số</dt>
        <dd className="font-semibold tabular-nums">{classroom.studentCount} học sinh</dd>
        <dt className="text-content-muted">Giáo viên</dt>
        <dd className="min-w-0 truncate">{classroom.teacher?.fullName || "Chưa phân công"}</dd>
        {classroom.schoolName && (
          <>
            <dt className="text-content-muted">Trường</dt>
            <dd className="min-w-0 truncate">{classroom.schoolName}</dd>
          </>
        )}
      </dl>
      <div className="flex justify-end border-t border-[var(--border-default)] px-4 py-3">
        <Link href={href} className="archive-link">
          {role === "TEACHER" ? "Mở lớp" : "Xem lớp"} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

/** Compact side card of a student's class. */
export function ApiClassroomSideCard({ classroom }: { classroom: ApiClassroom }) {
  return (
    <div className="rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--jade)]">Lớp của em</p>
        <ClassroomStatusPill status={classroom.status} />
      </div>
      <p className="archive-title is-plain mt-1.5 text-2xl">Lớp {classroom.className}</p>
      <p className="mt-1 text-[13px] text-content-muted">{classroomMeta(classroom)}</p>
      <p className="mt-1 flex items-center gap-1.5 text-[13px] text-content-muted">
        <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {classroom.teacher?.fullName ? `GV ${classroom.teacher.fullName}` : "Chưa có giáo viên phụ trách"} · {classroom.studentCount} học sinh
      </p>
      <ClassCodeCopy code={classroom.classCode} className="mt-2" />
      <Link href={ROUTES.CLASS_DETAIL(classroom.id)} className="archive-link mt-3">
        Vào lớp <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

export function ClassroomCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Đang tải danh sách lớp">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-[228px] animate-pulse rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] motion-reduce:animate-none" />
      ))}
    </div>
  );
}

export function ClassroomLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-start gap-3 rounded-[2px] border border-[var(--accent-danger)] bg-[var(--bg-surface)] p-4">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-danger)]" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-content-heading">Không tải được danh sách lớp</p>
        <p className="mt-0.5 text-sm text-content-muted">{message}</p>
      </div>
      <button type="button" onClick={onRetry} className="btn-ink min-h-0 px-3 py-2 text-xs">
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Thử lại
      </button>
    </div>
  );
}

/** Honest placeholder for a class feature with no API yet (no sample rows). */
export function NoDataYet({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-[2px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-main)] p-5">
      <p className="text-sm font-bold text-content-heading">{title}</p>
      <p className="mt-1 text-sm leading-6 text-content-muted">{description ?? "Chưa có dữ liệu cho lớp này."}</p>
    </div>
  );
}
