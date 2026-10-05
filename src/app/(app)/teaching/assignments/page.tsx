"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ClipboardList, Plus } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { StaffFormSelect } from "@/components/staff/staff-form";
import { SaasShell, SearchInput, normalizeText } from "@/components/saas/saas-ui";
import {
  ALL,
  AssignmentStateBadge,
  AssignmentTypeBadge,
  ClassSelect,
  ProgressBar,
  SegmentedFilter,
  TD,
  TH,
  TR,
  TableShell,
} from "@/components/saas/teaching-ui";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import {
  ASSIGNMENT_TYPE_LABELS,
  assignmentState,
  formatDateTime,
  relativeDue,
  useTeachingData,
  type AssignmentState,
} from "@/features/saas/hooks-teaching";
import type { AssignmentType } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

type StateFilter = "ALL" | "OPEN" | "DUE_SOON" | "CLOSED" | "UPCOMING";

const STATE_FILTERS: { value: StateFilter; label: string; match: (s: AssignmentState) => boolean }[] = [
  { value: "ALL", label: "Tất cả", match: () => true },
  { value: "OPEN", label: "Đang mở", match: (s) => s === "OPEN" || s === "DUE_SOON" },
  { value: "DUE_SOON", label: "Sắp đến hạn", match: (s) => s === "DUE_SOON" },
  { value: "CLOSED", label: "Đã hết hạn", match: (s) => s === "CLOSED" },
  { value: "UPCOMING", label: "Chưa mở", match: (s) => s === "UPCOMING" },
];

/** Assignments the teacher gave to their classes (Role Matrix row 16). */
export default function TeachingAssignmentsPage() {
  return (
    <SaasShell variant="app" title="Bài tập đã giao" description="Bài đọc sự kiện, trò chuyện với nhân vật và bài kiểm tra kèm hạn nộp cho các lớp của bạn.">
      <AssignmentList />
    </SaasShell>
  );
}

function AssignmentList() {
  const role = useRole();
  const data = useTeachingData(role);
  const [classId, setClassId] = React.useState(ALL);
  const [type, setType] = React.useState<AssignmentType | typeof ALL>(ALL);
  const [state, setState] = React.useState<StateFilter>("ALL");
  const [search, setSearch] = React.useState("");

  const withState = React.useMemo(() => data.assignments.map((a) => ({ a, state: assignmentState(a) })), [data.assignments]);

  const base = withState.filter(
    ({ a }) =>
      (classId === ALL || a.classId === classId) &&
      (type === ALL || a.type === type) &&
      (!search.trim() || normalizeText(`${a.title} ${a.targetTitle}`).includes(normalizeText(search))),
  );
  const rows = base
    .filter(({ state: s }) => STATE_FILTERS.find((f) => f.value === state)!.match(s))
    .sort((x, y) => {
      // Open work first (by nearest deadline), then upcoming, then closed (most recent first).
      const rank = (s: AssignmentState) => (s === "DUE_SOON" ? 0 : s === "OPEN" ? 1 : s === "UPCOMING" ? 2 : 3);
      const r = rank(x.state) - rank(y.state);
      if (r) return r;
      return x.state === "CLOSED" ? y.a.dueAt.localeCompare(x.a.dueAt) : x.a.dueAt.localeCompare(y.a.dueAt);
    });

  if (data.classes.length === 0) {
    return <EmptyState icon={ClipboardList} title="Chưa có lớp giảng dạy" description="Bạn cần được phân công lớp trước khi giao bài." />;
  }

  const newHref = classId === ALL ? ROUTES.TEACHING.ASSIGNMENT_NEW : `${ROUTES.TEACHING.ASSIGNMENT_NEW}?classId=${encodeURIComponent(classId)}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <ClassSelect classes={data.classes} value={classId} onChange={setClassId} />
          <StaffFormSelect
            value={type}
            onValueChange={setType}
            options={[{ value: ALL, label: "Mọi loại bài" }, ...(Object.keys(ASSIGNMENT_TYPE_LABELS) as AssignmentType[]).map((t) => ({ value: t, label: ASSIGNMENT_TYPE_LABELS[t] }))]}
            className="w-full sm:w-[180px]"
          />
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên bài..." />
        </div>
        <Link href={newHref} className="btn-crimson">
          <Plus className="h-4 w-4" aria-hidden="true" /> Giao bài tập
        </Link>
      </div>

      <SegmentedFilter
        label="Lọc theo trạng thái"
        value={state}
        onChange={setState}
        options={STATE_FILTERS.map((f) => ({ value: f.value, label: f.label, count: base.filter((x) => f.match(x.state)).length }))}
      />

      {rows.length === 0 ? (
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
              <th className={TH}>Đã nộp</th>
              <th className={cn(TH, "text-right")}>
                <span className="sr-only">Chi tiết</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ a, state: s }) => {
              const p = data.progress.get(a.id);
              return (
                <tr key={a.id} className={TR}>
                  <td className={TD}>
                    <AssignmentTypeBadge type={a.type} />
                  </td>
                  <td className={cn(TD, "max-w-[340px]")}>
                    <Link href={ROUTES.TEACHING.ASSIGNMENT_DETAIL(a.id)} className="font-semibold text-content-heading hover:text-[var(--accent-gold)]">
                      {a.title}
                    </Link>
                    <p className="truncate text-xs text-content-muted">
                      {a.source === "LOCAL" ? "Địa phương" : "Kho chung"} · {a.targetTitle}
                    </p>
                  </td>
                  <td className={cn(TD, "font-medium")}>{data.classById.get(a.classId)?.name}</td>
                  <td className={TD}>
                    <div className="flex flex-col items-start gap-1">
                      <span className="tabular-nums">{formatDateTime(a.dueAt)}</span>
                      <span className="flex items-center gap-2">
                        <AssignmentStateBadge state={s} />
                        {s !== "UPCOMING" && <span className="text-xs text-content-muted">{relativeDue(a.dueAt)}</span>}
                      </span>
                    </div>
                  </td>
                  <td className={TD}>
                    <ProgressBar done={p?.done ?? 0} total={p?.total ?? 0} />
                    {p && p.missing > 0 && <p className="mt-1 text-xs text-[var(--accent-danger)]">{p.missing} thiếu bài</p>}
                  </td>
                  <td className={cn(TD, "text-right")}>
                    <Link href={ROUTES.TEACHING.ASSIGNMENT_DETAIL(a.id)} className="archive-link" aria-label={`Chi tiết ${a.title}`}>
                      Chi tiết <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
