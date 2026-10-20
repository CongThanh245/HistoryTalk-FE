"use client";

import * as React from "react";
import { ArrowUpRight, Check, Coins, Gift, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StaffFormInput, StaffFormTextarea } from "@/components/staff/staff-form";
import { EmptyState } from "@/components/ui/empty-state";
import { DIALOG_CLASS, DIALOG_TITLE_CLASS, Field, Panel, formatDate, formatNumber } from "@/components/saas/saas-ui";
import { useTeacherClassroomDashboard } from "@/features/dashboard/hooks";
import { useProfile } from "@/features/profile/hooks";
import {
  tokenApiErrorMessage,
  useCreateTeacherTicket,
  useGrantStudentTokens,
  useReviewTokenBoost,
  useTokenBoostsForReview,
  type BoostReviewer,
} from "@/features/saas/hooks-school-token";
import {
  BOOST_MAX_TOKENS,
  BOOST_MIN_TOKENS,
  GRANT_MAX_TOKENS,
  GRANT_MIN_TOKENS,
  type TokenBoostRequest,
  type TokenBoostStatus,
} from "@/services/school-token.service";
import { cn } from "@/lib/utils/cn";

/*
 * Sprint 7 token tickets (US-SP7-17). A student asks their class teacher; the teacher approves from their own daily
 * limit (or escalates to the School Admin when it is used up); the School Admin approves from the school pool.
 */

const PILL = "inline-flex items-center whitespace-nowrap rounded-[2px] border px-2 py-0.5 text-[11px] font-bold";

export const BOOST_STATUS_LABELS: Record<TokenBoostStatus, string> = {
  PENDING: "Chờ giáo viên",
  PENDING_ADMIN: "Chờ quản trị trường",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

const BOOST_STATUS_CLASS: Record<TokenBoostStatus, string> = {
  PENDING: "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
  PENDING_ADMIN: "border-[var(--men-lam)] bg-[var(--status-neutral-bg)] text-[var(--men-lam)]",
  APPROVED: "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]",
  REJECTED: "border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--accent-danger)]",
};

export function TokenBoostStatusBadge({ status }: { status: TokenBoostStatus }) {
  return <span className={cn(PILL, BOOST_STATUS_CLASS[status] ?? BOOST_STATUS_CLASS.PENDING)}>{BOOST_STATUS_LABELS[status] ?? status}</span>;
}

const parseTokens = (v: string) => Number(v.replace(/[.\s,]/g, ""));
const rangeError = (v: string, min: number, max: number) => {
  const n = parseTokens(v);
  return !Number.isInteger(n) || n < min || n > max ? `Từ ${formatNumber(min)} đến ${formatNumber(max)} token` : null;
};

/** A teacher's ticket for their own daily limit (no student, or the teacher as target). */
const isTeacherSelfTicket = (r: TokenBoostRequest) =>
  r.requesterRole === "TEACHER" && (!r.studentUid || r.studentUid === r.requesterUid);

/** Backend message when the teacher's own daily limit cannot cover an approval or a grant. */
const isTeacherQuotaShort = (error: unknown) => /hạn mức token trong ngày của giáo viên/i.test(tokenApiErrorMessage(error, ""));

const TABS: Record<BoostReviewer, TokenBoostStatus[]> = {
  TEACHER: ["PENDING", "PENDING_ADMIN", "APPROVED", "REJECTED"],
  SCHOOL_ADMIN: ["PENDING_ADMIN", "PENDING", "APPROVED", "REJECTED"],
};
const PAGE_SIZE = 20;

type Action = "APPROVE" | "REJECT" | "ESCALATE";

/**
 * Tickets a reviewer can act on. Teacher: students of their classes + their own tickets; approving takes from the
 * teacher's daily limit. School Admin: the whole school; approving takes from the shared pool.
 */
export function TokenBoostReviewList({ reviewer, scopeHint }: { reviewer: BoostReviewer; scopeHint: string }) {
  const isTeacher = reviewer === "TEACHER";
  const [status, setStatus] = React.useState<TokenBoostStatus>(TABS[reviewer][0]);
  const [page, setPage] = React.useState(1);
  const query = useTokenBoostsForReview(reviewer, { status, page, limit: PAGE_SIZE });
  const review = useReviewTokenBoost(reviewer);
  const [target, setTarget] = React.useState<{ request: TokenBoostRequest; action: Action } | null>(null);
  const [amount, setAmount] = React.useState("");
  const [note, setNote] = React.useState("");

  const rows = query.data?.items ?? [];
  const amountError = target && target.action !== "REJECT" ? rangeError(amount, BOOST_MIN_TOKENS, BOOST_MAX_TOKENS) : null;

  const ask = (request: TokenBoostRequest, action: Action) => {
    setAmount(String(request.requestedTokens));
    setNote("");
    setTarget({ request, action });
  };

  const send = (request: TokenBoostRequest, action: Action, tokens: number, reviewNote?: string) =>
    review.mutate(
      { id: request.id, payload: { action, approvedTokens: action === "REJECT" ? undefined : tokens, reviewNote } },
      {
        onSuccess: () =>
          toast.success(
            action === "APPROVE"
              ? `Đã cấp thêm ${formatNumber(tokens)} token hôm nay cho ${who(request)}`
              : action === "ESCALATE"
                ? `Đã chuyển yêu cầu của ${who(request)} lên quản trị trường`
                : `Đã từ chối yêu cầu của ${who(request)}`,
          ),
        onError: (err) => {
          // Teacher's own limit is used up: offer to forward the same request to the School Admin.
          if (isTeacher && action === "APPROVE" && isTeacherQuotaShort(err)) {
            toast.error("Hạn mức hôm nay của bạn không đủ để cấp số token này.", {
              description: "Chuyển yêu cầu lên quản trị trường để được cấp từ quỹ chung.",
              action: { label: "Chuyển lên", onClick: () => send(request, "ESCALATE", tokens, reviewNote) },
              duration: 10_000,
            });
            return;
          }
          toast.error(tokenApiErrorMessage(err, "Không xử lý được yêu cầu. Vui lòng thử lại."));
        },
      },
    );

  const confirm = () => {
    if (!target) return;
    if (amountError) {
      toast.error(`Số token không hợp lệ: ${amountError.toLowerCase()}.`);
      return;
    }
    send(target.request, target.action, parseTokens(amount), note.trim() || undefined);
    setTarget(null);
  };

  const canAct = (r: TokenBoostRequest) =>
    isTeacher ? r.status === "PENDING" && !isTeacherSelfTicket(r) : r.status === "PENDING" || r.status === "PENDING_ADMIN";

  const dialogCopy = (a: Action | undefined) =>
    a === "APPROVE"
      ? isTeacher
        ? "Token được trích từ hạn mức hôm nay của bạn sang học sinh. Quỹ chung của trường chỉ bị trừ khi học sinh thực sự dùng; hết ngày phần chưa dùng không cộng dồn."
        : "Token được cấp từ quỹ chung của trường và chỉ có hiệu lực trong hôm nay."
      : a === "ESCALATE"
        ? "Yêu cầu được chuyển lên quản trị trường để cấp từ quỹ chung. Dùng khi hạn mức hôm nay của bạn đã hết."
        : "Người gửi sẽ thấy yêu cầu bị từ chối cùng ghi chú của bạn.";

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Trạng thái yêu cầu" className="flex flex-wrap gap-2">
        {TABS[reviewer].map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={status === t}
            onClick={() => {
              setStatus(t);
              setPage(1);
            }}
            className={cn(
              "h-9 rounded-[2px] border px-3 text-xs font-bold uppercase tracking-[0.06em] transition-colors",
              status === t
                ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
                : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]",
            )}
          >
            {BOOST_STATUS_LABELS[t]}
            {status === t && query.data && <span className="ml-1.5 tabular-nums opacity-80">{query.data.totalElements}</span>}
          </button>
        ))}
      </div>

      {query.isPending ? (
        <p className="flex items-center gap-2 py-6 text-sm text-content-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Đang tải yêu cầu...
        </p>
      ) : query.isError ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 py-6 text-sm">
          <span className="text-[var(--accent-danger)]">{tokenApiErrorMessage(query.error, "Không tải được yêu cầu.")}</span>
          <button type="button" className="btn-line" onClick={() => void query.refetch()}>
            Thử lại
          </button>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState size="sm" title={status.startsWith("PENDING") ? "Không có yêu cầu nào đang chờ" : "Chưa có yêu cầu nào"} description={scopeHint} />
      ) : (
        <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--text-primary)]">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-content-heading">{who(r)}</span>
                  {r.studentCode && !isTeacherSelfTicket(r) && <span className="text-xs text-content-muted">{r.studentCode}</span>}
                  {r.className && <span className="text-xs text-content-muted">· Lớp {r.className}</span>}
                  <TokenBoostStatusBadge status={r.status} />
                </div>
                <p className="text-sm text-content-text">
                  {origin(r)} <b className="tabular-nums">{formatNumber(r.requestedTokens)}</b> token · {formatDate(r.requestDate)}
                  {r.status === "APPROVED" && r.approvedTokens != null && (
                    <span className="text-content-muted"> · đã cấp {formatNumber(r.approvedTokens)}</span>
                  )}
                </p>
                <p className="whitespace-pre-line break-words text-xs text-content-muted">{r.reason}</p>
                {isTeacher && r.status === "PENDING" && r.classroomId && r.studentUid && (
                  <StudentTodayUsage classId={r.classroomId} studentUid={r.studentUid} />
                )}
                <ReviewTrail r={r} />
              </div>
              {canAct(r) && (
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button type="button" className="btn-line disabled:opacity-60" disabled={review.isPending} onClick={() => ask(r, "REJECT")}>
                    <X className="h-4 w-4" aria-hidden="true" /> Từ chối
                  </button>
                  {isTeacher && (
                    <button type="button" className="btn-line disabled:opacity-60" disabled={review.isPending} onClick={() => ask(r, "ESCALATE")}>
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" /> Chuyển lên
                    </button>
                  )}
                  <button type="button" className="btn-crimson disabled:opacity-60" disabled={review.isPending} onClick={() => ask(r, "APPROVE")}>
                    <Check className="h-4 w-4" aria-hidden="true" /> Duyệt
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {query.data && query.data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <button type="button" className="btn-line" disabled={!query.data.hasPrevious} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Trước
          </button>
          <span className="tabular-nums text-content-muted">
            {page} / {query.data.totalPages}
          </span>
          <button type="button" className="btn-line" disabled={!query.data.hasNext} onClick={() => setPage((p) => p + 1)}>
            Sau
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        variant={target?.action === "REJECT" ? "warning" : "primary"}
        title={
          target
            ? target.action === "APPROVE"
              ? `Cấp thêm token cho ${who(target.request)}?`
              : target.action === "ESCALATE"
                ? `Chuyển yêu cầu của ${who(target.request)} lên quản trị trường?`
                : `Từ chối yêu cầu của ${who(target.request)}?`
            : ""
        }
        description={dialogCopy(target?.action)}
        confirmLabel={target?.action === "APPROVE" ? "Duyệt" : target?.action === "ESCALATE" ? "Chuyển lên" : "Từ chối"}
        onConfirm={confirm}
      >
        <div className="space-y-3">
          {isTeacher && target?.request.classroomId && target.request.studentUid && (
            <StudentTodayUsage classId={target.request.classroomId} studentUid={target.request.studentUid} boxed />
          )}
          {isTeacher && target?.action === "APPROVE" && <TeacherRemaining boxed />}
          {target && target.action !== "REJECT" && (
            <Field label={target.action === "ESCALATE" ? "Số token xin quản trị trường" : "Số token cấp"} required error={amountError} htmlFor="boost-approve-amount">
              <StaffFormInput id="boost-approve-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
          )}
          <Field label="Ghi chú" htmlFor="boost-note">
            <StaffFormTextarea id="boost-note" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} className="min-h-[80px] resize-y" />
          </Field>
        </div>
      </ConfirmDialog>
    </div>
  );
}

/** Who gets the tokens. */
function who(r: TokenBoostRequest) {
  if (isTeacherSelfTicket(r)) return `GV ${r.requesterName ?? r.studentName ?? ""}`.trim();
  return r.studentName ?? "Học sinh";
}

/** How the ticket started. */
function origin(r: TokenBoostRequest) {
  if (r.requesterRole === "TEACHER") {
    if (isTeacherSelfTicket(r)) return "Xin thêm hạn mức cho giáo viên";
    return r.status === "APPROVED" && !r.adminReviewedByUid ? "Giáo viên cấp trực tiếp" : "Giáo viên xin cho học sinh";
  }
  return "Xin thêm";
}

/** Teacher / School Admin notes, in order. */
function ReviewTrail({ r }: { r: TokenBoostRequest }) {
  const lines: [string, string][] = [];
  if (r.teacherReviewNote && r.requesterRole !== "TEACHER") lines.push([r.teacherReviewedByName ?? "Giáo viên", r.teacherReviewNote]);
  if (r.adminReviewNote) lines.push([r.adminReviewedByName ?? "Quản trị trường", r.adminReviewNote]);
  if (!lines.length && r.reviewNote && r.requesterRole !== "TEACHER") lines.push([r.reviewedByName ?? "Người duyệt", r.reviewNote]);
  if (!lines.length) return null;
  return (
    <>
      {lines.map(([name, text], i) => (
        <p key={i} className="text-xs text-[var(--text-secondary)]">
          {name}: {text}
        </p>
      ))}
    </>
  );
}

/**
 * "Hôm nay đã dùng 950 / 1.000 token · được duyệt thêm 0" for one student, from the class dashboard
 * (GET /teacher/dashboard/classrooms/{classId}; one request per class, shared by every row of that class).
 */
export function StudentTodayUsage({ classId, studentUid, boxed }: { classId: string; studentUid: string; boxed?: boolean }) {
  const { data, isPending, isError } = useTeacherClassroomDashboard(classId);
  const box = boxed ? "rounded-[2px] border border-[var(--border-strong)] bg-[var(--status-neutral-bg)] px-3 py-2" : "";
  if (isPending) return <p className={cn("text-xs text-content-muted", box)}>Đang tải mức dùng hôm nay…</p>;
  const s = data?.students.find((x) => x.studentId === studentUid);
  if (isError || !s) return null;
  if (s.dailyTokenLimit == null) {
    return <p className={cn("text-xs text-content-muted", box)}>Còn dùng được hôm nay: {formatNumber(s.currentTokens)} token</p>;
  }
  const bonus = s.dailyBonusTokens ?? 0;
  const used = s.dailyTokensUsed ?? 0;
  const limit = s.dailyTokenLimit + bonus;
  const pct = limit > 0 ? used / limit : 0;
  return (
    <p className={cn("text-xs tabular-nums", box, pct >= 0.9 ? "text-[var(--status-warning)]" : "text-[var(--text-secondary)]")}>
      Học sinh hôm nay đã dùng <b>{formatNumber(used)}</b> / {formatNumber(limit)} token
      {bonus > 0 ? ` (gồm ${formatNumber(bonus)} được cấp thêm)` : " · chưa được cấp thêm"}
      {" · "}còn {formatNumber(s.currentTokens)}
    </p>
  );
}

/*
 * Teacher's own daily limit. There is no endpoint for it yet; `GET /users/me` returns `token`, which the backend sets
 * to the teacher's remaining allowance after each chat or grant (it is not reset at midnight until the next one).
 */
function TeacherRemaining({ boxed }: { boxed?: boolean }) {
  const { data } = useProfile();
  if (data?.token == null) return null;
  return (
    <p
      className={cn(
        "text-xs tabular-nums text-[var(--text-secondary)]",
        boxed && "rounded-[2px] border border-[var(--border-strong)] bg-[var(--status-neutral-bg)] px-3 py-2",
      )}
    >
      Hạn mức của bạn còn khoảng <b>{formatNumber(data.token)}</b> token hôm nay (chat AI và cấp cho học sinh dùng chung).
    </p>
  );
}

/** Teacher's own limit + "ask the School Admin" (top of the teacher's token page). */
export function TeacherQuotaPanel() {
  const { data } = useProfile();
  const [open, setOpen] = React.useState(false);
  return (
    <Panel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Coins className="mt-0.5 h-6 w-6 shrink-0 text-[var(--gold-leaf)]" aria-hidden="true" />
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-content-heading">
            Hạn mức token của bạn hôm nay
            {data?.token != null && (
              <>
                : còn khoảng <span className="tabular-nums">{formatNumber(data.token)}</span> token
              </>
            )}
          </p>
          <p className="text-xs text-content-muted">
            Dùng chung cho trò chuyện AI của bạn và phần cấp cho học sinh. Làm mới lúc 00:00; số dư cập nhật sau mỗi lần bạn chat hoặc cấp token.
          </p>
        </div>
      </div>
      <button type="button" className="btn-line shrink-0" onClick={() => setOpen(true)}>
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" /> Xin quản trị trường cấp thêm
      </button>
      <TeacherTicketDialog open={open} onOpenChange={setOpen} />
    </Panel>
  );
}

/** Teacher → School Admin ticket, for the teacher's own limit or for one student. */
export function TeacherTicketDialog({
  open,
  onOpenChange,
  student,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: { uid: string; name: string; classId?: string };
}) {
  const create = useCreateTeacherTicket();
  const [amount, setAmount] = React.useState("5000");
  const [reason, setReason] = React.useState("");
  const [touched, setTouched] = React.useState(false);

  const [lastOpen, setLastOpen] = React.useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setAmount(student ? "2000" : "5000");
      setReason("");
      setTouched(false);
      create.reset();
    }
  }

  const amountError = rangeError(amount, BOOST_MIN_TOKENS, BOOST_MAX_TOKENS);
  const reasonError = !reason.trim() ? "Nhập lý do" : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (amountError || reasonError) return;
    create.mutate(
      { requestedTokens: parseTokens(amount), reason: reason.trim(), studentId: student?.uid, classroomId: student?.classId },
      {
        onSuccess: () => {
          toast.success("Đã gửi yêu cầu tới quản trị trường");
          onOpenChange(false);
        },
        onError: (err) => toast.error(tokenApiErrorMessage(err, "Không gửi được yêu cầu. Vui lòng thử lại.")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !create.isPending && onOpenChange(o)}>
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-md")}>
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle className={DIALOG_TITLE_CLASS}>{student ? `Xin token cho ${student.name}` : "Xin thêm hạn mức"}</DialogTitle>
            <DialogDescription className="text-content-muted">
              Quản trị trường duyệt và cấp từ quỹ chung của trường. Token được cấp chỉ có hiệu lực trong hôm nay.
            </DialogDescription>
          </DialogHeader>
          <Field label="Số token" required error={touched ? amountError : null} htmlFor="ticket-amount">
            <StaffFormInput id="ticket-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Lý do" required error={touched ? reasonError : null} htmlFor="ticket-reason">
            <StaffFormTextarea
              id="ticket-reason"
              value={reason}
              maxLength={500}
              placeholder="VD: Lớp 11A1 thảo luận nhóm với nhân vật, hạn mức hôm nay đã hết"
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[90px] resize-y"
            />
          </Field>
          <DialogFooter className="gap-2">
            <button type="button" className="btn-line" disabled={create.isPending} onClick={() => onOpenChange(false)}>
              Hủy
            </button>
            <button type="submit" className="btn-crimson disabled:opacity-50" disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Gửi yêu cầu
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Teacher gives tokens from their own daily limit to one student (POST /teacher/students/{id}/grant-tokens). */
export function GrantTokensDialog({
  student,
  onOpenChange,
}: {
  /** Open while set. */
  student: { uid: string; name: string; classId: string } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const grant = useGrantStudentTokens();
  const [amount, setAmount] = React.useState("1000");
  const [reason, setReason] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const [ticketFor, setTicketFor] = React.useState<typeof student>(null);
  const open = !!student;

  const [lastOpen, setLastOpen] = React.useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setAmount("1000");
      setReason("");
      setTouched(false);
      grant.reset();
    }
  }

  const amountError = rangeError(amount, GRANT_MIN_TOKENS, GRANT_MAX_TOKENS);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!student || amountError) return;
    const s = student;
    const tokens = parseTokens(amount);
    grant.mutate(
      { studentId: s.uid, payload: { tokens, reason: reason.trim() || undefined } },
      {
        onSuccess: () => {
          toast.success(`Đã cấp ${formatNumber(tokens)} token hôm nay cho ${s.name}`);
          onOpenChange(false);
        },
        onError: (err) => {
          if (isTeacherQuotaShort(err)) {
            toast.error("Hạn mức hôm nay của bạn không đủ để cấp số token này.", {
              action: { label: "Xin quản trị trường", onClick: () => setTicketFor(s) },
              duration: 10_000,
            });
            return;
          }
          toast.error(tokenApiErrorMessage(err, "Không cấp được token. Vui lòng thử lại."));
        },
      },
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !grant.isPending && onOpenChange(o)}>
        <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-md")}>
          <form onSubmit={submit} noValidate className="space-y-4">
            <DialogHeader>
              <DialogTitle className={DIALOG_TITLE_CLASS}>Cấp token cho {student?.name}</DialogTitle>
              <DialogDescription className="text-content-muted">
                Trích từ hạn mức hôm nay của bạn. Học sinh dùng được ngay, hết ngày phần chưa dùng không cộng dồn.
              </DialogDescription>
            </DialogHeader>
            {student && <StudentTodayUsage classId={student.classId} studentUid={student.uid} boxed />}
            <TeacherRemaining boxed />
            <Field label="Số token" required error={touched ? amountError : null} htmlFor="grant-amount">
              <StaffFormInput id="grant-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label="Lý do (không bắt buộc)" htmlFor="grant-reason">
              <StaffFormTextarea id="grant-reason" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} className="min-h-[70px] resize-y" />
            </Field>
            <DialogFooter className="gap-2">
              <button type="button" className="btn-line" disabled={grant.isPending} onClick={() => onOpenChange(false)}>
                Hủy
              </button>
              <button type="submit" className="btn-crimson disabled:opacity-50" disabled={grant.isPending}>
                {grant.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Gift className="h-4 w-4" aria-hidden="true" />} Cấp token
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <TeacherTicketDialog
        open={!!ticketFor}
        onOpenChange={(o) => !o && setTicketFor(null)}
        student={ticketFor ? { uid: ticketFor.uid, name: ticketFor.name, classId: ticketFor.classId } : undefined}
      />
    </>
  );
}
