"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StaffFormInput } from "@/components/staff/staff-form";
import { DIALOG_CLASS, DIALOG_TITLE_CLASS, Field, formatNumber } from "@/components/saas/saas-ui";
import { apiErrorMessage, apiErrorStatus, useApiTokenQuota, useStudentMutations } from "@/features/saas/hooks-api";
import type { ApiStudent } from "@/services/school.service";
import { cn } from "@/lib/utils/cn";

const PRESETS = [1_000, 5_000, 10_000, 50_000];
/** The backend multiplies in a Java int. */
const INT_MAX = 2_147_483_647;

/** Vietnamese text for the allocation errors the backend returns in English. */
function allocationError(error: unknown): string {
  const raw = apiErrorMessage(error, "");
  if (/insufficient token quota/i.test(raw)) {
    const m = raw.match(/only has ([\d,.]+) available/i);
    return m
      ? `Quỹ token của trường không đủ: chỉ còn ${m[1].replace(/,/g, ".")} token chưa phân bổ. Giảm số token mỗi học sinh hoặc số học sinh.`
      : "Quỹ token của trường không đủ cho lần cấp này. Giảm số token mỗi học sinh hoặc số học sinh.";
  }
  if (/could not be found/i.test(raw) || apiErrorStatus(error) === 404) return "Một số học sinh không còn tồn tại. Tải lại danh sách rồi thử lại.";
  if (/does not belong|is not a student/i.test(raw)) return "Một số tài khoản đã chọn không phải học sinh của trường.";
  return raw || "Không cấp được token. Vui lòng thử lại.";
}

/**
 * Give each selected student `tokenAmount` tokens from the school's unallocated pool
 * (PUT /school-admin/students/token-allocation). Submit is blocked when the total exceeds the pool.
 */
export function StudentTokenDialog({
  students,
  onOpenChange,
  onDone,
}: {
  /** Open while non-empty. */
  students: ApiStudent[];
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
}) {
  const open = students.length > 0;
  const quota = useApiTokenQuota(open);
  const { allocateTokens } = useStudentMutations();
  const [amount, setAmount] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [lastOpen, setLastOpen] = React.useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setAmount("");
      setTouched(false);
      setError(null);
      allocateTokens.reset();
    }
  }

  const perStudent = Number(amount.replace(/[.\s,]/g, ""));
  const validAmount = Number.isInteger(perStudent) && perStudent >= 1;
  const count = students.length;
  const total = validAmount ? perStudent * count : 0;
  const available = quota.data?.unallocatedTokenQuota;
  const over = available != null && total > available;
  const tooBig = total > INT_MAX;
  const amountError = !amount.trim() ? "Nhập số token mỗi học sinh" : !validAmount ? "Nhập số nguyên lớn hơn 0" : tooBig ? "Số token quá lớn" : null;
  const blocked = !!amountError || over || quota.isPending || quota.isError;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (blocked) return;
    allocateTokens.mutate(
      { studentIds: students.map((s) => s.uid), tokenAmount: perStudent },
      {
        onSuccess: (r) => {
          toast.success(`Đã cấp ${formatNumber(r.totalTokensAllocated)} token cho ${r.affectedStudentCount} học sinh`, {
            description: `${formatNumber(r.tokenAmountPerStudent)} token mỗi học sinh · Quỹ còn ${formatNumber(r.remainingSchoolTokens)} token`,
          });
          onOpenChange(false);
          onDone?.();
        },
        onError: (err) => {
          setError(allocationError(err));
          void quota.refetch();
        },
      },
    );
  }

  const single = count === 1 ? students[0] : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !allocateTokens.isPending && onOpenChange(o)}>
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-md")}>
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle className={DIALOG_TITLE_CLASS}>Cấp thêm token</DialogTitle>
            <DialogDescription className="text-content-muted">
              {single
                ? `Chuyển token từ quỹ chưa phân bổ của trường vào ví của ${single.fullName}${single.studentCode ? ` (${single.studentCode})` : ""}.`
                : `Mỗi học sinh trong ${count} học sinh đã chọn nhận cùng một số token từ quỹ chưa phân bổ của trường.`}
            </DialogDescription>
          </DialogHeader>

          <Field label="Token mỗi học sinh" required error={touched ? amountError : null} htmlFor="token-amount">
            <StaffFormInput
              id="token-amount"
              inputMode="numeric"
              autoComplete="off"
              value={amount}
              placeholder="VD: 5000"
              aria-invalid={touched && !!amountError}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
            />
          </Field>
          <div className="flex flex-wrap gap-2" aria-label="Mức gợi ý">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setAmount(String(p));
                  setError(null);
                }}
                aria-pressed={perStudent === p}
                className={cn(
                  "h-8 rounded-[2px] border px-2.5 text-xs font-bold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]",
                  perStudent === p
                    ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
                    : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]",
                )}
              >
                {formatNumber(p)}
              </button>
            ))}
          </div>

          <dl className="space-y-2 border-y border-[var(--border-strong)] py-3 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-content-muted">Tổng cần cấp</dt>
              <dd className="text-right tabular-nums">
                <span className="text-content-muted">
                  {count} HS × {validAmount ? formatNumber(perStudent) : "…"} ={" "}
                </span>
                <b className={cn("text-content-heading", over && "text-[var(--accent-danger)]")}>{formatNumber(total)}</b>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-content-muted">Quỹ chưa phân bổ</dt>
              <dd className="tabular-nums font-bold text-content-heading">
                {quota.isPending ? "…" : quota.isError ? "—" : formatNumber(available ?? 0)}
              </dd>
            </div>
            {validAmount && available != null && !over && (
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-content-muted">Còn lại sau khi cấp</dt>
                <dd className="tabular-nums text-content-heading">{formatNumber(available - total)}</dd>
              </div>
            )}
          </dl>

          {over && (
            <p role="alert" className="text-sm text-[var(--accent-danger)]">
              Vượt quỹ chưa phân bổ {formatNumber(total - (available ?? 0))} token. Giảm số token mỗi học sinh hoặc bỏ bớt học sinh.
            </p>
          )}
          {quota.isError && (
            <p role="alert" className="text-sm text-[var(--accent-danger)]">
              Không tải được quỹ token của trường.{" "}
              <button type="button" className="archive-link" onClick={() => void quota.refetch()}>
                Thử lại
              </button>
            </p>
          )}
          {students.some((s) => !s.active) && (
            <p className="text-xs text-content-muted">Có học sinh đang bị khóa; token vẫn được cộng vào ví và dùng được khi mở khóa.</p>
          )}
          {error && (
            <p role="alert" className="text-sm text-[var(--accent-danger)]">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2">
            <button type="button" className="btn-line" disabled={allocateTokens.isPending} onClick={() => onOpenChange(false)}>
              Hủy
            </button>
            <button type="submit" className="btn-crimson disabled:opacity-50" disabled={allocateTokens.isPending || (touched && blocked) || over}>
              {allocateTokens.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Cấp token
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
