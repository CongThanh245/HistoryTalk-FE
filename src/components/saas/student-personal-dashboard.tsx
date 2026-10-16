"use client";

import Link from "next/link";

import { Panel, SectionHeading, formatDate, formatNumber } from "@/components/saas/saas-ui";
import { KpiTile } from "@/components/saas/teaching-ui";
import { ClassroomLoadError } from "@/components/saas/api-classroom-ui";
import { EmptyState } from "@/components/ui/empty-state";
import { ROUTES } from "@/constants/routes";
import { useStudentDashboard } from "@/features/dashboard/hooks";
import { apiErrorMessage } from "@/features/saas/hooks-api";

/**
 * Tong quan ca nhan cua hoc sinh truong tu GET /student/dashboard.
 */

function scoreClass(pct: number) {
  if (pct >= 80) return "text-[var(--status-success)]";
  if (pct >= 50) return "text-[var(--status-warning)]";
  return "text-accent-danger";
}

export function StudentPersonalDashboard() {
  const { data, isPending, isError, error, refetch } = useStudentDashboard();

  if (isPending) {
    return (
      <div
        className="h-[132px] animate-pulse rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] motion-reduce:animate-none"
        aria-busy="true"
      />
    );
  }
  if (isError || !data) {
    return (
      <ClassroomLoadError
        message={apiErrorMessage(error, "Không tải được tổng quan học tập.")}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <section className="space-y-6" aria-label="Tổng quan học tập">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Token còn lại" value={formatNumber(data.currentTokens)} accent="text-[var(--gold-leaf)]" />
        <KpiTile label="Token dùng hôm nay" value={formatNumber(data.tokensUsedToday)} />
        <KpiTile label="Quiz đã làm" value={formatNumber(data.totalQuizzesAttempted)} accent="text-[var(--men-lam)]" />
        <KpiTile
          label="Điểm TB quiz"
          value={data.totalQuizzesAttempted ? `${data.averageScorePercentage.toFixed(1)}%` : "—"}
          accent="text-[var(--jade)]"
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel>
          <SectionHeading title="Quiz gần đây" description="Các lần làm quiz mới nhất của em." />
          {data.recentQuizzes.length === 0 ? (
            <EmptyState
              size="sm"
              title="Chưa làm quiz nào"
              action={
                <Link href={ROUTES.QUIZ} className="btn-crimson">
                  Làm quiz
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
              {data.recentQuizzes.map((q) => (
                <li key={q.sessionId} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-content-text">{q.quizTitle}</span>
                    <span className="block text-[12px] text-content-muted">{formatDate(q.completedAt)}</span>
                  </span>
                  <span className={`font-display text-2xl font-extrabold tabular-nums ${scoreClass(q.percentage)}`}>
                    {Math.round(q.percentage)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <SectionHeading title="Lớp của em" description={data.schoolName || undefined} />
          {data.enrolledClassrooms.length === 0 ? (
            <EmptyState size="sm" title="Em chưa thuộc lớp nào" />
          ) : (
            <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
              {data.enrolledClassrooms.map((c) => (
                <li key={c.classId} className="py-2.5">
                  <Link
                    href={ROUTES.CLASS_DETAIL(c.classId)}
                    className="block text-[14px] font-semibold text-content-heading underline-offset-4 hover:text-[var(--accent-gold)] hover:underline"
                  >
                    Lớp {c.className}
                  </Link>
                  <span className="block text-[12px] text-content-muted">
                    {c.teacherName ? `GV: ${c.teacherName}` : "Chưa phân công giáo viên"} · Mã lớp {c.classCode}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <SectionHeading title="Bài tập sắp đến hạn" />
          {data.upcomingAssignments.length === 0 ? (
            <EmptyState size="sm" title="Không có bài tập sắp đến hạn" />
          ) : (
            <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
              {data.upcomingAssignments.map((a) => (
                <li key={a.assignmentId} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-content-text">{a.title}</span>
                    <span className="block text-[12px] text-content-muted">{a.assignmentType}</span>
                  </span>
                  <span className="shrink-0 text-[12px] font-semibold tabular-nums text-content-muted">
                    Hạn {formatDate(a.deadline)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </section>
  );
}
