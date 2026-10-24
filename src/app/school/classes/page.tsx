"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { StaffFormSelect } from "@/components/staff/staff-form";
import { Skeleton } from "@/components/ui/skeleton";
import { NoResults, TableEmpty, TablePagination } from "@/components/saas/accounts-table";
import { ClassFormDialog, CLASS_GRADES, academicYearLabel, currentAcademicYear } from "@/components/saas/class-form-dialog";
import { IconAction, SearchInput, formatNumber } from "@/components/saas/saas-ui";
import { ROUTES } from "@/constants/routes";
import { apiErrorMessage, useApiSchoolClassrooms, useDeleteApiClassroom } from "@/features/saas/hooks-api";
import type { ApiClassroom, ClassroomListParams } from "@/services/school.service";
import { cn } from "@/lib/utils/cn";
import { ClassStatusBadge } from "../_components/classroom";
import { AcademicRolloverButton } from "../_components/token-policy";
import { CopyTag, ErrorBlock, SchoolShell, useDebouncedValue } from "../_components/shared";
import { FetchingBadge, FetchingBar } from "@/components/commons/fetching-indicator";

const ALL = "ALL";
const PAGE_SIZES = [12, 24, 48];
const SORTS = [
  { value: "className,asc", label: "Tên lớp A → Z" },
  { value: "className,desc", label: "Tên lớp Z → A" },
  { value: "gradeLevel,asc", label: "Khối tăng dần" },
  { value: "createdAt,desc", label: "Mới tạo trước" },
];

/** School Admin: classrooms of the school (GET /school-admin/classrooms + classroom CRUD). */
export default function SchoolClassesPage() {
  return (
    <SchoolShell title="Lớp học" description="Tạo lớp theo năm học, phân công giáo viên phụ trách và quản lý trạng thái lớp.">
      <ClassesContent />
    </SchoolShell>
  );
}

function ClassesContent() {
  const thisYear = currentAcademicYear();
  const [search, setSearch] = React.useState("");
  const debounced = useDebouncedValue(search.trim(), 300);
  const [grade, setGrade] = React.useState(ALL);
  const [year, setYear] = React.useState(String(thisYear));
  const [sort, setSort] = React.useState(SORTS[0].value);
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(PAGE_SIZES[0]);

  const filterKey = `${debounced}|${grade}|${year}|${sort}`;
  const [lastKey, setLastKey] = React.useState(filterKey);
  if (filterKey !== lastKey) {
    setLastKey(filterKey);
    setPage(0);
  }

  const params: ClassroomListParams = {
    search: debounced || undefined,
    gradeLevel: grade === ALL ? undefined : Number(grade),
    academicYear: year === ALL ? undefined : Number(year),
    page,
    size,
    sort,
  };
  const classes = useApiSchoolClassrooms(params);
  const remove = useDeleteApiClassroom();

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ApiClassroom | null>(null);
  const [deleting, setDeleting] = React.useState<ApiClassroom | null>(null);

  const rows = classes.data?.items ?? [];
  const total = classes.data?.totalElements ?? 0;
  const filtered = !!debounced || grade !== ALL || year !== String(thisYear);
  const resetFilters = () => {
    setSearch("");
    setGrade(ALL);
    setYear(String(thisYear));
  };

  const yearOptions = [
    { value: ALL, label: "Mọi năm học" },
    ...[thisYear + 1, thisYear, thisYear - 1, thisYear - 2, thisYear - 3].map((y) => ({ value: String(y), label: `Năm học ${academicYearLabel(y)}` })),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm tên lớp, mã lớp..." />
        <StaffFormSelect
          value={grade}
          onValueChange={setGrade}
          options={[{ value: ALL, label: "Tất cả khối" }, ...CLASS_GRADES.map((g) => ({ value: String(g), label: `Khối ${g}` }))]}
          className="w-full sm:w-36"
        />
        <StaffFormSelect value={year} onValueChange={setYear} options={yearOptions} className="w-full sm:w-48" />
        <StaffFormSelect value={sort} onValueChange={setSort} options={SORTS} className="w-full sm:w-44" />
        <div className="hidden flex-1 sm:block" />
        <button
          type="button"
          className="btn-crimson w-full sm:w-auto"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Tạo lớp
        </button>
      </div>

      {classes.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Đang tải danh sách lớp">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full" />
          ))}
        </div>
      ) : classes.isError ? (
        <ErrorBlock error={classes.error} fallback="Không tải được danh sách lớp." onRetry={() => void classes.refetch()} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-content-muted" aria-live="polite">
              <b className="tabular-nums text-content-heading">{total}</b> lớp
              <FetchingBadge active={classes.isFetching} />
            </p>
            <AcademicRolloverButton />
          </div>

          {rows.length === 0 ? (
            <div className="rounded-sm border border-dashed border-[var(--border-strong)]">
              {filtered ? (
                <NoResults onReset={resetFilters} message="Không có lớp phù hợp với bộ lọc." />
              ) : (
                <TableEmpty
                  icon={BookOpen}
                  title="Chưa có lớp nào"
                  description="Tạo lớp cho năm học hiện tại rồi phân công giáo viên phụ trách."
                  action={
                    <button
                      type="button"
                      className="btn-crimson"
                      onClick={() => {
                        setEditing(null);
                        setFormOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" /> Tạo lớp
                    </button>
                  }
                />
              )}
            </div>
          ) : (
            <div className={cn("relative grid gap-4 sm:grid-cols-2 xl:grid-cols-3", classes.isFetching && "opacity-70")}>
              <FetchingBar active={classes.isFetching} />
              {rows.map((c) => (
                <article key={c.id} className="flex flex-col rounded-sm border border-border-card bg-[var(--bg-surface)]">
                  <div className="flex items-start justify-between gap-3 border-b border-[var(--border-strong)] p-4">
                    <div className="min-w-0 space-y-1.5">
                      <h3 className="archive-title is-plain text-2xl">Lớp {c.className}</h3>
                      <p className="text-xs text-content-muted">
                        Khối {c.gradeLevel ?? "—"} · Năm học {academicYearLabel(c.academicYear)}
                      </p>
                      <CopyTag value={c.classCode} label="mã lớp" />
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <IconAction
                        label={`Sửa lớp ${c.className}`}
                        onClick={() => {
                          setEditing(c);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </IconAction>
                      <IconAction label={`Xóa lớp ${c.className}`} tone="danger" onClick={() => setDeleting(c)}>
                        <Trash2 className="h-4 w-4" />
                      </IconAction>
                    </div>
                  </div>
                  <dl className="grid flex-1 grid-cols-[auto_1fr] gap-x-4 gap-y-2 p-4 text-sm">
                    <dt className="text-content-muted">Giáo viên</dt>
                    <dd className="min-w-0 truncate font-medium text-content-heading">
                      {c.teacher ? c.teacher.fullName : <span className="text-[var(--status-warning)]">Chưa phân công</span>}
                    </dd>
                    <dt className="text-content-muted">Sĩ số</dt>
                    <dd className="font-semibold tabular-nums">{formatNumber(c.studentCount ?? 0)} học sinh</dd>
                    {c.dailyTokenQuota ? (
                      <>
                        <dt className="text-content-muted">Token AI</dt>
                        <dd className="tabular-nums text-content-text">{formatNumber(c.dailyTokenQuota)} / học sinh / ngày</dd>
                      </>
                    ) : null}
                    {c.description && (
                      <>
                        <dt className="text-content-muted">Mô tả</dt>
                        <dd className="line-clamp-2 min-w-0 text-content-text">{c.description}</dd>
                      </>
                    )}
                  </dl>
                  <div className="flex items-center justify-between gap-2 border-t border-[var(--border-default)] px-4 py-3">
                    <ClassStatusBadge status={c.status} />
                    <Link href={ROUTES.SCHOOL.CLASS_DETAIL(c.id)} className="archive-link">
                      Xem lớp <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
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

      <ClassFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSaved={(room) => toast.success(editing ? `Đã cập nhật lớp ${room.className}` : `Đã tạo lớp ${room.className} · mã ${room.classCode}`)}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && !remove.isPending && setDeleting(null)}
        title={`Xóa lớp ${deleting?.className ?? ""}?`}
        description={`Lớp sẽ bị gỡ khỏi danh sách${deleting?.studentCount ? ` (đang có ${deleting.studentCount} học sinh)` : ""}. Tài khoản học sinh và giáo viên không bị xóa.`}
        confirmLabel="Xóa lớp"
        variant="danger"
        isPending={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          const target = deleting;
          remove.mutate(target.id, {
            onSuccess: () => {
              toast.success(`Đã xóa lớp ${target.className}`);
              setDeleting(null);
            },
            onError: (error) => toast.error(apiErrorMessage(error, "Không xóa được lớp. Vui lòng thử lại.")),
          });
        }}
      />
    </div>
  );
}
