"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Building2, Loader2, Plus } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NoResults, TableEmpty, TablePagination, TableSkeleton } from "@/components/saas/accounts-table";
import { ErrorRetry, PackageCell, SchoolStatusPill, useDebouncedValue } from "@/components/saas/admin-school-shared";
import { Panel, SaasShell, SearchInput, TokenBar, formatNumber } from "@/components/saas/saas-ui";
import { ROUTES } from "@/constants/routes";
import { apiErrorMessage, useApiSchools } from "@/features/saas/hooks-api";
import { formatDateTime, schoolPool } from "@/features/saas/admin-schools";
import type { ApiSchool } from "@/services/school.service";
import { cn } from "@/lib/utils/cn";

/** System Admin: schools on the Enterprise package (`GET /admin/schools`, server-side search / paging / sort). */
export default function AdminSchoolsPage() {
  return (
    <SaasShell
      live
      title="Gói trường học"
      description="Các trường dùng gói Enterprise theo năm học (01/09 – 31/05): quỹ token chung, gia hạn, nạp thêm và tài khoản quản trị trường."
      fallback={<TableSkeleton rows={8} cols={7} />}
    >
      <SchoolsContent />
    </SaasShell>
  );
}

type SortBy = "createdAt" | "name" | "schoolCode" | "totalSchoolTokenQuota";
type SortDirection = "asc" | "desc";

const PAGE_SIZES = [10, 20, 50];
const STICKY = "sticky left-0 z-10 bg-[var(--bg-surface)]";

function SortHeader({
  label,
  column,
  sortBy,
  direction,
  onSort,
}: {
  label: string;
  column: SortBy;
  sortBy: SortBy;
  direction: SortDirection;
  onSort: (c: SortBy) => void;
}) {
  const active = sortBy === column;
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={cn(
        "-ml-1.5 inline-flex h-8 items-center gap-1 rounded-[2px] px-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors hover:bg-[var(--status-neutral-bg)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]",
        active ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]",
      )}
    >
      {label}
      {active ? (
        direction === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
      )}
    </button>
  );
}

const PlainHeader = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{children}</span>
);

function SchoolsContent() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);
  const [sortBy, setSortBy] = React.useState<SortBy>("createdAt");
  const [direction, setDirection] = React.useState<SortDirection>("desc");

  // Back to the first page whenever the query changes.
  const [lastSearch, setLastSearch] = React.useState(debouncedSearch);
  if (debouncedSearch !== lastSearch) {
    setLastSearch(debouncedSearch);
    setPage(0);
  }

  const params = { search: debouncedSearch || undefined, page, size, sortBy, sortDirection: direction };
  const { data, isLoading, isError, error, refetch, isFetching, isPlaceholderData } = useApiSchools(params);

  // Keep the page in range if the total shrank (e.g. another admin's change).
  const totalPages = data?.totalPages ?? 1;
  if (data && !isPlaceholderData && page > 0 && page > totalPages - 1) setPage(Math.max(0, totalPages - 1));

  function onSort(column: SortBy) {
    if (column === sortBy) setDirection((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(column);
      // Dates and token pools read best largest/newest first; names and codes A → Z.
      setDirection(column === "createdAt" || column === "totalSchoolTokenQuota" ? "desc" : "asc");
    }
    setPage(0);
  }

  const rows = data?.items ?? [];
  const total = data?.totalElements ?? 0;
  const searching = debouncedSearch !== "";
  const sortProps = { sortBy, direction, onSort };
  const ariaSort = (c: SortBy) => (sortBy === c ? (direction === "asc" ? "ascending" : "descending") : "none");
  const goTo = (s: ApiSchool) => router.push(ROUTES.STAFF.ADMIN.SCHOOL_DETAIL(s.id));

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm tên trường, mã trường, email liên hệ..." className="sm:w-[360px]" />
          <Link href={ROUTES.STAFF.ADMIN.SCHOOL_NEW} className="btn-crimson w-full sm:w-auto">
            <Plus className="h-4 w-4" aria-hidden="true" /> Thêm trường
          </Link>
        </div>

        {!isLoading && !isError && (
          <p className="flex items-center gap-2 text-sm text-content-muted" aria-live="polite">
            {searching ? `${formatNumber(total)} trường khớp “${debouncedSearch}”` : `${formatNumber(total)} trường`}
            {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent-gold)]" aria-label="Đang cập nhật" />}
          </p>
        )}

        {isLoading ? (
          <TableSkeleton rows={size > 10 ? 10 : size} cols={7} />
        ) : isError ? (
          <ErrorRetry
            title="Không tải được danh sách trường"
            message={apiErrorMessage(error, "Máy chủ không phản hồi. Kiểm tra kết nối rồi thử lại.")}
            onRetry={() => void refetch()}
            retrying={isFetching}
          />
        ) : (
          <div className="space-y-3">
            <div
              className={cn(
                "overflow-x-auto rounded-[2px] border-y border-[var(--text-primary)] bg-[var(--bg-surface)] transition-opacity",
                isPlaceholderData && "opacity-60",
              )}
              aria-busy={isFetching}
            >
              <Table className="min-w-max">
                <caption className="sr-only">Danh sách trường trên gói trường học</caption>
                <TableHeader>
                  <TableRow className="border-b border-[var(--border-strong)] hover:bg-transparent">
                    <TableHead className={cn("px-3", STICKY, "z-20")} aria-sort={ariaSort("name")}>
                      <SortHeader label="Trường" column="name" {...sortProps} />
                    </TableHead>
                    <TableHead className="px-3" aria-sort={ariaSort("schoolCode")}>
                      <SortHeader label="Mã trường" column="schoolCode" {...sortProps} />
                    </TableHead>
                    <TableHead className="px-3">
                      <PlainHeader>Gói</PlainHeader>
                    </TableHead>
                    <TableHead className="px-3" aria-sort={ariaSort("totalSchoolTokenQuota")}>
                      <SortHeader label="Quỹ token đã phân bổ" column="totalSchoolTokenQuota" {...sortProps} />
                    </TableHead>
                    <TableHead className="px-3">
                      <PlainHeader>Liên hệ</PlainHeader>
                    </TableHead>
                    <TableHead className="px-3" aria-sort={ariaSort("createdAt")}>
                      <SortHeader label="Ngày tạo" column="createdAt" {...sortProps} />
                    </TableHead>
                    <TableHead className="px-3">
                      <PlainHeader>Trạng thái</PlainHeader>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="p-0">
                        {searching ? (
                          <NoResults onReset={() => setSearch("")} message={`Không có trường nào khớp “${debouncedSearch}”.`} />
                        ) : (
                          <TableEmpty
                            icon={Building2}
                            title="Chưa có trường nào"
                            description="Thêm trường đầu tiên cùng tài khoản quản trị trường."
                            action={
                              <Link href={ROUTES.STAFF.ADMIN.SCHOOL_NEW} className="btn-crimson">
                                <Plus className="h-4 w-4" aria-hidden="true" /> Thêm trường
                              </Link>
                            }
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((s) => {
                      const pool = schoolPool(s);
                      return (
                        <TableRow
                          key={s.id}
                          onClick={() => goTo(s)}
                          className="cursor-pointer border-b border-[var(--border-default)] last:border-b-0 hover:bg-[var(--status-neutral-bg)]"
                        >
                          <TableCell className={cn("px-3 py-2.5", STICKY)}>
                            <div className="min-w-[180px] max-w-[280px] whitespace-normal">
                              <Link
                                href={ROUTES.STAFF.ADMIN.SCHOOL_DETAIL(s.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="text-sm font-semibold leading-snug text-content-heading hover:text-[var(--accent-gold)]"
                              >
                                {s.name}
                              </Link>
                              {s.address && <p className="truncate text-xs text-content-muted" title={s.address}>{s.address}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-2.5">
                            <span className="font-mono text-xs">{s.schoolCode}</span>
                          </TableCell>
                          <TableCell className="px-3 py-2.5">
                            <PackageCell pkg={s.packageType} />
                          </TableCell>
                          <TableCell className="px-3 py-2.5">
                            <div className="w-40 space-y-1">
                              <p className="text-sm tabular-nums">
                                {formatNumber(pool.allocated)}
                                <span className="text-content-muted"> / {formatNumber(pool.total)}</span>
                              </p>
                              <TokenBar used={pool.allocated} quota={pool.total} className="h-1.5" />
                              <p className="text-[11px] text-content-muted">Còn {formatNumber(pool.unallocated)} chưa phân bổ</p>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-2.5">
                            <div className="max-w-[220px] text-sm">
                              <p className="truncate" title={s.contactEmail}>
                                {s.contactEmail}
                              </p>
                              <p className="text-xs tabular-nums text-content-muted">{s.contactPhone || "—"}</p>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-2.5">
                            <span className="whitespace-nowrap text-xs tabular-nums">{formatDateTime(s.createdAt)}</span>
                          </TableCell>
                          <TableCell className="px-3 py-2.5">
                            <SchoolStatusPill status={s.status} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            {total > 0 && (
              <TablePagination
                pageIndex={page}
                pageSize={size}
                total={total}
                pageSizeOptions={PAGE_SIZES}
                onPageChange={setPage}
                onPageSizeChange={(n) => {
                  setSize(n);
                  setPage(0);
                }}
              />
            )}
          </div>
        )}
      </Panel>

    </div>
  );
}
