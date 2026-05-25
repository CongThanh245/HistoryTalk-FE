"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowClockwiseIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  HourglassIcon,
  PackageIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { queryKeys } from "@/shared/query-key";
import { paymentService, type PaymentHistoryItem } from "@/services/payment.service";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "--";

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "--";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusConfig(status: string) {
  const normalized = status.toUpperCase();

  const map = {
    PAID: {
      label: "Đã thanh toán",
      icon: <CheckCircleIcon size={14} weight="fill" />,
      classes: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    CANCELLED: {
      label: "Đã hủy",
      icon: <XCircleIcon size={14} weight="fill" />,
      classes: "border-rose-200 bg-rose-50 text-rose-700",
    },
    PENDING: {
      label: "Chờ thanh toán",
      icon: <HourglassIcon size={14} weight="fill" />,
      classes: "border-amber-200 bg-amber-50 text-amber-700",
    },
  } as const;

  return (
    map[normalized as keyof typeof map] ?? {
      label: status,
      icon: <ClockCountdownIcon size={14} weight="fill" />,
      classes: "border-slate-200 bg-slate-50 text-slate-600",
    }
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = getStatusConfig(status);

  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold ${cfg.classes}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[rgba(27,38,50,0.1)] bg-white/70 p-4 shadow-[0_10px_30px_rgba(27,38,50,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--content-subtle)]">
            {label}
          </p>
          <p className="mt-1 text-xl font-bold text-[var(--content-heading)]">{value}</p>
        </div>
        <div className="grid size-10 place-items-center rounded-lg bg-[rgba(255,146,21,0.12)] text-[var(--accent-gold)]">
          {icon}
        </div>
      </div>
    </div>
  );
}

function HistoryRow({ item, index }: { item: PaymentHistoryItem; index: number }) {
  const paid = item.status.toUpperCase() === "PAID";
  const pending = item.status.toUpperCase() === "PENDING";

  return (
    <article
      className="group relative overflow-hidden rounded-lg border border-[rgba(27,38,50,0.1)] bg-white/80 p-4 shadow-[0_12px_34px_rgba(27,38,50,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(255,146,21,0.34)] hover:shadow-[0_18px_42px_rgba(27,38,50,0.1)] sm:p-5 animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-[var(--oatmeal)] transition-colors group-hover:bg-[var(--accent-gold)]" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 pl-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-[var(--bg-content)] text-[var(--accent-gold)]">
              <PackageIcon size={18} weight="duotone" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-[var(--content-heading)]">
                {item.tierTitle}
              </h2>
              <p className="text-xs text-[var(--content-muted)]">
                Mã đơn <span className="font-mono font-semibold">#{item.orderCode}</span>
              </p>
            </div>
            <StatusBadge status={item.status} />
          </div>

          <div className="mt-4 grid gap-2 text-xs text-[var(--content-muted)] sm:grid-cols-2">
            <div className="inline-flex items-center gap-2">
              <CalendarBlankIcon size={15} className="text-[var(--content-subtle)]" />
              Tạo lúc {formatDate(item.createdAt)}
            </div>
            <div className="inline-flex items-center gap-2">
              <ShieldCheckIcon
                size={15}
                className={paid ? "text-emerald-600" : "text-[var(--content-subtle)]"}
              />
              {paid ? `Thanh toán ${formatDate(item.paidAt)}` : `Hết hạn ${formatDate(item.expiredAt)}`}
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-[rgba(27,38,50,0.08)] pt-4 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
          <div>
            <p className="text-xl font-extrabold text-[var(--content-heading)]">
              {formatCurrency(item.amount)}
            </p>
            <p className="mt-1 text-xs text-[var(--content-muted)]">
              {pending ? "Đang chờ xác nhận" : "Gói Pro HistoryTalk"}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function SkeletonRow() {
  return (
    <div className="rounded-lg border border-[rgba(27,38,50,0.1)] bg-white/70 p-5 shadow-[0_12px_34px_rgba(27,38,50,0.05)]">
      <div className="flex animate-pulse gap-4">
        <div className="size-10 rounded-lg bg-[rgba(27,38,50,0.08)]" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-1/3 rounded bg-[rgba(27,38,50,0.1)]" />
          <div className="h-3 w-1/2 rounded bg-[rgba(27,38,50,0.08)]" />
          <div className="h-3 w-2/3 rounded bg-[rgba(27,38,50,0.08)]" />
        </div>
        <div className="hidden w-28 space-y-3 sm:block">
          <div className="h-5 rounded bg-[rgba(27,38,50,0.1)]" />
          <div className="h-3 rounded bg-[rgba(27,38,50,0.08)]" />
        </div>
      </div>
    </div>
  );
}

export default function PaymentHistory() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.payments.history,
    queryFn: paymentService.getHistory,
  });

  const summary = useMemo(() => {
    const items = data ?? [];
    const paidItems = items.filter((item) => item.status.toUpperCase() === "PAID");
    const pendingItems = items.filter((item) => item.status.toUpperCase() === "PENDING");
    const totalPaid = paidItems.reduce((sum, item) => sum + item.amount, 0);

    return {
      total: items.length,
      paid: paidItems.length,
      pending: pendingItems.length,
      totalPaid,
    };
  }, [data]);

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="relative overflow-hidden rounded-lg border border-[rgba(27,38,50,0.1)] bg-white/65 p-5 shadow-[0_18px_48px_rgba(27,38,50,0.06)] sm:p-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="absolute right-0 top-0 h-28 w-56 rounded-bl-full bg-[rgba(255,146,21,0.1)] blur-2xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid size-11 place-items-center rounded-lg bg-[var(--abyssal-blue)] text-[var(--accent-gold-soft)] shadow-[0_12px_28px_rgba(27,38,50,0.22)]">
                <ReceiptIcon size={22} weight="duotone" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent-gold)]">
                  Payment
                </p>
                <h1 className="mt-1 text-2xl font-extrabold text-[var(--content-heading)] sm:text-3xl">
                  Lịch sử đơn hàng
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-[var(--content-muted)]">
                  Theo dõi các giao dịch Pro, trạng thái thanh toán và thời hạn xử lý của từng đơn.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[rgba(27,38,50,0.12)] bg-white px-4 text-sm font-bold text-[var(--content-heading)] shadow-sm transition hover:border-[rgba(255,146,21,0.36)] hover:text-[var(--accent-gold)] disabled:cursor-wait disabled:opacity-70"
            >
              <ArrowClockwiseIcon size={16} className={isFetching ? "animate-spin" : ""} />
              Làm mới
            </button>
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-3">
          <SummaryCard label="Tổng đơn" value={isLoading ? "--" : summary.total.toString()} icon={<ReceiptIcon size={20} />} />
          <SummaryCard label="Đã thanh toán" value={isLoading ? "--" : summary.paid.toString()} icon={<CheckCircleIcon size={20} />} />
          <SummaryCard label="Đang chờ" value={isLoading ? "--" : summary.pending.toString()} icon={<HourglassIcon size={20} />} />
        </div>

        {isError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-center text-sm font-medium text-rose-700">
            Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.
          </div>
        )}

        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => <SkeletonRow key={index} />)
            : data && data.length > 0
              ? data.map((item, index) => <HistoryRow key={item.orderId} item={item} index={index} />)
              : !isLoading && (
                  <div className="rounded-lg border border-dashed border-[rgba(27,38,50,0.18)] bg-white/60 p-10 text-center">
                    <div className="mx-auto grid size-14 place-items-center rounded-lg bg-[rgba(255,146,21,0.12)] text-[var(--accent-gold)]">
                      <ReceiptIcon size={30} weight="duotone" />
                    </div>
                    <h2 className="mt-4 text-lg font-bold text-[var(--content-heading)]">
                      Chưa có đơn hàng nào
                    </h2>
                    <p className="mt-1 text-sm text-[var(--content-muted)]">
                      Khi bạn nâng cấp Pro, thông tin thanh toán sẽ xuất hiện tại đây.
                    </p>
                  </div>
                )}
        </div>

        {summary.total > 0 && (
          <div className="rounded-lg border border-[rgba(27,38,50,0.1)] bg-[rgba(27,38,50,0.04)] px-4 py-3 text-sm text-[var(--content-muted)]">
            Tổng giá trị đã thanh toán:{" "}
            <span className="font-bold text-[var(--content-heading)]">
              {formatCurrency(summary.totalPaid)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
