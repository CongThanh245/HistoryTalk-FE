"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Panel, SearchInput, SectionHeading, formatNumber } from "@/components/saas/saas-ui";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffFormSelect } from "@/components/staff/staff-form";
import { FetchingBadge, FetchingBar } from "@/components/commons/fetching-indicator";
import { useClassroomTokenUsage, useSchoolAdminDashboard, useStudentTokenUsage } from "@/features/dashboard/hooks";
import type { ClassroomTokenUsage } from "@/services/analytics-dashboard.service";
import { cn } from "@/lib/utils/cn";
import { ErrorBlock, useDebouncedValue } from "./shared";

const ALL = "ALL";

/**
 * Token theo lop (GET /school-admin/analytics/classrooms): lop dung nhieu nhat len dau,
 * bam mot lop de xem tung hoc sinh dung bao nhieu (khi quy hut nhanh thi biet vi sao).
 */
export function ClassTokenUsagePanel() {
  const [grade, setGrade] = React.useState(ALL);
  const [search, setSearch] = React.useState("");
  const debounced = useDebouncedValue(search.trim(), 300);
  const q = useClassroomTokenUsage({
    page: 0,
    size: 50,
    sort: "tokensUsedTotal,desc",
    ...(grade !== ALL && { gradeLevel: Number(grade) }),
    ...(debounced && { search: debounced }),
  });
  const [open, setOpen] = React.useState<ClassroomTokenUsage | null>(null);
  // API danh sach loi thi dung tam top lop trong dashboard (khong loc duoc).
  const dash = useSchoolAdminDashboard();
  const fallback = q.isError ? (dash.data?.topClassroomsByTokenUsage ?? []) : [];
  const rows = q.isError ? fallback : (q.data?.items ?? []);
  const max = Math.max(1, ...rows.map((r) => r.tokensUsedTotal));

  return (
    <Panel>
      <SectionHeading
        title="Token theo lớp"
        description="Lớp dùng nhiều nhất ở trên cùng. Bấm vào một lớp để xem từng học sinh."
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <StaffFormSelect
              value={grade}
              onValueChange={setGrade}
              className="w-full sm:w-32"
              options={[{ value: ALL, label: "Mọi khối" }, ...[10, 11, 12].map((g) => ({ value: String(g), label: `Khối ${g}` }))]}
            />
            <SearchInput value={search} onChange={setSearch} placeholder="Tìm lớp, giáo viên..." />
          </div>
        }
      />

      {q.isPending ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : q.isError && rows.length === 0 ? (
        <ErrorBlock error={null} fallback="Chưa tải được token theo lớp. Vui lòng thử lại sau." onRetry={() => void q.refetch()} />
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-content-muted">Không có lớp phù hợp.</p>
      ) : (
        <div className="relative">
          <FetchingBar active={q.isFetching} />
          {q.isError && <p className="mb-2 text-xs text-content-muted">Đang hiện {rows.length} lớp dùng nhiều nhất.</p>}
          <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
            {rows.map((r) => (
              <li key={r.classroomId}>
                <button
                  type="button"
                  onClick={() => setOpen(r)}
                  className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-2 py-2.5 text-left hover:bg-[var(--status-neutral-bg)] sm:grid-cols-[180px_minmax(0,1fr)_120px_100px_16px]"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-content-heading group-hover:text-[var(--accent-gold)]">Lớp {r.className}</span>
                    <span className="block truncate text-xs text-content-muted">
                      {r.teacherName ?? "Chưa phân công"} · {r.studentCount} HS
                    </span>
                  </span>
                  <span className="col-span-2 flex items-center gap-2 sm:col-span-1">
                    <span className="h-2 flex-1 overflow-hidden rounded-sm bg-[var(--border-default)]">
                      <span
                        className="block h-full bg-[var(--accent-gold)]"
                        style={{ width: r.tokensUsedTotal > 0 ? `${Math.max(2, (r.tokensUsedTotal / max) * 100)}%` : "0%" }}
                      />
                    </span>
                    <span className="w-12 text-right text-xs tabular-nums text-content-muted">{r.percentageOfSchoolUsage.toFixed(1)}%</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-lg font-bold tabular-nums text-content-heading">{formatNumber(r.tokensUsedTotal)}</span>
                    <span className="block text-[11px] text-content-muted">tổng</span>
                  </span>
                  <span className="hidden text-right sm:block">
                    <span className="block text-sm font-semibold tabular-nums text-content-text">{formatNumber(r.tokensUsedToday)}</span>
                    <span className="block text-[11px] text-content-muted">hôm nay</span>
                  </span>
                  <ChevronRight className="hidden h-4 w-4 text-content-muted sm:block" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ClassStudentsTokenDialog classroom={open} onOpenChange={(o) => !o && setOpen(null)} />
    </Panel>
  );
}

/** Chi tiet token tung hoc sinh cua mot lop (GET .../analytics/classrooms/{id}/students). */
export function ClassStudentsTokenDialog({
  classroom,
  onOpenChange,
}: {
  classroom: Pick<ClassroomTokenUsage, "classroomId" | "className" | "tokensUsedTotal" | "tokensUsedToday"> | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [search, setSearch] = React.useState("");
  const debounced = useDebouncedValue(search.trim(), 300);
  const q = useStudentTokenUsage(classroom?.classroomId, { page: 0, size: 100, ...(debounced && { search: debounced }) });
  const rows = q.data?.items ?? [];

  return (
    <Dialog open={!!classroom} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Token lớp {classroom?.className}</DialogTitle>
          <DialogDescription>
            Tổng {formatNumber(classroom?.tokensUsedTotal ?? 0)} token · hôm nay {formatNumber(classroom?.tokensUsedToday ?? 0)}. Học sinh dùng nhiều
            nhất ở trên cùng.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm học sinh, mã HS..." />
          <FetchingBadge active={q.isFetching && !q.isPending} />
        </div>
        <div className="-mx-6 max-h-[55vh] overflow-y-auto px-6">
          {q.isPending ? (
            <Skeleton className="h-40 w-full" />
          ) : q.isError ? (
            <ErrorBlock error={null} fallback="Chưa xem được chi tiết token của lớp này. Vui lòng thử lại sau." onRetry={() => void q.refetch()} />
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-content-muted">Không có học sinh phù hợp.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--bg-surface)]">
                <tr className="border-b border-[var(--border-strong)] text-left text-[13px] text-[var(--text-tertiary)]">
                  <th className="py-2 font-semibold">Học sinh</th>
                  <th className="py-2 text-right font-semibold">Tổng</th>
                  <th className="py-2 text-right font-semibold">Hôm nay</th>
                  <th className="hidden py-2 text-right font-semibold sm:table-cell">Tin nhắn</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const limit = s.dailyTokenLimit + s.dailyBonusTokens;
                  const out = limit > 0 && s.effectiveRemainingToday <= 0;
                  return (
                    <tr key={s.studentId} className="border-b border-[var(--border-default)] last:border-b-0">
                      <td className="py-2">
                        <span className="block font-semibold text-content-heading">{s.fullName}</span>
                        <span className="block font-mono text-[11px] text-content-muted">{s.studentCode ?? s.userName}</span>
                      </td>
                      <td className="py-2 text-right font-semibold tabular-nums">{formatNumber(s.tokensUsedTotal)}</td>
                      <td className={cn("py-2 text-right tabular-nums", out ? "font-semibold text-[var(--accent-danger)]" : "text-content-text")}>
                        {formatNumber(s.tokensUsedToday)}
                        <span className="text-[11px] text-content-muted"> / {formatNumber(limit)}</span>
                      </td>
                      <td className="hidden py-2 text-right tabular-nums text-content-muted sm:table-cell">{formatNumber(s.messageCount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
