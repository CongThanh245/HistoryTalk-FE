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
import { ArrowUpDownIcon, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
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
    return "sticky left-0 z-20 border-r bg-[var(--card-light-bg)] shadow-[10px_0_18px_rgba(27,38,50,0.05)]";
  }

  return "";
}

export function StaffDataTable<TData>({
  columns,
  data,
  emptyMessage = "Không có dữ liệu phù hợp.",
  className,
  isLoading = false,
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
      className={cn("rounded-xl border overflow-x-auto overflow-y-hidden", className)}
      style={{
        background: "var(--card-light-bg)",
        borderColor: "var(--card-light-border)",
      }}
    >
      <Table className="min-w-max">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
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
                    className={cn("px-4", getStickyColumnClass(header.column.id))}
                    style={{ borderColor: "var(--card-light-border)" }}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="-ml-2 h-8 px-2 font-semibold hover:bg-black/[0.04] hover:text-[var(--content-heading)]"
                        onClick={handleSortClick}
                        style={{ color: "var(--content-heading)" }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <ArrowUpDownIcon className="h-3.5 w-3.5 opacity-70" />
                      </Button>
                    ) : (
                      <span
                        className="text-xs font-semibold tracking-wide uppercase"
                        style={{ color: "var(--content-subtle)" }}
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
                className="h-28"
                style={{ color: "var(--content-muted)" }}
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
                  "hover:bg-black/[0.025]!",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn("px-4", getStickyColumnClass(cell.column.id))}
                    style={{ borderColor: "var(--card-light-border)" }}
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
                className="h-28 text-center"
                style={{ color: "var(--content-muted)" }}
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

