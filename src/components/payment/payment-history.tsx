"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query-key";
import { paymentService, type PaymentHistoryItem } from "@/services/payment.service";
import { CheckCircleIcon, XCircleIcon, HourglassIcon, ReceiptIcon } from "@phosphor-icons/react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    PAID: {
      label: "Đã thanh toán",
      color: "#22c55e",
      icon: <CheckCircleIcon size={13} weight="fill" />,
    },
    CANCELLED: {
      label: "Đã hủy",
      color: "#ef4444",
      icon: <XCircleIcon size={13} weight="fill" />,
    },
    PENDING: {
      label: "Chờ thanh toán",
      color: "#f59e0b",
      icon: <HourglassIcon size={13} weight="fill" />,
    },
  };

  const cfg = map[status] ?? {
    label: status,
    color: "var(--content-muted)",
    icon: null,
  };

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: `${cfg.color}22`, color: cfg.color }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function HistoryRow({ item }: { item: PaymentHistoryItem }) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border p-4 transition-all"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border-default)" }}
    >
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm" style={{ color: "var(--content-heading)" }}>
            {item.tierTitle}
          </span>
          <StatusBadge status={item.status} />
        </div>
        <p className="text-xs" style={{ color: "var(--content-muted)" }}>
          Mã đơn: <span className="font-mono">#{item.orderCode}</span>
        </p>
        <p className="text-xs" style={{ color: "var(--content-muted)" }}>
          Tạo lúc: {formatDate(item.createdAt)}
          {item.paidAt ? ` · Thanh toán: ${formatDate(item.paidAt)}` : ""}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className="font-bold text-base" style={{ color: "var(--content-heading)" }}>
          {formatCurrency(item.amount)}
        </p>
        <p className="text-xs" style={{ color: "var(--content-muted)" }}>
          HSD: {formatDate(item.expiredAt)}
        </p>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div
      className="rounded-xl border p-4 animate-pulse flex gap-4"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border-default)" }}
    >
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 rounded" style={{ background: "var(--border-default)" }} />
        <div className="h-3 w-1/4 rounded" style={{ background: "var(--border-default)" }} />
        <div className="h-3 w-2/5 rounded" style={{ background: "var(--border-default)" }} />
      </div>
      <div className="space-y-2 text-right">
        <div className="h-5 w-24 rounded" style={{ background: "var(--border-default)" }} />
        <div className="h-3 w-20 rounded" style={{ background: "var(--border-default)" }} />
      </div>
    </div>
  );
}

export default function PaymentHistory() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.payments.history,
    queryFn: paymentService.getHistory,
  });

  return (
    <div className="px-3 py-6 md:px-6 md:py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <ReceiptIcon size={22} style={{ color: "var(--content-heading)" }} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--content-heading)" }}>
              Lịch sử đơn hàng
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--content-muted)" }}>
              Tất cả các giao dịch thanh toán của bạn
            </p>
          </div>
        </div>

        {isError && (
          <div
            className="rounded-xl border p-4 text-sm text-center"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border-default)",
              color: "var(--content-muted)",
            }}
          >
            Không thể tải lịch sử. Vui lòng thử lại.
          </div>
        )}

        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
            : data && data.length > 0
            ? data.map((item) => <HistoryRow key={item.orderId} item={item} />)
            : !isLoading && (
                <div
                  className="rounded-xl border p-8 text-center"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border-default)",
                    color: "var(--content-muted)",
                  }}
                >
                  <ReceiptIcon size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Chưa có đơn hàng nào.</p>
                </div>
              )}
        </div>
      </div>
    </div>
  );
}
