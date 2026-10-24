"use client";

// Bang diem hoc sinh: tat ca bai duoc giao + diem BE tu cham (GET /student/assignments, API that).
import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, ClipboardList, Star } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, SectionHeading } from "@/components/saas/saas-ui";
import {
  AssignmentLoadError,
  AssignmentTypeBadge,
  SubmissionStatusBadge,
  formatDateTime,
  formatScore,
  isDone,
  parseLocal,
} from "@/components/saas/student-assignment-card";
import { ALL, KpiTile } from "@/components/saas/teaching-ui";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { StaffFormSelect } from "@/components/staff/staff-form";
import { ROUTES } from "@/constants/routes";
import { useMyAssignments } from "@/features/saas/hooks-assignment-api";
import { apiErrorMessage } from "@/features/saas/hooks-api";
import type { StudentAssignment } from "@/services/assignment.service";

const columns: ColumnDef<StudentAssignment, unknown>[] = [
  {
    id: "title",
    header: "Bài",
    cell: ({ row }) => (
      <Link
        href={ROUTES.MY_ASSIGNMENT_DETAIL(row.original.assignmentId)}
        className="font-semibold text-content-text hover:text-[var(--accent-gold)] hover:underline"
      >
        {row.original.title}
      </Link>
    ),
  },
  { id: "class", header: "Lớp", cell: ({ row }) => row.original.className },
  { id: "type", header: "Loại", cell: ({ row }) => <AssignmentTypeBadge type={row.original.assignmentType} /> },
  {
    id: "deadline",
    header: "Hạn",
    cell: ({ row }) => <span className="whitespace-nowrap text-content-muted">{formatDateTime(row.original.deadline)}</span>,
  },
  { id: "status", header: "Trạng thái", cell: ({ row }) => <SubmissionStatusBadge assignment={row.original} /> },
  {
    id: "score",
    header: "Điểm /10",
    cell: ({ row }) =>
      row.original.score === null ? (
        <span className="text-content-muted">—</span>
      ) : (
        <strong className="text-lg font-bold tabular-nums text-[var(--gold-leaf)]">{formatScore(row.original.score)}</strong>
      ),
  },
  {
    id: "submittedAt",
    header: "Nộp lúc",
    cell: ({ row }) => <span className="whitespace-nowrap text-content-muted">{formatDateTime(row.original.submittedAt)}</span>,
  },
];

/** Bảng điểm học sinh theo bài tập được giao (Role Matrix row 25). */
export function StudentGradeBook() {
  const { data, isLoading, isError, error, refetch } = useMyAssignments({ page: 0, size: 100 });
  const [classId, setClassId] = React.useState<string>(ALL);

  const all = React.useMemo(() => data?.items ?? [], [data]);
  const classes = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const a of all) map.set(a.classroomId, a.className);
    return [...map].map(([id, name]) => ({ id, name }));
  }, [all]);

  const rows = React.useMemo(() => {
    const list = classId === ALL ? all : all.filter((a) => a.classroomId === classId);
    return list.slice().sort((x, y) => (parseLocal(y.deadline)?.getTime() ?? 0) - (parseLocal(x.deadline)?.getTime() ?? 0));
  }, [all, classId]);

  const stats = React.useMemo(() => {
    const scored = rows.filter((a) => a.score !== null);
    const counted = rows.filter((a) => a.submissionStatus !== "EXEMPTED");
    return {
      average: scored.length ? scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length : null,
      scoredCount: scored.length,
      done: counted.filter((a) => isDone(a.submissionStatus)).length,
      total: counted.length,
    };
  }, [rows]);

  if (isError) {
    return (
      <AssignmentLoadError title="Không tải được bảng điểm" message={apiErrorMessage(error, "Vui lòng kiểm tra kết nối rồi thử lại.")} onRetry={() => void refetch()} />
    );
  }
  if (!isLoading && all.length === 0) {
    return <EmptyState icon={ClipboardList} title="Chưa có bài tập nào" description="Khi thầy cô giao bài cho lớp của bạn, điểm sẽ hiện ở đây." />;
  }

  return (
    <Panel>
      <SectionHeading title="Điểm bài tập" description="Điểm thang 10 do hệ thống tự chấm khi bạn nộp bài." />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiTile
          label="Điểm trung bình"
          value={stats.average === null ? "—" : formatScore(stats.average)}
          hint={stats.average === null ? "Chưa có bài có điểm" : `Trên ${stats.scoredCount} bài có điểm`}
          icon={<Star className="h-4 w-4 text-[var(--gold-leaf)]" aria-hidden="true" />}
        />
        <KpiTile
          label="Đã nộp"
          value={`${stats.done}/${stats.total}`}
          hint="Không tính bài được miễn"
          icon={<CheckCircle2 className="h-4 w-4 text-[var(--jade)]" aria-hidden="true" />}
        />
        <KpiTile label="Tổng số bài" value={rows.length} hint={classId === ALL ? "Tất cả lớp" : "Lớp đang chọn"} />
      </div>

      {classes.length > 1 && (
        <StaffFormSelect
          value={classId}
          onValueChange={setClassId}
          options={[{ value: ALL, label: "Tất cả lớp" }, ...classes.map((c) => ({ value: c.id, label: `Lớp ${c.name}` }))]}
          className="w-full sm:w-[220px]"
        />
      )}

      <StaffDataTable columns={columns} data={rows} isLoading={isLoading} emptyMessage="Không có bài tập nào." />
      {(data?.totalElements ?? 0) > all.length && (
        <p className="text-[12px] text-content-muted">
          Đang hiện {all.length}/{data?.totalElements} bài gần nhất.
        </p>
      )}
    </Panel>
  );
}
