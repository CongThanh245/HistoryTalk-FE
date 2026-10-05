"use client";

import { useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Timer,
  Hourglass,
  Search,
  Package,
  Receipt,
  ShieldCheck,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";
import { queryKeys } from "@/shared/query-key";
import { paymentService, type PaymentHistoryItem } from "@/services/payment.service";
import { adminDashboardService } from "@/services/admin.dashboard.service";
import { StaffShell } from "@/components/staff/staff-shell";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { StaffStatCard, StaffStatsGrid } from "@/components/staff/staff-stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 20;

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
      icon: <CheckCircle2 size={13} />,
      classes: "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]",
    },
    CANCELLED: {
      label: "Đã hủy",
      icon: <XCircle size={13} />,
      classes: "border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--accent-danger)]",
    },
    PENDING: {
      label: "Chờ thanh toán",
      icon: <Hourglass size={13} />,
      classes: "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
    },
  } as const;

  return (
    map[normalized as keyof typeof map] ?? {
      label: status,
      icon: <Timer size={13} />,
      classes: "border-[var(--status-neutral-border)] bg-[var(--status-neutral-bg)] text-[var(--text-secondary)]",
    }
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = getStatusConfig(status);

  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-[2px] border px-2 text-[10px] font-bold uppercase tracking-[0.1em] ${cfg.classes}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

const LEDGER_GRID =
  "md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_150px_150px] md:items-center md:gap-4";

function LedgerHeader() {
  return (
    <div
      className={`hidden border-b border-[var(--text-primary)] bg-[var(--bg-elevated)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)] sm:px-5 ${LEDGER_GRID}`}
    >
      <span>Đơn hàng</span>
      <span>Thời gian</span>
      <span>Trạng thái</span>
      <span className="text-right">Số tiền</span>
    </div>
  );
}

function HistoryRow({ item, index }: { item: PaymentHistoryItem; index: number }) {
  const paid = item.status.toUpperCase() === "PAID";
  const pending = item.status.toUpperCase() === "PENDING";

  return (
    <article
      className={`group relative px-4 py-4 transition-colors duration-150 hover:bg-[var(--bg-elevated)] sm:px-5 animate-in fade-in slide-in-from-bottom-2 ${LEDGER_GRID}`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="absolute inset-y-0 left-0 w-[3px] bg-transparent transition-colors group-hover:bg-[var(--accent-gold)]" />

      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-[2px] border border-[var(--border-strong)] text-[var(--gold-on-light)]">
          <Package size={17} />
        </span>
        <div className="min-w-0">
          <h2 className="archive-title is-plain truncate text-[17px]">{item.tierTitle}</h2>
          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
            Mã đơn{" "}
            <span className="font-mono font-semibold text-[var(--text-secondary)]">#{item.orderCode}</span>
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-1.5 text-xs text-[var(--text-tertiary)] md:mt-0">
        <div className="inline-flex items-center gap-2">
          <CalendarDays size={14} className="shrink-0 text-[var(--text-muted)]" />
          Tạo lúc {formatDate(item.createdAt)}
        </div>
        <div className="inline-flex items-center gap-2">
          <ShieldCheck
            size={14}
            className={`shrink-0 ${paid ? "text-[var(--status-success)]" : "text-[var(--text-muted)]"}`}
          />
          {paid ? `Thanh toán ${formatDate(item.paidAt)}` : `Hết hạn ${formatDate(item.expiredAt)}`}
        </div>
        {item.userName && (
          <div className="inline-flex min-w-0 items-center gap-2">
            <User size={14} className="shrink-0 text-[var(--text-muted)]" />
            <span className="truncate font-medium text-[var(--text-primary)]">{item.userName}</span>
            {item.userEmail && <span className="truncate text-[var(--text-muted)]">· {item.userEmail}</span>}
          </div>
        )}
      </div>

      <div className="mt-3 md:mt-0">
        <StatusBadge status={item.status} />
      </div>

      <div className="mt-3 flex items-end justify-between gap-4 border-t border-dashed border-[var(--border-default)] pt-3 md:mt-0 md:block md:border-t-0 md:pt-0 md:text-right">
        <p className="font-display text-xl font-extrabold leading-none tabular-nums text-[var(--text-primary)]">
          {formatCurrency(item.amount)}
        </p>
        <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
          {pending ? "Đang chờ xác nhận" : "Gói Pro HistoryTalk"}
        </p>
      </div>
    </article>
  );
}

function SkeletonRow() {
  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="flex animate-pulse gap-4">
        <div className="size-9 rounded-[2px] bg-[var(--bg-deep)]" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-1/3 rounded-[2px] bg-[var(--bg-deep)]" />
          <div className="h-3 w-1/2 rounded-[2px] bg-[var(--bg-elevated)]" />
        </div>
        <div className="hidden w-28 space-y-3 sm:block">
          <div className="h-5 rounded-[2px] bg-[var(--bg-deep)]" />
          <div className="h-3 rounded-[2px] bg-[var(--bg-elevated)]" />
        </div>
      </div>
    </div>
  );
}

const OUTLINE_BUTTON =
  "rounded-[2px] border-[var(--text-primary)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]";

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
    <div className="flex flex-col gap-4 border-b border-[var(--text-primary)] pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h2 className="archive-title text-xl">Danh sách giao dịch</h2>
        <p className="text-sm text-[var(--text-tertiary)]">
          Hiển thị {count} giao dịch trên trang này · Tổng {total} giao dịch
          {isFetching && <span className="ml-2 text-xs opacity-60">Đang cập nhật...</span>}
        </p>
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm mã đơn, email, người dùng..."
            className="h-10 rounded-[2px] border pl-10 bg-[var(--bg-main)] border-[var(--border-strong)] text-[var(--text-primary)] focus-visible:border-[var(--text-primary)]"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onRefresh}
          disabled={isFetching}
          className={`h-10 ${OUTLINE_BUTTON}`}
        >
          <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          Làm mới
        </Button>
      </div>
    </div>
  );
}

function PaginationBar({
  page,
  totalPages,
  hasPrevious,
  hasNext,
  isFetching,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  isFetching: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 border-t border-[var(--border-default)] pt-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
        Trang {page + 1}/{totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={!hasPrevious || isFetching}
          className={`h-9 px-3 ${OUTLINE_BUTTON}`}
        >
          <ArrowLeft size={14} />
          Trước
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onNext}
          disabled={!hasNext || isFetching}
          className={`h-9 px-3 ${OUTLINE_BUTTON}`}
        >
          Sau
          <ArrowRight size={14} />
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
  const [page, setPage] = useState(0);

  const adminQuery = useQuery({
    queryKey: queryKeys.payments.history({ page, size: PAGE_SIZE }),
    queryFn: () => paymentService.getHistory({ page, size: PAGE_SIZE }),
    enabled: isAdmin,
    placeholderData: keepPreviousData,
  });

  const customerQuery = useQuery({
    queryKey: ["payments", "me"],
    queryFn: () => paymentService.getMyHistory(),
    enabled: !isAdmin,
  });

  // Aggregate stats must come from the backend, not the current page of results —
  // the table only ever holds one page, so totals computed from it would be wrong.
  const revenueQuery = useQuery({
    queryKey: ["admin", "dashboard", "revenue", undefined],
    queryFn: () => adminDashboardService.getRevenueAnalytics(),
    enabled: isAdmin,
  });

  const paymentAnalyticsQuery = useQuery({
    queryKey: ["admin", "dashboard", "payments", undefined],
    queryFn: () => adminDashboardService.getPaymentAnalytics(),
    enabled: isAdmin,
  });

  const { data, isLoading, isError, refetch, isFetching } = isAdmin ? adminQuery : customerQuery;

  const adminPage = data as import("@/services/payment.service").PaymentHistoryPage | undefined;

  // Derived from totalElements + the page/size we requested rather than the
  // backend's hasNext/hasPrevious/totalPages flags, which have been observed
  // to report stale/incorrect values (e.g. hasNext=false with more rows left).
  const adminTotalElements = adminPage?.totalElements ?? 0;
  const adminTotalPages = adminTotalElements > 0 ? Math.ceil(adminTotalElements / PAGE_SIZE) : 0;
  const adminHasPrevious = page > 0;
  const adminHasNext = (page + 1) * PAGE_SIZE < adminTotalElements;

  const items = useMemo(() => {
    if (isAdmin) {
      return adminPage?.content ?? [];
    }

    return (data as import("@/services/payment.service").PaymentHistoryItem[] | undefined) ?? [];
  }, [data, adminPage, isAdmin]);

  const summary = useMemo(() => {
    if (isAdmin) {
      return {
        total: paymentAnalyticsQuery.data?.summary.totalOrders ?? adminPage?.totalElements ?? 0,
        paid: paymentAnalyticsQuery.data?.summary.paidOrders ?? 0,
        pending: paymentAnalyticsQuery.data?.summary.pendingOrders ?? 0,
        totalPaid: revenueQuery.data?.summary.totalRevenue ?? 0,
      };
    }

    const paidItems = items.filter((item) => item.status.toUpperCase() === "PAID");
    const pendingItems = items.filter((item) => item.status.toUpperCase() === "PENDING");
    const totalPaid = paidItems.reduce((sum, item) => sum + item.amount, 0);

    return {
      total: items.length,
      paid: paidItems.length,
      pending: pendingItems.length,
      totalPaid,
    };
  }, [items, isAdmin, adminPage, paymentAnalyticsQuery.data, revenueQuery.data]);

  const statsLoading = isAdmin
    ? paymentAnalyticsQuery.isLoading || revenueQuery.isLoading
    : isLoading;

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
            <p className="font-mono text-sm font-bold text-[var(--text-primary)]">
              #{row.original.orderCode}
            </p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">{row.original.tierTitle}</p>
          </div>
        ),
      },
      {
        accessorKey: "userEmail",
        header: "Khách hàng",
        cell: ({ row }) => (
          <div className="min-w-[220px]">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {row.original.userName || "Chưa có tên"}
            </p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              {row.original.userEmail || "Chưa có email"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: "Giá trị",
        cell: ({ row }) => (
          <span className="font-display text-base font-extrabold tabular-nums text-[var(--text-primary)]">
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
          <span className="text-xs text-[var(--text-tertiary)]">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: "paidAt",
        header: "Thanh toán",
        cell: ({ row }) => (
          <span className="text-xs text-[var(--text-tertiary)]">
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
        icon={Receipt}
        accent="var(--accent-gold)"
      >
        <div className="space-y-6">
          <StaffStatsGrid>
            <StaffStatCard
              label="Doanh thu đã thu"
              value={statsLoading ? "--" : formatCurrency(summary.totalPaid)}
              icon={<TrendingUp size={20} />}
              tone="gold"
            />
            <StaffStatCard
              label="Tổng giao dịch"
              value={statsLoading ? "--" : summary.total.toString()}
              icon={<Receipt size={20} />}
              tone="blue"
            />
            <StaffStatCard
              label="Đã thanh toán"
              value={statsLoading ? "--" : summary.paid.toString()}
              icon={<CheckCircle2 size={20} />}
              tone="green"
            />
            <StaffStatCard
              label="Đang chờ"
              value={statsLoading ? "--" : summary.pending.toString()}
              icon={<Hourglass size={20} />}
              tone="amber"
            />
          </StaffStatsGrid>

          {isError && (
            <div className="rounded-[2px] border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-4 text-sm font-medium text-[var(--accent-danger)]">
              Không thể tải lịch sử giao dịch. Vui lòng thử lại sau.
            </div>
          )}

          <section className="space-y-5 rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] p-5 sm:p-6">
            <AdminToolbar
              search={search}
              onSearchChange={setSearch}
              onRefresh={() => {
                refetch();
                if (isAdmin) {
                  revenueQuery.refetch();
                  paymentAnalyticsQuery.refetch();
                }
              }}
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
            <PaginationBar
              page={page}
              totalPages={adminTotalPages}
              hasPrevious={adminHasPrevious}
              hasNext={adminHasNext}
              isFetching={isFetching}
              onPrevious={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </section>
        </div>
      </StaffShell>
    );
  }

  const customerStats = [
    { label: "Tổng đơn", value: summary.total, icon: <Receipt size={14} />, tone: "text-[var(--text-muted)]" },
    { label: "Đã thanh toán", value: summary.paid, icon: <CheckCircle2 size={14} />, tone: "text-[var(--status-success)]" },
    { label: "Đang chờ", value: summary.pending, icon: <Hourglass size={14} />, tone: "text-[var(--status-warning)]" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="archive-heading flex-col items-start sm:flex-row sm:items-end animate-in fade-in slide-in-from-bottom-2">
        <div className="min-w-0">
          <h1 className="archive-title">Lịch sử đơn hàng</h1>
          <p className="max-w-2xl">
            Theo dõi các giao dịch Pro, trạng thái thanh toán và thời hạn xử lý của từng đơn.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-line shrink-0 disabled:cursor-wait disabled:opacity-70"
        >
          <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
          Làm mới
        </button>
      </header>

      <dl className="grid grid-cols-3 rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)]">
        {customerStats.map((stat, i) => (
          <div
            key={stat.label}
            className={`min-w-0 px-3 py-4 sm:px-5 ${i > 0 ? "border-l border-[var(--border-default)]" : ""}`}
          >
            <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
              <span className={`shrink-0 ${stat.tone}`}>{stat.icon}</span>
              <span className="truncate">{stat.label}</span>
            </dt>
            <dd className="mt-2 font-display text-3xl font-extrabold leading-none tabular-nums text-[var(--text-primary)]">
              {isLoading ? "--" : stat.value}
            </dd>
          </div>
        ))}
      </dl>

      {isError && (
        <div className="rounded-[2px] border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-4 text-center text-sm font-medium text-[var(--accent-danger)]">
          Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.
        </div>
      )}

      {isLoading || items.length > 0 ? (
        <div className="overflow-hidden rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)]">
          <LedgerHeader />
          <div className="divide-y divide-[var(--border-default)]">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => <SkeletonRow key={index} />)
              : items.map((item, index) => <HistoryRow key={item.orderId} item={item} index={index} />)}
          </div>

          {items.length > 0 && (
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-[var(--text-primary)] bg-[var(--bg-elevated)] px-4 py-3 sm:px-5">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                Tổng đơn hàng: {summary.total} &nbsp;·&nbsp; Đã thanh toán
              </span>
              <span className="font-display text-xl font-extrabold tabular-nums text-[var(--text-primary)]">
                {formatCurrency(summary.totalPaid)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-[2px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] p-10 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-[2px] bg-[var(--accent-gold-active-bg)] text-[var(--gold-on-light)]">
            <Receipt size={28} />
          </div>
          <h2 className="archive-title mt-4 text-xl">Chưa có giao dịch nào</h2>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Chưa có giao dịch thanh toán nào trong hệ thống.
          </p>
        </div>
      )}
    </div>
  );
}
