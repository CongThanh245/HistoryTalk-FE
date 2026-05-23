// src/features/admin/dashboard.hooks.ts
import { useQuery } from "@tanstack/react-query";
import {
  adminDashboardService,
  type UserAnalyticsParams,
  type ChatActivityParams,
} from "@/services/admin.dashboard.service";

const DASHBOARD_KEYS = {
  overview: ["admin", "dashboard", "overview"] as const,
  users: (params?: UserAnalyticsParams) => ["admin", "dashboard", "users", params] as const,
  content: ["admin", "dashboard", "content"] as const,
  chat: (params?: ChatActivityParams) => ["admin", "dashboard", "chat", params] as const,
  health: ["admin", "dashboard", "health"] as const,
};

export function useAdminOverview() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.overview,
    queryFn: () => adminDashboardService.getOverview(),
    staleTime: 1000 * 60, // 60s
  });
}

export function useAdminUserAnalytics(params?: UserAnalyticsParams) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.users(params),
    queryFn: () => adminDashboardService.getUserAnalytics(params),
    staleTime: 1000 * 60,
  });
}

export function useAdminContentSummary() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.content,
    queryFn: () => adminDashboardService.getContentSummary(),
    staleTime: 1000 * 120, // 2 min
  });
}

export function useAdminChatActivity(params?: ChatActivityParams) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.chat(params),
    queryFn: () => adminDashboardService.getChatActivity(params),
    staleTime: 1000 * 60,
  });
}

export function useAdminSystemHealth() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.health,
    queryFn: () => adminDashboardService.getSystemHealth(),
    staleTime: 1000 * 30,         // 30s
    refetchInterval: 1000 * 60,   // auto-refresh every 60s
  });
}
