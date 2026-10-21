"use client";

import * as React from "react";
import { AlertCircle, ArrowRightLeft, ChevronLeft, ChevronRight, Download, FileUp, Gift, KeyRound, RefreshCw, UserMinus, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { buildBackendTemplateCsv, downloadTextFile, withoutAdditionalTokens } from "@/features/saas/student-import";
import type { BatchEnrollResult, ClassroomStudent } from "@/services/assignment.service";
import type { ImportedStudentAccount, StudentImportResult } from "@/services/school.service";
import { cn } from "@/lib/utils/cn";
import { FetchingBadge } from "@/components/commons/fetching-indicator";
import { GrantTokensDialog } from "@/components/saas/token-boost-ui";

/**
 * Roster of one class on the live API (GET/POST/DELETE /classrooms/{id}/students…), shared by School Admin and the
 * teacher in charge. `canManage` adds enroll / CSV import / remove / transfer.
 */

const PAGE_SIZES = [10, 20, 50];
const HEAD = "whitespace-nowrap px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]";
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
        "inline-flex items-center rounded-[2px] border px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em]",
        s?.className ?? "border-[var(--border-strong)] text-[var(--text-tertiary)]",
      )}
    >
      {s?.label ?? status ?? "—"}
    </span>
  );
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-start gap-3 rounded-[2px] border border-[var(--accent-danger)] bg-[var(--bg-surface)] p-4">
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
            <div className="rounded-[2px] border border-dashed border-[var(--border-strong)]">
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
            <div className={cn("overflow-x-auto rounded-[2px] border-y border-[var(--text-primary)] bg-[var(--bg-surface)]", students.isFetching && "opacity-70")}>
              <Table className="min-w-max">
                <caption className="sr-only">Danh sách học sinh của lớp</caption>
                <TableHeader>
                  <TableRow className="border-b border-[var(--border-strong)] hover:bg-transparent">
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
                                className="grid h-7 w-7 place-items-center rounded-[2px] text-[var(--accent-gold)] hover:bg-[var(--accent-gold-active-bg)]"
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
          <div key={label} className="rounded-[2px] border border-[var(--border-strong)] p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{label}</dt>
            <dd className="font-display text-xl font-extrabold tabular-nums text-content-heading">{formatNumber(Number(value))}</dd>
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
              <div className={cn("max-h-[45dvh] overflow-y-auto rounded-[2px] border border-[var(--border-strong)]", available.isFetching && "opacity-70")}>
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
                        className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]"
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

/** The backend CSV reader does not strip a UTF-8 BOM (Excel adds one), which would break the first header. */
async function withoutBom(file: File): Promise<File> {
  const head = new Uint8Array(await file.slice(0, 3).arrayBuffer());
  if (head[0] === 0xef && head[1] === 0xbb && head[2] === 0xbf) return new File([file.slice(3)], file.name, { type: file.type || "text/csv" });
  return file;
}

function ImportCsvDialog({ classId, open, onOpenChange }: { classId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [file, setFile] = React.useState<File | null>(null);
  const [result, setResult] = React.useState<StudentImportResult | null>(null);
  const [credentials, setCredentials] = React.useState<CredentialRecord[] | null>(null);
  const { importCsv } = useRosterMutations(classId);

  const reset = () => {
    setFile(null);
    setResult(null);
  };

  const submit = async () => {
    if (!file) return;
    const noBom = await withoutBom(file);
    // Students spend from the shared school pool, so no tokens are handed out on import.
    const clean = new File([withoutAdditionalTokens(await noBom.text())], noBom.name, { type: "text/csv" });
    importCsv.mutate(
      { file: clean },
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
        <DialogContent className={cn(DIALOG_CLASS, result ? "sm:max-w-3xl" : "sm:max-w-lg")}>
          <DialogHeader>
            <DialogTitle className={DIALOG_TITLE_CLASS}>Nhập học sinh từ CSV</DialogTitle>
            <DialogDescription className="text-content-muted">
              Học sinh đã có trong trường (khớp mã HS hoặc email) được thêm thẳng vào lớp; học sinh mới được tạo tài khoản rồi thêm vào lớp. Học sinh
              dùng quỹ token chung của trường theo hạn mức ngày, không cần cấp token riêng.
            </DialogDescription>
          </DialogHeader>

          {result ? (
            <div className="space-y-4">
              <dl className="grid grid-cols-3 gap-3">
                {[
                  ["Thêm vào lớp", result.successCount],
                  ["Tài khoản mới", fresh.length],
                  ["Dòng lỗi", result.failureCount],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[2px] border border-[var(--border-strong)] p-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{label}</dt>
                    <dd className="font-display text-xl font-extrabold tabular-nums text-content-heading">{formatNumber(Number(value))}</dd>
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
              <Field label="File CSV" required htmlFor="roster-import-file" hint="UTF-8, phân cách bằng dấu phẩy, dòng đầu là tiêu đề cột.">
                <Input
                  id="roster-import-file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="h-10 rounded-[2px] border-[var(--border-strong)] bg-[var(--bg-elevated)]"
                />
              </Field>
              <div className="rounded-[2px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-main)] p-3 text-xs leading-5 text-content-muted">
                Cột: <code className="font-mono">student_code, full_name, email, dob, gender, phone_number, password</code> (cột additional_token nếu có sẽ được bỏ qua). Học sinh
                mới bắt buộc có <code className="font-mono">full_name</code> và <code className="font-mono">dob</code> (yyyy-mm-dd); gender là MALE /
                FEMALE. Học sinh đã có chỉ cần mã HS hoặc email.{" "}
                <button
                  type="button"
                  className="archive-link"
                  onClick={() => downloadTextFile("class_student_import_template.csv", buildBackendTemplateCsv())}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" /> Tải file mẫu
                </button>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
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
                  disabled={!file || importCsv.isPending}
                  onClick={() => void submit()}
                >
                  {importCsv.isPending ? "Đang nhập…" : "Nhập vào lớp"}
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
