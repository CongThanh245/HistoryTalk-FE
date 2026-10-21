"use client";

import Link from "next/link";
import { BookOpen, GraduationCap, Library, Users, Zap } from "lucide-react";

import { StaffStatCard, StaffStatsGrid } from "@/components/staff/staff-stat-card";
import { Panel, SectionHeading, formatNumber } from "@/components/saas/saas-ui";
import { Skeleton } from "@/components/ui/skeleton";
import { academicYearLabel, currentAcademicYear } from "@/components/saas/class-form-dialog";
import { ROUTES } from "@/constants/routes";
import { useApiSchoolClassrooms, useApiTeachers, useApiTokenQuota } from "@/features/saas/hooks-api";
import { useSchoolAdminDashboard } from "@/features/dashboard/hooks";
import { TokenHero } from "./quota";
import { ErrorBlock } from "./shared";


/** Ti le tu BE theo thang 0–100. */
function formatRate(q: { isPending: boolean; isError: boolean }, value: number | undefined) {
  if (q.isPending) return "…";
  if (q.isError || value === undefined) return "—";
  return `${value.toFixed(1)}%`;
}

/** School Admin dashboard widgets backed by the API: school + token pool from the API, counts of classes / teachers. */
export function OverviewWidgets() {
  const quota = useApiTokenQuota();
  const classes = useApiSchoolClassrooms({ page: 0, size: 1 });
  const yearClasses = useApiSchoolClassrooms({ page: 0, size: 1, academicYear: currentAcademicYear() });
  const teachers = useApiTeachers({ page: 0, size: 1 });
  // GET /school-admin/dashboard — so hoc sinh, token hoc sinh da dung, thong ke nop bai.
  const analytics = useSchoolAdminDashboard();
  const analyticsStat = (value: number | undefined) =>
    analytics.isPending ? "…" : analytics.isError || value === undefined ? "—" : formatNumber(value);

  const stat = (q: { isPending: boolean; isError: boolean; data?: { totalElements: number } }) =>
    q.isPending ? "…" : q.isError ? "—" : formatNumber(q.data?.totalElements ?? 0);

  const links = [
    { href: ROUTES.SCHOOL.CLASSES, label: "Quản lý lớp học", desc: "Tạo lớp, phân công giáo viên", icon: BookOpen },
    { href: ROUTES.SCHOOL.TEACHERS, label: "Tài khoản giáo viên", desc: "Tạo, khóa / mở khóa tài khoản", icon: GraduationCap },
    { href: ROUTES.SCHOOL.STUDENTS, label: "Tài khoản học sinh", desc: "Nhập hàng loạt từ file CSV", icon: Users },
    { href: ROUTES.SCHOOL.TOKENS, label: "Hạn mức token", desc: "Quỹ chung, hạn mức ngày, yêu cầu", icon: Zap },
    { href: ROUTES.SCHOOL.CONTENT, label: "Giám sát nội dung", desc: "Nội dung giáo viên đăng", icon: Library },
  ];

  return (
    <div className="space-y-8">
      {quota.isPending ? (
        <Skeleton className="h-72 w-full" />
      ) : quota.isError ? (
        <ErrorBlock error={quota.error} fallback="Không tải được thông tin trường." onRetry={() => void quota.refetch()} />
      ) : (
        <TokenHero quota={quota.data} dash={analytics.data} />
      )}

      <StaffStatsGrid className="sm:grid-cols-3 lg:grid-cols-3">
        <StaffStatCard
          label={`Lớp năm học ${academicYearLabel(currentAcademicYear())}`}
          value={stat(yearClasses)}
          icon={<BookOpen className="h-5 w-5" />}
          tone="blue"
        />
        <StaffStatCard label="Giáo viên" value={stat(teachers)} icon={<GraduationCap className="h-5 w-5" />} tone="green" />
        <StaffStatCard label="Học sinh" value={analyticsStat(analytics.data?.totalStudents)} icon={<Users className="h-5 w-5" />} tone="gold" />
      </StaffStatsGrid>

      <Panel>
        <SectionHeading title="Tình hình nộp bài" description="Tổng hợp bài nộp của học sinh trên toàn trường." />
        <StaffStatsGrid className="sm:grid-cols-2 lg:grid-cols-4">
          <StaffStatCard label="Tổng bài nộp" value={analyticsStat(analytics.data?.assignmentStats?.totalSubmissions)} tone="muted" />
          <StaffStatCard label="Hoàn thành" value={formatRate(analytics, analytics.data?.assignmentStats?.completedRate)} tone="green" />
          <StaffStatCard label="Nộp muộn" value={formatRate(analytics, analytics.data?.assignmentStats?.lateSubmittedRate)} tone="amber" />
          <StaffStatCard label="Chưa làm" value={formatRate(analytics, analytics.data?.assignmentStats?.notStartedRate)} tone="red" />
        </StaffStatsGrid>
      </Panel>

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
