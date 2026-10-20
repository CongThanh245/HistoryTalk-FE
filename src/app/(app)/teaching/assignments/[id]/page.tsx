"use client";

// So diem bai tap tren API that: GET/PUT/DELETE /teacher/assignments/{id}.
import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, Ban, Pencil } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { StaffFormInput, StaffFormSelect, StaffFormTextarea } from "@/components/staff/staff-form";
import { DIALOG_CLASS, DIALOG_TITLE_CLASS, Field, Panel, SaasShell, SearchInput, SectionHeading, normalizeText } from "@/components/saas/saas-ui";
import { KpiTile } from "@/components/saas/teaching-ui";
import { ClassroomLoadError } from "@/components/saas/api-classroom-ui";
import {
  ASSIGNMENT_STATUS_META,
  ASSIGNMENT_TYPE_META,
  ApiAssignmentTypeBadge,
  ApiSubmissionStatusBadge,
  AssignmentStatusBadge,
  DeadlineBadge,
  SUBMISSION_STATUS_META,
  formatDuration,
  formatLocalDateTime,
  fromDateTimeInput,
  isPastDeadline,
  requirementText,
  toDateTimeInput,
} from "@/components/saas/teacher-class-assignments";
import { ROUTES } from "@/constants/routes";
import { apiErrorMessage, apiErrorStatus } from "@/features/saas/hooks-api";
import { useAssignmentGradebook, useCancelAssignment, useUpdateAssignment } from "@/features/saas/hooks-assignment-api";
import type { AssignmentGradebook, AssignmentStatus, SubmissionItem, SubmissionStatus, UpdateAssignmentPayload } from "@/services/assignment.service";
import { cn } from "@/lib/utils/cn";

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <SaasShell live variant="app" title="Chi tiết bài tập" description="Theo dõi bài nộp và điểm tự chấm của học sinh; sửa, gia hạn hoặc hủy bài.">
      <AssignmentDetail id={id} />
    </SaasShell>
  );
}

const back = (
  <Link href={ROUTES.TEACHING.ASSIGNMENTS} className="archive-link">
    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Bài tập đã giao
  </Link>
);

function scoreClass(score: number) {
  if (score >= 8) return "text-[var(--status-success)]";
  if (score >= 5) return "text-[var(--status-warning)]";
  return "text-[var(--accent-danger)]";
}

function AssignmentDetail({ id }: { id: string }) {
  const router = useRouter();
  const query = useAssignmentGradebook(id);
  const cancel = useCancelAssignment();
  const [editOpen, setEditOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<SubmissionStatus | "ALL">("ALL");

  if (query.isPending) {
    return (
      <div className="space-y-6">
        {back}
        <div className="h-48 animate-pulse rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] motion-reduce:animate-none" aria-busy="true" />
      </div>
    );
  }
  if (query.isError || !query.data) {
    const status = apiErrorStatus(query.error);
    if (status === 404 || status === 403) {
      return (
        <EmptyState
          title="Không tìm thấy bài tập"
          description={apiErrorMessage(query.error, "Bài tập đã bị hủy/xóa hoặc không thuộc lớp bạn phụ trách.")}
          action={back}
        />
      );
    }
    return (
      <div className="space-y-6">
        {back}
        <ClassroomLoadError message={apiErrorMessage(query.error, "Không tải được bài tập.")} onRetry={() => void query.refetch()} />
      </div>
    );
  }

  const a = query.data;
  const subs = a.submissions;
  const count = (s: SubmissionStatus) => subs.filter((x) => x.status === s).length;
  const scored = subs.filter((x) => x.score != null);
  const avgScore = scored.length ? scored.reduce((sum, x) => sum + (x.score ?? 0), 0) / scored.length : null;
  const q = normalizeText(search);
  const shown = subs.filter(
    (r) =>
      (statusFilter === "ALL" || r.status === statusFilter) &&
      (!q || normalizeText(`${r.fullName} ${r.studentCode ?? ""} ${r.email ?? ""}`).includes(q)),
  );
  const cancelled = a.status === "CANCELLED";

  return (
    <div className="space-y-8">
      {back}

      <Panel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <ApiAssignmentTypeBadge type={a.assignmentType} />
              <AssignmentStatusBadge status={a.status} />
              {a.status === "ACTIVE" && <DeadlineBadge deadline={a.deadline} />}
            </div>
            <h2 className="archive-title is-plain text-3xl">{a.title}</h2>
            <p className="text-sm text-content-muted">
              <Link href={ROUTES.CLASS_DETAIL(a.classroomId)} className="font-semibold text-content-heading hover:text-[var(--accent-gold)]">
                Lớp {a.className}
              </Link>{" "}
              · {ASSIGNMENT_TYPE_META[a.assignmentType]?.target ?? "Nội dung"}: {a.targetTitle || "—"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button type="button" className="btn-line" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" aria-hidden="true" /> Sửa / gia hạn
            </button>
            <button type="button" className="btn-line text-[var(--accent-danger)]" onClick={() => setCancelOpen(true)} disabled={cancelled}>
              <Ban className="h-4 w-4" aria-hidden="true" /> Hủy bài
            </button>
          </div>
        </div>
        {a.description && <p className="whitespace-pre-line text-sm text-[var(--text-secondary)]">{a.description}</p>}
        <dl className="grid gap-x-6 gap-y-2 border-t border-[var(--border-default)] pt-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-content-muted">Hạn nộp</dt>
            <dd className="font-semibold tabular-nums">{formatLocalDateTime(a.deadline)}</dd>
          </div>
          <div>
            <dt className="text-xs text-content-muted">Yêu cầu</dt>
            <dd>{requirementText(a.assignmentType, a.minRequirement)}</dd>
          </div>
          <div>
            <dt className="text-xs text-content-muted">Trạng thái bài</dt>
            <dd>{ASSIGNMENT_STATUS_META[a.status]?.label ?? a.status}</dd>
          </div>
        </dl>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Được giao" value={a.totalAssignedStudents} hint="Học sinh đang học trong lớp lúc giao bài" />
        <KpiTile
          label="Đã nộp"
          value={`${a.totalSubmittedStudents}/${a.totalAssignedStudents}`}
          accent="text-[var(--jade)]"
          hint={`Gồm ${count("LATE_SUBMITTED")} bài nộp muộn`}
        />
        <KpiTile label="Đang làm / chưa bắt đầu" value={`${count("IN_PROGRESS")} / ${count("NOT_STARTED")}`} accent="text-[var(--status-warning)]" />
        <KpiTile
          label="Điểm TB (tự chấm)"
          value={avgScore == null ? "—" : avgScore.toFixed(2)}
          accent="text-[var(--men-lam)]"
          hint={`Thang 10 · ${scored.length} bài có điểm`}
        />
      </div>

      <div className="space-y-4">
        <SectionHeading title="Bài nộp của học sinh" description="Điểm do hệ thống tự chấm theo thang 10 khi học sinh nộp bài." />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm học sinh, mã HS, email..." />
          <StaffFormSelect
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={[
              { value: "ALL" as const, label: `Mọi trạng thái (${subs.length})` },
              ...(Object.keys(SUBMISSION_STATUS_META) as SubmissionStatus[]).map((s) => ({
                value: s,
                label: `${SUBMISSION_STATUS_META[s].label} (${count(s)})`,
              })),
            ]}
            className="w-full sm:w-[220px]"
          />
        </div>
        <SubmissionTable rows={shown} />
      </div>

      <EditAssignmentDialog open={editOpen} onOpenChange={setEditOpen} assignment={a} />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        variant="danger"
        title="Hủy bài tập?"
        description={`“${a.title}” của lớp ${a.className} sẽ bị hủy và ẩn khỏi danh sách; học sinh không làm tiếp được nữa.`}
        confirmLabel="Hủy bài tập"
        cancelLabel="Đóng"
        isPending={cancel.isPending}
        onConfirm={() =>
          cancel.mutate(a.assignmentId, {
            onSuccess: () => {
              toast.success("Đã hủy bài tập");
              setCancelOpen(false);
              router.push(`${ROUTES.TEACHING.ASSIGNMENTS}?classId=${encodeURIComponent(a.classroomId)}`);
            },
            onError: (err) => toast.error(apiErrorMessage(err, "Không hủy được bài tập.")),
          })
        }
      />
    </div>
  );
}

/* ───────────────────────── Submissions ───────────────────────── */
function SubmissionTable({ rows }: { rows: SubmissionItem[] }) {
  const columns = React.useMemo<ColumnDef<SubmissionItem, unknown>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Học sinh",
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-content-heading">{row.original.fullName}</span>
            {row.original.email && <span className="block text-xs text-content-muted">{row.original.email}</span>}
          </div>
        ),
      },
      {
        accessorKey: "studentCode",
        header: "Mã HS",
        cell: ({ row }) => <span className="tabular-nums text-content-muted">{row.original.studentCode || "—"}</span>,
      },
      { accessorKey: "status", header: "Trạng thái", cell: ({ row }) => <ApiSubmissionStatusBadge status={row.original.status} /> },
      {
        accessorKey: "score",
        header: "Điểm",
        cell: ({ row }) =>
          row.original.score == null ? (
            <span className="text-content-subtle">—</span>
          ) : (
            <span className={cn("font-bold tabular-nums", scoreClass(row.original.score))}>{row.original.score.toFixed(2)}</span>
          ),
      },
      {
        accessorKey: "messageCount",
        header: "Tin nhắn",
        cell: ({ row }) => <span className="tabular-nums">{row.original.messageCount ?? "—"}</span>,
      },
      {
        accessorKey: "readingDurationSeconds",
        header: "Thời gian đọc",
        cell: ({ row }) => <span className="tabular-nums">{formatDuration(row.original.readingDurationSeconds)}</span>,
      },
      {
        accessorKey: "startedAt",
        header: "Bắt đầu",
        cell: ({ row }) => <span className="tabular-nums text-content-muted">{formatLocalDateTime(row.original.startedAt)}</span>,
      },
      {
        accessorKey: "submittedAt",
        header: "Nộp lúc",
        cell: ({ row }) => <span className="tabular-nums text-content-muted">{formatLocalDateTime(row.original.submittedAt)}</span>,
      },
    ],
    [],
  );
  return <StaffDataTable columns={columns} data={rows} emptyMessage="Không có học sinh phù hợp." />;
}

/* ───────────────────────── Edit / extend ───────────────────────── */
const STATUS_OPTIONS: { value: AssignmentStatus; label: string }[] = (Object.keys(ASSIGNMENT_STATUS_META) as AssignmentStatus[]).map((s) => ({
  value: s,
  label: ASSIGNMENT_STATUS_META[s].label,
}));

function EditAssignmentDialog({
  open,
  onOpenChange,
  assignment,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  assignment: AssignmentGradebook;
}) {
  const update = useUpdateAssignment();
  const a = assignment;
  const initial = React.useMemo(
    () => ({
      title: a.title,
      description: a.description ?? "",
      deadline: toDateTimeInput(a.deadline),
      minRequirement: a.minRequirement != null ? String(a.minRequirement) : "",
      status: a.status,
    }),
    [a],
  );
  const [form, setForm] = React.useState(initial);
  const [lastOpen, setLastOpen] = React.useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setForm(initial);
  }

  const isQuiz = a.assignmentType === "QUIZ_TEST";
  const deadlineChanged = form.deadline !== initial.deadline;
  const min = form.minRequirement.trim() === "" ? null : Number(form.minRequirement);
  const errors = {
    title: form.title.trim().length < 3 || form.title.trim().length > 255 ? "Tên bài từ 3 đến 255 ký tự" : null,
    deadline: !deadlineChanged
      ? null
      : !form.deadline
        ? "Chọn hạn nộp"
        : isPastDeadline(fromDateTimeInput(form.deadline))
          ? "Hạn nộp mới phải ở tương lai"
          : null,
    minRequirement: !isQuiz && min !== null && !(Number.isInteger(min) && min > 0) ? "Nhập số nguyên lớn hơn 0" : null,
  };
  const hasError = Object.values(errors).some(Boolean);

  const save = () => {
    if (hasError) return;
    // Chi gui truong da doi: BE tu choi deadline o qua khu ke ca khi khong doi.
    const payload: UpdateAssignmentPayload = {};
    if (form.title.trim() !== initial.title) payload.title = form.title.trim();
    if (form.description !== initial.description) payload.description = form.description;
    if (deadlineChanged) payload.deadline = fromDateTimeInput(form.deadline);
    if (!isQuiz && min !== null && form.minRequirement !== initial.minRequirement) payload.minRequirement = min;
    if (form.status !== initial.status) payload.status = form.status;
    if (Object.keys(payload).length === 0) {
      onOpenChange(false);
      return;
    }
    update.mutate(
      { id: a.assignmentId, payload },
      {
        onSuccess: () => {
          toast.success(
            payload.deadline && payload.deadline > a.deadline ? `Đã gia hạn đến ${formatLocalDateTime(payload.deadline)}` : "Đã cập nhật bài tập",
          );
          onOpenChange(false);
        },
        onError: (err) => toast.error(apiErrorMessage(err, "Không cập nhật được bài tập.")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !update.isPending && onOpenChange(v)}>
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-lg")}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE_CLASS}>Sửa bài tập</DialogTitle>
          <DialogDescription className="text-content-muted">
            Gia hạn sẽ chuyển các bài “nộp muộn” (nộp trước hạn mới) thành “đã nộp”.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Tên bài tập" required error={errors.title}>
            <StaffFormInput value={form.title} maxLength={255} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </Field>
          <Field label="Mô tả / lời dặn">
            <StaffFormTextarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="min-h-[100px]" />
          </Field>
          <Field label="Hạn nộp" required error={errors.deadline} hint={`Hiện tại: ${formatLocalDateTime(a.deadline)}`} htmlFor="edit-due">
            <StaffFormInput id="edit-due" type="datetime-local" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
          </Field>
          {!isQuiz && (
            <Field
              label={a.assignmentType === "AI_CHAT_ROLEPLAY" ? "Số tin nhắn tối thiểu" : "Thời gian đọc tối thiểu (giây)"}
              error={errors.minRequirement}
              hint={min && min > 0 && a.assignmentType === "CONTEXT_READING" ? `= ${formatDuration(min)}` : undefined}
              htmlFor="edit-min"
            >
              <StaffFormInput
                id="edit-min"
                type="number"
                min={1}
                step={1}
                value={form.minRequirement}
                onChange={(e) => setForm((f) => ({ ...f, minRequirement: e.target.value }))}
              />
            </Field>
          )}
          <Field label="Trạng thái bài">
            <StaffFormSelect value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))} options={STATUS_OPTIONS} className="w-full" />
          </Field>
        </div>
        <DialogFooter className="gap-2">
          <button type="button" className="btn-line" onClick={() => onOpenChange(false)} disabled={update.isPending}>
            Hủy
          </button>
          <button type="button" className="btn-crimson" onClick={save} disabled={update.isPending}>
            {update.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
