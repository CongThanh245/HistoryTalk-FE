"use client";

import * as React from "react";
import { KeyRound, LockKeyhole, LockKeyholeOpen, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BulkActionBar,
  BulkButton,
  NoResults,
  RowActions,
  TableEmpty,
  TablePagination,
  TableSkeleton,
  useRowSelection,
} from "@/components/saas/accounts-table";
import { CredentialsDialog } from "@/components/saas/accounts-credentials";
import { todayStamp, type CredentialRecord } from "@/components/saas/accounts-utils";
import { AccountStatusBadge, Panel, SearchInput, formatDate } from "@/components/saas/saas-ui";
import { TeacherCreateDialog } from "@/components/saas/teacher-create-dialog";
import { TeacherEditDialog } from "@/components/saas/teacher-edit-dialog";
import { apiErrorMessage, useApiTeachers, useApiTokenQuota, useSetApiTeacherActive, useTeacherMutations } from "@/features/saas/hooks-api";
import { schoolService, type AccountListParams, type ApiTeacher } from "@/services/school.service";
import { cn } from "@/lib/utils/cn";
import {
  ActiveFilterTabs,
  HEAD,
  PAGE_SIZES,
  SortHeader,
  activeParam,
  ariaSort,
  runBulk,
  useServerSort,
  type ActiveFilter,
} from "../_components/account-list";
import { CopyTag, ErrorBlock, SchoolShell, useDebouncedValue } from "../_components/shared";
import { FetchingBadge, FetchingBar } from "@/components/commons/fetching-indicator";

type SortBy = "fullName" | "userName" | "email" | "createdAt";

/** School Admin: Teacher accounts (GET/POST/PUT/DELETE /school-admin/teachers, /{id}/status, /{id}/reset-password). */
export default function SchoolTeachersPage() {
  return (
    <SchoolShell
      title="Giáo viên"
      description="Tạo, sửa, khóa / mở khóa và đặt lại mật khẩu tài khoản giáo viên. Phân công giáo viên phụ trách lớp ở trang Lớp học."
    >
      <TeachersContent />
    </SchoolShell>
  );
}

function TeachersContent() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const debounced = useDebouncedValue(search.trim(), 300);
  const [filter, setFilter] = React.useState<ActiveFilter>("ALL");
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);
  const sort = useServerSort<SortBy>("createdAt", "createdAt");

  // Back to the first page when the search, filter or sort changes.
  const queryKey = `${debounced}|${filter}|${sort.sortBy}|${sort.direction}`;
  const [lastKey, setLastKey] = React.useState(queryKey);
  if (queryKey !== lastKey) {
    setLastKey(queryKey);
    setPage(0);
  }

  const params: AccountListParams = {
    search: debounced || undefined,
    active: activeParam(filter),
    page,
    size,
    sortBy: sort.sortBy,
    sortDirection: sort.direction,
  };
  const teachers = useApiTeachers(params);
  const quota = useApiTokenQuota();
  const setActive = useSetApiTeacherActive();
  const { remove, resetPassword } = useTeacherMutations();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<ApiTeacher | null>(null);
  const [lockTarget, setLockTarget] = React.useState<ApiTeacher | null>(null);
  const [resetTarget, setResetTarget] = React.useState<ApiTeacher | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ApiTeacher | null>(null);
  const [bulkLock, setBulkLock] = React.useState(false);
  const [bulkRunning, setBulkRunning] = React.useState(false);
  const [credentials, setCredentials] = React.useState<{ title: string; records: CredentialRecord[] } | null>(null);

  const data = teachers.data;
  const rows = React.useMemo(() => data?.items ?? [], [data]);
  const total = data?.totalElements ?? 0;
  const rowIds = React.useMemo(() => rows.map((t) => t.uid), [rows]);
  const selection = useRowSelection(rowIds);
  const selected = rows.filter((t) => selection.isSelected(t.uid));
  const selectedOnPage = selected.length;
  const headerChecked: boolean | "indeterminate" =
    rows.length > 0 && selectedOnPage === rows.length ? true : selectedOnPage > 0 ? "indeterminate" : false;

  // Keep the page in range after the list shrinks (e.g. a search on a later page).
  if (data && page > 0 && page >= Math.max(1, data.totalPages)) setPage(Math.max(0, data.totalPages - 1));

  const filtered = !!debounced || filter !== "ALL";

  const bulkSetActive = async (active: boolean) => {
    const targets = selected.filter((t) => t.active !== active);
    if (!targets.length) {
      toast.info(active ? "Các tài khoản đã chọn đều đang hoạt động." : "Các tài khoản đã chọn đều đã bị khóa.");
      return;
    }
    setBulkRunning(true);
    try {
      await runBulk({
        items: targets,
        run: (t) => schoolService.setTeacherActive(t.uid, active),
        name: (t) => t.fullName,
        progressLabel: active ? "Đang mở khóa" : "Đang khóa",
        doneLabel: (n) => (active ? `Đã mở khóa ${n} tài khoản giáo viên` : `Đã khóa ${n} tài khoản giáo viên`),
      });
    } finally {
      setBulkRunning(false);
      selection.clear();
      void qc.invalidateQueries({ queryKey: ["saas", "teachers"] });
    }
  };

  const doReset = (t: ApiTeacher) =>
    resetPassword.mutate(t.uid, {
      onSuccess: (r) => {
        setResetTarget(null);
        setCredentials({
          title: "Mật khẩu mới của giáo viên",
          records: [{ id: r.uid, fullName: r.fullName, login: r.email, userName: r.userName, password: r.initialPassword, roleLabel: "Giáo viên" }],
        });
      },
      onError: (error) => {
        setResetTarget(null);
        toast.error(apiErrorMessage(error, "Không đặt lại được mật khẩu. Vui lòng thử lại."));
      },
    });

  const doDelete = (t: ApiTeacher) =>
    remove.mutate(t.uid, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success(`Đã xóa tài khoản giáo viên ${t.fullName}`);
      },
      onError: (error) => {
        setDeleteTarget(null);
        toast.error(apiErrorMessage(error, "Không xóa được tài khoản. Vui lòng thử lại."));
      },
    });

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm họ tên, tên tài khoản, email..." />
          <ActiveFilterTabs value={filter} onChange={setFilter} />
          <div className="hidden flex-1 sm:block" />
          <button type="button" className="btn-crimson w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Thêm giáo viên
          </button>
        </div>

        {teachers.isPending ? (
          <TableSkeleton rows={6} cols={5} />
        ) : teachers.isError ? (
          <ErrorBlock error={teachers.error} fallback="Không tải được danh sách giáo viên." onRetry={() => void teachers.refetch()} />
        ) : (
          <>
            <p className="text-sm text-content-muted" aria-live="polite">
              <b className="tabular-nums text-content-heading">{total}</b> giáo viên
              {filter === "ACTIVE" ? " đang hoạt động" : filter === "LOCKED" ? " đã khóa" : ""}
              {debounced ? ` khớp “${debounced}”` : ""}
              <FetchingBadge active={teachers.isFetching} />
            </p>

            <BulkActionBar
              count={selectedOnPage}
              total={rows.length}
              noun="giáo viên trên trang này"
              onSelectAll={() => selection.setMany(rowIds, true)}
              onClear={selection.clear}
            >
              <BulkButton icon={LockKeyhole} tone="danger" disabled={bulkRunning} onClick={() => setBulkLock(true)}>
                Khóa
              </BulkButton>
              <BulkButton icon={LockKeyholeOpen} disabled={bulkRunning} onClick={() => void bulkSetActive(true)}>
                Mở khóa
              </BulkButton>
            </BulkActionBar>

            {rows.length === 0 ? (
              <div className="border-y border-border-card">
                {filtered ? (
                  <NoResults
                    onReset={() => {
                      setSearch("");
                      setFilter("ALL");
                    }}
                    message="Không có giáo viên phù hợp với bộ lọc."
                  />
                ) : (
                  <TableEmpty
                    icon={Users}
                    title="Chưa có giáo viên nào"
                    description="Thêm tài khoản giáo viên rồi phân công phụ trách lớp ở trang Lớp học."
                    action={
                      <button type="button" className="btn-crimson" onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4" aria-hidden="true" /> Thêm giáo viên
                      </button>
                    }
                  />
                )}
              </div>
            ) : (
              <div className={cn("relative overflow-x-auto rounded-lg border border-border-card bg-[var(--bg-surface)]", teachers.isFetching && "opacity-70")}>
                <FetchingBar active={teachers.isFetching} />
                <Table className="min-w-max">
                  <caption className="sr-only">Danh sách giáo viên</caption>
                  <TableHeader>
                    <TableRow className="border-b border-border-card">
                      <TableHead className="w-10 px-3">
                        <Checkbox
                          checked={headerChecked}
                          onCheckedChange={(v) => selection.setMany(rowIds, v === true)}
                          aria-label="Chọn tất cả giáo viên trên trang này"
                        />
                      </TableHead>
                      <TableHead className={HEAD} aria-sort={ariaSort("fullName", sort.sortBy, sort.direction)}>
                        <SortHeader label="Giáo viên" column="fullName" {...sort} />
                      </TableHead>
                      <TableHead className={HEAD} aria-sort={ariaSort("email", sort.sortBy, sort.direction)}>
                        <SortHeader label="Email đăng nhập" column="email" {...sort} />
                      </TableHead>
                      <TableHead className={HEAD} aria-sort={ariaSort("userName", sort.sortBy, sort.direction)}>
                        <SortHeader label="Tên tài khoản" column="userName" {...sort} />
                      </TableHead>
                      <TableHead className={HEAD}>Trạng thái</TableHead>
                      <TableHead className={HEAD} aria-sort={ariaSort("createdAt", sort.sortBy, sort.direction)}>
                        <SortHeader label="Ngày tạo" column="createdAt" {...sort} />
                      </TableHead>
                      <TableHead className={HEAD}>
                        <span className="sr-only">Thao tác</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((t) => {
                      const pending = setActive.isPending && setActive.variables?.id === t.uid;
                      const checked = selection.isSelected(t.uid);
                      return (
                        <TableRow
                          key={t.uid}
                          data-state={checked ? "selected" : undefined}
                          className={cn(
                            "border-b border-[var(--border-default)] last:border-b-0",
                            checked && "bg-[var(--accent-gold-active-bg)] hover:bg-[var(--accent-gold-active-bg)]",
                          )}
                        >
                          <TableCell className="w-10 px-3">
                            <Checkbox checked={checked} onCheckedChange={(v) => selection.toggle(t.uid, v === true)} aria-label={`Chọn ${t.fullName}`} />
                          </TableCell>
                          <TableCell className="px-3 py-2.5">
                            <div className="min-w-[180px] max-w-[260px]">
                              <p className="text-sm font-semibold text-content-heading">{t.fullName}</p>
                              {t.phoneNumber && <p className="text-xs tabular-nums text-content-muted">{t.phoneNumber}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[260px] truncate px-3 py-2.5 font-mono text-xs">{t.email}</TableCell>
                          <TableCell className="px-3 py-2.5">
                            <CopyTag value={t.userName} label="tên tài khoản" />
                          </TableCell>
                          <TableCell className="px-3 py-2.5">
                            <AccountStatusBadge status={t.active ? "ACTIVE" : "LOCKED"} />
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-3 py-2.5 text-xs tabular-nums text-content-muted">{formatDate(t.createdAt)}</TableCell>
                          <TableCell className="px-3 py-2.5 text-right">
                            <RowActions
                              label={`Thao tác với ${t.fullName}`}
                              actions={[
                                { label: "Sửa thông tin", icon: Pencil, onSelect: () => setEditTarget(t) },
                                { label: "Đặt lại mật khẩu", icon: KeyRound, onSelect: () => setResetTarget(t) },
                                t.active
                                  ? { label: "Khóa tài khoản", icon: LockKeyhole, disabled: pending, onSelect: () => setLockTarget(t), separated: true }
                                  : {
                                      label: "Mở khóa tài khoản",
                                      icon: LockKeyholeOpen,
                                      tone: "success",
                                      disabled: pending,
                                      onSelect: () => setActive.mutate({ id: t.uid, active: true }),
                                      separated: true,
                                    },
                                // Delete = lock on the backend (both set deletedAt): no-op for an already-locked account.
                                t.active && { label: "Xóa tài khoản", icon: Trash2, tone: "danger", onSelect: () => setDeleteTarget(t) },
                              ]}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

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
          </>
        )}
      </Panel>

      <TeacherCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(t) =>
          setCredentials({
            title: "Tài khoản giáo viên đã tạo",
            records: [
              { id: t.uid, fullName: t.fullName, login: t.email, userName: t.userName, password: t.initialPassword ?? "", roleLabel: "Giáo viên" },
            ],
          })
        }
      />

      <TeacherEditDialog teacher={editTarget} onOpenChange={(o) => !o && setEditTarget(null)} />

      <ConfirmDialog
        open={!!lockTarget}
        onOpenChange={(o) => !o && setLockTarget(null)}
        title="Khóa tài khoản giáo viên?"
        description={`${lockTarget?.fullName ?? ""} sẽ không đăng nhập được cho đến khi được mở khóa. Lớp đang phụ trách vẫn được giữ nguyên.`}
        confirmLabel="Khóa tài khoản"
        variant="danger"
        onConfirm={() => {
          if (lockTarget) setActive.mutate({ id: lockTarget.uid, active: false });
          setLockTarget(null);
        }}
      />

      <ConfirmDialog
        open={bulkLock}
        onOpenChange={setBulkLock}
        title={`Khóa ${selected.filter((t) => t.active).length} tài khoản giáo viên?`}
        description="Các giáo viên đã chọn sẽ không đăng nhập được cho đến khi được mở khóa. Lớp đang phụ trách vẫn được giữ nguyên."
        confirmLabel="Khóa tài khoản"
        variant="danger"
        onConfirm={() => {
          setBulkLock(false);
          void bulkSetActive(false);
        }}
      />

      <ConfirmDialog
        open={!!resetTarget}
        onOpenChange={(o) => !o && !resetPassword.isPending && setResetTarget(null)}
        title="Đặt lại mật khẩu?"
        description={`Hệ thống sẽ tạo mật khẩu tạm mới cho ${resetTarget?.fullName ?? ""}; mật khẩu hiện tại không dùng được nữa. Giáo viên phải đổi mật khẩu ở lần đăng nhập tiếp theo.`}
        confirmLabel="Đặt lại mật khẩu"
        variant="warning"
        isPending={resetPassword.isPending}
        onConfirm={() => resetTarget && doReset(resetTarget)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && !remove.isPending && setDeleteTarget(null)}
        title="Xóa tài khoản giáo viên?"
        description={`${deleteTarget?.fullName ?? ""} sẽ bị vô hiệu hóa và không đăng nhập được. Hiện máy chủ xử lý xóa giống khóa: tài khoản vẫn hiện trong danh sách ở trạng thái “Đã khóa” và có thể mở khóa lại.`}
        confirmLabel="Xóa tài khoản"
        variant="danger"
        isPending={remove.isPending}
        onConfirm={() => deleteTarget && doDelete(deleteTarget)}
      />

      <CredentialsDialog
        open={!!credentials}
        onOpenChange={(o) => !o && setCredentials(null)}
        title={credentials?.title}
        records={credentials?.records ?? []}
        schoolName={quota.data?.schoolName}
        fileName={`tai-khoan-giao-vien-${todayStamp()}.csv`}
      />
    </div>
  );
}
