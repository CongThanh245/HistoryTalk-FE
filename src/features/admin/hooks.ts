// src/features/admin/hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminMockService, type MockUser } from "./mock-data";

const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));

const ADMIN_KEYS = {
  stats: ["admin", "stats"] as const,
  users: (role: string) => ["admin", "users", role] as const,
};

export function useAdminStats() {
  return useQuery({
    queryKey: ADMIN_KEYS.stats,
    queryFn: async () => {
      await delay(350);
      return adminMockService.getStats();
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useAdminUsers(role: "CUSTOMER" | "CONTENT_ADMIN" | "SYSTEM_ADMIN") {
  return useQuery({
    queryKey: ADMIN_KEYS.users(role),
    queryFn: async () => {
      await delay(400);
      return adminMockService.getUsersByRole(role);
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useAdminCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: Omit<MockUser, "uid" | "created_date" | "updated_date" | "deleted_date" | "last_active_date">) => {
      await delay(500);
      return adminMockService.createUser(user);
    },
    onSuccess: (newUser) => {
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.users(newUser.role) });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
      toast.success(`Tạo tài khoản ${newUser.user_name} thành công`);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Tạo tài khoản thất bại");
    },
  });
}

export function useAdminUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uid, updates }: { uid: string; updates: Partial<MockUser> }) => {
      await delay(500);
      return adminMockService.updateUser(uid, updates);
    },
    onSuccess: (updatedUser) => {
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.users(updatedUser.role) });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
      toast.success("Cập nhật tài khoản thành công");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Cập nhật tài khoản thất bại");
    },
  });
}

export function useAdminDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uid, role }: { uid: string; role: "CUSTOMER" | "CONTENT_ADMIN" | "SYSTEM_ADMIN" }) => {
      await delay(400);
      adminMockService.softDeleteUser(uid);
      return { uid, role };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.users(result.role) });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
      toast.success("Đã chuyển tài khoản vào thùng rác");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Xóa tài khoản thất bại");
    },
  });
}

export function useAdminRestoreUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uid, role }: { uid: string; role: "CUSTOMER" | "CONTENT_ADMIN" | "SYSTEM_ADMIN" }) => {
      await delay(400);
      adminMockService.restoreUser(uid);
      return { uid, role };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.users(result.role) });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
      toast.success("Khôi phục tài khoản thành công");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Khôi phục tài khoản thất bại");
    },
  });
}

export function useAdminPermanentDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uid, role }: { uid: string; role: "CUSTOMER" | "CONTENT_ADMIN" | "SYSTEM_ADMIN" }) => {
      await delay(500);
      adminMockService.permanentDeleteUser(uid);
      return { uid, role };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.users(result.role) });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
      toast.success("Đã xóa vĩnh viễn tài khoản khỏi hệ thống");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Xóa vĩnh viễn thất bại");
    },
  });
}

export function useAdminAddTokens() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uid, amount }: { uid: string; amount: number }) => {
      await delay(400);
      return adminMockService.addTokens(uid, amount);
    },
    onSuccess: (updatedUser, variables) => {
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.users(updatedUser.role) });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
      toast.success(`Đã cộng thêm ${variables.amount} token cho tài khoản ${updatedUser.user_name}`);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Cộng token thất bại");
    },
  });
}

