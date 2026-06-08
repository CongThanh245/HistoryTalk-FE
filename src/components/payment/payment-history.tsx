"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowClockwiseIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  HourglassIcon,
  MagnifyingGlassIcon,
  PackageIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  TrendUpIcon,
  UserIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { queryKeys } from "@/shared/query-key";
import { paymentService, type PaymentHistoryItem } from "@/services/payment.service";
import { StaffShell } from "@/components/staff/staff-shell";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { StaffStatCard, StaffStatsGrid } from "@/components/staff/staff-stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      classes: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    },
    CANCELLED: {
      label: "Đã hủy",
      icon: <XCircleIcon size={14} weight="fill" />,
      classes: "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300",
    },
    PENDING: {
      label: "Chờ thanh toán",
      icon: <HourglassIcon size={14} weight="fill" />,
      classes: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-300",
    },
  } as const;

  return (
    map[normalized as keyof typeof map] ?? {
      label: status,
      icon: <ClockCountdownIcon size={14} weight="fill" />,
      classes: "border-slate-500/25 bg-slate-500/10 text-slate-600 dark:text-slate-300",
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
            {item.userName && (
              <div className="inline-flex items-center gap-2 sm:col-span-2">
                <UserIcon size={15} className="text-[var(--content-subtle)]" />
                <span className="font-medium text-[var(--content-heading)]">{item.userName}</span>
                {item.userEmail && <span className="text-[var(--content-subtle)]">· {item.userEmail}</span>}
              </div>
            )}
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

function AdminToolbar({
  search,
  onSearchChange,
  onRefresh,
  isFetching,
  count,
  total,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  isFetching: boolean;
  count: number;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold text-[var(--content-heading)]">
          Danh sách giao dịch
        </h2>
        <p className="text-sm text-[var(--content-muted)]">
          Hiển thị {count}/{total} giao dịch
          {isFetching && <span className="ml-2 text-xs opacity-60">Đang cập nhật...</span>}
        </p>
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-[320px]">
          <MagnifyingGlassIcon
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--content-subtle)" }}
          />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm mã đơn, email, người dùng..."
            className="h-10 rounded-xl border pl-10"
            style={{
              background: "rgba(27,38,50,0.05)",
              borderColor: "var(--card-light-border)",
              color: "var(--content-heading)",
            }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onRefresh}
          disabled={isFetching}
          className="h-10 rounded-xl"
          style={{ borderColor: "var(--card-light-border)" }}
        >
          <ArrowClockwiseIcon size={16} className={isFetching ? "animate-spin" : ""} />
          Làm mới
        </Button>
      </div>
    </div>
  );
}

interface PaymentHistoryProps {
  variant?: "admin" | "customer";
}

export default function PaymentHistory({ variant = "customer" }: PaymentHistoryProps) {
  const isAdmin = variant === "admin";
  const [search, setSearch] = useState("");

  const adminQuery = useQuery({
    queryKey: queryKeys.payments.history,
    queryFn: () => paymentService.getHistory(),
    enabled: isAdmin,
  });

  const customerQuery = useQuery({
    queryKey: ["payments", "me"],
    queryFn: () => paymentService.getMyHistory(),
    enabled: !isAdmin,
  });

  const { data, isLoading, isError, refetch, isFetching } = isAdmin ? adminQuery : customerQuery;

  const items = useMemo(() => {
    if (isAdmin) {
      return (data as import("@/services/payment.service").PaymentHistoryPage | undefined)?.content ?? [];
    }

    return (data as import("@/services/payment.service").PaymentHistoryItem[] | undefined) ?? [];
  }, [data, isAdmin]);

  const summary = useMemo(() => {
    const paidItems = items.filter((item) => item.status.toUpperCase() === "PAID");
    const pendingItems = items.filter((item) => item.status.toUpperCase() === "PENDING");
    const totalPaid = paidItems.reduce((sum, item) => sum + item.amount, 0);

    return {
      total: isAdmin
        ? ((data as import("@/services/payment.service").PaymentHistoryPage | undefined)?.totalElements ?? items.length)
        : items.length,
      paid: paidItems.length,
      pending: pendingItems.length,
      totalPaid,
    };
  }, [data, items, isAdmin]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) =>
      [
        item.orderCode.toString(),
        item.tierTitle,
        item.status,
        item.userName,
        item.userEmail,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    );
  }, [items, search]);

  const adminColumns = useMemo<ColumnDef<PaymentHistoryItem>[]>(
    () => [
      {
        accessorKey: "orderCode",
        header: "Đơn hàng",
        cell: ({ row }) => (
          <div className="min-w-[180px]">
            <p className="font-mono text-sm font-bold text-[var(--content-heading)]">
              #{row.original.orderCode}
            </p>
            <p className="mt-1 text-xs text-[var(--content-muted)]">{row.original.tierTitle}</p>
          </div>
        ),
      },
      {
        accessorKey: "userEmail",
        header: "Khách hàng",
        cell: ({ row }) => (
          <div className="min-w-[220px]">
            <p className="text-sm font-semibold text-[var(--content-heading)]">
              {row.original.userName || "Chưa có tên"}
            </p>
            <p className="mt-1 text-xs text-[var(--content-muted)]">
              {row.original.userEmail || "Chưa có email"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: "Giá trị",
        cell: ({ row }) => (
          <span className="font-semibold text-[var(--content-heading)]">
            {formatCurrency(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: "Ngày tạo",
        cell: ({ row }) => (
          <span className="text-xs text-[var(--content-muted)]">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: "paidAt",
        header: "Thanh toán",
        cell: ({ row }) => (
          <span className="text-xs text-[var(--content-muted)]">
            {row.original.paidAt ? formatDate(row.original.paidAt) : "Chưa thanh toán"}
          </span>
        ),
      },
    ],
    []
  );

  if (isAdmin) {
    return (
      <StaffShell
        title="Lịch sử giao dịch"
        description="Theo dõi doanh thu, trạng thái thanh toán và các giao dịch trong hệ thống."
        icon={ReceiptIcon}
        accent="var(--accent-gold)"
      >
        <div className="space-y-6">
          <StaffStatsGrid>
            <StaffStatCard
              label="Doanh thu đã thu"
              value={isLoading ? "--" : formatCurrency(summary.totalPaid)}
              icon={<TrendUpIcon size={20} />}
              tone="gold"
            />
            <StaffStatCard
              label="Tổng giao dịch"
              value={isLoading ? "--" : summary.total.toString()}
              icon={<ReceiptIcon size={20} />}
              tone="blue"
            />
            <StaffStatCard
              label="Đã thanh toán"
              value={isLoading ? "--" : summary.paid.toString()}
              icon={<CheckCircleIcon size={20} />}
              tone="green"
            />
            <StaffStatCard
              label="Đang chờ"
              value={isLoading ? "--" : summary.pending.toString()}
              icon={<HourglassIcon size={20} />}
              tone="amber"
            />
          </StaffStatsGrid>

          {isError && (
            <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm font-medium text-rose-600 dark:text-rose-300">
              Không thể tải lịch sử giao dịch. Vui lòng thử lại sau.
            </div>
          )}

          <section
            className="space-y-5 rounded-2xl border p-5 sm:p-6"
            style={{
              background: "var(--card-light-bg)",
              borderColor: "var(--card-light-border)",
            }}
          >
            <AdminToolbar
              search={search}
              onSearchChange={setSearch}
              onRefresh={() => refetch()}
              isFetching={isFetching}
              count={filteredItems.length}
              total={summary.total}
            />
            <StaffDataTable
              columns={adminColumns}
              data={filteredItems}
              isLoading={isLoading}
              emptyMessage="Không tìm thấy giao dịch phù hợp."
            />
          </section>
        </div>
      </StaffShell>
    );
  }

  return (
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

      <StaffStatsGrid className="md:grid-cols-3 xl:grid-cols-3">
        <StaffStatCard label="Tổng đơn" value={isLoading ? "--" : summary.total.toString()} icon={<ReceiptIcon size={20} />} />
        <StaffStatCard label="Đã thanh toán" value={isLoading ? "--" : summary.paid.toString()} icon={<CheckCircleIcon size={20} />} tone="green" />
        <StaffStatCard label="Đang chờ" value={isLoading ? "--" : summary.pending.toString()} icon={<HourglassIcon size={20} />} tone="amber" />
      </StaffStatsGrid>

      {isError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-center text-sm font-medium text-rose-700">
          Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.
        </div>
      )}

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => <SkeletonRow key={index} />)
          : items.length > 0
            ? items.map((item, index) => <HistoryRow key={item.orderId} item={item} index={index} />)
            : !isLoading && (
                <div className="rounded-lg border border-dashed border-[rgba(27,38,50,0.18)] bg-white/60 p-10 text-center">
                  <div className="mx-auto grid size-14 place-items-center rounded-lg bg-[rgba(255,146,21,0.12)] text-[var(--accent-gold)]">
                    <ReceiptIcon size={30} weight="duotone" />
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-[var(--content-heading)]">
                    Chưa có giao dịch nào
                  </h2>
                  <p className="mt-1 text-sm text-[var(--content-muted)]">
                    Chưa có giao dịch thanh toán nào trong hệ thống.
                  </p>
                </div>
              )}
      </div>

      {items.length > 0 && (
        <div className="rounded-lg border border-[rgba(27,38,50,0.1)] bg-[rgba(27,38,50,0.04)] px-4 py-3 text-sm text-[var(--content-muted)]">
          Tổng đơn hàng: {summary.total} &nbsp;·&nbsp; Đã thanh toán:{" "}
          <span className="font-bold text-[var(--content-heading)]">
            {formatCurrency(summary.totalPaid)}
          </span>
        </div>
      )}
    </div>
  );
}
