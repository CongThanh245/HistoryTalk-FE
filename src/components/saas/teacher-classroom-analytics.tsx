"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { Gift } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { GrantTokensDialog } from "@/components/saas/token-boost-ui";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { formatNumber } from "@/components/saas/saas-ui";
import { KpiTile } from "@/components/saas/teaching-ui";
import { ClassroomLoadError, NoDataYet } from "@/components/saas/api-classroom-ui";
import { useTeacherClassroomDashboard } from "@/features/dashboard/hooks";
import { apiErrorMessage, apiErrorStatus } from "@/features/saas/hooks-api";
import type { TeacherClassroomStudent } from "@/services/analytics-dashboard.service";

/**
 * Thong ke lop cho giao vien tu GET /teacher/dashboard/classrooms/{classId}.
 */

const num = (v: number) => <span className="tabular-nums">{formatNumber(v)}</span>;

function scoreClass(pct: number) {
  if (pct >= 80) return "text-[var(--status-success)]";
  if (pct >= 50) return "text-[var(--status-warning)]";
  return "text-accent-danger";
}

function AnalyticsState({
  query,
  children,
}: {
  query: ReturnType<typeof useTeacherClassroomDashboard>;
  children: (data: NonNullable<ReturnType<typeof useTeacherClassroomDashboard>["data"]>) => React.ReactNode;
}) {
  if (query.isPending) {
    return (
      <div
        className="h-[132px] animate-pulse rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] motion-reduce:animate-none"
        aria-busy="true"
      />
    );
  }
  if (query.isError || !query.data) {
    const status = apiErrorStatus(query.error);
    if (status === 403 || status === 404) {
      return <NoDataYet title="Không xem được thống kê lớp này" description="Lớp không tồn tại hoặc không thuộc trường của bạn." />;
    }
    return (
      <ClassroomLoadError
        message={apiErrorMessage(query.error, "Không tải được thống kê lớp.")}
        onRetry={() => void query.refetch()}
      />
    );
  }
  return <>{children(query.data)}</>;
}

function StudentTable({ students, classId, canGrant }: { students: TeacherClassroomStudent[]; classId: string; canGrant: boolean }) {
  const [granting, setGranting] = React.useState<{ uid: string; name: string; classId: string } | null>(null);
  const columns = React.useMemo<ColumnDef<TeacherClassroomStudent, unknown>[]>(() => {
    const base: ColumnDef<TeacherClassroomStudent, unknown>[] = [
      {
        accessorKey: "fullName",
        header: "Học sinh",
        cell: ({ row }) => <span className="font-semibold text-content-heading">{row.original.fullName}</span>,
      },
      {
        accessorKey: "studentCode",
        header: "Mã HS",
        cell: ({ row }) => <span className="tabular-nums text-content-muted">{row.original.studentCode || "—"}</span>,
      },
    ];
    return [
      ...base,
      { accessorKey: "quizzesAttempted", header: "Quiz đã làm", cell: ({ row }) => num(row.original.quizzesAttempted) },
      {
        accessorKey: "averageScorePercentage",
        header: "Điểm TB quiz",
        cell: ({ row }) =>
          row.original.quizzesAttempted === 0 ? (
            <span className="text-content-muted">—</span>
          ) : (
            <span className={`font-semibold tabular-nums ${scoreClass(row.original.averageScorePercentage)}`}>
              {row.original.averageScorePercentage.toFixed(1)}%
            </span>
          ),
      },
      { accessorKey: "aiMessagesCount", header: "Tin nhắn AI", cell: ({ row }) => num(row.original.aiMessagesCount) },
      {
        accessorKey: "dailyTokensUsed",
        header: "Token hôm nay",
        cell: ({ row }) => {
          const s = row.original;
          // Older builds only send currentTokens.
          if (s.dailyTokenLimit == null) return num(s.currentTokens);
          const limit = s.dailyTokenLimit + (s.dailyBonusTokens ?? 0);
          return (
            <span className="tabular-nums" title={`Còn dùng được ${formatNumber(s.currentTokens)} token hôm nay`}>
              {formatNumber(s.dailyTokensUsed ?? 0)} / {formatNumber(limit)}
              {(s.dailyBonusTokens ?? 0) > 0 && <span className="text-xs text-[var(--status-success)]"> (+{formatNumber(s.dailyBonusTokens ?? 0)})</span>}
            </span>
          );
        },
      },
      { accessorKey: "currentTokens", header: "Còn lại hôm nay", cell: ({ row }) => num(row.original.currentTokens) },
      ...(canGrant
        ? [
            {
              id: "grant",
              header: "",
              cell: ({ row }) => (
                <button
                  type="button"
                  className="archive-link whitespace-nowrap"
                  onClick={() => setGranting({ uid: row.original.studentId, name: row.original.fullName, classId })}
                >
                  <Gift className="h-3.5 w-3.5" aria-hidden="true" /> Cấp token
                </button>
              ),
            } satisfies ColumnDef<TeacherClassroomStudent, unknown>,
          ]
        : []),
    ];
  }, [canGrant, classId]);

  return (
    <>
      <StaffDataTable columns={columns} data={students} emptyMessage="Lớp chưa có học sinh." />
      <GrantTokensDialog student={granting} onOpenChange={(o) => !o && setGranting(null)} />
    </>
  );
}

/** Tab "Thong ke": KPI lop + bang ket qua tung hoc sinh. */
export function TeacherClassStats({ classId }: { classId: string }) {
  const query = useTeacherClassroomDashboard(classId);
  return (
    <AnalyticsState query={query}>
      {(data) => {
        const attempted = data.students.filter((s) => s.quizzesAttempted > 0);
        const avgScore = attempted.length
          ? attempted.reduce((sum, s) => sum + s.averageScorePercentage, 0) / attempted.length
          : null;
        const totalQuizzes = data.students.reduce((sum, s) => sum + s.quizzesAttempted, 0);
        return (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiTile label="Sĩ số" value={formatNumber(data.studentCount)} />
              <KpiTile
                label="Điểm TB quiz"
                value={avgScore == null ? "—" : `${avgScore.toFixed(1)}%`}
                hint={`${attempted.length}/${data.students.length} học sinh đã làm quiz`}
                accent="text-[var(--men-lam)]"
              />
              <KpiTile label="Lượt làm quiz" value={formatNumber(totalQuizzes)} accent="text-[var(--jade)]" />
              <KpiTile
                label="Tin nhắn AI"
                value={formatNumber(data.totalAiMessages)}
                hint={`TB ${data.avgAiMessagesPerStudent.toFixed(1)} tin nhắn / học sinh`}
                accent="text-[var(--gold-leaf)]"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <KpiTile label="Nộp đúng hạn" value={`${(data.assignmentRates?.onTimeRate ?? 0).toFixed(1)}%`} accent="text-[var(--status-success)]" />
              <KpiTile label="Nộp muộn" value={`${(data.assignmentRates?.lateRate ?? 0).toFixed(1)}%`} accent="text-[var(--status-warning)]" />
              <KpiTile label="Chưa nộp" value={`${(data.assignmentRates?.pendingRate ?? 0).toFixed(1)}%`} accent="text-accent-danger" />
            </div>
            {data.dailyTokenLimit != null && (
              <div className="grid gap-4 sm:grid-cols-2">
                <KpiTile
                  label="Hạn mức token / học sinh / ngày"
                  value={formatNumber(data.dailyTokenLimit)}
                  hint="Do quản trị trường đặt cho lớp hoặc toàn trường. Làm mới lúc 00:00."
                />
                <KpiTile
                  label="Yêu cầu xin thêm token"
                  value={formatNumber(data.pendingTokenBoostRequests ?? 0)}
                  hint={
                    <Link href={ROUTES.TEACHING.TOKEN_REQUESTS} className="archive-link">
                      Xem và duyệt
                    </Link>
                  }
                  accent={(data.pendingTokenBoostRequests ?? 0) > 0 ? "text-[var(--status-warning)]" : undefined}
                />
              </div>
            )}
            {data.status === "ARCHIVED" && (
              <p className="text-sm text-content-muted">Lớp thuộc năm học đã kết thúc (đã lưu trữ); số liệu chỉ để tham khảo.</p>
            )}
            <StudentTable students={data.students} classId={classId} canGrant={data.status !== "ARCHIVED"} />
          </div>
        );
      }}
    </AnalyticsState>
  );
}
