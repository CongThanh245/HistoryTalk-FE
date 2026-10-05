"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Download,
  GraduationCap,
  Library,
  MessageSquare,
  School as SchoolIcon,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { StaffStatCard, StaffStatsGrid } from "@/components/staff/staff-stat-card";
import { Panel, SaasShell, SectionHeading, TokenBar, PlanBadge, formatDate, formatNumber } from "@/components/saas/saas-ui";
import { SchoolRankBars, SchoolTrendChart } from "@/components/saas/school-charts";
import { SchoolClassReportTable, SchoolTeacherActivityTable } from "@/components/saas/school-dashboard-tables";
import { ROUTES } from "@/constants/routes";
import { TODAY_KEY, classReportCsv, shortDay, useSchoolDashboard } from "@/features/saas/hooks-school";
import { useDemoSchoolId } from "@/features/saas/store";
import { cn } from "@/lib/utils/cn";

/** School Admin report dashboard (Role Matrix row 23): classes, teachers, students, activity and token use. */
export default function SchoolOverviewPage() {
  return (
    <SaasShell title="Tổng quan trường" description="Báo cáo số lớp, giáo viên, học sinh, mức hoạt động và token của trường.">
      <Overview />
    </SaasShell>
  );
}

const PERIODS = [7, 14] as const;
type Period = (typeof PERIODS)[number];

function PeriodSwitch({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div role="group" aria-label="Khoảng thời gian" className="inline-flex rounded-[2px] border border-[var(--text-primary)]">
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          aria-pressed={value === p}
          onClick={() => onChange(p)}
          className={cn(
            "px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.06em] transition-colors",
            value === p ? "bg-[var(--text-primary)] text-[var(--text-inverse)]" : "text-[var(--text-primary)] hover:bg-[var(--status-neutral-bg)]",
          )}
        >
          {p} ngày
        </button>
      ))}
    </div>
  );
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function Overview() {
  const schoolId = useDemoSchoolId();
  const [period, setPeriod] = React.useState<Period>(14);
  const { school, teachers, students, classes, teacherById, daily, activeToday, grades, classRows, teacherRows, pendingReviews, unassigned } =
    useSchoolDashboard(schoolId, period);

  if (!school) return <p className="text-sm text-content-muted">Không tìm thấy dữ liệu trường.</p>;

  const activeStudents = students.filter((s) => s.status !== "LOCKED");
  const usedToday = students.reduce((sum, s) => sum + s.tokensUsedToday, 0);
  const quotaToday = activeStudents.length * school.dailyTokensPerStudent;
  const capped = students.filter((s) => s.tokensUsedToday >= school.dailyTokensPerStudent).length;

  const noHomeroom = classes.filter((c) => !c.homeroomTeacherId || !teacherById.has(c.homeroomTeacherId));
  const lockedHomeroom = classes.filter((c) => c.homeroomTeacherId && teacherById.get(c.homeroomTeacherId)?.status === "LOCKED");
  const invited = [...teachers.filter((t) => t.status === "INVITED"), ...students.filter((s) => s.status === "INVITED")];
  const seatRatio = students.length / school.maxStudents;

  const warnings: { key: string; text: string; href: string }[] = [];
  if (pendingReviews)
    warnings.push({ key: "pending", text: `${pendingReviews} nội dung địa phương đang chờ bạn duyệt`, href: ROUTES.SCHOOL.CONTENT });
  if (noHomeroom.length)
    warnings.push({
      key: "homeroom",
      text: `${noHomeroom.length} lớp chưa có giáo viên chủ nhiệm: ${noHomeroom.map((c) => c.name).join(", ")}`,
      href: ROUTES.SCHOOL.CLASSES,
    });
  if (lockedHomeroom.length)
    warnings.push({
      key: "locked-homeroom",
      text: `Giáo viên chủ nhiệm của ${lockedHomeroom.map((c) => c.name).join(", ")} đang bị khóa tài khoản`,
      href: ROUTES.SCHOOL.TEACHERS,
    });
  if (unassigned)
    warnings.push({ key: "unassigned", text: `${unassigned} học sinh chưa được xếp lớp`, href: ROUTES.SCHOOL.STUDENTS });
  if (seatRatio >= 0.9)
    warnings.push({
      key: "seats",
      text: `Trường đã dùng ${formatNumber(students.length)}/${formatNumber(school.maxStudents)} tài khoản học sinh của gói`,
      href: ROUTES.SCHOOL.STUDENTS,
    });
  if (invited.length)
    warnings.push({ key: "invited", text: `${invited.length} tài khoản chưa kích hoạt (đang chờ lời mời)`, href: ROUTES.SCHOOL.TEACHERS });
  if (capped)
    warnings.push({ key: "capped", text: `${capped} học sinh đã dùng hết hạn mức token hôm nay`, href: ROUTES.SCHOOL.TOKENS });

  // Chart series.
  const activeSeries = daily.map((d) => ({ key: d.date, label: shortDay(d.date), value: d.activeStudents }));
  const messageSeries = daily.map((d) => ({ key: d.date, label: shortDay(d.date), value: d.messages }));
  const avgActive = daily.length ? Math.round(daily.reduce((s, d) => s + d.activeStudents, 0) / daily.length) : 0;
  const peakActive = daily.reduce((b, d) => (d.activeStudents > b.activeStudents ? d : b), daily[0]);
  const totalMessages = daily.reduce((s, d) => s + d.messages, 0);
  const peakMessages = daily.reduce((b, d) => (d.messages > b.messages ? d : b), daily[0]);
  const studentGrade = grades.map((g) => ({ key: String(g.grade), label: `Khối ${g.grade}`, value: g.students }));
  const classGrade = grades.map((g) => ({ key: String(g.grade), label: `Khối ${g.grade}`, value: g.classes }));
  const topToken = [...classRows]
    .sort((a, b) => b.tokensToday - a.tokensToday)
    .slice(0, 5)
    .map((r) => ({
      key: r.id,
      label: r.name,
      value: r.tokensToday,
      hint: r.students ? `${formatNumber(Math.round(r.tokensToday / r.students))}/HS` : undefined,
    }));

  const links = [
    { href: ROUTES.SCHOOL.CONTENT, label: "Duyệt nội dung", desc: "Xuất bản nội dung giáo viên soạn", icon: Library },
    { href: ROUTES.SCHOOL.CLASSES, label: "Quản lý lớp học", desc: "Tạo lớp, phân công giáo viên", icon: BookOpen },
    { href: ROUTES.SCHOOL.TEACHERS, label: "Tài khoản giáo viên", desc: "Mời, khóa, gửi lại lời mời", icon: GraduationCap },
    { href: ROUTES.SCHOOL.STUDENTS, label: "Tài khoản học sinh", desc: "Tạo mới hoặc nhập từ file CSV", icon: Users },
    { href: ROUTES.SCHOOL.TOKENS, label: "Hạn mức token", desc: "Cấu hình token mỗi ngày", icon: Zap },
  ];

  return (
    <div className="space-y-8">
      <Panel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SchoolIcon className="h-6 w-6 shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
          <div>
            <p className="archive-title is-plain text-xl">{school.name}</p>
            <p className="text-xs text-content-muted">
              {school.code} · {school.province} · Hợp đồng đến {formatDate(school.contractEndsAt)} · số liệu tính đến {formatDate(TODAY_KEY)}
            </p>
          </div>
        </div>
        <PlanBadge plan={school.plan} />
      </Panel>

      <StaffStatsGrid className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StaffStatCard label="Lớp học" value={classes.length} icon={<BookOpen className="h-5 w-5" />} tone="gold" />
        <StaffStatCard label="Giáo viên" value={teachers.length} icon={<GraduationCap className="h-5 w-5" />} tone="blue" />
        <StaffStatCard
          label="Học sinh"
          value={`${formatNumber(students.length)}/${formatNumber(school.maxStudents)}`}
          icon={<Users className="h-5 w-5" />}
          tone="green"
        />
        <StaffStatCard label="Hoạt động hôm nay" value={activeToday} icon={<MessageSquare className="h-5 w-5" />} tone="amber" />
        <Link
          href={ROUTES.SCHOOL.CONTENT}
          aria-label={`${pendingReviews} nội dung chờ duyệt — mở trang duyệt`}
          className="block rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)]"
        >
          <StaffStatCard
            label="Chờ duyệt"
            value={pendingReviews}
            icon={<ClipboardCheck className="h-5 w-5" />}
            tone={pendingReviews ? "amber" : "muted"}
            valueColor={pendingReviews ? "var(--status-warning)" : undefined}
            className="h-full transition-colors hover:bg-[var(--status-neutral-bg)]"
          />
        </Link>
      </StaffStatsGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionHeading title="Học sinh theo khối" description="Số tài khoản học sinh của từng khối." />
          <SchoolTrendChart
            data={studentGrade}
            title="Học sinh theo khối"
            unit="học sinh"
            directLabels="all"
            summary={studentGrade.map((g) => `${g.label}: ${g.value} học sinh`).join(" · ")}
          />
        </Panel>
        <Panel>
          <SectionHeading title="Lớp theo khối" description="Số lớp đang mở trong năm học." />
          <SchoolTrendChart
            data={classGrade}
            color="var(--gold-leaf)"
            title="Lớp theo khối"
            unit="lớp"
            directLabels="all"
            summary={classGrade.map((g) => `${g.label}: ${g.value} lớp`).join(" · ")}
          />
        </Panel>
      </div>

      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <SectionHeading title="Hoạt động trò chuyện AI" description="Học sinh có gửi tin nhắn cho nhân vật lịch sử, theo ngày." />
          <PeriodSwitch value={period} onChange={setPeriod} />
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-content-heading">Học sinh hoạt động mỗi ngày</h3>
            <SchoolTrendChart
              data={activeSeries}
              title={`Học sinh hoạt động mỗi ngày, ${period} ngày gần nhất`}
              unit="học sinh"
              summary={`Trung bình ${avgActive} học sinh/ngày trong ${period} ngày; cao nhất ${peakActive?.activeStudents ?? 0} vào ${peakActive ? shortDay(peakActive.date) : "—"}.`}
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-content-heading">Tin nhắn AI mỗi ngày</h3>
            <SchoolTrendChart
              data={messageSeries}
              variant="line"
              color="var(--jade)"
              title={`Tin nhắn AI mỗi ngày, ${period} ngày gần nhất`}
              unit="tin nhắn"
              summary={`Tổng ${formatNumber(totalMessages)} tin nhắn trong ${period} ngày; nhiều nhất ${formatNumber(peakMessages?.messages ?? 0)} vào ${peakMessages ? shortDay(peakMessages.date) : "—"}.`}
            />
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionHeading title="Token hôm nay" description="Tổng token học sinh đã dùng so với tổng hạn mức trong ngày." />
          <div className="flex items-end justify-between gap-3">
            <p className="font-display text-3xl font-extrabold tabular-nums text-content-heading">{formatNumber(usedToday)}</p>
            <p className="pb-1 text-sm text-content-muted">/ {formatNumber(quotaToday)} token</p>
          </div>
          <TokenBar used={usedToday} quota={quotaToday} className="h-3" />
          <p className="text-xs text-content-muted">
            {formatNumber(school.dailyTokensPerStudent)} token/học sinh/ngày · {formatNumber(school.dailyTokensPerTeacher)} token/giáo viên/ngày · reset
            mỗi ngày lúc 00:00
          </p>
          <div className="space-y-2 border-t border-[var(--border-default)] pt-4">
            <h3 className="text-sm font-bold text-content-heading">Lớp dùng nhiều token nhất hôm nay</h3>
            <SchoolRankBars
              data={topToken}
              title="Lớp dùng nhiều token nhất hôm nay"
              unit="token"
              summary={
                topToken[0]
                  ? `Lớp ${topToken[0].label} dùng nhiều nhất: ${formatNumber(topToken[0].value)} token.`
                  : "Chưa có lớp nào dùng token hôm nay."
              }
            />
          </div>
          <Link href={ROUTES.SCHOOL.TOKENS} className="archive-link">
            Cấu hình hạn mức <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Panel>

        <Panel>
          <SectionHeading title="Cần chú ý" />
          {warnings.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-[var(--status-success)]">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Mọi thứ đều ổn.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
              {warnings.map((w) => (
                <li key={w.key}>
                  <Link href={w.href} className="flex items-start gap-3 py-3 text-sm hover:text-[var(--accent-gold)]">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-warning)]" aria-hidden="true" />
                    <span className="flex-1">{w.text}</span>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <section className="space-y-4">
        <SectionHeading
          title="Báo cáo theo lớp"
          description="Bài đang mở, tỉ lệ nộp bài (các bài đã mở), điểm trung bình bài kiểm tra quy về thang 10. Bấm tiêu đề cột để sắp xếp."
          actions={
            <button
              type="button"
              className="btn-line"
              onClick={() => {
                downloadCsv(`bao-cao-lop-${school.code}-${TODAY_KEY}.csv`, classReportCsv(classRows));
                toast.success("Đã tải báo cáo CSV");
              }}
            >
              <Download className="h-4 w-4" aria-hidden="true" /> Xuất báo cáo CSV
            </button>
          }
        />
        <SchoolClassReportTable rows={classRows} />
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="Hoạt động giáo viên"
          description="Bài tập giao trong 30 ngày, nội dung địa phương đã soạn theo trạng thái và các lớp phụ trách."
        />
        <SchoolTeacherActivityTable rows={teacherRows} />
      </section>

      <div className="space-y-4">
        <SectionHeading title="Truy cập nhanh" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {links.map(({ href, label, desc, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-3 rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] p-4 transition-colors hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]"
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
              <span>
                <span className="block text-sm font-bold">{label}</span>
                <span className="block text-xs text-content-muted group-hover:text-[var(--text-inverse)]">{desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
