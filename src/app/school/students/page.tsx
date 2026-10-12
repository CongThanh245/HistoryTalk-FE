"use client";

import * as React from "react";
import { Coins, Download, Eye, KeyRound, LockKeyhole, LockKeyholeOpen, Trash2, Upload, Users } from "lucide-react";
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
import { downloadCsv, todayStamp, type CredentialRecord } from "@/components/saas/accounts-utils";
import { AccountStatusBadge, NeutralBadge, Panel, SearchInput, formatDate, formatNumber } from "@/components/saas/saas-ui";
import { GENDER_LABELS, StudentEditDialog, isShadowEmail } from "@/components/saas/student-edit-dialog";
import { StudentTokenDialog } from "@/components/saas/student-token-dialog";
import { apiErrorMessage, useApiStudents, useApiTokenQuota, useStudentMutations } from "@/features/saas/hooks-api";
import { schoolService, type AccountListParams, type ApiStudent } from "@/services/school.service";
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
import { LastImportBar } from "../_components/import-last";
import { ErrorBlock, SchoolShell, useDebouncedValue } from "../_components/shared";
import { StudentImportWizard } from "../_components/student-import-wizard";

type SortBy = "studentCode" | "fullName" | "userName" | "email" | "token" | "createdAt";

/** School Admin: student accounts (GET/PUT/DELETE /school-admin/students, import, token allocation, reset password). */
export default function SchoolStudentsPage() {
  return (
    <SchoolShell
      title="Học sinh"
      description="Quản lý tài khoản học sinh của trường: nhập danh sách từ CSV, sửa thông tin, khóa / mở khóa, đặt lại mật khẩu và cấp token từ quỹ của trường."
    >
      <StudentsContent />
    </SchoolShell>
  );
}

/** CSV of the selected rows (no passwords). */
function exportStudentsCsv(students: ApiStudent[]) {
  downloadCsv(`danh-sach-hoc-sinh-${todayStamp()}.csv`, [
    ["Mã học sinh", "Họ và tên", "Email đăng nhập", "Tên tài khoản", "Ngày sinh", "Giới tính", "Số điện thoại", "Token trong ví", "Trạng thái", "Ngày tạo"],
    ...students.map((s) => [
      s.studentCode,
      s.fullName,
      s.email,
      s.userName,
      s.dob ? formatDate(s.dob) : "",
      s.gender ? GENDER_LABELS[s.gender] : "",
      s.phoneNumber ?? "",
      s.token ?? 0,
      s.active ? "Hoạt động" : "Đã khóa",
      formatDate(s.createdAt),
    ]),
  ]);
}

function StudentsContent() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const debounced = useDebouncedValue(search.trim(), 300);
  const [filter, setFilter] = React.useState<ActiveFilter>("ALL");
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(20);
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
  const students = useApiStudents(params);
  const quota = useApiTokenQuota();
  const { setActive, remove, resetPassword } = useStudentMutations();

  const [importOpen, setImportOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<ApiStudent | null>(null);
  const [tokenTargets, setTokenTargets] = React.useState<ApiStudent[]>([]);
  const [lockTarget, setLockTarget] = React.useState<ApiStudent | null>(null);
  const [resetTarget, setResetTarget] = React.useState<ApiStudent | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ApiStudent | null>(null);
  const [bulkLock, setBulkLock] = React.useState(false);
  const [bulkRunning, setBulkRunning] = React.useState(false);
  const [credentials, setCredentials] = React.useState<CredentialRecord[] | null>(null);

  const data = students.data;
  const rows = React.useMemo(() => data?.items ?? [], [data]);
  const total = data?.totalElements ?? 0;
  const rowIds = React.useMemo(() => rows.map((s) => s.uid), [rows]);
  const selection = useRowSelection(rowIds);
  const selected = rows.filter((s) => selection.isSelected(s.uid));
  const headerChecked: boolean | "indeterminate" =
    rows.length > 0 && selected.length === rows.length ? true : selected.length > 0 ? "indeterminate" : false;

  // Keep the page in range after the list shrinks.
  if (data && page > 0 && page >= Math.max(1, data.totalPages)) setPage(Math.max(0, data.totalPages - 1));

  const filtered = !!debounced || filter !== "ALL";

  const bulkSetActive = async (active: boolean) => {
    const targets = selected.filter((s) => s.active !== active);
    if (!targets.length) {
      toast.info(active ? "Các học sinh đã chọn đều đang hoạt động." : "Các học sinh đã chọn đều đã bị khóa.");
      return;
    }
    setBulkRunning(true);
    try {
      await runBulk({
        items: targets,
        run: (s) => schoolService.setStudentActive(s.uid, active),
        name: (s) => s.fullName,
        progressLabel: active ? "Đang mở khóa" : "Đang khóa",
        doneLabel: (n) => (active ? `Đã mở khóa ${n} tài khoản học sinh` : `Đã khóa ${n} tài khoản học sinh`),
      });
    } finally {
      setBulkRunning(false);
      selection.clear();
      void qc.invalidateQueries({ queryKey: ["saas", "students"] });
      void qc.invalidateQueries({ queryKey: ["saas", "student"] });
    }
  };

  const toggleActive = (s: ApiStudent, active: boolean) =>
    setActive.mutate(
      { id: s.uid, active },
      {
        onSuccess: (r) => toast.success(r.active ? `Đã mở khóa tài khoản ${r.fullName}` : `Đã khóa tài khoản ${r.fullName}`),
        onError: (error) => toast.error(apiErrorMessage(error, "Không cập nhật được trạng thái. Vui lòng thử lại.")),
      },
    );

  const doReset = (s: ApiStudent) =>
    resetPassword.mutate(s.uid, {
      onSuccess: (r) => {
        setResetTarget(null);
        setCredentials([
          {
            id: r.uid,
            fullName: r.fullName,
            login: r.email,
            userName: r.userName,
            password: r.initialPassword,
            roleLabel: "Học sinh",
            studentCode: s.studentCode || undefined,
          },
        ]);
      },
      onError: (error) => {
        setResetTarget(null);
        toast.error(apiErrorMessage(error, "Không đặt lại được mật khẩu. Vui lòng thử lại."));
      },
    });

  const doDelete = (s: ApiStudent) =>
    remove.mutate(s.uid, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success(`Đã xóa tài khoản học sinh ${s.fullName}`);
      },
      onError: (error) => {
        setDeleteTarget(null);
        toast.error(apiErrorMessage(error, "Không xóa được tài khoản. Vui lòng thử lại."));
      },
    });

  const importButton = (
    <button type="button" className="btn-crimson w-full sm:w-auto" onClick={() => setImportOpen(true)}>
      <Upload className="h-4 w-4" aria-hidden="true" /> Nhập danh sách học sinh
    </button>
  );

  return (
    <div className="space-y-6">
      <LastImportBar schoolName={quota.data?.schoolName} />

      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm mã HS, họ tên, email, tên tài khoản..." />
          <ActiveFilterTabs value={filter} onChange={setFilter} />
          <div className="hidden flex-1 sm:block" />
          {importButton}
        </div>

        {quota.data && (
          <p className="text-sm text-content-muted">
            Quỹ token chưa phân bổ: <b className="tabular-nums text-content-heading">{formatNumber(quota.data.unallocatedTokenQuota)}</b>. Chọn học
            sinh trong bảng rồi bấm “Cấp token” để cộng token vào ví.
          </p>
        )}

        {students.isPending ? (
          <TableSkeleton rows={8} cols={7} />
        ) : students.isError ? (
          <ErrorBlock error={students.error} fallback="Không tải được danh sách học sinh." onRetry={() => void students.refetch()} />
        ) : (
          <>
            <p className="text-sm text-content-muted" aria-live="polite">
              <b className="tabular-nums text-content-heading">{formatNumber(total)}</b> học sinh
              {filter === "ACTIVE" ? " đang hoạt động" : filter === "LOCKED" ? " đã khóa" : ""}
              {debounced ? ` khớp “${debounced}”` : ""}
              {students.isFetching && <span className="ml-2 text-xs">Đang cập nhật…</span>}
            </p>

            <BulkActionBar
              count={selected.length}
              total={rows.length}
              noun="học sinh trên trang này"
              onSelectAll={() => selection.setMany(rowIds, true)}
              onClear={selection.clear}
            >
              <BulkButton icon={Coins} disabled={bulkRunning} onClick={() => setTokenTargets(selected)}>
                Cấp token
              </BulkButton>
              <BulkButton icon={LockKeyhole} tone="danger" disabled={bulkRunning} onClick={() => setBulkLock(true)}>
                Khóa
              </BulkButton>
              <BulkButton icon={LockKeyholeOpen} disabled={bulkRunning} onClick={() => void bulkSetActive(true)}>
                Mở khóa
              </BulkButton>
              <BulkButton icon={Download} onClick={() => exportStudentsCsv(selected)}>
                Xuất CSV
              </BulkButton>
            </BulkActionBar>

            {rows.length === 0 ? (
              <div className="border-y border-[var(--text-primary)]">
                {filtered ? (
                  <NoResults
                    onReset={() => {
                      setSearch("");
                      setFilter("ALL");
                    }}
                    message="Không có học sinh phù hợp với bộ lọc."
                  />
                ) : (
                  <TableEmpty
                    icon={Users}
                    title="Chưa có học sinh nào"
                    description="Tải file mẫu, điền danh sách học sinh rồi nhập để tạo tài khoản và in phiếu tài khoản."
                    action={importButton}
                  />
                )}
              </div>
            ) : (
              <div className={cn("overflow-x-auto rounded-[2px] border-y border-[var(--text-primary)] bg-[var(--bg-surface)]", students.isFetching && "opacity-70")}>
                <Table className="min-w-max">
                  <caption className="sr-only">Danh sách học sinh</caption>
                  <TableHeader>
                    <TableRow className="border-b border-[var(--border-strong)] hover:bg-transparent">
                      <TableHead className="w-10 px-3">
                        <Checkbox
                          checked={headerChecked}
                          onCheckedChange={(v) => selection.setMany(rowIds, v === true)}
                          aria-label="Chọn tất cả học sinh trên trang này"
                        />
                      </TableHead>
                      <TableHead className={HEAD} aria-sort={ariaSort("studentCode", sort.sortBy, sort.direction)}>
                        <SortHeader label="Mã HS" column="studentCode" {...sort} />
                      </TableHead>
                      <TableHead className={HEAD} aria-sort={ariaSort("fullName", sort.sortBy, sort.direction)}>
                        <SortHeader label="Họ và tên" column="fullName" {...sort} />
                      </TableHead>
                      <TableHead className={HEAD} aria-sort={ariaSort("email", sort.sortBy, sort.direction)}>
                        <SortHeader label="Email đăng nhập" column="email" {...sort} />
                      </TableHead>
                      <TableHead className={HEAD} aria-sort={ariaSort("userName", sort.sortBy, sort.direction)}>
                        <SortHeader label="Tên tài khoản" column="userName" {...sort} />
                      </TableHead>
                      <TableHead className={HEAD}>Ngày sinh</TableHead>
                      <TableHead className={HEAD}>Giới tính</TableHead>
                      <TableHead className={cn(HEAD, "text-right")} aria-sort={ariaSort("token", sort.sortBy, sort.direction)}>
                        <SortHeader label="Token trong ví" column="token" {...sort} />
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
                    {rows.map((s) => {
                      const checked = selection.isSelected(s.uid);
                      const pending = setActive.isPending && setActive.variables?.id === s.uid;
                      return (
                        <TableRow
                          key={s.uid}
                          data-state={checked ? "selected" : undefined}
                          className={cn(
                            "border-b border-[var(--border-default)] last:border-b-0",
                            checked && "bg-[var(--accent-gold-active-bg)] hover:bg-[var(--accent-gold-active-bg)]",
                          )}
                        >
                          <TableCell className="w-10 px-3">
                            <Checkbox checked={checked} onCheckedChange={(v) => selection.toggle(s.uid, v === true)} aria-label={`Chọn ${s.fullName}`} />
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-3 py-2.5 font-mono text-xs font-bold text-content-heading">{s.studentCode || "—"}</TableCell>
                          <TableCell className="px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => setEditTarget(s)}
                              className="min-w-[160px] max-w-[240px] text-left text-sm font-semibold text-content-heading underline-offset-2 hover:text-[var(--accent-gold)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]"
                            >
                              {s.fullName}
                            </button>
                            {s.phoneNumber && <p className="text-xs tabular-nums text-content-muted">{s.phoneNumber}</p>}
                          </TableCell>
                          <TableCell className="px-3 py-2.5">
                            <p className="max-w-[260px] truncate font-mono text-xs" title={s.email}>
                              {s.email}
                            </p>
                            {isShadowEmail(s.email) && <NeutralBadge className="mt-1 px-1.5 text-[10px]">Email hệ thống</NeutralBadge>}
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate px-3 py-2.5 font-mono text-xs text-content-muted" title={s.userName}>
                            {s.userName}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-3 py-2.5 text-xs tabular-nums">{formatDate(s.dob)}</TableCell>
                          <TableCell className="whitespace-nowrap px-3 py-2.5 text-xs">{s.gender ? GENDER_LABELS[s.gender] : "—"}</TableCell>
                          <TableCell className="whitespace-nowrap px-3 py-2.5 text-right text-sm font-semibold tabular-nums">{formatNumber(s.token ?? 0)}</TableCell>
                          <TableCell className="px-3 py-2.5">
                            <AccountStatusBadge status={s.active ? "ACTIVE" : "LOCKED"} />
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-3 py-2.5 text-xs tabular-nums text-content-muted">{formatDate(s.createdAt)}</TableCell>
                          <TableCell className="px-3 py-2.5 text-right">
                            <RowActions
                              label={`Thao tác với ${s.fullName}`}
                              actions={[
                                { label: "Xem / sửa thông tin", icon: Eye, onSelect: () => setEditTarget(s) },
                                { label: "Cấp thêm token", icon: Coins, onSelect: () => setTokenTargets([s]) },
                                { label: "Đặt lại mật khẩu", icon: KeyRound, onSelect: () => setResetTarget(s) },
                                s.active
                                  ? { label: "Khóa tài khoản", icon: LockKeyhole, disabled: pending, onSelect: () => setLockTarget(s), separated: true }
                                  : {
                                      label: "Mở khóa tài khoản",
                                      icon: LockKeyholeOpen,
                                      tone: "success",
                                      disabled: pending,
                                      onSelect: () => toggleActive(s, true),
                                      separated: true,
                                    },
                                // Delete = lock on the backend (both set deletedAt): no-op for an already-locked account.
                                s.active && { label: "Xóa tài khoản", icon: Trash2, tone: "danger", onSelect: () => setDeleteTarget(s) },
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

      <StudentImportWizard open={importOpen} onOpenChange={setImportOpen} />

      <StudentEditDialog student={editTarget} onOpenChange={(o) => !o && setEditTarget(null)} />

      <StudentTokenDialog students={tokenTargets} onOpenChange={(o) => !o && setTokenTargets([])} onDone={selection.clear} />

      <ConfirmDialog
        open={!!lockTarget}
        onOpenChange={(o) => !o && setLockTarget(null)}
        title="Khóa tài khoản học sinh?"
        description={`${lockTarget?.fullName ?? ""} sẽ không đăng nhập được cho đến khi được mở khóa. Token trong ví được giữ nguyên.`}
        confirmLabel="Khóa tài khoản"
        variant="danger"
        onConfirm={() => {
          if (lockTarget) toggleActive(lockTarget, false);
          setLockTarget(null);
        }}
      />

      <ConfirmDialog
        open={bulkLock}
        onOpenChange={setBulkLock}
        title={`Khóa ${selected.filter((s) => s.active).length} tài khoản học sinh?`}
        description="Các học sinh đã chọn sẽ không đăng nhập được cho đến khi được mở khóa. Token trong ví được giữ nguyên."
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
        description={
          resetTarget?.studentCode
            ? `Mật khẩu của ${resetTarget.fullName} sẽ trở về mặc định ${resetTarget.studentCode}@2026 (mã học sinh + @2026). Học sinh phải đổi mật khẩu ở lần đăng nhập tiếp theo.`
            : `Hệ thống sẽ tạo mật khẩu tạm mới cho ${resetTarget?.fullName ?? ""}. Học sinh phải đổi mật khẩu ở lần đăng nhập tiếp theo.`
        }
        confirmLabel="Đặt lại mật khẩu"
        variant="warning"
        isPending={resetPassword.isPending}
        onConfirm={() => resetTarget && doReset(resetTarget)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && !remove.isPending && setDeleteTarget(null)}
        title="Xóa tài khoản học sinh?"
        description={`${deleteTarget?.fullName ?? ""} sẽ bị vô hiệu hóa và không đăng nhập được. Hiện máy chủ xử lý xóa giống khóa: tài khoản vẫn hiện trong danh sách ở trạng thái “Đã khóa” và có thể mở khóa lại; token trong ví không được hoàn về quỹ trường.`}
        confirmLabel="Xóa tài khoản"
        variant="danger"
        isPending={remove.isPending}
        onConfirm={() => deleteTarget && doDelete(deleteTarget)}
      />

      <CredentialsDialog
        open={!!credentials}
        onOpenChange={(o) => !o && setCredentials(null)}
        title="Mật khẩu học sinh đã đặt lại"
        records={credentials ?? []}
        schoolName={quota.data?.schoolName}
        fileName={`mat-khau-hoc-sinh-${todayStamp()}.csv`}
      />
    </div>
  );
}
