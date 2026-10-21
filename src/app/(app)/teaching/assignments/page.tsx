"use client";

// Bai tap da giao: chay tren API that (GET /teacher/assignments/classroom/{id}).
// BE khong co API liet ke bai tap cua giao vien tren moi lop -> tai rieng tung lop roi gop lai.
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { ArrowRight, ClipboardList, Plus } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { StaffFormSelect } from "@/components/staff/staff-form";
import { SaasShell, SearchInput, normalizeText } from "@/components/saas/saas-ui";
import { ALL, SegmentedFilter, TD, TH, TR, TableShell } from "@/components/saas/teaching-ui";
import { ClassroomCardsSkeleton, ClassroomLoadError } from "@/components/saas/api-classroom-ui";
import {
  ASSIGNMENT_STATUS_META,
  ASSIGNMENT_TYPES,
  ASSIGNMENT_TYPE_META,
  ApiAssignmentTypeBadge,
  AssignmentCounts,
  AssignmentStatusBadge,
  DeadlineBadge,
  formatLocalDateTime,
  newAssignmentHref,
  requirementText,
} from "@/components/saas/teacher-class-assignments";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { apiErrorMessage, useMyApiClassrooms } from "@/features/saas/hooks-api";
import { assignmentKeys } from "@/features/saas/hooks-assignment-api";
import { assignmentService, type AssignmentStatus, type AssignmentType, type TeacherAssignmentListParams } from "@/services/assignment.service";
import { cn } from "@/lib/utils/cn";

/** So bai toi da tai cho moi lop (BE phan trang, mac dinh 20). */
const PER_CLASS = 100;

const STATUS_FILTERS: { value: AssignmentStatus | typeof ALL; label: string }[] = [
  { value: ALL, label: "Tất cả" },
  { value: "ACTIVE", label: ASSIGNMENT_STATUS_META.ACTIVE.label },
  { value: "ARCHIVED", label: ASSIGNMENT_STATUS_META.ARCHIVED.label },
  { value: "CANCELLED", label: ASSIGNMENT_STATUS_META.CANCELLED.label },
];

/** Assignments the teacher gave to their classes (Role Matrix row 16). */
export default function TeachingAssignmentsPage() {
  return (
    <SaasShell live variant="app" title="Bài tập đã giao" description="Bài đọc bối cảnh, trò chuyện với nhân vật và bài kiểm tra kèm hạn nộp cho các lớp của bạn.">
      <React.Suspense fallback={null}>
        <AssignmentList />
      </React.Suspense>
    </SaasShell>
  );
}

function AssignmentList() {
  const role = useRole();
  const router = useRouter();
  const params = useSearchParams();
  const { classes, truncated, isLoading, isError, error, refetch } = useMyApiClassrooms(role);

  const requested = params.get("classId");
  const classId = requested && classes.some((c) => c.id === requested) ? requested : ALL;
  const [status, setStatus] = React.useState<AssignmentStatus | typeof ALL>(ALL);
  const [type, setType] = React.useState<AssignmentType | typeof ALL>(ALL);
  const [search, setSearch] = React.useState("");

  const setClass = (v: string) =>
    router.replace(v === ALL ? ROUTES.TEACHING.ASSIGNMENTS : `${ROUTES.TEACHING.ASSIGNMENTS}?classId=${encodeURIComponent(v)}`, { scroll: false });

  const targetClasses = classId === ALL ? classes : classes.filter((c) => c.id === classId);
  const listParams: TeacherAssignmentListParams = { page: 0, size: PER_CLASS, ...(status === ALL ? {} : { status }) };
  const results = useQueries({
    queries: targetClasses.map((c) => ({
      queryKey: assignmentKeys.byClassroom(c.id, listParams),
      queryFn: () => assignmentService.listByClassroom(c.id, listParams),
    })),
  });

  if (role !== "TEACHER") {
    return <EmptyState icon={ClipboardList} title="Dành cho giáo viên" description="Mục này dành cho tài khoản giáo viên của trường." />;
  }
  if (isLoading) return <ClassroomCardsSkeleton count={3} />;
  if (isError) {
    return <ClassroomLoadError message={apiErrorMessage(error, "Vui lòng kiểm tra kết nối rồi thử lại.")} onRetry={() => void refetch()} />;
  }
  if (classes.length === 0) {
    return <EmptyState icon={ClipboardList} title="Chưa có lớp giảng dạy" description="Bạn cần được phân công lớp trước khi giao bài." />;
  }

  const loading = results.some((r) => r.isPending);
  const failed = results.filter((r) => r.isError);
  const all = results.flatMap((r) => r.data?.items ?? []);
  const clipped = results.some((r) => (r.data?.totalElements ?? 0) > (r.data?.items.length ?? 0));
  const q = normalizeText(search);
  const rows = all
    .filter((a) => (type === ALL || a.assignmentType === type) && (!q || normalizeText(`${a.title} ${a.targetTitle ?? ""}`).includes(q)))
    // Gop nhieu lop: bai moi tao truoc (giong thu tu mac dinh cua BE).
    .sort((x, y) => (y.createdAt ?? "").localeCompare(x.createdAt ?? ""));

  const newHref = newAssignmentHref(classId === ALL ? null : classId);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <StaffFormSelect
            value={classId}
            onValueChange={setClass}
            options={[{ value: ALL, label: "Tất cả lớp" }, ...classes.map((c) => ({ value: c.id, label: `Lớp ${c.className}` }))]}
            className="w-full sm:w-[200px]"
          />
          <StaffFormSelect
            value={type}
            onValueChange={setType}
            options={[{ value: ALL, label: "Mọi loại bài" }, ...ASSIGNMENT_TYPES.map((t) => ({ value: t, label: ASSIGNMENT_TYPE_META[t].label }))]}
            className="w-full sm:w-[180px]"
          />
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên bài, nội dung..." />
        </div>
        <Link href={newHref} className="btn-crimson">
          <Plus className="h-4 w-4" aria-hidden="true" /> Giao bài tập
        </Link>
      </div>

      <SegmentedFilter label="Lọc theo trạng thái bài" value={status} onChange={setStatus} options={STATUS_FILTERS} />

      {failed.length > 0 && (
        <ClassroomLoadError
          message={`${failed.length} lớp không tải được bài tập: ${apiErrorMessage(failed[0].error, "lỗi không xác định")}`}
          onRetry={() => failed.forEach((r) => void r.refetch())}
        />
      )}

      {loading && rows.length === 0 ? (
        <div className="h-40 animate-pulse rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] motion-reduce:animate-none" aria-busy="true" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Không có bài tập phù hợp"
          description="Thử đổi bộ lọc hoặc giao bài mới cho lớp."
          action={
            <Link href={newHref} className="btn-ink">
              Giao bài tập
            </Link>
          }
        />
      ) : (
        <TableShell>
          <thead>
            <tr className="border-b border-[var(--border-strong)]">
              <th className={TH}>Loại</th>
              <th className={TH}>Bài tập</th>
              <th className={TH}>Lớp</th>
              <th className={TH}>Hạn nộp</th>
              <th className={TH}>Yêu cầu</th>
              <th className={TH}>Trạng thái</th>
              <th className={TH}>Nộp bài</th>
              <th className={cn(TH, "text-right")}>
                <span className="sr-only">Chi tiết</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.assignmentId} className={TR}>
                <td className={TD}>
                  <ApiAssignmentTypeBadge type={a.assignmentType} />
                </td>
                <td className={cn(TD, "max-w-[270px]")}>
                  <Link href={ROUTES.TEACHING.ASSIGNMENT_DETAIL(a.assignmentId)} className="font-semibold text-content-heading hover:text-[var(--accent-gold)]">
                    {a.title}
                  </Link>
                  <p className="truncate text-xs text-content-muted" title={a.targetTitle ?? undefined}>
                    {ASSIGNMENT_TYPE_META[a.assignmentType]?.target ?? "Nội dung"}: {a.targetTitle || "—"}
                  </p>
                  {a.description && (
                    <p className="truncate text-xs text-[var(--text-secondary)]" title={a.description}>
                      {a.description}
                    </p>
                  )}
                </td>
                <td className={cn(TD, "font-medium")}>
                  <Link href={ROUTES.CLASS_DETAIL(a.classroomId)} className="hover:text-[var(--accent-gold)]">
                    {a.className}
                  </Link>
                </td>
                <td className={TD}>
                  <div className="flex flex-col items-start gap-1">
                    <span className="tabular-nums">{formatLocalDateTime(a.deadline)}</span>
                    {a.status === "ACTIVE" && <DeadlineBadge deadline={a.deadline} />}
                  </div>
                </td>
                <td className={cn(TD, "text-xs")}>{requirementText(a.assignmentType, a.minRequirement)}</td>
                <td className={TD}>
                  <AssignmentStatusBadge status={a.status} />
                </td>
                <td className={TD}>
                  <AssignmentCounts assignment={a} compact />
                </td>
                <td className={cn(TD, "text-right")}>
                  <Link
                    href={ROUTES.TEACHING.ASSIGNMENT_DETAIL(a.assignmentId)}
                    className="inline-grid h-8 w-8 place-items-center rounded-[2px] text-content-muted hover:bg-[var(--bg-elevated)] hover:text-[var(--accent-gold)]"
                    aria-label={`Chi tiết ${a.title}`}
                    title="Chi tiết"
                  >
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      {(clipped || truncated) && (
        <p className="text-xs text-content-muted">
          {clipped && `Mỗi lớp chỉ hiển thị ${PER_CLASS} bài mới nhất. `}
          {truncated && "Chỉ tải 100 lớp đầu tiên."}
        </p>
      )}
    </div>
  );
}
