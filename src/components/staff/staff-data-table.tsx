"use client";

import * as React from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { FetchingBar } from "@/components/commons/fetching-indicator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type StaffDataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  emptyMessage?: string;
  className?: string;
  isLoading?: boolean;
  /** Dang tai lai (doi bo loc / trang) khi van con du lieu cu: thanh chay ngang o mep tren. */
  isFetching?: boolean;
  onRowClick?: (row: TData) => void;
};

function sortByPublishedStatus<TData>(data: TData[], desc: boolean) {
  return data
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const aValue = (a.item as { isPublished?: boolean }).isPublished ? 1 : 0;
      const bValue = (b.item as { isPublished?: boolean }).isPublished ? 1 : 0;
      const statusOrder = desc ? bValue - aValue : aValue - bValue;
      return statusOrder || a.index - b.index;
    })
    .map(({ item }) => item);
}

function getStickyColumnClass(columnId: string) {
  if (columnId === "title" || columnId === "name") {
    return "sticky left-0 z-20 border-r bg-inherit";
  }
  // Cot thao tac luon nhin thay khi bang cuon ngang.
  if (columnId === "actions") {
    return "sticky right-0 z-20 border-l bg-inherit";
  }

  return "";
}

export function StaffDataTable<TData>({
  columns,
  data,
  emptyMessage = "Không có dữ liệu phù hợp.",
  className,
  isLoading = false,
  isFetching = false,
  onRowClick,
}: StaffDataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const displayData = React.useMemo(() => {
    const currentSort = sorting[0];
    if (currentSort?.id !== "isPublished") return data;

    return sortByPublishedStatus(data, currentSort.desc);
  }, [data, sorting]);

  const table = useReactTable({
    data: displayData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: sorting[0]?.id === "isPublished" ? undefined : getSortedRowModel(),
  });
  const rowModel = table.getRowModel();

  return (
    <div
      className={cn("relative rounded-lg border overflow-x-auto overflow-y-hidden bg-[var(--bg-surface)] border-border-card", className)}
    >
      <FetchingBar active={isFetching && !isLoading} />
      <Table className="min-w-max">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b border-border-card bg-[var(--bg-deep)] hover:bg-[var(--bg-deep)]">
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                const SortIcon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown;
                const isPublishStatusColumn = header.column.id === "isPublished";
                const handleSortClick = isPublishStatusColumn
                  ? () => {
                      const currentSort = sorting[0];
                      const nextSorting: SortingState =
                        currentSort?.id === "isPublished" && !currentSort.desc
                          ? [{ id: "isPublished", desc: true }]
                          : [{ id: "isPublished", desc: false }];

                      setSorting(nextSorting);
                    }
                  : header.column.getToggleSortingHandler();
                return (
                  <TableHead
                    key={header.id}
                    className={cn("h-12 px-4 border-[var(--border-default)]", getStickyColumnClass(header.column.id))}
                    aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="-ml-2 h-8 rounded-sm px-2 text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--status-neutral-bg)] hover:text-[var(--text-primary)]"
                        onClick={handleSortClick}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <SortIcon className={cn("h-3.5 w-3.5", sorted ? "text-[var(--accent-gold)]" : "opacity-50")} aria-hidden="true" />
                      </Button>
                    ) : (
                      <span
                        className="text-[13px] font-semibold text-[var(--text-secondary)]"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </span>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-28 text-content-muted"
              >
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-gold)]" />
                  <span className="text-xs font-medium">Đang tải dữ liệu...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : rowModel.rows.length ? (
            rowModel.rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  "bg-[var(--bg-surface)] border-b border-[var(--border-default)] last:border-b-0 hover:bg-[var(--bg-elevated)]!",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn("px-4 py-3 border-[var(--border-default)]", getStickyColumnClass(cell.column.id))}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-28 text-center text-content-muted"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
