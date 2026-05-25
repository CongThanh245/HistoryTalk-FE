"use client";

import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  XCircleIcon,
  HourglassIcon,
  ArrowLeftIcon,
} from "@phosphor-icons/react";

type PaymentStatus = "success" | "cancelled" | "pending" | "unknown";

function getStatus(params: URLSearchParams): PaymentStatus {
  const code = params.get("code");
  const status = params.get("status");
  const cancel = params.get("cancel");

  if (cancel === "true") return "cancelled";
  if (code === "00" || status === "PAID") return "success";
  if (status === "PENDING") return "pending";
  return "unknown";
}

const CONFIG: Record<
  PaymentStatus,
  { icon: React.ReactNode; title: string; desc: string; color: string }
> = {
  success: {
    icon: <CheckCircleIcon size={56} weight="fill" style={{ color: "#22c55e" }} />,
    title: "Thanh toán thành công!",
    desc: "Gói của bạn đã được kích hoạt. Hãy khám phá toàn bộ tính năng ngay.",
    color: "#22c55e",
  },
  cancelled: {
    icon: <XCircleIcon size={56} weight="fill" style={{ color: "#ef4444" }} />,
    title: "Thanh toán đã bị hủy",
    desc: "Bạn đã hủy giao dịch. Bạn có thể thử lại bất kỳ lúc nào.",
    color: "#ef4444",
  },
  pending: {
    icon: <HourglassIcon size={56} weight="fill" style={{ color: "#f59e0b" }} />,
    title: "Đang xử lý thanh toán",
    desc: "Giao dịch đang được xác nhận. Vui lòng đợi trong giây lát.",
    color: "#f59e0b",
  },
  unknown: {
    icon: <HourglassIcon size={56} weight="fill" style={{ color: "var(--content-muted)" }} />,
    title: "Trạng thái không xác định",
    desc: "Không thể xác định trạng thái thanh toán. Vui lòng kiểm tra lịch sử đơn hàng.",
    color: "var(--content-muted)",
  },
};

export default function PaymentResult() {
  const params = useSearchParams();
  const router = useRouter();
  const status = getStatus(params);
  const cfg = CONFIG[status];

  const orderCode = params.get("orderCode");
  const amount = params.get("amount");

  return (
    <div className="flex items-center justify-center min-h-full px-4 py-12">
      <div
        className="w-full max-w-md rounded-2xl border p-8 text-center space-y-6"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex justify-center">{cfg.icon}</div>

        <div className="space-y-2">
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--content-heading)" }}
          >
            {cfg.title}
          </h1>
          <p className="text-sm" style={{ color: "var(--content-muted)" }}>
            {cfg.desc}
          </p>
        </div>

        {(orderCode || amount) && (
          <div
            className="rounded-xl p-4 text-left space-y-2"
            style={{ background: "var(--bg-content)", border: "1px solid var(--border-default)" }}
          >
            {orderCode && (
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--content-muted)" }}>Mã đơn hàng</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                  #{orderCode}
                </span>
              </div>
            )}
            {amount && (
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--content-muted)" }}>Số tiền</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(Number(amount))}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {status === "success" ? (
            <button
              onClick={() => router.push("/home")}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all"
              style={{ background: "var(--accent-gold-soft)", color: "var(--abyssal-blue)" }}
            >
              Về trang chủ
            </button>
          ) : (
            <button
              onClick={() => router.push("/home")}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all"
              style={{ background: "var(--accent-gold-soft)", color: "var(--abyssal-blue)" }}
            >
              Thử lại
            </button>
          )}
          <button
            onClick={() => router.push("/payment/history")}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all"
            style={{
              background: "var(--bg-content)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            }}
          >
            <ArrowLeftIcon size={14} />
            Lịch sử đơn hàng
          </button>
        </div>
      </div>
    </div>
  );
}
