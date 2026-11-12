"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CreditCard, Loader2, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { StaffFormInput, StaffFormSelect } from "@/components/staff/staff-form";
import { Field, Panel, SectionHeading, formatDate, formatNumber } from "@/components/saas/saas-ui";
import { cn } from "@/lib/utils/cn";
import { formatVnd } from "@/features/payment/tier-plans";
import { PACKAGE_ORDER, PACKAGE_SHORT_LABELS, millionTokens } from "@/features/saas/admin-schools";
import { apiErrorMessage, useApiTokenQuota } from "@/features/saas/hooks-api";
import { TOKEN_PURCHASE_ANCHOR } from "@/features/saas/school-pool";
import {
  usePurchaseSchoolTokens,
  useRefreshSchoolPool,
  useRenewOwnSubscription,
  useSchoolTokenPurchaseHistory,
} from "@/features/saas/hooks-school-token";
import { paymentService } from "@/services/payment.service";
import { ENTERPRISE_PACKAGE_TOKENS, type EnterprisePackage } from "@/services/school.service";
import { TOKEN_PURCHASE, tokenPurchaseAmount, type SchoolTokenPurchaseHistoryItem } from "@/services/school-token.service";
import type { SchoolAdminDashboard } from "@/services/analytics-dashboard.service";


// The school pool is a 32-bit integer on the backend; a purchase must not push it past that.
const POOL_INT_MAX = 2_147_483_647;
// Above this a single order should go through HistoryTalk (invoice, contract).
const PURCHASE_MAX_TOKENS = 1_000_000_000;
const PRESETS = [1_000_000, 10_000_000, 50_000_000, 100_000_000];
const HISTORY_PAGE_SIZE = 5;

const parseTokens = (text: string) => Number(text.replace(/[.\s,]/g, ""));
const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

// ─── Purchase ──────────────────────────────────────────────────────────────

/** School Admin buys tokens for the shared pool through PayOS; the webhook adds them right after payment. */
export function TokenPurchasePanel({ schoolStatus }: { schoolStatus?: SchoolAdminDashboard["status"] }) {
  const quota = useApiTokenQuota();
  const purchase = usePurchaseSchoolTokens();
  const [text, setText] = React.useState("10000000");

  const tokens = parseTokens(text);
  const headroom = quota.data ? Math.max(0, POOL_INT_MAX - Math.max(0, quota.data.totalSchoolTokenQuota)) : PURCHASE_MAX_TOKENS;
  const maxTokens = Math.min(PURCHASE_MAX_TOKENS, headroom);
  const locked = schoolStatus != null && schoolStatus !== "ACTIVE";
  const error = !Number.isInteger(tokens) || tokens < TOKEN_PURCHASE.minTokens
    ? `Tối thiểu ${formatNumber(TOKEN_PURCHASE.minTokens)} token.`
    : tokens > maxTokens
      ? `Tối đa ${formatNumber(maxTokens)} token mỗi lần mua. Cần nhiều hơn, vui lòng liên hệ HistoryTalk.`
      : null;

  const checkout = () => {
    if (error || locked) return;
    purchase.mutate(tokens, {
      onSuccess: (order) => {
        if (!order.checkoutUrl) {
          toast.error("Không nhận được liên kết thanh toán. Vui lòng thử lại.");
          return;
        }
        window.location.href = order.checkoutUrl;
      },
      onError: (e) => toast.error(apiErrorMessage(e, "Không tạo được đơn mua token.")),
    });
  };

  return (
    <Panel>
      <div id={TOKEN_PURCHASE_ANCHOR} className="scroll-mt-24">
        <SectionHeading
          title="Mua thêm token"
          description="Thanh toán qua PayOS (quét VietQR hoặc chuyển khoản). Token được cộng thẳng vào quỹ chung ngay khi thanh toán thành công, không cần chờ duyệt."
        />
      </div>

      {locked ? (
        <p className="rounded-sm border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-3 py-2 text-sm text-[var(--status-warning)]">
          Gói năm học của trường đang không hoạt động nên chưa mua thêm token được. Hãy gia hạn gói trước.
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn nhanh số token">
              {PRESETS.filter((p) => p <= maxTokens).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setText(String(p))}
                  className={cn(
                    "rounded-sm border px-3 py-1.5 text-sm font-semibold tabular-nums motion-safe:transition-colors",
                    tokens === p
                      ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
                      : "border-[var(--border-strong)] hover:border-[var(--text-primary)]",
                  )}
                >
                  {millionTokens(p)}
                </button>
              ))}
            </div>
            <Field
              label="Số token cần mua"
              required
              htmlFor="purchase-tokens"
              error={text.trim() ? error : null}
              hint={`Đơn giá ${TOKEN_PURCHASE.unitPriceVnd.toLocaleString("vi-VN")} đ/token, tối thiểu ${formatNumber(TOKEN_PURCHASE.minTokens)} token.`}
            >
              <StaffFormInput
                id="purchase-tokens"
                inputMode="numeric"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={() => Number.isFinite(tokens) && tokens > 0 && setText(String(Math.round(tokens)))}
              />
            </Field>
            <p className="text-xs leading-5 text-content-muted">
              Token mua thêm dùng chung trong năm học hiện tại. Khi sang năm học mới, chỉ 20% token còn dư trong quỹ được bảo lưu.
            </p>
          </div>

          <div className="space-y-3 rounded-sm border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-content-muted">Số token</dt>
                <dd className="font-semibold tabular-nums">{Number.isFinite(tokens) && tokens > 0 ? formatNumber(Math.round(tokens)) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-[var(--border-default)] pt-2">
                <dt className="font-semibold">Thành tiền</dt>
                <dd className="text-lg font-bold tabular-nums text-content-heading">{error ? "—" : formatVnd(tokenPurchaseAmount(tokens))}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={checkout}
              disabled={!!error || purchase.isPending}
              className="btn-crimson w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {purchase.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CreditCard className="h-4 w-4" aria-hidden="true" />}
              Thanh toán qua PayOS
            </button>
            <p className="text-center text-xs text-content-muted">Liên kết thanh toán có hiệu lực 15 phút.</p>
          </div>
        </div>
      )}

      <PurchaseHistory />
    </Panel>
  );
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Chờ thanh toán", className: "text-[var(--status-warning)]" },
  PAID: { label: "Đã thanh toán", className: "text-[var(--status-success)]" },
  CANCELLED: { label: "Đã huỷ", className: "text-content-muted" },
  EXPIRED: { label: "Hết hạn", className: "text-content-muted" },
  FAILED: { label: "Thất bại", className: "text-[var(--accent-danger)]" },
};

function orderStatus(item: SchoolTokenPurchaseHistoryItem) {
  if (item.status === "PAID" && item.fulfillmentStatus !== "FULFILLED") {
    return { label: "Đang cộng token", className: "text-[var(--status-warning)]" };
  }
  if (item.status === "PAID") return { label: "Đã cộng vào quỹ", className: "text-[var(--status-success)]" };
  return STATUS_LABELS[item.status] ?? { label: item.status, className: "text-content-muted" };
}

function PurchaseHistory() {
  const [page, setPage] = React.useState(0);
  const history = useSchoolTokenPurchaseHistory({ page, size: HISTORY_PAGE_SIZE });
  const items = history.data?.content ?? [];
  const totalPages = history.data?.totalPages ?? 1;

  return (
    <div className="space-y-2 border-t border-[var(--border-default)] pt-4">
      <p className="text-[13px] font-semibold text-[var(--text-tertiary)]">Lịch sử mua token</p>
      {history.isPending ? (
        <p className="text-sm text-content-muted">Đang tải…</p>
      ) : history.isError ? (
        <p className="text-sm text-[var(--accent-danger)]">
          Không tải được lịch sử mua token.{" "}
          <button type="button" className="underline" onClick={() => void history.refetch()}>
            Thử lại
          </button>
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-content-muted">Trường chưa mua thêm token lần nào.</p>
      ) : (
        <>
          <ul className="divide-y divide-[var(--border-default)] rounded-sm border border-[var(--border-default)]">
            {items.map((item) => {
              const s = orderStatus(item);
              return (
                <li key={item.orderId} className="flex flex-col gap-1 px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0">
                    <b className="tabular-nums">{formatNumber(item.tokens)} token</b>
                    <span className="text-content-muted"> · {formatVnd(item.amount)} · #{item.orderCode}</span>
                    <span className="block text-xs text-content-muted">{formatDateTime(item.paidAt ?? item.createdAt)}</span>
                  </span>
                  <span className={cn("shrink-0 text-xs font-bold", s.className)}>{s.label}</span>
                </li>
              );
            })}
          </ul>
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 text-sm">
              <button type="button" className="btn-line" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Trước
              </button>
              <span className="tabular-nums text-content-muted">
                {page + 1} / {totalPages}
              </span>
              <button type="button" className="btn-line" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Return from PayOS ─────────────────────────────────────────────────────

// How long to wait for the PayOS webhook before telling the admin to check back later.
const WEBHOOK_WAIT_MS = 90_000;

/**
 * PayOS sends the School Admin back with ?orderCode=…&status=…&cancel=… (the middleware forwards /payment/* here).
 * The return call only records a cancellation; a payment counts once the webhook has verified it, so this polls the
 * purchase history until the order is fulfilled.
 */
export function PurchaseReturnBanner() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const refreshPool = useRefreshSchoolPool();
  const orderCode = Number(params.get("orderCode") ?? 0);
  const cancelled = params.get("cancel") === "true" || params.get("status") === "CANCELLED";
  const [startedAt] = React.useState(() => Date.now());
  const [now, setNow] = React.useState(startedAt);
  const notified = React.useRef(false);

  React.useEffect(() => {
    if (!orderCode || notified.current) return;
    notified.current = true;
    paymentService
      .notifyReturn({
        code: params.get("code") ?? "",
        id: params.get("id") ?? "",
        cancel: cancelled,
        status: params.get("status") ?? "",
        orderCode,
      })
      .catch(() => undefined);
  }, [orderCode, cancelled, params]);

  const waiting = !!orderCode && !cancelled && now - startedAt < WEBHOOK_WAIT_MS;
  const history = useSchoolTokenPurchaseHistory({ page: 0, size: 20 }, waiting);
  const order = history.data?.content.find((o) => Number(o.orderCode) === orderCode);
  const done = order?.status === "PAID" && order.fulfillmentStatus === "FULFILLED";
  const failed = order != null && ["CANCELLED", "EXPIRED", "FAILED"].includes(order.status);

  // Tick so the polling stops after WEBHOOK_WAIT_MS.
  React.useEffect(() => {
    if (!waiting || done || failed) return;
    const timer = window.setInterval(() => setNow(Date.now()), 3000);
    return () => window.clearInterval(timer);
  }, [waiting, done, failed]);

  const refreshed = React.useRef(false);
  React.useEffect(() => {
    if (done && !refreshed.current) {
      refreshed.current = true;
      refreshPool();
    }
  }, [done, refreshPool]);

  if (!orderCode) return null;
  const dismiss = () => router.replace(pathname, { scroll: false });

  const tone = done ? "success" : cancelled || failed ? "muted" : "pending";
  const Icon = done ? CheckCircle2 : cancelled || failed ? XCircle : Loader2;
  const title = done
    ? `Đã cộng ${formatNumber(order?.tokens ?? 0)} token vào quỹ của trường`
    : cancelled || failed
      ? "Đơn mua token chưa được thanh toán"
      : "Đang xác nhận thanh toán…";
  const body = done
    ? `Đơn #${orderCode} đã thanh toán thành công.`
    : cancelled || failed
      ? `Đơn #${orderCode} đã huỷ hoặc hết hạn, không có khoản tiền nào bị trừ.`
      : waiting
        ? `Đơn #${orderCode}: đang chờ PayOS xác nhận, thường mất vài giây.`
        : `Đơn #${orderCode} chưa được xác nhận. Nếu bạn đã chuyển tiền, token sẽ được cộng tự động; tải lại trang sau ít phút để kiểm tra.`;

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-sm border px-4 py-3",
        tone === "success" && "border-[var(--status-success)] bg-[var(--status-success-bg)]",
        tone === "pending" && "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)]",
        tone === "muted" && "border-[var(--border-default)] bg-[var(--bg-elevated)]",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0",
          tone === "success" ? "text-[var(--status-success)]" : tone === "pending" ? "text-[var(--status-warning)]" : "text-content-muted",
          tone === "pending" && waiting && "animate-spin",
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-content-heading">{title}</p>
        <p className="text-content-text">{body}</p>
      </div>
      <button type="button" onClick={dismiss} className="shrink-0 text-xs font-semibold underline-offset-4 hover:underline">
        Đóng
      </button>
    </div>
  );
}

// ─── Renewal ───────────────────────────────────────────────────────────────

const DAY_MS = 86_400_000;

/** Mirrors the backend window: any day in May, or from 31 days before to 30 days after the current end date. */
export function canRenewNow(endDate?: string | null, today = new Date()) {
  if (today.getMonth() === 4) return true;
  if (!endDate) return false;
  const end = new Date(`${endDate}T00:00:00`).getTime();
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return t >= end - 31 * DAY_MS && t <= end + 30 * DAY_MS;
}

/** School Admin renews the school-year package; HistoryTalk activates it once the current one ends. */
export function RenewSubscriptionButton({ dash, className }: { dash: SchoolAdminDashboard; className?: string }) {
  const renew = useRenewOwnSubscription();
  const current = dash.packageType ?? "ENTERPRISE_MEDIUM";
  const isCustom = current === "ENTERPRISE_CUSTOM";
  const [open, setOpen] = React.useState(false);
  const [pkg, setPkg] = React.useState<EnterprisePackage>(current);
  const eligible = canRenewNow(dash.subscriptionEndDate);
  const options: EnterprisePackage[] = isCustom ? ["ENTERPRISE_CUSTOM", ...PACKAGE_ORDER] : PACKAGE_ORDER;

  if (dash.renewedForNextYear) return null;

  const confirm = () =>
    renew.mutate(
      { packageType: pkg },
      {
        onSuccess: () => {
          toast.success(`Đã đăng ký gia hạn ${PACKAGE_SHORT_LABELS[pkg]} cho năm học tới`);
          setOpen(false);
        },
        onError: (e) => toast.error(apiErrorMessage(e, "Không gia hạn được gói.")),
      },
    );

  return (
    <>
      <button
        type="button"
        className={cn("btn-crimson disabled:cursor-not-allowed disabled:opacity-60", className)}
        disabled={!eligible}
        title={eligible ? undefined : "Mở gia hạn trong tháng 5 hoặc trong 31 ngày trước khi gói hết hạn"}
        onClick={() => setOpen(true)}
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" /> Gia hạn năm học tới
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        variant="primary"
        title="Gia hạn gói cho năm học tới?"
        description={`Gói hiện tại kết thúc ngày ${formatDate(dash.subscriptionEndDate)}. Gói mới được kích hoạt sau ngày đó; khi kích hoạt, 20% token còn dư trong quỹ được bảo lưu sang năm mới.`}
        confirmLabel="Gia hạn"
        isPending={renew.isPending}
        onConfirm={confirm}
      >
        <Field
          label="Gói năm học tới"
          hint={
            pkg === "ENTERPRISE_CUSTOM"
              ? "Giữ nguyên quy mô và quỹ token theo hợp đồng hiện tại. Muốn đổi quy mô, liên hệ HistoryTalk để báo giá lại."
              : `Quỹ ${millionTokens(ENTERPRISE_PACKAGE_TOKENS[pkg])} token cho cả năm học.`
          }
        >
          <StaffFormSelect
            value={pkg}
            onValueChange={setPkg}
            options={options.map((p) => ({
              value: p,
              label:
                p === "ENTERPRISE_CUSTOM"
                  ? `${PACKAGE_SHORT_LABELS[p]} · giữ quy mô hiện tại`
                  : `${PACKAGE_SHORT_LABELS[p]} · ${millionTokens(ENTERPRISE_PACKAGE_TOKENS[p])} token`,
            }))}
            className="w-full"
          />
        </Field>
      </ConfirmDialog>
    </>
  );
}
