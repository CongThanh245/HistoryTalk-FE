"use client";

import * as React from "react";
import {
  type ColumnDef,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  SearchX,
  type LucideIcon,
} from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StaffFormSelect } from "@/components/staff/staff-form";
import { cn } from "@/lib/utils/cn";

/* ───────────────────────── Row selection ───────────────────────── */
export interface RowSelection {
  /** Selected ids that are still in the current (filtered) data. */
  selectedIds: string[];
  isSelected: (id: string) => boolean;
  toggle: (id: string, checked: boolean) => void;
  setMany: (ids: string[], checked: boolean) => void;
  clear: () => void;
}

/** Selection pruned to the rows currently shown by the filters, so hidden rows are never acted on. */
export function useRowSelection(rowIds: string[]): RowSelection {
  const [raw, setRaw] = React.useState<Set<string>>(() => new Set());
  const visible = React.useMemo(() => new Set(rowIds), [rowIds]);
  const selectedIds = React.useMemo(() => [...raw].filter((id) => visible.has(id)), [raw, visible]);
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  return React.useMemo(
    () => ({
      selectedIds,
      isSelected: (id: string) => selectedSet.has(id),
      toggle: (id: string, checked: boolean) =>
        setRaw((prev) => {
          const next = new Set(prev);
          if (checked) next.add(id);
          else next.delete(id);
          return next;
        }),
      setMany: (ids: string[], checked: boolean) =>
        setRaw((prev) => {
          const next = new Set(prev);
          for (const id of ids) {
            if (checked) next.add(id);
            else next.delete(id);
          }
          return next;
        }),
      clear: () => setRaw(new Set()),
    }),
    [selectedIds, selectedSet],
  );
}

/* ───────────────────────── Data table ───────────────────────── */
export interface AccountsTableProps<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  data: T[];
  getRowId: (row: T) => string;
  /** Accessible name of a row (used for its checkbox), e.g. the person's name. */
  getRowLabel?: (row: T) => string;
  selection?: RowSelection;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  initialSorting?: SortingState;
  /** Changing this value (e.g. a serialized filter state) jumps back to page 1. */
  resetKey?: string;
  onRowClick?: (row: T) => void;
  /** Rendered inside the table body when `data` is empty (no results / empty state). */
  emptyContent?: React.ReactNode;
  /** Column id that sticks to the left on small screens. */
  stickyColumnId?: string;
  caption?: string;
  className?: string;
}

const STICKY = "sticky left-0 z-10 bg-[var(--bg-surface)]";

export function AccountsTable<T>({
  columns,
  data,
  getRowId,
  getRowLabel,
  selection,
  pageSizeOptions = [10, 20, 50],
  defaultPageSize = 10,
  initialSorting = [],
  resetKey,
  onRowClick,
  emptyContent,
  stickyColumnId = "name",
  caption,
  className,
}: AccountsTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: defaultPageSize });
  const [lastResetKey, setLastResetKey] = React.useState(resetKey);
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }

  // Keep the page in range when rows disappear (bulk delete, filter on a later page).
  const pageCount = Math.max(1, Math.ceil(data.length / pagination.pageSize));
  const safePagination = pagination.pageIndex > pageCount - 1 ? { ...pagination, pageIndex: pageCount - 1 } : pagination;

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => getRowId(row),
    state: { sorting, pagination: safePagination },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageRows = table.getRowModel().rows;
  const pageIds = pageRows.map((r) => r.id);
  const selectedOnPage = selection ? pageIds.filter((id) => selection.isSelected(id)).length : 0;
  const headerChecked: boolean | "indeterminate" =
    pageIds.length > 0 && selectedOnPage === pageIds.length ? true : selectedOnPage > 0 ? "indeterminate" : false;
  const colCount = table.getVisibleLeafColumns().length + (selection ? 1 : 0);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="overflow-x-auto rounded-[2px] border-y border-[var(--text-primary)] bg-[var(--bg-surface)]">
        <Table className="min-w-max">
          {caption && <caption className="sr-only">{caption}</caption>}
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="border-b border-[var(--border-strong)] hover:bg-transparent">
                {selection && (
                  <TableHead className="w-10 px-3">
                    <Checkbox
                      checked={headerChecked}
                      disabled={pageIds.length === 0}
                      onCheckedChange={(v) => selection.setMany(pageIds, v === true)}
                      aria-label="Chọn tất cả trên trang này"
                    />
                  </TableHead>
                )}
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const dir = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : canSort ? "none" : undefined}
                      className={cn("px-3", header.column.id === stickyColumnId && cn(STICKY, "z-20"))}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            "-ml-1.5 inline-flex h-8 items-center gap-1 rounded-[2px] px-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors hover:bg-[var(--status-neutral-bg)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]",
                            dir ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]",
                          )}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {dir === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : dir === "desc" ? (
                            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
                          )}
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {pageRows.length ? (
              pageRows.map((row) => {
                const checked = selection?.isSelected(row.id) ?? false;
                return (
                  <TableRow
                    key={row.id}
                    data-state={checked ? "selected" : undefined}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    className={cn(
                      "border-b border-[var(--border-default)] last:border-b-0 hover:bg-[var(--status-neutral-bg)]",
                      checked && "bg-[var(--accent-gold-active-bg)] hover:bg-[var(--accent-gold-active-bg)]",
                      onRowClick && "cursor-pointer",
                    )}
                  >
                    {selection && (
                      <TableCell className="w-10 px-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => selection.toggle(row.id, v === true)}
                          aria-label={`Chọn ${getRowLabel?.(row.original) ?? "dòng"}`}
                        />
                      </TableCell>
                    )}
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={cn("px-3 py-2.5", cell.column.id === stickyColumnId && cn(STICKY, checked && "bg-[var(--accent-gold-active-bg)]"))}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={colCount} className="p-0">
                  {emptyContent ?? <p className="py-10 text-center text-sm text-content-muted">Không có dữ liệu.</p>}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {data.length > 0 && (
        <TablePagination
          pageIndex={safePagination.pageIndex}
          pageSize={safePagination.pageSize}
          total={data.length}
          pageSizeOptions={pageSizeOptions}
          onPageChange={(i) => setPagination((p) => ({ ...p, pageIndex: i }))}
          onPageSizeChange={(size) => setPagination({ pageIndex: 0, pageSize: size })}
        />
      )}
    </div>
  );
}

/* ───────────────────────── Pagination ───────────────────────── */
function pageWindow(current: number, count: number): (number | "…")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i);
  const pages = new Set([0, count - 1, current - 1, current, current + 1].filter((p) => p >= 0 && p < count));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

const PAGE_BTN =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-[2px] border px-2 text-xs font-bold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)] disabled:pointer-events-none disabled:opacity-40";

export function TablePagination({
  pageIndex,
  pageSize,
  total,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: {
  pageIndex: number;
  pageSize: number;
  total: number;
  pageSizeOptions: number[];
  onPageChange: (index: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const count = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min(total, (pageIndex + 1) * pageSize);
  const nav = (label: string, icon: LucideIcon, target: number, disabled: boolean, className?: string) => {
    const Icon = icon;
    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        disabled={disabled}
        onClick={() => onPageChange(target)}
        className={cn(PAGE_BTN, "border-[var(--border-strong)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]", className)}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </button>
    );
  };

  return (
    <nav aria-label="Phân trang" className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-content-muted">
        <span aria-live="polite">
          Hiển thị <b className="tabular-nums text-content-heading">{from}–{to}</b> / <span className="tabular-nums">{total}</span>
        </span>
        <label className="inline-flex items-center gap-2">
          <span className="text-xs">Mỗi trang</span>
          <StaffFormSelect
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
            options={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
            className="h-9 w-[76px]"
          />
        </label>
      </div>
      {count > 1 && (
        <div className="flex flex-wrap items-center gap-1">
          {nav("Trang đầu", ChevronsLeft, 0, pageIndex === 0, "hidden sm:inline-flex")}
          {nav("Trang trước", ChevronLeft, pageIndex - 1, pageIndex === 0)}
          {pageWindow(pageIndex, count).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-content-muted" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === pageIndex ? "page" : undefined}
                aria-label={`Trang ${p + 1}`}
                className={cn(
                  PAGE_BTN,
                  p === pageIndex
                    ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
                    : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]",
                )}
              >
                {p + 1}
              </button>
            ),
          )}
          {nav("Trang sau", ChevronRight, pageIndex + 1, pageIndex >= count - 1)}
          {nav("Trang cuối", ChevronsRight, count - 1, pageIndex >= count - 1, "hidden sm:inline-flex")}
        </div>
      )}
    </nav>
  );
}

/* ───────────────────────── Row actions menu ───────────────────────── */
export interface RowAction {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  tone?: "danger" | "success";
  disabled?: boolean;
  /** Why the action is disabled (shown as a tooltip and to screen readers). */
  disabledReason?: string;
  /** Draws a separator above this item. */
  separated?: boolean;
}

export function RowActions({ label, actions }: { label: string; actions: (RowAction | false | null | undefined)[] }) {
  const items = actions.filter(Boolean) as RowAction[];
  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={label}
            title={label}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[2px] border border-transparent text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)] data-[state=open]:border-[var(--text-primary)] data-[state=open]:text-[var(--text-primary)]"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="staff-theme min-w-[220px] bg-[var(--bg-surface)] text-content-text">
          {items.map((a) => {
            const Icon = a.icon;
            return (
              <React.Fragment key={a.label}>
                {a.separated && <DropdownMenuSeparator className="bg-[var(--border-default)]" />}
                <DropdownMenuItem
                  disabled={a.disabled}
                  title={a.disabled ? a.disabledReason : undefined}
                  onSelect={() => a.onSelect()}
                  className={cn(
                    "rounded-[2px] focus:bg-[var(--status-neutral-bg)]",
                    a.tone === "danger" && "text-[var(--accent-danger)] focus:text-[var(--accent-danger)]",
                    a.tone === "success" && "text-[var(--status-success)] focus:text-[var(--status-success)]",
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 text-current" aria-hidden="true" />}
                  <span className="flex-1">{a.label}</span>
                  {a.disabled && a.disabledReason && <span className="sr-only">({a.disabledReason})</span>}
                </DropdownMenuItem>
              </React.Fragment>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* ───────────────────────── Bulk actions ───────────────────────── */
export function BulkActionBar({
  count,
  total,
  noun,
  onSelectAll,
  onClear,
  children,
}: {
  count: number;
  /** Rows matching the current filters. */
  total: number;
  noun: string;
  onSelectAll: () => void;
  onClear: () => void;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div
      role="region"
      aria-label="Thao tác hàng loạt"
      className="flex flex-col gap-3 rounded-[2px] border border-[var(--text-primary)] bg-[var(--status-neutral-bg)] px-3 py-2.5 lg:flex-row lg:items-center lg:justify-between"
    >
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm" aria-live="polite">
        <span>
          Đã chọn <b className="tabular-nums text-content-heading">{count}</b> {noun}
        </span>
        {count < total && (
          <button type="button" className="archive-link" onClick={onSelectAll}>
            Chọn tất cả {total}
          </button>
        )}
        <button type="button" className="archive-link" onClick={onClear}>
          Bỏ chọn
        </button>
      </p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function BulkButton({
  icon: Icon,
  children,
  onClick,
  tone = "default",
  disabled,
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-[2px] border bg-[var(--bg-surface)] px-3 text-xs font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)] disabled:pointer-events-none disabled:opacity-40",
        tone === "danger"
          ? "border-[var(--accent-danger)] text-[var(--accent-danger)] hover:bg-[var(--accent-danger)] hover:text-white"
          : "border-[var(--text-primary)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]",
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      {children}
    </button>
  );
}

/* ───────────────────────── Filters, empty & loading ───────────────────────── */
export function FilterBar({ children, onReset, activeCount }: { children: React.ReactNode; onReset?: () => void; activeCount?: number }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {children}
      {onReset && !!activeCount && (
        <button type="button" className="archive-link self-start sm:self-center" onClick={onReset}>
          Xóa bộ lọc ({activeCount})
        </button>
      )}
    </div>
  );
}

/** Body of an empty filtered table. */
export function NoResults({ onReset, message = "Không có kết quả phù hợp với bộ lọc." }: { onReset?: () => void; message?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <SearchX className="h-6 w-6 text-content-subtle" aria-hidden="true" />
      <p className="text-sm text-content-muted">{message}</p>
      {onReset && (
        <button type="button" className="archive-link" onClick={onReset}>
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
}

/** Body of a table with no records at all. */
export function TableEmpty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      {Icon && <Icon className="h-7 w-7 text-content-subtle" strokeWidth={1.5} aria-hidden="true" />}
      <p className="archive-title is-plain text-lg">{title}</p>
      {description && <p className="max-w-sm text-sm text-content-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="overflow-hidden border-y border-[var(--text-primary)]">
        <div className="flex gap-4 border-b border-[var(--border-strong)] px-3 py-3">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 border-b border-[var(--border-default)] px-3 py-3.5 last:border-b-0">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={cn("h-4 flex-1", c === 0 && "flex-[2]")} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton of a list page: stat cards, a filter row and the table. */
export function AccountsPageSkeleton({ stats = 4, cols = 6 }: { stats?: number; cols?: number }) {
  return (
    <div className="space-y-6" role="status" aria-label="Đang tải dữ liệu">
      {stats > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: stats }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-[2px] border border-[var(--border-strong)] p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      )}
      <div className="space-y-4 rounded-[2px] border border-[var(--border-strong)] p-4 sm:p-6">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-full sm:w-[280px]" />
          <Skeleton className="h-10 w-full sm:w-40" />
          <Skeleton className="h-10 w-full sm:w-40" />
        </div>
        <TableSkeleton cols={cols} />
      </div>
      <span className="sr-only">Đang tải dữ liệu...</span>
    </div>
  );
}
