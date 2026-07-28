// src/features/admin/hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminUserService,
  type AdminUser,
  type UpdateUserPayload,
  type TokenAnalyticsData,
  type TokenAnalyticsParams,
  type UserRole,
  type ListUsersParams,
} from "@/services/admin.user.service";

// Re-export types for consumers
export type { AdminUser, TokenAnalyticsData, TokenAnalyticsParams, UserRole, ListUsersParams };

const ADMIN_KEYS = {
  stats: ["admin", "stats"] as const,
  users: (role?: string) => ["admin", "users", role ?? "all"] as const,
  userById: (uid: string) => ["admin", "user", uid] as const,
  tokenAnalytics: (params?: TokenAnalyticsParams) => ["admin", "token-analytics", params] as const,
};

/** Get admin dashboard stats - TODO: Replace with real API when available */
export function useAdminStats() {
  return useQuery({
    queryKey: ADMIN_KEYS.stats,
    queryFn: async () => {
      // TODO: Implement real stats API
      // For now, return empty stats or derive from other endpoints
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalRevenue: 0,
        freeCount: 0,
        plusCount: 0,
        proCount: 0,
        totalTokens: 0,
        registrationTrend: [],
        revenueTrend: [],
        recentActivities: [],
        recentOrders: [],
      };
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

/** Get paginated list of all users (filter by role on client if needed) */
export function useAdminUsers(role?: UserRole, params?: ListUsersParams) {
  return useQuery({
    queryKey: ADMIN_KEYS.users(role),
    queryFn: async () => {
      const data = await adminUserService.listUsers(params);
      // Filter by role if specified
      if (role) {
        return {
          ...data,
          content: data.content.filter((u) => u.role === role),
        };
      }
      return data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

/** Get single user by ID */
export function useAdminUserById(userId: string) {
  return useQuery({
    queryKey: ADMIN_KEYS.userById(userId),
    queryFn: async () => {
      return adminUserService.getUserById(userId);
    },
    staleTime: 1000 * 60, // 1 minute
    enabled: !!userId,
  });
}

// Note: User creation should go through auth flow, not admin API
// This is kept for compatibility but should be replaced with proper auth registration
export function useAdminCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // TODO: Implement via auth service or dedicated admin create API
      throw new Error("User creation via admin panel not yet implemented. Use auth registration flow.");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.users() });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
    },
    onError: (err: unknown) => {
      const error = err as { message?: string } | null;
      toast.error(error?.message ?? "Tạo tài khoản thất bại");
    },
  });
}

/** Update user profile as admin */
export function useAdminUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uid, updates }: { uid: string; updates: UpdateUserPayload }) => {
      return adminUserService.updateUser(uid, updates);
    },
    onSuccess: (updatedUser) => {
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.users(updatedUser.role) });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.userById(updatedUser.uid) });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
      toast.success("Cập nhật tài khoản thành công");
    },
    onError: (err: unknown) => {
      const error = err as { message?: string } | null;
      toast.error(error?.message ?? "Cập nhật tài khoản thất bại");
    },
  });
}

/** Update user role */
export function useAdminUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uid, role }: { uid: string; role: UserRole }) => {
      return adminUserService.updateUserRole(uid, { role });
    },
    onSuccess: (updatedUser, variables) => {
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.users() });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.users(variables.role) });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.userById(updatedUser.uid) });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
      toast.success(`Đã cập nhật vai trò thành ${updatedUser.role}`);
    },
    onError: (err: unknown) => {
      const error = err as { message?: string } | null;
      toast.error(error?.message ?? "Cập nhật vai trò thất bại");
    },
  });
}

/** Deactivate/suspend user account */
export function useAdminDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uid, role }: { uid: string; role?: UserRole }) => {
      await adminUserService.deactivateUser(uid);
      return { uid, role };
    },
    onSuccess: (result) => {
      if (result.role) {
        qc.invalidateQueries({ queryKey: ADMIN_KEYS.users(result.role) });
      } else {
        qc.invalidateQueries({ queryKey: ADMIN_KEYS.users() });
      }
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.userById(result.uid) });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
      toast.success("Đã vô hiệu hóa tài khoản");
    },
    onError: (err: unknown) => {
      const error = err as { message?: string } | null;
      toast.error(error?.message ?? "Vô hiệu hóa tài khoản thất bại");
    },
  });
}

// Note: Soft delete/restore/permanent delete APIs not available in current backend
// Using deactivate as the primary way to disable accounts
export function useAdminDeleteUser() {
  // Re-export deactivate as the soft delete equivalent
  return useAdminDeactivateUser();
}

export function useAdminRestoreUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uid }: { uid: string; role?: UserRole }) => {
      return adminUserService.restoreUser(uid);
    },
    onSuccess: (restoredUser) => {
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.users(restoredUser.role) });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.users() });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.userById(restoredUser.uid) });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
      toast.success("Đã khôi phục tài khoản thành công");
    },
    onError: (err: unknown) => {
      const error = err as { message?: string } | null;
      toast.error(error?.message ?? "Khôi phục tài khoản thất bại");
    },
  });
}

export function useAdminPermanentDeleteUser() {
  // TODO: Implement when backend supports permanent deletion
  return useMutation({
    mutationFn: async () => {
      throw new Error("Permanent user deletion not yet implemented in backend");
    },
    onError: (err: unknown) => {
      const error = err as { message?: string } | null;
      toast.error(error?.message ?? "Xóa vĩnh viễn thất bại");
    },
  });
}

// Note: Add tokens API not available in current backend contract
// This is kept for compatibility but should be implemented when available
export function useAdminAddTokens() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uid, amount }: { uid: string; amount: number }) => {
      // TODO: Implement when backend supports manual token adjustment
      console.warn(`Add ${amount} tokens to user ${uid} - API not implemented`);
      throw new Error("Manual token adjustment not yet implemented in backend");
    },
    onSuccess: (_updatedUser, variables) => {
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.users() });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
      toast.success(`Đã cộng thêm ${variables.amount} token cho tài khoản`);
    },
    onError: (err: unknown) => {
      const error = err as { message?: string } | null;
      toast.error(error?.message ?? "Cộng token thất bại");
    },
  });
}

/** Get token analytics for admin dashboard */
export function useAdminTokenAnalytics(params?: TokenAnalyticsParams) {
  return useQuery({
    queryKey: ADMIN_KEYS.tokenAnalytics(params),
    queryFn: async () => {
      return adminUserService.getTokenAnalytics(params);
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

