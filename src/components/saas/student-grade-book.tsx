"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageCircle, Star } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, SectionHeading, formatNumber } from "@/components/saas/saas-ui";
import { StudentActivityBars } from "@/components/saas/student-activity-bars";
import { DueLine } from "@/components/saas/student-assignment-card";
import { AssignmentTypeTile, ProgressMeter, SubmissionStatusBadge, formatScore } from "@/components/saas/student-ui";
import { ROUTES } from "@/constants/routes";
import {
  formatDateTime,
  useStudentChatActivity,
  useStudentGradeBook,
  type ClassGradeSummary,
} from "@/features/saas/hooks-student";
import type { LucideIcon } from "lucide-react";

/** Bảng điểm & tiến độ học tập của học sinh, theo từng lớp (Role Matrix row 25). */
export function StudentGradeBook({ role }: { role: string }) {
  const summaries = useStudentGradeBook(role);
  const activity = useStudentChatActivity(14);
  const totalMessages = activity.reduce((s, d) => s + d.messages, 0);
  const activeDays = activity.filter((d) => d.messages > 0).length;

  if (summaries.length === 0) {
    return <EmptyState title="Em chưa thuộc lớp nào" description="Khi nhà trường xếp em vào lớp, bảng điểm sẽ hiện ở đây." />;
  }

  return (
    <div className="space-y-8">
      {summaries.map((s) => (
        <ClassGrades key={s.classroom.id} summary={s} totalMessages={totalMessages} />
      ))}

      <Panel>
        <SectionHeading
          title="Trò chuyện với AI"
          description={`${formatNumber(totalMessages)} tin nhắn trong 14 ngày qua · học ${activeDays}/14 ngày`}
        />
        <StudentActivityBars data={activity} />
      </Panel>
    </div>
  );
}

function StatTile({ icon: Icon, color, label, value, sub }: { icon: LucideIcon; color: string; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[2px] text-white" style={{ background: color }} aria-hidden="true">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-bold text-content-muted">{label}</p>
        <p className="font-display text-3xl font-extrabold tabular-nums leading-none text-content-text">{value}</p>
        {sub && <p className="mt-1 truncate text-[12px] text-content-muted">{sub}</p>}
      </div>
    </div>
  );
}

function ClassGrades({ summary, totalMessages }: { summary: ClassGradeSummary; totalMessages: number }) {
  const { classroom, tests, average, completed, opened, upcoming } = summary;
  const rate = opened ? Math.round((completed / opened) * 100) : 0;

  return (
    <Panel>
      <SectionHeading title={`Lớp ${classroom.name}`} description={`Năm học ${classroom.schoolYear}`} />

      <div className="grid gap-2 sm:grid-cols-3">
        <StatTile
          icon={Star}
          color="var(--gold-leaf)"
          label="Điểm trung bình"
          value={average === null ? "—" : formatScore(average)}
          sub={average === null ? "Chưa có bài tính điểm" : "Thang điểm 10"}
        />
        <div className="space-y-2 rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[2px] bg-[var(--jade)] text-white" aria-hidden="true">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-content-muted">Hoàn thành</p>
              <p className="font-display text-3xl font-extrabold tabular-nums leading-none text-content-text">{rate}%</p>
            </div>
            <span className="ml-auto text-[12px] font-bold tabular-nums text-content-muted">
              {completed}/{opened} bài
            </span>
          </div>
          <ProgressMeter value={completed} max={Math.max(opened, 1)} color="var(--jade)" label="Tỉ lệ hoàn thành bài tập" />
        </div>
        <StatTile icon={MessageCircle} color="var(--accent-gold)" label="Tin nhắn AI" value={formatNumber(totalMessages)} sub="14 ngày gần nhất" />
      </div>

      <div className="space-y-2">
        <h3 className="font-display text-xl font-extrabold uppercase leading-tight text-content-text">Bài kiểm tra tính điểm</h3>
        {tests.length === 0 ? (
          <p className="text-[13px] text-content-muted">Lớp chưa có bài kiểm tra tính điểm.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-[var(--text-primary)] text-[11px] font-bold uppercase tracking-[0.08em] text-content-muted">
                  <th scope="col" className="py-2 pr-3">Bài kiểm tra</th>
                  <th scope="col" className="py-2 pr-3">Hạn nộp</th>
                  <th scope="col" className="py-2 pr-3 text-right">Điểm</th>
                  <th scope="col" className="py-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((r) => (
                  <tr key={r.assignment.id} className="border-b border-[var(--border-default)]">
                    <td className="py-2.5 pr-3">
                      <Link href={ROUTES.MY_ASSIGNMENT_DETAIL(r.assignment.id)} className="font-semibold text-content-text hover:text-[var(--accent-gold)] hover:underline">
                        {r.assignment.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap py-2.5 pr-3 text-content-muted">{formatDateTime(r.assignment.dueAt)}</td>
                    <td className="whitespace-nowrap py-2.5 pr-3 text-right tabular-nums">
                      {typeof r.submission?.score === "number" ? (
                        <>
                          <strong className="font-display text-lg font-extrabold text-[var(--gold-leaf)]">{formatScore(r.submission.score)}</strong>
                          <span className="text-content-muted"> / {r.assignment.maxScore ?? 10}</span>
                        </>
                      ) : (
                        <span className="text-content-muted">—</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <SubmissionStatusBadge status={r.submission?.status} bucket={r.bucket} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="font-display text-xl font-extrabold uppercase leading-tight text-content-text">Sắp tới</h3>
        {upcoming.length === 0 ? (
          <p className="text-[13px] text-content-muted">Không còn bài nào cần làm.</p>
        ) : (
          <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
            {upcoming.slice(0, 4).map((r) => (
              <li key={r.assignment.id}>
                <Link href={ROUTES.MY_ASSIGNMENT_DETAIL(r.assignment.id)} className="group flex items-center gap-3 py-2.5">
                  <AssignmentTypeTile type={r.assignment.type} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-content-text group-hover:text-[var(--accent-gold)]">{r.assignment.title}</span>
                    <DueLine row={r} compact />
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
