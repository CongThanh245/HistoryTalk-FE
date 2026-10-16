import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import { analyticsDashboardService } from "@/services/analytics-dashboard.service";
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

/** GET /teacher/dashboard/classrooms/{classId} — chỉ TEACHER. */
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
