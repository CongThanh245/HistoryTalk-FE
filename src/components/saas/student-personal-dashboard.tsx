"use client";

import Link from "next/link";

import {
  Panel,
  SectionHeading,
  formatDate,
  formatNumber,
} from "@/components/saas/saas-ui";
import { KpiTile } from "@/components/saas/teaching-ui";
import { ClassroomLoadError } from "@/components/saas/api-classroom-ui";
import { ASSIGNMENT_TYPE_META, assignmentBucket, parseLocal } from "@/components/saas/student-assignment-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ROUTES } from "@/constants/routes";
import { useStudentDashboard } from "@/features/dashboard/hooks";
import { useMyAssignments } from "@/features/saas/hooks-assignment-api";
import type { AssignmentType } from "@/services/assignment.service";
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
  // BE dashboard chua tinh upcomingAssignments (luon rong): lay tu danh sach bai tap cua em.
  const mine = useMyAssignments({ page: 0, size: 100 });
  const upcoming = (mine.data?.items ?? [])
    .filter((a) => {
      const bucket = assignmentBucket(a);
      return bucket === "TODO" || bucket === "DUE_SOON";
    })
    .sort((x, y) => (parseLocal(x.deadline)?.getTime() ?? 0) - (parseLocal(y.deadline)?.getTime() ?? 0))
    .slice(0, 5);

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
        <KpiTile
          label="Token còn dùng hôm nay"
          value={formatNumber(data.currentTokens)}
          hint={
            data.dailyTokenLimit != null
              ? `Hạn mức ${formatNumber(data.dailyTokenLimit + (data.dailyBonusTokens ?? 0))} token/ngày · làm mới lúc 00:00`
              : undefined
          }
          accent="text-[var(--gold-leaf)]"
        />
        <KpiTile
          label="Token dùng hôm nay"
          value={formatNumber(data.tokensUsedToday)}
          hint={
            (data.dailyBonusTokens ?? 0) > 0
              ? `Gồm ${formatNumber(data.dailyBonusTokens ?? 0)} token thầy cô duyệt thêm`
              : undefined
          }
        />
        <KpiTile
          label="Quiz đã làm"
          value={formatNumber(data.totalQuizzesAttempted)}
          accent="text-[var(--men-lam)]"
        />
        <KpiTile
          label="Điểm TB quiz"
          value={
            data.totalQuizzesAttempted
              ? `${data.averageScorePercentage.toFixed(1)}%`
              : "—"
          }
          accent="text-[var(--jade)]"
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel>
          <SectionHeading
            title="Quiz gần đây"
            description="Các lần làm quiz mới nhất của bạn."
          />
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
                <li
                  key={q.sessionId}
                  className="flex items-center gap-3 py-2.5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-content-text">
                      {q.quizTitle}
                    </span>
                    <span className="block text-[12px] text-content-muted">
                      {formatDate(q.completedAt)}
                    </span>
                  </span>
                  <span
                    className={`font-display text-2xl font-extrabold tabular-nums ${scoreClass(q.percentage)}`}
                  >
                    {Math.round(q.percentage)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <SectionHeading title="Bài tập sắp đến hạn" />
          {upcoming.length === 0 ? (
            <EmptyState size="sm" title="Không có bài tập sắp đến hạn" />
          ) : (
            <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
              {upcoming.map((a) => (
                <li key={a.assignmentId}>
                  <Link
                    href={ROUTES.MY_ASSIGNMENT_DETAIL(a.assignmentId)}
                    className="group flex items-center gap-3 py-2.5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold text-content-text group-hover:text-[var(--accent-gold)]">
                        {a.title}
                      </span>
                      <span className="block text-[12px] text-content-muted">
                        {ASSIGNMENT_TYPE_META[
                          a.assignmentType as AssignmentType
                        ]?.label ?? a.assignmentType}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12px] font-semibold tabular-nums text-content-muted">
                      Hạn {formatDate(a.deadline)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </section>
  );
}
