import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
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
