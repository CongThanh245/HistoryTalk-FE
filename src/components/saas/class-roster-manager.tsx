"use client";

import * as React from "react";
import { AlertCircle, ArrowRightLeft, ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileUp, Gift, KeyRound, RefreshCw, UserMinus, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StaffFormSelect } from "@/components/staff/staff-form";
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
import { useDebouncedValue } from "@/components/saas/admin-school-shared";
import { DIALOG_CLASS, DIALOG_TITLE_CLASS, Field, NeutralBadge, SearchInput, formatDate, formatNumber } from "@/components/saas/saas-ui";
import { GENDER_LABELS } from "@/components/saas/student-edit-dialog";
import { ImportAccountsTable, ImportErrorsTable } from "@/app/school/_components/import-result";
import { useRole } from "@/features/auth/usePermission";
import { apiErrorMessage, useApiSchoolClassrooms, useApiTeacherClassrooms } from "@/features/saas/hooks-api";
import { useAvailableStudents, useClassroomStudents, useRosterMutations } from "@/features/saas/hooks-assignment-api";
import { autoMapStudentColumns, buildBackendCsv, buildBackendTemplateCsv, decodeImportFile, downloadTextFile, readTable } from "@/features/saas/student-import";
import { ImportPreviewTable, useImportRows } from "@/components/saas/student-import-preview";
import type { BatchEnrollResult, ClassroomStudent } from "@/services/assignment.service";
import type { ImportedStudentAccount, StudentImportResult } from "@/services/school.service";
import { cn } from "@/lib/utils/cn";
import { FetchingBadge, FetchingBar } from "@/components/commons/fetching-indicator";
import { GrantTokensDialog } from "@/components/saas/token-boost-ui";

/**
 * Roster of one class on the live API (GET/POST/DELETE /classrooms/{id}/students…), shared by School Admin and the
 * teacher in charge. `canManage` adds enroll / CSV import / remove / transfer.
 */

const PAGE_SIZES = [10, 20, 50];
const HEAD = "whitespace-nowrap px-3 py-2.5 text-[13px] font-semibold text-[var(--text-tertiary)]";
const CELL = "whitespace-nowrap px-3 py-2.5";

/** class_students.status: the roster only lists ACTIVE rows, removal sets INACTIVE, transfer sets TRANSFERRED. */
const ENROLL_STATUS: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Đang học", className: "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]" },
  INACTIVE: { label: "Đã rời lớp", className: "border-[var(--border-strong)] text-[var(--text-tertiary)]" },
  TRANSFERRED: { label: "Đã chuyển lớp", className: "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]" },
};

function EnrollStatusBadge({ status }: { status: string | null }) {
  const s = status ? ENROLL_STATUS[status] : undefined;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs font-semibold",
        s?.className ?? "border-[var(--border-strong)] text-[var(--text-tertiary)]",
      )}
    >
      {s?.label ?? status ?? "—"}
    </span>
  );
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-start gap-3 rounded-sm border border-[var(--accent-danger)] bg-[var(--bg-surface)] p-4">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-danger)]" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm text-content-muted">{message}</p>
      <button type="button" onClick={onRetry} className="btn-ink min-h-0 px-3 py-2 text-xs">
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Thử lại
      </button>
    </div>
  );
}

export function ClassRosterManager({ classId, canManage }: { classId: string; canManage: boolean }) {
  const [search, setSearch] = React.useState("");
  const debounced = useDebouncedValue(search.trim(), 300);
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);

  // Back to the first page when the search changes.
  const [lastSearch, setLastSearch] = React.useState(debounced);
  if (debounced !== lastSearch) {
    setLastSearch(debounced);
    setPage(0);
  }

  const students = useClassroomStudents(classId, { search: debounced || undefined, page, size });
  const { remove } = useRosterMutations(classId);

  const [addOpen, setAddOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [transferTargets, setTransferTargets] = React.useState<ClassroomStudent[]>([]);
  const [removeTarget, setRemoveTarget] = React.useState<ClassroomStudent | null>(null);
  // Cap token tu han muc cua GV (chi giao vien; cung hop thoai voi bang thong ke lop).
  const canGrant = useRole() === "TEACHER";
  const [granting, setGranting] = React.useState<{ uid: string; name: string; classId: string } | null>(null);

  const data = students.data;
  const rows = React.useMemo(() => data?.items ?? [], [data]);
  const total = data?.totalElements ?? 0;
  const rowIds = React.useMemo(() => rows.map((s) => s.studentId), [rows]);
  const selection = useRowSelection(rowIds);
  const selected = rows.filter((s) => selection.isSelected(s.studentId));
  const headerChecked: boolean | "indeterminate" =
    rows.length > 0 && selected.length === rows.length ? true : selected.length > 0 ? "indeterminate" : false;

  // Keep the page in range after the roster shrinks.
  if (data && page > 0 && page >= Math.max(1, data.totalPages)) setPage(Math.max(0, data.totalPages - 1));

  const doRemove = (s: ClassroomStudent) =>
    remove.mutate(s.studentId, {
      onSuccess: () => {
        setRemoveTarget(null);
        toast.success(`Đã xóa ${s.fullName} khỏi lớp`);
      },
      onError: (error) => {
        setRemoveTarget(null);
        toast.error(apiErrorMessage(error, "Không xóa được học sinh khỏi lớp. Vui lòng thử lại."));
      },
    });

  const addButton = (
    <button type="button" className="btn-crimson w-full sm:w-auto" onClick={() => setAddOpen(true)}>
      <UserPlus className="h-4 w-4" aria-hidden="true" /> Thêm học sinh
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm mã HS, họ tên, email, tên tài khoản..." />
        <div className="hidden flex-1 sm:block" />
        {canManage && (
          <>
            <button type="button" className="btn-line w-full sm:w-auto" onClick={() => setImportOpen(true)}>
              <FileUp className="h-4 w-4" aria-hidden="true" /> Nhập CSV
            </button>
            {addButton}
          </>
        )}
      </div>

      {students.isPending ? (
        <TableSkeleton rows={6} cols={6} />
      ) : students.isError ? (
        <LoadError message={apiErrorMessage(students.error, "Không tải được danh sách học sinh của lớp.")} onRetry={() => void students.refetch()} />
      ) : (
        <>
          <p className="text-sm text-content-muted" aria-live="polite">
            <b className="tabular-nums text-content-heading">{formatNumber(total)}</b> học sinh
            {debounced ? ` khớp “${debounced}”` : " trong lớp"}
            <FetchingBadge active={students.isFetching} />
          </p>

          {canManage && (
            <BulkActionBar
              count={selected.length}
              total={rows.length}
              noun="học sinh trên trang này"
              onSelectAll={() => selection.setMany(rowIds, true)}
              onClear={selection.clear}
            >
              <BulkButton icon={ArrowRightLeft} onClick={() => setTransferTargets(selected)}>
                Chuyển lớp
              </BulkButton>
            </BulkActionBar>
          )}

          {rows.length === 0 ? (
            <div className="rounded-sm border border-dashed border-[var(--border-strong)]">
              {debounced ? (
                <NoResults onReset={() => setSearch("")} message="Không có học sinh phù hợp trong lớp." />
              ) : (
                <TableEmpty
                  icon={Users}
                  title="Lớp chưa có học sinh"
                  description={canManage ? "Thêm học sinh có sẵn của trường hoặc nhập danh sách từ file CSV." : undefined}
                  action={canManage ? addButton : undefined}
                />
              )}
            </div>
          ) : (
            <div className={cn("relative overflow-x-auto rounded-lg border border-border-card bg-[var(--bg-surface)]", students.isFetching && "opacity-70")}>
              <FetchingBar active={students.isFetching} />
              <Table className="min-w-max">
                <caption className="sr-only">Danh sách học sinh của lớp</caption>
                <TableHeader>
                  <TableRow className="border-b border-border-card">
                    {canManage && (
                      <TableHead className="w-10 px-3">
                        <Checkbox
                          checked={headerChecked}
                          onCheckedChange={(v) => selection.setMany(rowIds, v === true)}
                          aria-label="Chọn tất cả học sinh trên trang này"
                        />
                      </TableHead>
                    )}
                    <TableHead className={HEAD}>Mã HS</TableHead>
                    <TableHead className={HEAD}>Họ và tên</TableHead>
                    <TableHead className={HEAD}>Email đăng nhập</TableHead>
                    <TableHead className={cn(HEAD, "text-right")}>Token</TableHead>
                    <TableHead className={HEAD}>Ngày vào lớp</TableHead>
                    <TableHead className={HEAD}>Trạng thái</TableHead>
                    {canManage && (
                      <TableHead className={HEAD}>
                        <span className="sr-only">Thao tác</span>
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((s) => {
                    const checked = selection.isSelected(s.studentId);
                    return (
                      <TableRow
                        key={s.studentId}
                        data-state={checked ? "selected" : undefined}
                        className={cn(
                          "border-b border-[var(--border-default)] last:border-b-0",
                          checked && "bg-[var(--accent-gold-active-bg)] hover:bg-[var(--accent-gold-active-bg)]",
                        )}
                      >
                        {canManage && (
                          <TableCell className="w-10 px-3">
                            <Checkbox checked={checked} onCheckedChange={(v) => selection.toggle(s.studentId, v === true)} aria-label={`Chọn ${s.fullName}`} />
                          </TableCell>
                        )}
                        <TableCell className={cn(CELL, "font-mono text-xs font-bold text-content-heading")}>{s.studentCode || "—"}</TableCell>
                        <TableCell className={CELL}>
                          <span className="block text-sm font-semibold text-content-heading">{s.fullName}</span>
                          <span className="block text-xs tabular-nums text-content-muted">
                            {[s.gender && GENDER_LABELS[s.gender], s.dob && formatDate(s.dob), s.phoneNumber].filter(Boolean).join(" · ") || "—"}
                          </span>
                        </TableCell>
                        <TableCell className={cn(CELL, "max-w-[260px] truncate font-mono text-xs")} title={s.email ?? undefined}>
                          {s.email || "—"}
                        </TableCell>
                        <TableCell className={cn(CELL, "text-right text-sm font-semibold tabular-nums")}>
                          <span className="inline-flex items-center justify-end gap-1.5">
                            {s.token === null ? "—" : formatNumber(s.token)}
                            {canGrant && (
                              <button
                                type="button"
                                onClick={() => setGranting({ uid: s.studentId, name: s.fullName, classId })}
                                className="grid h-7 w-7 place-items-center rounded-sm text-[var(--accent-gold)] hover:bg-[var(--accent-gold-active-bg)]"
                                aria-label={`Cấp token cho ${s.fullName}`}
                                title="Cấp token"
                              >
                                <Gift className="h-4 w-4" aria-hidden="true" />
                              </button>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className={cn(CELL, "text-xs tabular-nums text-content-muted")}>{formatDate(s.joinedAt)}</TableCell>
                        <TableCell className={CELL}>
                          <EnrollStatusBadge status={s.status} />
                        </TableCell>
                        {canManage && (
                          <TableCell className="px-3 py-2.5 text-right">
                            <RowActions
                              label={`Thao tác với ${s.fullName}`}
                              actions={[
                                canGrant && { label: "Cấp token", icon: Gift, onSelect: () => setGranting({ uid: s.studentId, name: s.fullName, classId }) },
                                { label: "Chuyển lớp", icon: ArrowRightLeft, onSelect: () => setTransferTargets([s]) },
                                { label: "Xóa khỏi lớp", icon: UserMinus, tone: "danger", onSelect: () => setRemoveTarget(s), separated: true },
                              ]}
                            />
                          </TableCell>
                        )}
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

      {canManage && (
        <>
          <AddStudentsDialog classId={classId} open={addOpen} onOpenChange={setAddOpen} />
          <ImportCsvDialog classId={classId} open={importOpen} onOpenChange={setImportOpen} />
          <TransferDialog
            classId={classId}
            students={transferTargets}
            onOpenChange={(o) => !o && setTransferTargets([])}
            onDone={selection.clear}
          />
          <ConfirmDialog
            open={!!removeTarget}
            onOpenChange={(o) => !o && !remove.isPending && setRemoveTarget(null)}
            title="Xóa khỏi lớp?"
            description={`${removeTarget?.fullName ?? ""} sẽ rời lớp này. Tài khoản và token của học sinh vẫn được giữ nguyên; có thể thêm lại vào lớp sau.`}
            confirmLabel="Xóa khỏi lớp"
            variant="danger"
            isPending={remove.isPending}
            onConfirm={() => removeTarget && doRemove(removeTarget)}
          />
        </>
      )}
      {canGrant && <GrantTokensDialog student={granting} onOpenChange={(o) => !o && setGranting(null)} />}
    </div>
  );
}

/* ───────────────────────── Batch result ───────────────────────── */
function BatchResultView({ result, title }: { result: BatchEnrollResult; title: string }) {
  return (
    <div className="space-y-3" aria-live="polite">
      <p className="text-sm font-bold text-content-heading">{title}</p>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Yêu cầu", result.totalRequested],
          ["Thành công", result.successCount],
          ["Bỏ qua", result.alreadyEnrolledCount],
          [`Sĩ số lớp ${result.className}`, result.currentStudentCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-sm border border-[var(--border-strong)] p-3">
            <dt className="text-[13px] font-semibold text-[var(--text-tertiary)]">{label}</dt>
            <dd className="text-xl font-bold tabular-nums text-content-heading">{formatNumber(Number(value))}</dd>
          </div>
        ))}
      </dl>
      {result.notes.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-content-muted">
            Ghi chú từ máy chủ · mỗi học sinh chỉ thuộc một lớp đang hoạt động; học sinh đã ở lớp khác cần được chuyển lớp
          </p>
          <ul className="max-h-40 list-disc space-y-0.5 overflow-y-auto pl-5 text-sm text-[var(--status-warning)]">
            {result.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Add students ───────────────────────── */
function AddStudentsDialog({ classId, open, onOpenChange }: { classId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [search, setSearch] = React.useState("");
  const debounced = useDebouncedValue(search.trim(), 300);
  const [page, setPage] = React.useState(0);
  // Selection survives paging and searching: id → name (for the summary).
  const [selected, setSelected] = React.useState<Map<string, string>>(() => new Map());
  const [result, setResult] = React.useState<BatchEnrollResult | null>(null);
  const { enroll } = useRosterMutations(classId);

  const [lastSearch, setLastSearch] = React.useState(debounced);
  if (debounced !== lastSearch) {
    setLastSearch(debounced);
    setPage(0);
  }

  const available = useAvailableStudents(classId, { search: debounced || undefined, page, size: 20 }, open && !result);
  const items = available.data?.items ?? [];
  const totalPages = available.data?.totalPages ?? 0;

  const reset = () => {
    setSearch("");
    setPage(0);
    setSelected(new Map());
    setResult(null);
  };

  const toggle = (id: string, name: string, checked: boolean) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (checked) next.set(id, name);
      else next.delete(id);
      return next;
    });

  const allVisibleSelected = items.length > 0 && items.every((s) => selected.has(s.uid));

  const submit = () =>
    enroll.mutate([...selected.keys()], {
      onSuccess: (r) => {
        setResult(r);
        setSelected(new Map());
        if (r.successCount > 0) toast.success(`Đã thêm ${r.successCount} học sinh vào lớp ${r.className}`);
        else toast.info("Không có học sinh nào được thêm.");
      },
      onError: (error) => toast.error(apiErrorMessage(error, "Không thêm được học sinh. Vui lòng thử lại.")),
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-xl")}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE_CLASS}>Thêm học sinh vào lớp</DialogTitle>
          <DialogDescription className="text-content-muted">
            Học sinh của trường chưa có trong lớp này. Học sinh đang học lớp khác vẫn ở lớp cũ (muốn chuyển hẳn, dùng “Chuyển lớp” ở lớp cũ).
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <BatchResultView result={result} title="Kết quả thêm học sinh" />
        ) : (
          <div className="space-y-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Tìm mã HS, họ tên, email..." className="sm:w-full" />

            {available.isPending ? (
              <TableSkeleton rows={5} cols={2} />
            ) : available.isError ? (
              <LoadError message={apiErrorMessage(available.error, "Không tải được danh sách học sinh.")} onRetry={() => void available.refetch()} />
            ) : (
              <div className={cn("max-h-[45dvh] overflow-y-auto rounded-sm border border-[var(--border-strong)]", available.isFetching && "opacity-70")}>
                {items.length === 0 ? (
                  <p className="p-6 text-center text-sm text-content-muted">
                    {debounced ? "Không có học sinh phù hợp." : "Mọi học sinh của trường đều đã có trong lớp."}
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--border-default)]">
                    <li className="flex items-center gap-3 bg-[var(--status-neutral-bg)] px-3 py-2">
                      <Checkbox
                        id="roster-available-all"
                        checked={allVisibleSelected}
                        onCheckedChange={(v) =>
                          setSelected((prev) => {
                            const next = new Map(prev);
                            for (const s of items) {
                              if (v === true) next.set(s.uid, s.fullName);
                              else next.delete(s.uid);
                            }
                            return next;
                          })
                        }
                      />
                      <label
                        htmlFor="roster-available-all"
                        className="cursor-pointer text-[13px] font-semibold text-[var(--text-tertiary)]"
                      >
                        Chọn cả trang ({items.length}/{formatNumber(available.data?.totalElements ?? 0)})
                      </label>
                    </li>
                    {items.map((s) => (
                      <li key={s.uid}>
                        <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-[var(--status-neutral-bg)]">
                          <Checkbox checked={selected.has(s.uid)} onCheckedChange={(v) => toggle(s.uid, s.fullName, v === true)} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-content-heading">{s.fullName}</span>
                            <span className="block truncate text-xs text-content-muted">
                              {[s.studentCode, s.email].filter(Boolean).join(" · ") || "—"}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-content-muted">{formatNumber(s.token ?? 0)} token</span>
                          {s.active === false && <NeutralBadge>Đã khóa</NeutralBadge>}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm">
                <button type="button" className="archive-link disabled:opacity-40" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" /> Trang trước
                </button>
                <span className="tabular-nums text-content-muted">
                  Trang {page + 1}/{totalPages}
                </span>
                <button
                  type="button"
                  className="archive-link disabled:opacity-40"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Trang sau <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {result ? (
            <>
              <button type="button" className="btn-line" onClick={() => setResult(null)}>
                Thêm tiếp
              </button>
              <button type="button" className="btn-ink" onClick={() => onOpenChange(false)}>
                Xong
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-line" onClick={() => onOpenChange(false)}>
                Hủy
              </button>
              <button type="button" className="btn-crimson disabled:opacity-50" disabled={selected.size === 0 || enroll.isPending} onClick={submit}>
                {enroll.isPending ? "Đang thêm…" : `Thêm ${selected.size > 0 ? selected.size : ""} học sinh`}
              </button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── CSV import ───────────────────────── */

/** Existing accounts come back with allocatedToken 0 and a placeholder like "(Tài khoản hiện có)" instead of a password. */
const isExistingAccount = (a: ImportedStudentAccount) => (a.allocatedToken ?? 0) === 0 && /^\(.*\)$/.test(a.initialPassword ?? "");

function ImportCsvDialog({ classId, open, onOpenChange }: { classId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<StudentImportResult | null>(null);
  const [credentials, setCredentials] = React.useState<CredentialRecord[] | null>(null);
  // Existing students only need a code or email, so name / birth date are optional when one is present.
  const preview = useImportRows({ existingAllowed: true });
  const { importCsv } = useRosterMutations(classId);
  const loaded = !!fileName && !fileError;

  const removeFile = () => {
    setFileName(null);
    setFileError(null);
    preview.clear();
  };
  const reset = () => {
    removeFile();
    setResult(null);
  };

  async function handleFile(file: File | undefined) {
    if (!file) return;
    preview.clear();
    setFileName(file.name);
    if (!/\.csv$/i.test(file.name)) return setFileError("Chỉ nhận file .csv. Trong Excel chọn Tệp → Lưu thành → “CSV UTF-8 (Comma delimited)”.");
    if (file.size > 2 * 1024 * 1024) return setFileError("File quá lớn (tối đa 2 MB).");
    const parsed = readTable(decodeImportFile(await file.arrayBuffer()).text);
    if (!parsed.table) return setFileError(parsed.fileError ?? "Không đọc được file.");
    const mapping = autoMapStudentColumns(parsed.table.headers);
    if (mapping.fullName < 0 && mapping.studentCode < 0 && mapping.email < 0) {
      return setFileError("Không nhận ra cột họ tên, mã HS hay email. Hãy dùng file mẫu.");
    }
    setFileError(null);
    preview.load(parsed.table, mapping);
  }

  const submit = () => {
    if (preview.pickedRows.length === 0) return;
    // Rows are re-written as a clean UTF-8 CSV with the backend header (no BOM, no token column values).
    const csv = buildBackendCsv(preview.pickedRows.map((r) => r.values));
    const file = new File([csv], (fileName ?? "lop").replace(/\.[^.]+$/, "") + "-chuan-hoa.csv", { type: "text/csv" });
    importCsv.mutate(
      { file },
      {
        onSuccess: (r) => {
          setResult(r);
          toast.success(`Đã thêm ${r.successCount} học sinh vào lớp${r.failureCount ? `, ${r.failureCount} dòng lỗi` : ""}`);
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Không nhập được file. Vui lòng kiểm tra file và thử lại.")),
      },
    );
  };

  const accounts = result?.successfulAccounts ?? [];
  const fresh = accounts.filter((a) => !isExistingAccount(a));

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) reset();
          onOpenChange(o);
        }}
      >
        <DialogContent
          className={cn(DIALOG_CLASS, "flex max-h-[92dvh] flex-col", result ? "sm:max-w-3xl" : loaded ? "sm:max-w-5xl" : "sm:max-w-lg")}
          // Esc inside a row being edited only cancels that edit.
          onEscapeKeyDown={(e) => {
            if ((e.target as HTMLElement | null)?.closest?.("[data-row-editor]")) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle className={DIALOG_TITLE_CLASS}>Nhập học sinh từ CSV</DialogTitle>
            <DialogDescription className="text-content-muted">
              Học sinh đã có trong trường (khớp mã HS hoặc email) được thêm thẳng vào lớp; học sinh mới được tạo tài khoản rồi thêm vào lớp. Học sinh
              dùng quỹ token chung của trường theo hạn mức ngày, không cần cấp token riêng.
            </DialogDescription>
          </DialogHeader>

          <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
            {result ? (
              <div className="space-y-4">
                <dl className="grid grid-cols-3 gap-3">
                  {[
                    ["Thêm vào lớp", result.successCount],
                    ["Tài khoản mới", fresh.length],
                    ["Dòng lỗi", result.failureCount],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-sm border border-[var(--border-strong)] p-3">
                      <dt className="text-[13px] font-semibold text-[var(--text-tertiary)]">{label}</dt>
                      <dd className="text-xl font-bold tabular-nums text-content-heading">{formatNumber(Number(value))}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-sm text-content-muted">{formatNumber(result.totalRows)} dòng trong file</p>
                <ImportErrorsTable errors={result.errors} session={{ sentLines: [] }} />
                {accounts.length > 0 && <ImportAccountsTable accounts={accounts} maxHeight="max-h-[35dvh]" />}
                {fresh.length > 0 && (
                  <p className="text-xs text-[var(--status-warning)]">
                    Mật khẩu tạm của tài khoản mới chỉ hiện một lần. Hãy tải hoặc in phiếu tài khoản trước khi đóng.
                  </p>
                )}
              </div>
          ) : (
            <div className="space-y-4">
              {fileName ? (
                <div className="space-y-1 rounded-sm border border-[var(--border-strong)] px-3 py-2 text-sm">
                  <p className="flex min-w-0 items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
                    <span className="truncate font-semibold">{fileName}</span>
                    {loaded && <span className="ml-auto shrink-0 text-xs text-content-muted">{preview.checked.length} dòng</span>}
                    <button
                      type="button"
                      onClick={removeFile}
                      className={cn(
                        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-content-muted hover:bg-[var(--bg-elevated)] hover:text-content-heading",
                        !loaded && "ml-auto",
                      )}
                      aria-label="Bỏ file"
                      title="Bỏ file"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </p>
                  {fileError && (
                    <p role="alert" className="flex items-start gap-2 text-[var(--accent-danger)]">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {fileError}
                    </p>
                  )}
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-[var(--border-strong)] px-4 py-8 text-center hover:border-[var(--text-primary)] focus-within:outline-2 focus-within:outline-[var(--accent-gold)]">
                  <FileUp className="h-6 w-6 text-[var(--accent-gold)]" aria-hidden="true" />
                  <span className="text-sm font-semibold text-content-heading">Bấm để chọn file .csv</span>
                  <span className="text-xs text-content-muted">Tối đa 2 MB · tên cột có dấu hay không dấu đều được</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    onChange={(e) => {
                      void handleFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}

              {loaded ? (
                <ImportPreviewTable
                  rows={preview.checked}
                  filter={preview.filter}
                  setFilter={preview.setFilter}
                  validCount={preview.validRows.length}
                  errorCount={preview.errorCount}
                  selected={preview.selected}
                  setSelected={preview.setSelected}
                  rawRow={preview.rawRow}
                  onSaveRow={preview.saveRow}
                  note="Học sinh đã có chỉ cần mã HS hoặc email; học sinh mới cần họ tên và ngày sinh."
                  submitError={null}
                />
              ) : (
                <div className="rounded-sm border border-dashed border-[var(--border-strong)] bg-[var(--bg-main)] p-3 text-xs leading-5 text-content-muted">
                  Cột: <code className="font-mono">student_code, full_name, email, dob, gender, phone_number, password</code>. Học sinh mới cần{" "}
                  <code className="font-mono">full_name</code> và <code className="font-mono">dob</code>; học sinh đã có chỉ cần mã HS hoặc email. Sau
                  khi chọn file bạn sẽ xem trước, sửa và chọn học sinh cần nhập.{" "}
                  <button
                    type="button"
                    className="archive-link"
                    onClick={() => downloadTextFile("class_student_import_template.csv", buildBackendTemplateCsv())}
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" /> Tải file mẫu
                  </button>
                </div>
              )}
            </div>
          )}
          </div>

          <DialogFooter className="gap-2 border-t border-[var(--border-default)] pt-4">
            {result ? (
              <>
                {fresh.length > 0 && (
                  <button
                    type="button"
                    className="btn-line"
                    onClick={() =>
                      setCredentials(
                        fresh.map((a) => ({
                          id: a.uid,
                          fullName: a.fullName,
                          login: a.email,
                          userName: a.userName,
                          password: a.initialPassword,
                          roleLabel: "Học sinh",
                          studentCode: a.studentCode,
                        })),
                      )
                    }
                  >
                    <KeyRound className="h-4 w-4" aria-hidden="true" /> Phiếu tài khoản mới
                  </button>
                )}
                <button type="button" className="btn-ink" onClick={() => onOpenChange(false)}>
                  Xong
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn-line" onClick={() => onOpenChange(false)}>
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn-crimson disabled:opacity-50"
                  disabled={preview.pickedRows.length === 0 || importCsv.isPending}
                  onClick={submit}
                >
                  {importCsv.isPending ? "Đang nhập…" : loaded ? `Nhập ${preview.pickedRows.length} học sinh vào lớp` : "Nhập vào lớp"}
                </button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CredentialsDialog
        open={!!credentials}
        onOpenChange={(o) => !o && setCredentials(null)}
        title="Tài khoản học sinh mới"
        records={credentials ?? []}
        fileName={`tai-khoan-hoc-sinh-lop-${todayStamp()}.csv`}
      />
    </>
  );
}

/* ───────────────────────── Transfer ───────────────────────── */
function TransferDialog({
  classId,
  students,
  onOpenChange,
  onDone,
}: {
  classId: string;
  students: ClassroomStudent[];
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const open = students.length > 0;
  const isTeacher = useRole() === "TEACHER";
  // Teachers may only pick their own classes; School Admin sees every class of the school.
  const teacherRooms = useApiTeacherClassrooms({ page: 0, size: 100 }, open && isTeacher);
  const schoolRooms = useApiSchoolClassrooms({ page: 0, size: 100 }, open && !isTeacher);
  const rooms = isTeacher ? teacherRooms : schoolRooms;
  const { transfer } = useRosterMutations(classId);
  const [to, setTo] = React.useState("");
  const [result, setResult] = React.useState<BatchEnrollResult | null>(null);

  const options = (rooms.data?.items ?? [])
    .filter((c) => c.id !== classId)
    .map((c) => ({ value: c.id, label: `${c.className} · Khối ${c.gradeLevel} · ${c.academicYear}` }));

  const close = () => {
    setTo("");
    setResult(null);
    onOpenChange(false);
  };

  const submit = () =>
    transfer.mutate(
      { targetClassroomId: to, studentIds: students.map((s) => s.studentId) },
      {
        onSuccess: (r) => {
          onDone();
          const res = r as BatchEnrollResult | null;
          if (res && typeof res.successCount === "number") {
            toast.success(`Đã chuyển ${res.successCount} học sinh sang lớp ${res.className}`);
            if (res.notes?.length) setResult(res);
            else close();
          } else {
            toast.success("Đã chuyển lớp");
            close();
          }
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Không chuyển được lớp. Vui lòng thử lại.")),
      },
    );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-md")}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE_CLASS}>Chuyển lớp</DialogTitle>
          <DialogDescription className="text-content-muted">
            {students.length === 1 ? students[0].fullName : `${students.length} học sinh`} sẽ rời lớp này và được thêm vào lớp mới.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <BatchResultView result={result} title="Kết quả chuyển lớp" />
        ) : rooms.isPending ? (
          <p className="text-sm text-content-muted">Đang tải danh sách lớp…</p>
        ) : rooms.isError ? (
          <LoadError message={apiErrorMessage(rooms.error, "Không tải được danh sách lớp.")} onRetry={() => void rooms.refetch()} />
        ) : options.length === 0 ? (
          <p className="text-sm text-content-muted">
            {isTeacher ? "Bạn không phụ trách lớp nào khác để chuyển sang." : "Trường chưa có lớp nào khác để chuyển sang."}
          </p>
        ) : (
          <Field label="Lớp mới" required>
            <StaffFormSelect value={to} onValueChange={setTo} placeholder="Chọn lớp" options={options} className="w-full" />
          </Field>
        )}

        <DialogFooter className="gap-2">
          {result ? (
            <button type="button" className="btn-ink" onClick={close}>
              Xong
            </button>
          ) : (
            <>
              <button type="button" className="btn-line" onClick={close}>
                Hủy
              </button>
              <button type="button" className="btn-crimson disabled:opacity-50" disabled={!to || transfer.isPending} onClick={submit}>
                {transfer.isPending ? "Đang chuyển…" : "Chuyển lớp"}
              </button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
