import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import {
  analyticsDashboardService,
  type ClassroomTokenParams,
  type SchoolDashboardRangeParams,
} from "@/services/analytics-dashboard.service";
import { queryKeys } from "@/shared/query-key";
import { useAuthStore } from "@/store/auth.store";

// ── useMyDashboard ────────────────────────────────────────────────────────────
/** Lấy thống kê học tập & sử dụng AI của người dùng hiện tại từ /users/me/dashboard */
export function useMyDashboard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.dashboard.me,
    queryFn: () => dashboardService.getMyDashboard(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // Cache 2 phút
    refetchOnWindowFocus: false,
  });
}

// ── Dashboard theo role (AnalyticsDashboardController) ───────────────────────

const ANALYTICS_STALE_TIME = 1000 * 60 * 2;

/** GET /school-admin/dashboard — chỉ SCHOOL_ADMIN. */
export function useSchoolAdminDashboard(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.schoolAdmin,
    queryFn: () => analyticsDashboardService.getSchoolAdminDashboard(),
    enabled,
    staleTime: ANALYTICS_STALE_TIME,
  });
}

// ── Bộ dashboard School Admin (/school-admin/dashboard/*) ─────────────────────

const SCHOOL_DASH = ["dashboard", "school-admin", "suite"] as const;
const SCHOOL_DASH_STALE = 1000 * 60;

export function useSchoolOverview() {
  return useQuery({
    queryKey: [...SCHOOL_DASH, "overview"],
    queryFn: () => analyticsDashboardService.getSchoolOverview(),
    staleTime: SCHOOL_DASH_STALE,
  });
}

export function useSchoolUserAnalytics(params: SchoolDashboardRangeParams) {
  return useQuery({
    queryKey: [...SCHOOL_DASH, "users", params],
    queryFn: () => analyticsDashboardService.getSchoolUserAnalytics(params),
    staleTime: SCHOOL_DASH_STALE,
  });
}

export function useSchoolContentSummary() {
  return useQuery({
    queryKey: [...SCHOOL_DASH, "content"],
    queryFn: () => analyticsDashboardService.getSchoolContentSummary(),
    staleTime: 1000 * 120,
  });
}

export function useSchoolChatActivity(params: SchoolDashboardRangeParams) {
  return useQuery({
    queryKey: [...SCHOOL_DASH, "chat", params],
    queryFn: () => analyticsDashboardService.getSchoolChatActivity(params),
    staleTime: SCHOOL_DASH_STALE,
  });
}

export function useSchoolQuizAnalytics(params: SchoolDashboardRangeParams) {
  return useQuery({
    queryKey: [...SCHOOL_DASH, "quiz", params],
    queryFn: () => analyticsDashboardService.getSchoolQuizAnalytics(params),
    staleTime: SCHOOL_DASH_STALE,
  });
}

export function useSchoolTokenAnalytics(params: SchoolDashboardRangeParams) {
  return useQuery({
    queryKey: [...SCHOOL_DASH, "tokens", params],
    queryFn: () => analyticsDashboardService.getSchoolTokenAnalytics(params),
    staleTime: SCHOOL_DASH_STALE,
  });
}

/** GET /teacher/dashboard/classrooms/{classId} — chỉ TEACHER. */
export function useClassroomTokenUsage(params: ClassroomTokenParams = {}, enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "token-usage", "classrooms", params],
    queryFn: () => analyticsDashboardService.getClassroomTokenUsage(params),
    enabled,
    staleTime: ANALYTICS_STALE_TIME,
  });
}

export function useStudentTokenUsage(classroomId: string | undefined, params: { search?: string; page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: ["dashboard", "token-usage", "students", classroomId, params],
    queryFn: () => analyticsDashboardService.getStudentTokenUsage(classroomId!, params),
    enabled: !!classroomId,
    staleTime: ANALYTICS_STALE_TIME,
  });
}

export function useTeacherClassesOverview(enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "teacher-classes-overview"],
    queryFn: () => analyticsDashboardService.getTeacherClassesOverview(),
    enabled,
    staleTime: ANALYTICS_STALE_TIME,
  });
}

export function useTeacherClassroomDashboard(classId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.teacherClassroom(classId ?? ""),
    queryFn: () => analyticsDashboardService.getTeacherClassroomDashboard(classId!),
    enabled: enabled && !!classId,
    staleTime: ANALYTICS_STALE_TIME,
  });
}

/** GET /student/dashboard — chỉ SCHOOL_STUDENT. */
export function useStudentDashboard(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.student,
    queryFn: () => analyticsDashboardService.getStudentDashboard(),
    enabled,
    staleTime: ANALYTICS_STALE_TIME,
  });
}

/** GET /customer/dashboard — CUSTOMER. Phần lớn trùng /users/me/dashboard (useMyDashboard). */
export function useCustomerDashboard(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.customer,
    queryFn: () => analyticsDashboardService.getCustomerDashboard(),
    enabled,
    staleTime: ANALYTICS_STALE_TIME,
  });
}

/** GET /admin/dashboard — SYSTEM_ADMIN. Trùng phần lớn các API /system-admin/dashboard/*. */
export function useSystemAdminComprehensiveDashboard(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.systemAdmin,
    queryFn: () => analyticsDashboardService.getSystemAdminDashboard(),
    enabled,
    staleTime: ANALYTICS_STALE_TIME,
  });
}
