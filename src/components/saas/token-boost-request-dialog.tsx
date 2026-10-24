"use client";

import * as React from "react";
import { Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StaffFormInput, StaffFormTextarea } from "@/components/staff/staff-form";
import { DIALOG_CLASS, DIALOG_TITLE_CLASS, Field, formatNumber } from "@/components/saas/saas-ui";
import { apiErrorMessage, apiErrorStatus } from "@/features/saas/hooks-api";
import { useMyTokenBoosts, useRequestTokenBoost } from "@/features/saas/hooks-school-token";
import { localDateKey } from "@/features/saas/quota-bonus";
import { BOOST_MAX_TOKENS, BOOST_MIN_TOKENS, type TokenBoostRequest } from "@/services/school-token.service";
import { cn } from "@/lib/utils/cn";

const PRESETS = [500, 1_000, 2_000, 5_000];

/** Today's request still waiting for the teacher, if any (one pending request per day). */
export function usePendingBoostToday(enabled = true): TokenBoostRequest | undefined {
  const { data } = useMyTokenBoosts(enabled);
  const today = localDateKey();
  return data?.find((r) => (r.status === "PENDING" || r.status === "PENDING_ADMIN") && r.requestDate === today);
}

/**
 * School student: ask the class teacher for more AI tokens today (POST /student/token-requests).
 * Approved tokens raise today's limit only; they are still taken from the school pool as the student chats.
 */
export function TokenBoostRequestDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const request = useRequestTokenBoost();
  const pending = usePendingBoostToday(open);
  const [amount, setAmount] = React.useState("1000");
  const [reason, setReason] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [lastOpen, setLastOpen] = React.useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setAmount("1000");
      setReason("");
      setTouched(false);
      setError(null);
      request.reset();
    }
  }

  const tokens = Number(amount.replace(/[.\s,]/g, ""));
  const amountError = !Number.isInteger(tokens) || tokens < BOOST_MIN_TOKENS || tokens > BOOST_MAX_TOKENS
    ? `Từ ${formatNumber(BOOST_MIN_TOKENS)} đến ${formatNumber(BOOST_MAX_TOKENS)} token`
    : null;
  const reasonError = !reason.trim() ? "Cho thầy cô biết bạn cần thêm token để làm gì" : reason.trim().length > 500 ? "Tối đa 500 ký tự" : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (amountError || reasonError || pending) return;
    request.mutate(
      { requestedTokens: tokens, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success("Đã gửi yêu cầu xin thêm token", { description: "Thầy cô phụ trách lớp sẽ xem và duyệt trong hôm nay." });
          onOpenChange(false);
        },
        onError: (err) =>
          setError(
            apiErrorStatus(err) === 409
              ? "Bạn đã có một yêu cầu đang chờ duyệt hôm nay. Chờ thầy cô xử lý trước khi gửi yêu cầu mới."
              : apiErrorMessage(err, "Không gửi được yêu cầu. Vui lòng thử lại."),
          ),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !request.isPending && onOpenChange(o)}>
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-md")}>
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle className={DIALOG_TITLE_CLASS}>Xin thêm token hôm nay</DialogTitle>
            <DialogDescription className="text-content-muted">
              Yêu cầu được gửi tới thầy cô phụ trách lớp, thầy cô cấp từ hạn mức của mình (hoặc chuyển lên quản trị trường). Token được cấp chỉ dùng trong hôm nay; hạn mức làm mới lúc 00:00.
            </DialogDescription>
          </DialogHeader>

          {pending ? (
            <p role="status" className="flex items-start gap-2 rounded-sm border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] p-3 text-sm">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-warning)]" aria-hidden="true" />
              <span>
                Bạn đã xin thêm {formatNumber(pending.requestedTokens)} token hôm nay và đang chờ thầy cô duyệt. Mỗi ngày chỉ gửi được một yêu cầu
                đang chờ.
              </span>
            </p>
          ) : (
            <>
              <Field label="Số token cần thêm" required error={touched ? amountError : null} htmlFor="boost-amount">
                <StaffFormInput
                  id="boost-amount"
                  inputMode="numeric"
                  autoComplete="off"
                  value={amount}
                  aria-invalid={touched && !!amountError}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
              <div className="flex flex-wrap gap-2" aria-label="Mức gợi ý">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(String(p))}
                    aria-pressed={tokens === p}
                    className={cn(
                      "h-8 rounded-sm border px-2.5 text-xs font-bold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]",
                      tokens === p
                        ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
                        : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]",
                    )}
                  >
                    {formatNumber(p)}
                  </button>
                ))}
              </div>
              <Field label="Lý do" required error={touched ? reasonError : null} htmlFor="boost-reason">
                <StaffFormTextarea
                  id="boost-reason"
                  value={reason}
                  maxLength={500}
                  placeholder="VD: Em đang làm bài thảo luận với nhân vật Quang Trung"
                  className="min-h-[90px] resize-y"
                  onChange={(e) => setReason(e.target.value)}
                />
              </Field>
            </>
          )}

          {error && (
            <p role="alert" className="text-sm text-[var(--accent-danger)]">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2">
            <button type="button" className="btn-line" disabled={request.isPending} onClick={() => onOpenChange(false)}>
              {pending ? "Đóng" : "Hủy"}
            </button>
            {!pending && (
              <button type="submit" className="btn-crimson disabled:opacity-50" disabled={request.isPending}>
                {request.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Gửi yêu cầu
              </button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
