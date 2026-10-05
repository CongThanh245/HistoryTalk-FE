"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BellRing, Download, MessageSquareText, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StaffFormInput, StaffFormTextarea } from "@/components/staff/staff-form";
import { DIALOG_CLASS, DIALOG_TITLE_CLASS, Field, IconAction, Panel, SaasShell, SectionHeading, normalizeText, SearchInput } from "@/components/saas/saas-ui";
import { givenName } from "@/components/saas/class-roster";
import {
  AssignmentStateBadge,
  AssignmentTypeBadge,
  KpiTile,
  ProgressBar,
  ScoreValue,
  SubmissionStatusBadge,
  TD,
  TH,
  TR,
  TableShell,
} from "@/components/saas/teaching-ui";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import {
  SUBMISSION_STATUS_LABELS,
  TODAY,
  assignmentState,
  downloadCsv,
  effectiveStatus,
  formatDateTime,
  formatScore,
  fromDatetimeLocal,
  isDone,
  relativeDue,
  score10,
  toDatetimeLocal,
  useTeachingData,
} from "@/features/saas/hooks-teaching";
import { useSaasStore } from "@/features/saas/store";
import type { Assignment, StudentAccount, Submission, SubmissionStatus } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <SaasShell variant="app" title="Chi tiết bài tập" description="Theo dõi bài nộp, chấm điểm, nhận xét và gia hạn cho học sinh.">
      <AssignmentDetail id={id} />
    </SaasShell>
  );
}

interface Row {
  student: StudentAccount;
  sub: Submission | undefined;
  status: SubmissionStatus;
}

function AssignmentDetail({ id }: { id: string }) {
  const role = useRole();
  const data = useTeachingData(role);
  const router = useRouter();
  const removeAssignment = useSaasStore((s) => s.removeAssignment);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [remindOpen, setRemindOpen] = React.useState(false);
  const [grading, setGrading] = React.useState<Row | null>(null);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<SubmissionStatus | "ALL">("ALL");

  const assignment = data.assignments.find((a) => a.id === id);
  const classroom = assignment ? data.classById.get(assignment.classId) : undefined;

  const rows = React.useMemo<Row[]>(() => {
    if (!assignment || !classroom) return [];
    const subs = data.subsByAssignment.get(assignment.id) ?? [];
    return classroom.studentIds
      .map((sid) => data.studentById.get(sid))
      .filter((s): s is StudentAccount => !!s)
      .sort((a, b) => givenName(a.fullName).localeCompare(givenName(b.fullName), "vi") || a.fullName.localeCompare(b.fullName, "vi"))
      .map((student) => {
        const sub = subs.find((x) => x.studentId === student.id);
        return { student, sub, status: effectiveStatus(sub, assignment) };
      });
  }, [assignment, classroom, data.subsByAssignment, data.studentById]);

  const back = (
    <Link href={ROUTES.TEACHING.ASSIGNMENTS} className="archive-link">
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Bài tập đã giao
    </Link>
  );

  if (!assignment || !classroom) {
    return <EmptyState title="Không tìm thấy bài tập" description="Bài tập đã bị xóa hoặc không thuộc lớp bạn dạy." action={back} />;
  }

  const canEdit = assignment.teacherId === data.teacherId;
  const state = assignmentState(assignment);
  const progress = data.progress.get(assignment.id);
  const pending = rows.filter((r) => !isDone(r.status));
  const q = normalizeText(search);
  const shown = rows.filter(
    (r) =>
      (statusFilter === "ALL" || r.status === statusFilter) &&
      (!q || normalizeText(r.student.fullName).includes(q) || r.student.studentCode.toLowerCase().includes(q)),
  );
  const isTest = assignment.type === "TEST";
  const isChat = assignment.type === "CHAT";

  const exportCsv = () => {
    const header = ["STT", "Mã HS", "Họ và tên", "Trạng thái", ...(isTest ? [`Điểm (thang ${assignment.maxScore ?? 10})`, "Điểm thang 10"] : []), ...(isChat ? ["Số tin nhắn"] : []), "Nộp lúc", "Nhận xét"];
    const body = rows.map((r, i) => {
      const v = score10(r.sub, assignment);
      return [
        i + 1,
        r.student.studentCode,
        r.student.fullName,
        SUBMISSION_STATUS_LABELS[r.status],
        ...(isTest ? [r.sub?.score ?? "", v == null ? "" : v.toFixed(2)] : []),
        ...(isChat ? [r.sub?.messageCount ?? 0] : []),
        r.sub?.submittedAt ? formatDateTime(r.sub.submittedAt) : "",
        r.sub?.teacherComment ?? "",
      ];
    });
    const safe = normalizeText(assignment.title).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
    downloadCsv(`diem-${classroom.name}-${safe || assignment.id}.csv`, [header, ...body]);
    toast.success("Đã tải bảng điểm CSV");
  };

  return (
    <div className="space-y-8">
      {back}

      <Panel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <AssignmentTypeBadge type={assignment.type} />
              <AssignmentStateBadge state={state} />
              <span className="text-xs text-content-muted">{assignment.source === "LOCAL" ? "Lịch sử địa phương" : "Kho nội dung chung"}</span>
            </div>
            <h2 className="archive-title is-plain text-3xl">{assignment.title}</h2>
            <p className="text-sm text-content-muted">
              <Link href={ROUTES.CLASS_DETAIL(classroom.id)} className="font-semibold text-content-heading hover:text-[var(--accent-gold)]">
                Lớp {classroom.name}
              </Link>{" "}
              · Nội dung: {assignment.targetTitle}
            </p>
          </div>
          {canEdit && (
            <div className="flex shrink-0 flex-wrap gap-2">
              <button type="button" className="btn-line" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" aria-hidden="true" /> Sửa / gia hạn
              </button>
              <button type="button" className="btn-line text-[var(--accent-danger)]" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Xóa
              </button>
            </div>
          )}
        </div>
        {assignment.instructions && <p className="whitespace-pre-line text-sm text-[var(--text-secondary)]">{assignment.instructions}</p>}
        <dl className="grid gap-x-6 gap-y-2 border-t border-[var(--border-default)] pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-content-muted">Mở từ</dt>
            <dd className="tabular-nums">{formatDateTime(assignment.openAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-content-muted">Hạn nộp</dt>
            <dd className="font-semibold tabular-nums">
              {formatDateTime(assignment.dueAt)} <span className="font-normal text-content-muted">· {relativeDue(assignment.dueAt)}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-content-muted">Yêu cầu</dt>
            <dd>
              {isChat
                ? `Tối thiểu ${assignment.minMessages ?? 1} tin nhắn`
                : isTest
                  ? `Thang ${assignment.maxScore ?? 10} · ${assignment.graded === false ? "không tính điểm" : "tính vào sổ điểm"}`
                  : "Đọc bối cảnh"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-content-muted">Nộp muộn</dt>
            <dd>{assignment.allowLate ? "Cho phép" : "Không cho phép"}</dd>
          </div>
        </dl>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiTile label="Đã nộp" value={`${progress?.done ?? 0}/${progress?.total ?? 0}`} accent="text-[var(--jade)]" hint={<ProgressBar done={progress?.done ?? 0} total={progress?.total ?? 0} />} />
        <KpiTile label="Chưa nộp / thiếu" value={pending.length} accent={progress?.missing ? "text-[var(--accent-danger)]" : undefined} hint={`${progress?.missing ?? 0} thiếu bài sau hạn`} />
        {isTest ? (
          <KpiTile label="Điểm trung bình" value={formatScore(progress?.average ?? null)} accent="text-[var(--men-lam)]" hint="Quy về thang 10" />
        ) : isChat ? (
          <KpiTile
            label="Tin nhắn TB"
            value={formatScore(rows.length ? rows.reduce((s, r) => s + (r.sub?.messageCount ?? 0), 0) / rows.length : null)}
            accent="text-[var(--gold-leaf)]"
            hint="Mỗi học sinh"
          />
        ) : (
          <KpiTile label="Đang làm" value={rows.filter((r) => r.status === "IN_PROGRESS").length} />
        )}
      </div>

      <div className="space-y-4">
        <SectionHeading
          title="Bài nộp của học sinh"
          description={isTest ? "Bấm biểu tượng chấm để nhập hoặc sửa điểm và nhận xét." : "Bấm biểu tượng nhận xét để góp ý cho học sinh."}
          actions={
            <>
              <button type="button" className="btn-ink" onClick={() => setRemindOpen(true)} disabled={pending.length === 0}>
                <BellRing className="h-4 w-4" aria-hidden="true" /> Nhắc học sinh chưa nộp ({pending.length})
              </button>
              <button type="button" className="btn-line" onClick={exportCsv}>
                <Download className="h-4 w-4" aria-hidden="true" /> Xuất CSV
              </button>
            </>
          }
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm học sinh..." />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SubmissionStatus | "ALL")}
            aria-label="Lọc theo trạng thái"
            className="h-10 rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 text-sm text-content-heading focus-visible:border-[var(--text-primary)] focus-visible:outline-none sm:w-[200px]"
          >
            <option value="ALL">Mọi trạng thái</option>
            {(Object.keys(SUBMISSION_STATUS_LABELS) as SubmissionStatus[]).map((s) => (
              <option key={s} value={s}>
                {SUBMISSION_STATUS_LABELS[s]} ({rows.filter((r) => r.status === s).length})
              </option>
            ))}
          </select>
        </div>
        <TableShell>
          <thead>
            <tr className="border-b border-[var(--border-strong)]">
              <th className={TH}>STT</th>
              <th className={cn(TH, "sticky left-0 z-10 bg-[var(--bg-surface)]")}>Học sinh</th>
              <th className={TH}>Trạng thái</th>
              {isTest && <th className={TH}>Điểm</th>}
              {isChat && <th className={TH}>Tin nhắn</th>}
              <th className={TH}>Nộp lúc</th>
              <th className={TH}>Nhận xét</th>
              {canEdit && (
                <th className={cn(TH, "text-right")}>
                  <span className="sr-only">Thao tác</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={8} className="h-24 text-center text-content-muted">
                  Không có học sinh phù hợp.
                </td>
              </tr>
            )}
            {shown.map((r, i) => (
              <tr key={r.student.id} className={TR}>
                <td className={cn(TD, "tabular-nums text-content-muted")}>{i + 1}</td>
                <td className={cn(TD, "sticky left-0 z-10 bg-[var(--bg-surface)]")}>
                  <span className="font-medium text-content-heading">{r.student.fullName}</span>
                  <span className="block text-xs text-content-muted">{r.student.studentCode}</span>
                </td>
                <td className={TD}>
                  <SubmissionStatusBadge status={r.status} />
                </td>
                {isTest && (
                  <td className={TD}>
                    {r.sub?.score != null ? (
                      <span className="inline-flex items-baseline gap-1">
                        <ScoreValue value={score10(r.sub, assignment)} />
                        {(assignment.maxScore ?? 10) !== 10 && (
                          <span className="text-xs text-content-muted">
                            ({formatScore(r.sub.score, 2)}/{assignment.maxScore})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-content-subtle">—</span>
                    )}
                  </td>
                )}
                {isChat && (
                  <td className={cn(TD, "tabular-nums")}>
                    <span className={(r.sub?.messageCount ?? 0) >= (assignment.minMessages ?? 0) ? "font-semibold text-[var(--jade)]" : ""}>
                      {r.sub?.messageCount ?? 0}
                    </span>
                    <span className="text-content-muted">/{assignment.minMessages ?? 0}</span>
                  </td>
                )}
                <td className={cn(TD, "tabular-nums text-content-muted")}>{formatDateTime(r.sub?.submittedAt)}</td>
                <td className={cn(TD, "max-w-[240px] truncate text-[var(--text-secondary)]")} title={r.sub?.teacherComment}>
                  {r.sub?.teacherComment || <span className="text-content-subtle">—</span>}
                </td>
                {canEdit && (
                  <td className={cn(TD, "text-right")}>
                    <IconAction label={isTest ? `Chấm điểm ${r.student.fullName}` : `Nhận xét ${r.student.fullName}`} onClick={() => setGrading(r)}>
                      {isTest ? <Pencil className="h-4 w-4" /> : <MessageSquareText className="h-4 w-4" />}
                    </IconAction>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>

      {canEdit && <EditAssignmentDialog open={editOpen} onOpenChange={setEditOpen} assignment={assignment} />}
      <GradeDialog row={grading} assignment={assignment} onClose={() => setGrading(null)} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        variant="danger"
        title="Xóa bài tập?"
        description={`“${assignment.title}” cùng ${rows.length} bài nộp của lớp ${classroom.name} sẽ bị xóa. Không thể hoàn tác.`}
        confirmLabel="Xóa bài tập"
        onConfirm={() => {
          removeAssignment(assignment.id);
          toast.success("Đã xóa bài tập");
          router.push(ROUTES.TEACHING.ASSIGNMENTS);
        }}
      />
      <ConfirmDialog
        open={remindOpen}
        onOpenChange={setRemindOpen}
        title="Nhắc học sinh chưa nộp?"
        description={`Gửi thông báo nhắc hạn nộp cho ${pending.length} học sinh của lớp ${classroom.name}.`}
        confirmLabel="Gửi nhắc nhở"
        onConfirm={() => {
          setRemindOpen(false);
          toast.success(`Đã gửi nhắc nhở cho ${pending.length} học sinh`, { description: "Thông báo mô phỏng — chưa kết nối API." });
        }}
      />
    </div>
  );
}

/* ───────────────────────── Edit / extend ───────────────────────── */
function EditAssignmentDialog({ open, onOpenChange, assignment }: { open: boolean; onOpenChange: (v: boolean) => void; assignment: Assignment }) {
  const updateAssignment = useSaasStore((s) => s.updateAssignment);
  const [form, setForm] = React.useState({ title: "", instructions: "", dueAt: "", allowLate: false });
  const [lastOpen, setLastOpen] = React.useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open)
      setForm({ title: assignment.title, instructions: assignment.instructions, dueAt: toDatetimeLocal(assignment.dueAt), allowLate: assignment.allowLate });
  }

  const dueIso = fromDatetimeLocal(form.dueAt);
  const titleError = form.title.trim() ? null : "Nhập tên bài tập";
  const dueError = !dueIso ? "Chọn hạn nộp" : dueIso <= assignment.openAt ? "Hạn nộp phải sau thời điểm mở" : null;

  const save = () => {
    if (titleError || dueError || !dueIso) return;
    updateAssignment(assignment.id, { title: form.title.trim(), instructions: form.instructions.trim(), dueAt: dueIso, allowLate: form.allowLate });
    toast.success(dueIso > assignment.dueAt ? `Đã gia hạn đến ${formatDateTime(dueIso)}` : "Đã cập nhật bài tập");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-lg")}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE_CLASS}>Sửa bài tập</DialogTitle>
          <DialogDescription className="text-content-muted">Đổi tên, hướng dẫn hoặc gia hạn nộp bài cho cả lớp.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Tên bài tập" required error={titleError}>
            <StaffFormInput value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </Field>
          <Field label="Hướng dẫn">
            <StaffFormTextarea value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} className="min-h-[100px]" />
          </Field>
          <Field label="Hạn nộp" required error={dueError} hint={`Hiện tại: ${formatDateTime(assignment.dueAt)}`} htmlFor="edit-due">
            <StaffFormInput id="edit-due" type="datetime-local" value={form.dueAt} onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))} />
          </Field>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={form.allowLate} onCheckedChange={(v) => setForm((f) => ({ ...f, allowLate: v === true }))} />
            Cho phép nộp muộn
          </label>
        </div>
        <DialogFooter className="gap-2">
          <button type="button" className="btn-line" onClick={() => onOpenChange(false)}>
            Hủy
          </button>
          <button type="button" className="btn-crimson" onClick={save}>
            Lưu thay đổi
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Grade / comment ───────────────────────── */
function GradeDialog({ row, assignment, onClose }: { row: Row | null; assignment: Assignment; onClose: () => void }) {
  const upsertSubmission = useSaasStore((s) => s.upsertSubmission);
  const isTest = assignment.type === "TEST";
  const max = assignment.maxScore ?? 10;
  const [score, setScore] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [lastId, setLastId] = React.useState<string | null>(null);
  const currentId = row?.student.id ?? null;
  if (currentId !== lastId) {
    setLastId(currentId);
    if (row) {
      setScore(row.sub?.score != null ? String(row.sub.score) : "");
      setComment(row.sub?.teacherComment ?? "");
    }
  }

  const n = Number(score.replace(",", "."));
  const scoreError = isTest && score.trim() !== "" && !(Number.isFinite(n) && n >= 0 && n <= max) ? `Điểm từ 0 đến ${max}` : null;
  const marksSubmitted = isTest && score.trim() !== "" && row && !isDone(row.status);

  const save = () => {
    if (!row || scoreError) return;
    const patch: Partial<Submission> = { teacherComment: comment.trim() || undefined };
    if (isTest) patch.score = score.trim() === "" ? undefined : Math.round(n * 100) / 100;
    if (marksSubmitted) {
      patch.status = new Date(assignment.dueAt) < TODAY ? "LATE" : "SUBMITTED";
      patch.submittedAt = row.sub?.submittedAt ?? TODAY.toISOString();
    }
    upsertSubmission(assignment.id, row.student.id, patch);
    toast.success(isTest ? `Đã lưu điểm cho ${row.student.fullName}` : `Đã lưu nhận xét cho ${row.student.fullName}`);
    onClose();
  };

  return (
    <Dialog open={!!row} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-md")}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE_CLASS}>{isTest ? "Chấm điểm" : "Nhận xét"}</DialogTitle>
          <DialogDescription className="text-content-muted">
            {row?.student.fullName} · {row ? SUBMISSION_STATUS_LABELS[row.status] : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {isTest && (
            <Field
              label={`Điểm (thang ${max})`}
              error={scoreError}
              hint={marksSubmitted ? "Học sinh chưa nộp trên hệ thống — lưu điểm sẽ đánh dấu là đã nộp." : "Để trống để xóa điểm."}
              htmlFor="grade-score"
            >
              <StaffFormInput id="grade-score" inputMode="decimal" value={score} onChange={(e) => setScore(e.target.value)} placeholder={`0 – ${max}`} />
            </Field>
          )}
          <Field label="Nhận xét của giáo viên">
            <StaffFormTextarea value={comment} onChange={(e) => setComment(e.target.value)} className="min-h-[100px]" placeholder="VD: Nắm vững diễn biến, cần nêu rõ ý nghĩa lịch sử." />
          </Field>
        </div>
        <DialogFooter className="gap-2">
          <button type="button" className="btn-line" onClick={onClose}>
            Hủy
          </button>
          <button type="button" className="btn-crimson" onClick={save}>
            Lưu
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
