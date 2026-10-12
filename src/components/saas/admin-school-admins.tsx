"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Copy,
  KeyRound,
  Loader2,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Unlock,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StaffFormInput } from "@/components/staff/staff-form";
import { NoResults, TableEmpty, TablePagination, TableSkeleton } from "@/components/saas/accounts-table";
import { AccountDrawer } from "@/components/saas/accounts-form";
import { CredentialsDialog } from "@/components/saas/accounts-credentials";
import { copyText, todayStamp, type CredentialRecord } from "@/components/saas/accounts-utils";
import {
  AdminAccountFields,
  ErrorRetry,
  LOOSE_PHONE_PATTERN,
  MutedNotice,
  adminAccountErrors,
  compactPhone,
  emptyAdminAccount,
  focusById,
  useDebouncedValue,
  type AdminAccountValues,
} from "@/components/saas/admin-school-shared";
import { Field, SearchInput, SectionHeading, formatNumber, isValidEmail } from "@/components/saas/saas-ui";
import {
  apiErrorMessage,
  apiErrorStatus,
  saasKeys,
  useApiSchoolAdmins,
  useCreateApiSchoolAdmin,
  useSchoolAdminMutations,
} from "@/features/saas/hooks-api";
import {
  adminCredentialRecord,
  codeSlug,
  formatDateTime,
  resetCredentialRecord,
  schoolAdminActionError,
  schoolAdminCreateError,
  schoolAdminUpdateError,
  useSchoolAdminCounts,
  type AdminFormField,
} from "@/features/saas/admin-schools";
import { schoolService, type ApiSchool, type ApiSchoolAdmin } from "@/services/school.service";
import { cn } from "@/lib/utils/cn";

/**
 * "Quản trị trường" tab of the System Admin school detail page: the school's School Admin accounts
 * (`GET /admin/schools/{id}/school-admins`, server-side search / filter / sort / paging) with create, edit,
 * lock / unlock, reset password and delete.
 */

type SortBy = "fullName" | "email" | "userName" | "createdAt";
type SortDirection = "asc" | "desc";
type StatusFilter = "all" | "active" | "locked";
type ConfirmKind = "lock" | "unlock" | "reset" | "delete";

const PAGE_SIZES = [10, 20, 50];
const COLS = 7;
const STICKY = "sticky left-0 z-10 bg-[var(--bg-surface)]";
const PILL = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[2px] border px-2 py-0.5 text-[11px] font-bold";
const LAST_ADMIN_REASON = "Trường cần ít nhất một quản trị đang hoạt động";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "active", label: "Đang hoạt động" },
  { value: "locked", label: "Đã khóa" },
];

const ACTIVE_PARAM: Record<StatusFilter, boolean | undefined> = { all: undefined, active: true, locked: false };

export function SchoolAdminsTab({ school }: { school: ApiSchool }) {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [filter, setFilter] = React.useState<StatusFilter>("all");
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);
  const [sortBy, setSortBy] = React.useState<SortBy>("createdAt");
  const [direction, setDirection] = React.useState<SortDirection>("desc");

  const [addOpen, setAddOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ApiSchoolAdmin | null>(null);
  const [confirm, setConfirm] = React.useState<{ kind: ConfirmKind; admin: ApiSchoolAdmin } | null>(null);
  const [credentials, setCredentials] = React.useState<{ record: CredentialRecord; reset: boolean } | null>(null);

  // Back to the first page whenever the query changes.
  const [lastSearch, setLastSearch] = React.useState(debouncedSearch);
  if (debouncedSearch !== lastSearch) {
    setLastSearch(debouncedSearch);
    setPage(0);
  }

  const params = { search: debouncedSearch || undefined, active: ACTIVE_PARAM[filter], page, size, sortBy, sortDirection: direction };
  const { data, isLoading, isError, error, refetch, isFetching, isPlaceholderData } = useApiSchoolAdmins(school.id, params);
  const counts = useSchoolAdminCounts(school.id);
  const mutations = useSchoolAdminMutations();

  // Keep the page in range if the total shrank (e.g. after a delete on the last page).
  const totalPages = data?.totalPages ?? 1;
  if (data && !isPlaceholderData && page > 0 && page > totalPages - 1) setPage(Math.max(0, totalPages - 1));

  function onSort(column: SortBy) {
    if (column === sortBy) setDirection((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(column);
      setDirection(column === "createdAt" ? "desc" : "asc");
    }
    setPage(0);
  }

  function resetFilters() {
    setSearch("");
    setFilter("all");
    setPage(0);
  }

  /**
   * Why locking / deleting this admin is blocked, or null. The backend allows locking the last active
   * School Admin, which would leave the school with nobody to manage it, so the check is done here
   * against the active count over every page.
   */
  function lastAdminReason(admin: ApiSchoolAdmin): string | null {
    if (!admin.active) return null;
    if (counts.active === undefined) {
      return counts.activeError
        ? "Không kiểm tra được số quản trị đang hoạt động. Tải lại trang rồi thử lại."
        : "Đang kiểm tra số quản trị đang hoạt động...";
    }
    return counts.active <= 1 ? LAST_ADMIN_REASON : null;
  }

  const rows = data?.items ?? [];
  const total = data?.totalElements ?? 0;
  const filtered = debouncedSearch !== "" || filter !== "all";
  const sortProps = { sortBy, direction, onSort };
  const ariaSort = (c: SortBy) => (sortBy === c ? (direction === "asc" ? "ascending" : "descending") : "none");

  /* ── Confirm actions ── */
  const pending =
    mutations.setActive.isPending || mutations.remove.isPending || mutations.resetPassword.isPending;

  function onActionError(err: unknown, fallback: string) {
    toast.error(schoolAdminActionError(err, fallback));
    // A 404 means someone else removed the account: reload so the row disappears.
    if (apiErrorStatus(err) === 404) void qc.invalidateQueries({ queryKey: ["saas", "school-admins"] });
  }

  const [checking, setChecking] = React.useState(false);

  async function runConfirm() {
    if (!confirm || pending || checking) return;
    const { kind, admin } = confirm;
    if ((kind === "lock" || kind === "delete") && admin.active) {
      let reason = lastAdminReason(admin);
      if (!reason) {
        // Re-read the active count right before acting: the cached one may be stale (another tab, a lock just made).
        setChecking(true);
        try {
          const activeParams = { active: true, page: 0, size: 1 };
          const fresh = await qc.fetchQuery({
            queryKey: saasKeys.schoolAdmins(school.id, activeParams),
            queryFn: () => schoolService.listSchoolAdmins(school.id, activeParams),
            staleTime: 0,
          });
          if (fresh.totalElements <= 1) reason = LAST_ADMIN_REASON;
        } catch {
          reason = "Không kiểm tra được số quản trị đang hoạt động. Vui lòng thử lại.";
        } finally {
          setChecking(false);
        }
      }
      if (reason) {
        toast.error(reason);
        setConfirm(null);
        return;
      }
    }
    const close = () => setConfirm(null);
    if (kind === "lock" || kind === "unlock") {
      const active = kind === "unlock";
      mutations.setActive.mutate(
        { id: admin.uid, active },
        {
          onSuccess: () => {
            toast.success(active ? `Đã mở khóa tài khoản của ${admin.fullName}` : `Đã khóa tài khoản của ${admin.fullName}`);
            close();
          },
          onError: (err) => onActionError(err, "Không cập nhật được trạng thái. Vui lòng thử lại."),
        },
      );
    } else if (kind === "delete") {
      mutations.remove.mutate(admin.uid, {
        onSuccess: () => {
          toast.success(`Đã xóa tài khoản quản trị ${admin.fullName}`);
          close();
        },
        onError: (err) => onActionError(err, "Không xóa được tài khoản. Vui lòng thử lại."),
      });
    } else {
      mutations.resetPassword.mutate(admin.uid, {
        onSuccess: (result) => {
          close();
          if (result?.initialPassword) {
            toast.success(`Đã đặt lại mật khẩu cho ${admin.fullName}`);
            setCredentials({ record: resetCredentialRecord(result), reset: true });
          } else {
            toast.error("Máy chủ không trả về mật khẩu tạm. Vui lòng đặt lại mật khẩu lần nữa.");
          }
        },
        onError: (err) => onActionError(err, "Không đặt lại được mật khẩu. Vui lòng thử lại."),
      });
    }
  }

  const addButton = (
    <button type="button" className="btn-crimson w-full sm:w-auto" onClick={() => setAddOpen(true)}>
      <Plus className="h-4 w-4" aria-hidden="true" /> Thêm quản trị trường
    </button>
  );

  return (
    <div className="space-y-4">
      <SectionHeading
        title="Quản trị trường"
        description="Quản trị trường tạo tài khoản giáo viên, học sinh, lớp học và phân bổ token của trường. Họ đăng nhập bằng email."
        actions={addButton}
      />

      {counts.active === 0 && (counts.total ?? 0) > 0 && (
        <p
          role="note"
          className="flex items-start gap-2 rounded-[2px] border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-3 py-2 text-sm text-[var(--text-secondary)]"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-warning)]" aria-hidden="true" />
          <span>Trường chưa có quản trị nào đang hoạt động. Mở khóa một tài khoản hoặc thêm quản trị mới để trường tiếp tục quản lý tài khoản.</span>
        </p>
      )}
      {counts.active === 1 && (
        <MutedNotice>Trường chỉ còn một quản trị đang hoạt động, nên không thể khóa hoặc xóa tài khoản này. Thêm quản trị khác trước nếu cần thay người.</MutedNotice>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm họ tên, email, tên tài khoản..." className="sm:w-[320px]" />
        <div role="group" aria-label="Lọc theo trạng thái" className="flex w-full sm:w-auto">
          {FILTERS.map((f, i) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => {
                setFilter(f.value);
                setPage(0);
              }}
              className={cn(
                "h-10 flex-1 whitespace-nowrap border border-[var(--text-primary)] px-3 text-xs font-bold transition-colors focus-visible:relative focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)] sm:flex-none",
                i > 0 && "-ml-px",
                filter === f.value
                  ? "bg-[var(--text-primary)] text-[var(--text-inverse)]"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--status-neutral-bg)] hover:text-[var(--text-primary)]",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {!isLoading && !isError && (
        <p className="flex items-center gap-2 text-sm text-content-muted" aria-live="polite">
          {filtered ? `${formatNumber(total)} tài khoản khớp bộ lọc` : `${formatNumber(total)} tài khoản`}
          {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent-gold)]" aria-label="Đang cập nhật" />}
        </p>
      )}

      {isLoading ? (
        <div role="status" aria-label="Đang tải danh sách quản trị trường">
          <TableSkeleton rows={3} cols={6} />
        </div>
      ) : isError ? (
        <ErrorRetry
          title="Không tải được danh sách quản trị trường"
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
              <caption className="sr-only">Quản trị trường của {school.name}</caption>
              <TableHeader>
                <TableRow className="border-b border-[var(--border-strong)] hover:bg-transparent">
                  <TableHead className={cn("px-3", STICKY, "z-20")} aria-sort={ariaSort("fullName")}>
                    <SortHeader label="Họ và tên" column="fullName" {...sortProps} />
                  </TableHead>
                  <TableHead className="px-3" aria-sort={ariaSort("email")}>
                    <SortHeader label="Email đăng nhập" column="email" {...sortProps} />
                  </TableHead>
                  <TableHead className="px-3" aria-sort={ariaSort("userName")}>
                    <SortHeader label="Tên tài khoản" column="userName" {...sortProps} />
                  </TableHead>
                  <TableHead className="px-3">
                    <PlainHeader>Số điện thoại</PlainHeader>
                  </TableHead>
                  <TableHead className="px-3">
                    <PlainHeader>Trạng thái</PlainHeader>
                  </TableHead>
                  <TableHead className="px-3" aria-sort={ariaSort("createdAt")}>
                    <SortHeader label="Ngày tạo" column="createdAt" {...sortProps} />
                  </TableHead>
                  <TableHead className="w-12 px-3">
                    <span className="sr-only">Thao tác</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={COLS} className="p-0">
                      {filtered ? (
                        <NoResults onReset={resetFilters} message="Không có quản trị trường nào khớp bộ lọc." />
                      ) : (
                        <TableEmpty
                          icon={UserCog}
                          title="Trường chưa có quản trị trường"
                          description="Cấp tài khoản để trường bắt đầu sử dụng. Mật khẩu tạm chỉ hiển thị một lần ngay sau khi tạo."
                          action={
                            <button type="button" className="btn-crimson" onClick={() => setAddOpen(true)}>
                              <Plus className="h-4 w-4" aria-hidden="true" /> Thêm quản trị trường
                            </button>
                          }
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((a) => {
                    const blocked = lastAdminReason(a);
                    return (
                      <TableRow key={a.uid} className="border-b border-[var(--border-default)] last:border-b-0 hover:bg-[var(--status-neutral-bg)]">
                        <TableCell className={cn("px-3 py-2.5", STICKY)}>
                          <p className="min-w-[150px] max-w-[240px] whitespace-normal text-sm font-semibold leading-snug text-content-heading">{a.fullName}</p>
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <span className="block max-w-[240px] truncate text-sm" title={a.email}>
                            {a.email}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1">
                            <span className="font-mono text-xs">{a.userName}</span>
                            <button
                              type="button"
                              onClick={() => void copyText(a.userName, "Đã sao chép tên tài khoản")}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-[2px] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--status-neutral-bg)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]"
                              aria-label={`Sao chép tên tài khoản ${a.userName}`}
                              title="Sao chép tên tài khoản"
                            >
                              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <span className="whitespace-nowrap text-sm tabular-nums">{a.phoneNumber || <span className="text-content-muted">—</span>}</span>
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <AdminStatusPill active={a.active} />
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <span className="whitespace-nowrap text-xs tabular-nums">{formatDateTime(a.createdAt)}</span>
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <AdminRowMenu
                            label={`Thao tác với ${a.fullName}`}
                            actions={[
                              { label: "Sửa thông tin", icon: Pencil, onSelect: () => setEditing(a) },
                              a.active
                                ? { label: "Khóa tài khoản", icon: Lock, onSelect: () => setConfirm({ kind: "lock", admin: a }), disabledReason: blocked }
                                : { label: "Mở khóa tài khoản", icon: Unlock, tone: "success", onSelect: () => setConfirm({ kind: "unlock", admin: a }) },
                              { label: "Đặt lại mật khẩu", icon: KeyRound, onSelect: () => setConfirm({ kind: "reset", admin: a }) },
                              {
                                label: "Xóa tài khoản",
                                icon: Trash2,
                                tone: "danger",
                                separated: true,
                                onSelect: () => setConfirm({ kind: "delete", admin: a }),
                                disabledReason: blocked,
                              },
                            ]}
                          />
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

      <AddAdminDrawer open={addOpen} onOpenChange={setAddOpen} school={school} onCreated={(record) => setCredentials({ record, reset: false })} />

      <EditAdminDrawer admin={editing} onClose={() => setEditing(null)} />

      {confirm && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setConfirm(null)}
          isPending={pending || checking}
          onConfirm={() => void runConfirm()}
          {...confirmCopy(confirm.kind, confirm.admin)}
        />
      )}

      {credentials && (
        <CredentialsDialog
          open
          onOpenChange={(o) => !o && setCredentials(null)}
          title={credentials.reset ? "Mật khẩu tạm mới" : "Tài khoản quản trị trường"}
          description={
            credentials.reset
              ? `Mật khẩu của ${credentials.record.fullName} đã được đặt lại; mật khẩu cũ không còn dùng được. Gửi thông tin này cho người dùng qua kênh an toàn.`
              : undefined
          }
          records={[credentials.record]}
          schoolName={school.name}
          fileName={`quan-tri-${codeSlug(school.schoolCode)}-${todayStamp()}.csv`}
        />
      )}
    </div>
  );
}

/* ───────────────────────── Confirm copy ───────────────────────── */
function confirmCopy(kind: ConfirmKind, a: ApiSchoolAdmin) {
  switch (kind) {
    case "lock":
      return {
        title: "Khóa tài khoản?",
        description: `${a.fullName} sẽ không đăng nhập được cho tới khi được mở khóa. Dữ liệu của tài khoản và của trường được giữ nguyên.`,
        confirmLabel: "Khóa tài khoản",
        variant: "warning" as const,
      };
    case "unlock":
      return {
        title: "Mở khóa tài khoản?",
        description: `${a.fullName} có thể đăng nhập lại bằng email ${a.email} và mật khẩu hiện tại.`,
        confirmLabel: "Mở khóa",
        variant: "primary" as const,
      };
    case "reset":
      return {
        title: "Đặt lại mật khẩu?",
        description: `Mật khẩu hiện tại của ${a.fullName} sẽ ngừng hoạt động ngay. Hệ thống tạo mật khẩu tạm mới, chỉ hiển thị một lần; người dùng phải đổi mật khẩu ở lần đăng nhập tới.${
          a.active ? "" : " Tài khoản đang bị khóa, cần mở khóa thì mới đăng nhập được."
        }`,
        confirmLabel: "Đặt lại mật khẩu",
        variant: "warning" as const,
      };
    case "delete":
      return {
        title: "Xóa quản trị trường?",
        description: `${a.fullName} sẽ không đăng nhập được nữa. Đây là xóa mềm: dữ liệu được giữ lại để tra cứu và tài khoản vẫn hiện trong danh sách với trạng thái Đã khóa.`,
        confirmLabel: "Xóa tài khoản",
        variant: "danger" as const,
      };
  }
}

/* ───────────────────────── Table pieces ───────────────────────── */
function AdminStatusPill({ active }: { active: boolean }) {
  return active ? (
    <span className={cn(PILL, "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]")}>Đang hoạt động</span>
  ) : (
    <span className={cn(PILL, "border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--accent-danger)]")}>
      <Lock className="h-3 w-3" aria-hidden="true" /> Đã khóa
    </span>
  );
}

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

interface MenuAction {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  tone?: "danger" | "success";
  /** Set when the action is blocked; shown under the label (disabled items get no hover tooltip). */
  disabledReason?: string | null;
  separated?: boolean;
}

function AdminRowMenu({ label, actions }: { label: string; actions: MenuAction[] }) {
  return (
    <div className="flex justify-end">
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
        <DropdownMenuContent align="end" className="staff-theme w-[260px] max-w-[calc(100vw-2rem)] bg-[var(--bg-surface)] text-content-text">
          {actions.map((a) => {
            const Icon = a.icon;
            const disabled = Boolean(a.disabledReason);
            return (
              <React.Fragment key={a.label}>
                {a.separated && <DropdownMenuSeparator className="bg-[var(--border-default)]" />}
                <DropdownMenuItem
                  disabled={disabled}
                  title={a.disabledReason ?? undefined}
                  onSelect={() => a.onSelect()}
                  className={cn(
                    "items-start rounded-[2px] focus:bg-[var(--status-neutral-bg)]",
                    a.tone === "danger" && "text-[var(--accent-danger)] focus:text-[var(--accent-danger)]",
                    a.tone === "success" && "text-[var(--status-success)] focus:text-[var(--status-success)]",
                  )}
                >
                  <Icon className="mt-0.5 h-4 w-4 text-current" aria-hidden="true" />
                  <span className="flex-1">
                    <span className="block">{a.label}</span>
                    {disabled && <span className="block text-[11px] leading-snug text-content-muted">{a.disabledReason}</span>}
                  </span>
                </DropdownMenuItem>
              </React.Fragment>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* ───────────────────────── Form error block ───────────────────────── */
function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-[2px] border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--text-secondary)]"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-danger)]" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

/* ───────────────────────── Edit drawer ───────────────────────── */
const EDIT_PREFIX = "edit-admin";

function editErrors(v: AdminAccountValues): Record<AdminFormField, string | null> {
  const name = v.fullName.trim();
  const phone = v.phoneNumber.trim();
  return {
    fullName: !name ? "Nhập họ và tên" : name.length < 2 || name.length > 150 ? "Họ và tên từ 2 đến 150 ký tự" : null,
    email: !v.email.trim() ? "Nhập email" : isValidEmail(v.email) ? null : "Email không hợp lệ",
    phoneNumber: !phone
      ? null
      : compactPhone(phone).length > 20
        ? "Số điện thoại tối đa 20 ký tự"
        : LOOSE_PHONE_PATTERN.test(phone)
          ? null
          : "Số điện thoại không hợp lệ",
  };
}

function EditAdminDrawer({ admin, onClose }: { admin: ApiSchoolAdmin | null; onClose: () => void }) {
  const { update } = useSchoolAdminMutations();
  const [values, setValues] = React.useState<AdminAccountValues>(emptyAdminAccount);
  const [touched, setTouched] = React.useState(false);
  const [serverErrors, setServerErrors] = React.useState<Partial<Record<AdminFormField, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const busy = update.isPending;

  // Load the row into the form each time a (different) admin is opened.
  const [loadedId, setLoadedId] = React.useState<string | null>(null);
  const openId = admin?.uid ?? null;
  if (openId !== loadedId) {
    setLoadedId(openId);
    if (admin) {
      setValues({ fullName: admin.fullName, email: admin.email, phoneNumber: admin.phoneNumber ?? "" });
      setTouched(false);
      setServerErrors({});
      setFormError(null);
    }
  }

  const errors = editErrors(values);
  const err = (k: AdminFormField) => serverErrors[k] ?? (touched ? errors[k] : null);
  const emailChanged = !!admin && values.email.trim().toLowerCase() !== admin.email.toLowerCase();
  const dirty =
    !!admin &&
    (values.fullName.trim() !== admin.fullName ||
      emailChanged ||
      compactPhone(values.phoneNumber.trim()) !== compactPhone(admin.phoneNumber ?? ""));

  function setField(k: AdminFormField, v: string) {
    setValues((prev) => ({ ...prev, [k]: v }));
    setServerErrors((prev) => {
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!admin || busy) return;
    setTouched(true);
    setFormError(null);
    const firstInvalid = (Object.keys(errors) as AdminFormField[]).find((k) => errors[k]);
    if (firstInvalid) {
      focusById(`${EDIT_PREFIX}-${firstInvalid}`);
      return;
    }
    if (!dirty) {
      onClose();
      return;
    }
    const phone = values.phoneNumber.trim();
    update.mutate(
      {
        id: admin.uid,
        payload: {
          fullName: values.fullName.trim(),
          email: values.email.trim().toLowerCase(),
          // Full replace: an empty phone clears it.
          phoneNumber: phone ? compactPhone(phone) : undefined,
        },
      },
      {
        onSuccess: (saved) => {
          toast.success(`Đã lưu thông tin của ${saved?.fullName ?? values.fullName.trim()}`);
          onClose();
        },
        onError: (error) => {
          const mapped = schoolAdminUpdateError(error);
          const fields = Object.keys(mapped.fields) as AdminFormField[];
          if (fields.length > 0) {
            setServerErrors(mapped.fields);
            focusById(`${EDIT_PREFIX}-${fields[0]}`);
          }
          if (mapped.message) setFormError(mapped.message);
        },
      },
    );
  }

  return (
    <AccountDrawer
      open={!!admin}
      onOpenChange={(o) => !o && !busy && onClose()}
      title="Sửa thông tin"
      description={admin ? `Tài khoản quản trị trường của ${admin.fullName}.` : undefined}
      footer={
        <>
          <button type="button" className="btn-line w-full sm:w-auto" onClick={onClose} disabled={busy}>
            Hủy
          </button>
          <button type="submit" form="edit-school-admin-form" className="btn-crimson w-full disabled:opacity-60 sm:w-auto" disabled={busy || !dirty}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </button>
        </>
      }
    >
      {admin && (
        <form id="edit-school-admin-form" onSubmit={submit} noValidate className="space-y-4" aria-busy={busy}>
          {formError && <FormError message={formError} />}
          <Field label="Họ và tên" required error={err("fullName")} htmlFor={`${EDIT_PREFIX}-fullName`}>
            <StaffFormInput
              id={`${EDIT_PREFIX}-fullName`}
              maxLength={150}
              value={values.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
              aria-invalid={!!err("fullName")}
            />
          </Field>
          <Field label="Email đăng nhập" required error={err("email")} htmlFor={`${EDIT_PREFIX}-email`}>
            <StaffFormInput
              id={`${EDIT_PREFIX}-email`}
              type="email"
              autoComplete="off"
              value={values.email}
              onChange={(e) => setField("email", e.target.value)}
              aria-invalid={!!err("email")}
            />
          </Field>
          <Field label="Số điện thoại" error={err("phoneNumber")} htmlFor={`${EDIT_PREFIX}-phoneNumber`} hint="Không bắt buộc. Để trống để xóa số đã lưu.">
            <StaffFormInput
              id={`${EDIT_PREFIX}-phoneNumber`}
              type="tel"
              maxLength={24}
              value={values.phoneNumber}
              onChange={(e) => setField("phoneNumber", e.target.value)}
              placeholder="0903 112 233"
              aria-invalid={!!err("phoneNumber")}
            />
          </Field>
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Tên tài khoản</p>
            <p className="break-all font-mono text-sm text-content-text">{admin.userName}</p>
            <p className="text-[11px] text-content-muted">Do hệ thống cấp, không thay đổi được.</p>
          </div>
          {emailChanged && (
            <MutedNotice>
              Sau khi lưu, {admin.fullName} đăng nhập bằng email mới; email cũ không dùng được nữa. Mật khẩu giữ nguyên.
            </MutedNotice>
          )}
        </form>
      )}
    </AccountDrawer>
  );
}

/* ───────────────────────── Add drawer ───────────────────────── */
const ID_PREFIX = "add-admin";

function AddAdminDrawer({
  open,
  onOpenChange,
  school,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  school: ApiSchool;
  onCreated: (record: CredentialRecord) => void;
}) {
  // Invalidates ["saas", "school-admins"] on success, so the list and counts refresh.
  const createAdmin = useCreateApiSchoolAdmin();
  const [values, setValues] = React.useState<AdminAccountValues>(emptyAdminAccount);
  const [touched, setTouched] = React.useState(false);
  const [serverErrors, setServerErrors] = React.useState<Partial<Record<AdminFormField, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const errors = adminAccountErrors(values);
  const err = (k: AdminFormField) => serverErrors[k] ?? (touched ? errors[k] : null);
  const busy = createAdmin.isPending;

  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setValues(emptyAdminAccount());
      setTouched(false);
      setServerErrors({});
      setFormError(null);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setTouched(true);
    setFormError(null);
    if (Object.values(errors).some(Boolean)) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>("#add-school-admin-form [aria-invalid='true']")?.focus());
      return;
    }
    createAdmin.mutate(
      {
        schoolId: school.id,
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        phoneNumber: values.phoneNumber.trim() ? compactPhone(values.phoneNumber.trim()) : undefined,
      },
      {
        onSuccess: (created) => {
          toast.success(`Đã tạo tài khoản quản trị cho ${created.fullName}`);
          onOpenChange(false);
          if (created.initialPassword) onCreated(adminCredentialRecord(created));
        },
        onError: (error) => {
          const mapped = schoolAdminCreateError(error);
          if (mapped.field) {
            setServerErrors({ [mapped.field]: mapped.message });
            focusById(`${ID_PREFIX}-${mapped.field}`);
          } else {
            setFormError(mapped.message);
          }
        },
      },
    );
  }

  return (
    <AccountDrawer
      open={open}
      onOpenChange={(o) => !busy && onOpenChange(o)}
      title="Thêm quản trị trường"
      description={`Tài khoản quản trị mới của ${school.name}.`}
      footer={
        <>
          <button type="button" className="btn-line w-full sm:w-auto" onClick={() => onOpenChange(false)} disabled={busy}>
            Hủy
          </button>
          <button type="submit" form="add-school-admin-form" className="btn-crimson w-full disabled:opacity-60 sm:w-auto" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Đang tạo...
              </>
            ) : (
              "Tạo tài khoản"
            )}
          </button>
        </>
      }
    >
      <form id="add-school-admin-form" onSubmit={submit} noValidate className="space-y-4" aria-busy={busy}>
        {formError && <FormError message={formError} />}
        <AdminAccountFields
          idPrefix={ID_PREFIX}
          values={values}
          onChange={(v) => {
            setValues(v);
            setServerErrors({});
          }}
          errors={{ fullName: err("fullName"), email: err("email"), phoneNumber: err("phoneNumber") }}
        />
      </form>
    </AccountDrawer>
  );
}
