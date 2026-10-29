"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { paymentService, type PaymentHistoryItem, type PaymentTier } from "@/services/payment.service";
import {
  CheckCircle2,
  Home,
  Hourglass,
  MessagesSquare,
  Receipt,
  RotateCcw,
  Sparkles,
  Timer,
  XCircle,
} from "lucide-react";
import { UpgradeProDialog } from "@/components/layouts/sidebar/upgrade-pro-dialog";

type PaymentStatus = "success" | "cancelled" | "pending" | "unknown";

function getStatus(params: URLSearchParams): PaymentStatus {
  const code = params.get("code");
  const status = params.get("status")?.toUpperCase();
  const cancel = params.get("cancel");

  if (cancel === "true") return "cancelled";
  if (code === "00" || status === "PAID") return "success";
  if (status === "PENDING") return "pending";
  return "unknown";
}

function formatCurrency(amount?: string | number | null) {
  if (amount === undefined || amount === null || amount === "") return "Đang cập nhật";

  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount)) return String(amount);

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(parsedAmount);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date());
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDuration(months?: number) {
  if (!months) return "Theo thời hạn của gói";
  return months >= 12 ? `${Math.round(months / 12)} năm sử dụng` : `${months} tháng sử dụng`;
}

function formatTokens(tokens?: number) {
  if (!tokens) return "Mở rộng lượt trò chuyện AI";
  return `${new Intl.NumberFormat("vi-VN").format(tokens)} token AI mỗi ngày`;
}

const CONFIG: Record<
  PaymentStatus,
  {
    icon: ReactNode;
    title: string;
    desc: string;
    panelClassName: string;
    iconClassName: string;
  }
> = {
  success: {
    icon: <CheckCircle2 size={26} />,
    title: "Thanh toán thành công",
    desc: "Cảm ơn bạn đã thanh toán. Gói học tập của bạn đã được kích hoạt và sẵn sàng sử dụng trên HistoryTalk.",
    panelClassName: "border-[var(--status-success-border)] bg-[var(--status-success-bg)]",
    iconClassName: "text-[var(--status-success)]",
  },
  cancelled: {
    icon: <XCircle size={26} />,
    title: "Bạn đã hủy thanh toán",
    desc: "Chưa có khoản tiền nào bị trừ. Bạn có thể chọn lại gói bất cứ lúc nào.",
    // The learner cancelled on purpose: a calm neutral tone, not an error colour.
    panelClassName: "border-[var(--status-neutral-border)] bg-[var(--status-neutral-bg)]",
    iconClassName: "text-[var(--text-tertiary)]",
  },
  pending: {
    icon: <Hourglass size={26} />,
    title: "Đang xác nhận thanh toán",
    desc: "PayOS đang xử lý giao dịch. Nếu bạn đã chuyển khoản, trạng thái sẽ được cập nhật sau ít phút.",
    panelClassName: "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)]",
    iconClassName: "text-[var(--status-warning)]",
  },
  unknown: {
    icon: <Timer size={26} />,
    title: "Chưa xác định trạng thái",
    desc: "HistoryTalk chưa nhận được trạng thái cuối cùng từ cổng thanh toán. Hãy kiểm tra lại trong lịch sử đơn hàng.",
    panelClassName: "border-[var(--status-neutral-border)] bg-[var(--status-neutral-bg)]",
    iconClassName: "text-[var(--text-muted)]",
  },
};

export default function PaymentResult() {
  const params = useSearchParams();
  const router = useRouter();
  const status = getStatus(params);
  const cfg = CONFIG[status];

  const orderCode = params.get("orderCode");
  const amount = params.get("amount");
  const [historyItem, setHistoryItem] = useState<PaymentHistoryItem | null>(null);
  const [tier, setTier] = useState<PaymentTier | null>(null);

  const paymentTime = historyItem?.paidAt ?? (status === "success" ? new Date().toISOString() : null);
  const rawPackageName = historyItem?.tierTitle ?? tier?.title ?? (status === "success" ? "HistoryTalk" : "Đang cập nhật");
  // Tier codes come lowercase from the API ("plus"); show them as a name.
  const packageName = rawPackageName.charAt(0).toUpperCase() + rawPackageName.slice(1);
  const displayedAmount = historyItem?.amount ?? tier?.amount ?? amount;

  // Only what the plan actually adds, as short chips; shown once the tier has loaded.
  const features = useMemo(() => {
    if (status !== "success" || !tier) return [];
    return [formatTokens(tier.limitedToken), formatDuration(tier.noMonth)];
  }, [status, tier]);

  useEffect(() => {
    const code = params.get("code") ?? "";
    const id = params.get("id") ?? "";
    const cancel = params.get("cancel") === "true";
    const payosStatus = params.get("status") ?? "";
    const orderCodeNum = Number(params.get("orderCode") ?? "0");

    if (!orderCodeNum) return;

    paymentService
      .notifyReturn({ code, id, cancel, status: payosStatus, orderCode: orderCodeNum })
      .catch(() => {});
  }, [params]);

  useEffect(() => {
    if (status !== "success") return;

    const orderCodeNum = Number(orderCode ?? "0");

    Promise.all([paymentService.getMyHistory().catch(() => []), paymentService.getTiers().catch(() => [])])
      .then(([history, tiers]) => {
        const matchedHistory = orderCodeNum
          ? history.find((item) => Number(item.orderCode) === orderCodeNum)
          : history.find((item) => item.status?.toUpperCase() === "PAID");
        setHistoryItem(matchedHistory ?? null);

        const matchedTier = matchedHistory
          ? tiers.find((item) => item.tierId === matchedHistory.tierId)
          : null;
        setTier(matchedTier ?? null);
      })
      .catch(() => {});
  }, [orderCode, status]);

  useEffect(() => {
    if (status !== "success") return;

    const tid = setTimeout(() => {
      toast(
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 font-bold text-[var(--content-heading)]">
            <Sparkles className="size-4 shrink-0 text-[var(--accent-gold)]" />
            Gói thanh toán đã được kích hoạt!
          </div>
          <p className="text-xs leading-5 text-[var(--content-muted)]">
            Cảm ơn bạn đã nâng cấp. Bạn có thể dùng quyền lợi mới ngay bây giờ.
          </p>
        </div>,
        {
          duration: 8_000,
          icon: null,
          classNames: {
            toast: "ht-toast ht-toast--success",
          },
        },
      );
    }, 800);

    return () => clearTimeout(tid);
  }, [status]);

  if (status !== "success") {
    // Cancelled/unknown: the next step is picking a plan again. Pending: wait and check the order history.
    const canRetry = status === "cancelled" || status === "unknown";
    return (
      <div className="flex min-h-full items-center justify-center px-4 py-8 md:py-12">
        <section className="w-full max-w-md rounded-md border border-border-card bg-[var(--bg-surface)] p-6 text-center shadow-[var(--shadow-soft)] animate-in fade-in zoom-in-95 duration-500 sm:p-8">
          <span className={`mx-auto grid h-14 w-14 place-items-center rounded-full border ${cfg.panelClassName} ${cfg.iconClassName}`}>
            {cfg.icon}
          </span>
          <h1 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">{cfg.title}</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{cfg.desc}</p>

          <div className="mt-6 flex flex-col gap-2">
            {canRetry ? (
              <UpgradeProDialog>
                <button type="button" className="btn-crimson h-11 w-full">
                  <RotateCcw size={16} />
                  Chọn lại gói
                </button>
              </UpgradeProDialog>
            ) : (
              <button type="button" onClick={() => router.push("/payment/history")} className="btn-crimson h-11 w-full">
                <Receipt size={16} />
                Xem lịch sử giao dịch
              </button>
            )}
            <button type="button" onClick={() => router.push("/home")} className="btn-line h-11 w-full">
              <Home size={16} />
              Về trang chủ
            </button>
          </div>

          {/* Kept for support requests, but no longer the first thing on the card. */}
          {orderCode && (
            <p className="mt-5 text-xs text-[var(--text-tertiary)]">
              Mã đơn <span className="font-mono">#{orderCode}</span>
            </p>
          )}
        </section>
      </div>
    );
  }

  return (
    // A receipt, not a poster: one centred card saying what was bought, then the way into using it.
    <div className="flex min-h-full items-center justify-center px-4 py-8 md:py-12">
      <section className="w-full max-w-md rounded-md border border-border-card bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-soft)] animate-in fade-in zoom-in-95 duration-500 sm:p-8">
        <div className="text-center">
          <span className={`mx-auto grid h-14 w-14 place-items-center rounded-full border ${cfg.panelClassName} ${cfg.iconClassName}`}>
            {cfg.icon}
          </span>
          <h1 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">{cfg.title}</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Gói <b className="font-semibold text-[var(--text-primary)]">{packageName}</b> đã được kích hoạt cho tài khoản của bạn.
          </p>
        </div>

        {features.length > 0 && (
          <ul className="mt-5 flex flex-wrap justify-center gap-2">
            {features.map((feature) => (
              <li
                key={feature}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--status-success-border)] bg-[var(--status-success-bg)] px-3 py-1 text-xs font-semibold text-[var(--status-success)]"
              >
                <CheckCircle2 size={13} aria-hidden="true" /> {feature}
              </li>
            ))}
          </ul>
        )}

        <dl className="mt-6 divide-y divide-[var(--border-default)] border-y border-[var(--border-default)] text-sm">
          {[
            { label: "Số tiền", value: formatCurrency(displayedAmount) },
            { label: "Thời gian", value: formatDateTime(paymentTime) },
            { label: "Mã đơn", value: orderCode ? `#${orderCode}` : "Đang cập nhật", mono: true },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 py-2.5">
              <dt className="text-[var(--text-tertiary)]">{row.label}</dt>
              <dd className={row.mono ? "break-all text-right font-mono text-xs text-[var(--text-secondary)]" : "font-semibold tabular-nums text-[var(--text-primary)]"}>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-col gap-2">
          <button type="button" onClick={() => router.push("/characters")} className="btn-crimson h-11 w-full">
            <MessagesSquare size={16} />
            Bắt đầu trò chuyện
          </button>
          <button type="button" onClick={() => router.push("/home")} className="btn-line h-11 w-full">
            <Home size={16} />
            Về trang chủ
          </button>
        </div>
      </section>
    </div>
  );
}
