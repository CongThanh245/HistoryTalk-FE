"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { paymentService } from "@/services/payment.service";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  CreditCardIcon,
  HouseIcon,
  HourglassIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from "@phosphor-icons/react";

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

function formatCurrency(amount: string) {
  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount)) return amount;

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(parsedAmount);
}

const CONFIG: Record<
  PaymentStatus,
  {
    icon: ReactNode;
    eyebrow: string;
    title: string;
    desc: string;
    accent: string;
    bg: string;
    border: string;
  }
> = {
  success: {
    icon: <CheckCircleIcon size={26} weight="duotone" />,
    eyebrow: "Hoàn tất",
    title: "Thanh toán thành công",
    desc: "Gói Pro đã được kích hoạt. Bạn có thể quay lại HistoryTalk và dùng toàn bộ tính năng ngay.",
    accent: "var(--status-success)",
    bg: "var(--status-success-bg)",
    border: "var(--status-success-border)",
  },
  cancelled: {
    icon: <XCircleIcon size={26} weight="duotone" />,
    eyebrow: "Đã hủy",
    title: "Giao dịch đã bị hủy",
    desc: "Không có khoản thanh toán nào được ghi nhận. Bạn có thể mở lại gói Pro và thanh toán khi sẵn sàng.",
    accent: "var(--accent-danger)",
    bg: "var(--status-danger-bg)",
    border: "var(--status-danger-border)",
  },
  pending: {
    icon: <HourglassIcon size={26} weight="duotone" />,
    eyebrow: "Đang xử lý",
    title: "Đang xác nhận thanh toán",
    desc: "PayOS đang xử lý giao dịch. Nếu bạn đã chuyển khoản, trạng thái sẽ được cập nhật sau ít phút.",
    accent: "var(--status-warning)",
    bg: "var(--status-warning-bg)",
    border: "var(--status-warning-border)",
  },
  unknown: {
    icon: <ClockCountdownIcon size={26} weight="duotone" />,
    eyebrow: "Cần kiểm tra",
    title: "Chưa xác định trạng thái",
    desc: "HistoryTalk chưa nhận được trạng thái cuối cùng từ cổng thanh toán. Hãy kiểm tra lại trong lịch sử đơn hàng.",
    accent: "var(--content-muted)",
    bg: "var(--status-neutral-bg)",
    border: "var(--status-neutral-border)",
  },
};

export default function PaymentResult() {
  const params = useSearchParams();
  const router = useRouter();
  const status = getStatus(params);
  const cfg = CONFIG[status];

  const orderCode = params.get("orderCode");
  const amount = params.get("amount");

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
  }, []);

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-8 md:py-12">
      <section className="w-full max-w-4xl overflow-hidden rounded-lg border border-[rgba(27,38,50,0.1)] bg-white/75 shadow-[0_24px_70px_rgba(27,38,50,0.1)] animate-in fade-in zoom-in-95 duration-500">
        <div className="grid md:grid-cols-[0.9fr_1.1fr]">
          <aside className="relative overflow-hidden bg-[var(--abyssal-blue)] p-6 text-white md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,146,21,0.28),transparent_22rem)]" />
            <div className="relative flex h-full min-h-64 flex-col justify-between gap-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-bold text-[var(--accent-gold-soft)]">
                  <ShieldCheckIcon size={15} weight="fill" />
                  PayOS secure checkout
                </div>
                <h1 className="mt-5 text-3xl font-extrabold leading-tight">
                  HistoryTalk Pro
                </h1>
                <p className="mt-3 text-sm leading-6 text-white/68">
                  Thanh toán được đồng bộ tự động với tài khoản của bạn. Trạng thái đơn hàng có thể xem lại bất cứ lúc nào.
                </p>
              </div>

              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/7 p-3">
                  <CreditCardIcon size={18} className="text-[var(--accent-gold-soft)]" />
                  <span className="text-white/78">Chuyển khoản ngân hàng và QR</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/7 p-3">
                  <ReceiptIcon size={18} className="text-[var(--accent-gold-soft)]" />
                  <span className="text-white/78">Lưu lịch sử giao dịch rõ ràng</span>
                </div>
              </div>
            </div>
          </aside>

          <div className="p-6 sm:p-8">
            <div
              className="rounded-lg border p-5"
              style={{ borderColor: cfg.border, background: cfg.bg }}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0" style={{ color: cfg.accent }}>
                  {cfg.icon}
                </span>
                <div>
                  <p
                    className="text-xs font-extrabold uppercase tracking-[0.12em]"
                    style={{ color: cfg.accent }}
                  >
                    {cfg.eyebrow}
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold text-[var(--content-heading)]">
                    {cfg.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--content-muted)]">{cfg.desc}</p>
                </div>
              </div>
            </div>

            {(orderCode || amount) && (
              <div className="mt-5 rounded-lg border border-[rgba(27,38,50,0.1)] bg-[var(--bg-content)] p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--content-heading)]">
                  <ReceiptIcon size={17} weight="duotone" className="text-[var(--accent-gold)]" />
                  Chi tiết giao dịch
                </div>
                <div className="grid gap-3">
                  {orderCode && (
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-[var(--content-muted)]">Mã đơn hàng</span>
                      <span className="font-mono font-bold text-[var(--content-heading)]">
                        #{orderCode}
                      </span>
                    </div>
                  )}
                  {amount && (
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-[var(--content-muted)]">Số tiền</span>
                      <span className="font-bold text-[var(--content-heading)]">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push("/home")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--abyssal-blue)] px-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(27,38,50,0.2)] transition hover:-translate-y-0.5 hover:bg-[var(--blue-fantastic)]"
              >
                <HouseIcon size={17} />
                Về trang chủ
              </button>

              <button
                type="button"
                onClick={() => router.push("/home")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[rgba(27,38,50,0.12)] bg-white px-4 text-sm font-bold text-[var(--content-heading)] transition hover:-translate-y-0.5 hover:border-[rgba(255,146,21,0.36)] hover:text-[var(--accent-gold)]"
              >
                <ArrowLeftIcon size={16} />
                Quay lại
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
