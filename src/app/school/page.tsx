"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { MockDataNotice } from "@/components/saas/mock-data-notice";
import { Panel, SectionHeading, formatNumber, useHydrated } from "@/components/saas/saas-ui";
import { SchoolTrendChart } from "@/components/saas/school-charts";
import { SchoolClassReportTable, SchoolTeacherActivityTable } from "@/components/saas/school-dashboard-tables";
import { TODAY_KEY, classReportCsv, shortDay, useSchoolDashboard } from "@/features/saas/hooks-school";
import { useDemoSchoolId } from "@/features/saas/store";
import { cn } from "@/lib/utils/cn";
import { OverviewWidgets } from "./_components/overview";
import { SchoolShell } from "./_components/shared";

/**
 * School Admin dashboard. The top part (school, token pool, class / teacher counts) runs on the API.
 * The activity report below still reads the mock store until the backend exposes analytics endpoints.
 */
export default function SchoolOverviewPage() {
  return (
    <SchoolShell title="Tổng quan trường" description="Thông tin trường, quỹ token theo gói, số lớp, giáo viên và báo cáo hoạt động.">
      <div className="space-y-10">
        <OverviewWidgets />
        <MockActivityReport />
      </div>
    </SchoolShell>
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

/** Mock analytics (no API yet): students / classes per grade, AI chat activity, class report, teacher activity. */
function MockActivityReport() {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return <MockActivityReportContent />;
}

function MockActivityReportContent() {
  const schoolId = useDemoSchoolId();
  const [period, setPeriod] = React.useState<Period>(14);
  const { school, daily, grades, classRows, teacherRows } = useSchoolDashboard(schoolId, period);

  if (!school) return null;

  const activeSeries = daily.map((d) => ({ key: d.date, label: shortDay(d.date), value: d.activeStudents }));
  const messageSeries = daily.map((d) => ({ key: d.date, label: shortDay(d.date), value: d.messages }));
  const avgActive = daily.length ? Math.round(daily.reduce((s, d) => s + d.activeStudents, 0) / daily.length) : 0;
  const peakActive = daily.reduce((b, d) => (d.activeStudents > b.activeStudents ? d : b), daily[0]);
  const totalMessages = daily.reduce((s, d) => s + d.messages, 0);
  const peakMessages = daily.reduce((b, d) => (d.messages > b.messages ? d : b), daily[0]);
  const studentGrade = grades.map((g) => ({ key: String(g.grade), label: `Khối ${g.grade}`, value: g.students }));
  const classGrade = grades.map((g) => ({ key: String(g.grade), label: `Khối ${g.grade}`, value: g.classes }));

  return (
    <section className="space-y-8" aria-label="Báo cáo hoạt động (dữ liệu mẫu)">
      <div className="space-y-3">
        <SectionHeading title="Báo cáo hoạt động" description="Phần này chưa có API trên máy chủ và đang hiển thị dữ liệu mẫu." />
        {/* FAKE UI: khối "Báo cáo hoạt động" dùng dữ liệu mẫu (useSchoolDashboard), chưa có API thống kê. */}
        <MockDataNotice />
      </div>
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

    </section>
  );
}
