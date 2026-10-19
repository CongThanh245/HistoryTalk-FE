"use client";

import * as React from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { StaffFormInput, StaffFormTextarea } from "@/components/staff/staff-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, formatDate, formatNumber } from "@/components/saas/saas-ui";
import { tokenApiErrorMessage, useReviewTokenBoost, useTokenBoostsForReview } from "@/features/saas/hooks-school-token";
import { BOOST_MIN_TOKENS, type TokenBoostRequest, type TokenBoostStatus } from "@/services/school-token.service";
import { cn } from "@/lib/utils/cn";

/* Shared bits for the Sprint 7 daily token boost requests (teacher page, School Admin tokens page, student profile). */

const PILL = "inline-flex items-center whitespace-nowrap rounded-[2px] border px-2 py-0.5 text-[11px] font-bold";

export const BOOST_STATUS_LABELS: Record<TokenBoostStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

const BOOST_STATUS_CLASS: Record<TokenBoostStatus, string> = {
  PENDING: "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
  APPROVED: "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]",
  REJECTED: "border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--accent-danger)]",
};

export function TokenBoostStatusBadge({ status }: { status: TokenBoostStatus }) {
  return <span className={cn(PILL, BOOST_STATUS_CLASS[status])}>{BOOST_STATUS_LABELS[status]}</span>;
}

const TABS: TokenBoostStatus[] = ["PENDING", "APPROVED", "REJECTED"];
const PAGE_SIZE = 20;

/**
 * Boost requests a reviewer can act on: a teacher sees the classes they teach, a School Admin the whole school
 * (GET /teacher/token-requests). Approving raises the student's limit for today only.
 */
export function TokenBoostReviewList({ scopeHint }: { scopeHint: string }) {
  const [status, setStatus] = React.useState<TokenBoostStatus>("PENDING");
  const [page, setPage] = React.useState(1);
  const query = useTokenBoostsForReview({ status, page, limit: PAGE_SIZE });
  const review = useReviewTokenBoost();
  const [target, setTarget] = React.useState<{ request: TokenBoostRequest; action: "APPROVE" | "REJECT" } | null>(null);
  const [amount, setAmount] = React.useState("");
  const [note, setNote] = React.useState("");

  const rows = query.data?.items ?? [];
  const approved = Number(amount.replace(/[.\s,]/g, ""));
  const amountError = target?.action === "APPROVE" && (!Number.isInteger(approved) || approved < BOOST_MIN_TOKENS)
    ? `Tối thiểu ${formatNumber(BOOST_MIN_TOKENS)} token`
    : null;

  const ask = (request: TokenBoostRequest, action: "APPROVE" | "REJECT") => {
    setAmount(String(request.requestedTokens));
    setNote("");
    setTarget({ request, action });
  };

  const confirm = () => {
    if (!target) return;
    if (amountError) {
      toast.error(`Số token duyệt không hợp lệ: ${amountError.toLowerCase()}.`);
      return;
    }
    const { request, action } = target;
    review.mutate(
      {
        id: request.id,
        payload: {
          action,
          approvedTokens: action === "APPROVE" ? approved : undefined,
          reviewNote: note.trim() || undefined,
        },
      },
      {
        onSuccess: () =>
          toast.success(
            action === "APPROVE"
              ? `Đã duyệt thêm ${formatNumber(approved)} token hôm nay cho ${request.studentName}`
              : `Đã từ chối yêu cầu của ${request.studentName}`,
          ),
        onError: (err) => toast.error(tokenApiErrorMessage(err, "Không xử lý được yêu cầu. Vui lòng thử lại.")),
      },
    );
    setTarget(null);
  };

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Trạng thái yêu cầu" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
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
        <EmptyState size="sm" title={status === "PENDING" ? "Không có yêu cầu nào đang chờ" : "Chưa có yêu cầu nào"} description={scopeHint} />
      ) : (
        <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--text-primary)]">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-content-heading">{r.studentName}</span>
                  {r.studentCode && <span className="text-xs text-content-muted">{r.studentCode}</span>}
                  <span className="text-xs text-content-muted">· Lớp {r.className}</span>
                  <TokenBoostStatusBadge status={r.status} />
                </div>
                <p className="text-sm text-content-text">
                  Xin thêm <b className="tabular-nums">{formatNumber(r.requestedTokens)}</b> token · {formatDate(r.requestDate)}
                  {r.status === "APPROVED" && r.approvedTokens != null && (
                    <span className="text-content-muted"> · đã duyệt {formatNumber(r.approvedTokens)}</span>
                  )}
                </p>
                <p className="whitespace-pre-line break-words text-xs text-content-muted">{r.reason}</p>
                {r.reviewNote && (
                  <p className="text-xs text-[var(--text-secondary)]">
                    {r.reviewedByName ?? "Người duyệt"}: {r.reviewNote}
                  </p>
                )}
              </div>
              {r.status === "PENDING" && (
                <div className="flex shrink-0 gap-2">
                  <button type="button" className="btn-line disabled:opacity-60" disabled={review.isPending} onClick={() => ask(r, "REJECT")}>
                    <X className="h-4 w-4" aria-hidden="true" /> Từ chối
                  </button>
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
        variant={target?.action === "APPROVE" ? "primary" : "warning"}
        title={target ? (target.action === "APPROVE" ? `Duyệt thêm token cho ${target.request.studentName}?` : `Từ chối yêu cầu của ${target.request.studentName}?`) : ""}
        description={
          target?.action === "APPROVE"
            ? "Hạn mức hôm nay của học sinh tăng thêm số token này; token chỉ bị trừ khỏi quỹ trường khi học sinh thực sự dùng. Hết ngày, phần chưa dùng không cộng dồn."
            : "Học sinh sẽ thấy yêu cầu bị từ chối cùng ghi chú của bạn."
        }
        confirmLabel={target?.action === "APPROVE" ? "Duyệt" : "Từ chối"}
        onConfirm={confirm}
      >
        <div className="space-y-3">
          {target?.action === "APPROVE" && (
            <Field label="Số token duyệt" required error={amountError} htmlFor="boost-approve-amount">
              <StaffFormInput id="boost-approve-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
          )}
          <Field label="Ghi chú cho học sinh" htmlFor="boost-note">
            <StaffFormTextarea id="boost-note" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} className="min-h-[80px] resize-y" />
          </Field>
        </div>
      </ConfirmDialog>
    </div>
  );
}
