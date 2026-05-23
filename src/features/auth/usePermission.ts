import { useAuthStore } from "@/store/auth.store";

// Hook kiểm tra user có phải là staff/admin không
export function useIsStaff() {
  const role = useAuthStore((s) => s.user?.role);
  return role === "CONTENT_ADMIN" || role === "SYSTEM_ADMIN";
}

export function useIsContentAdmin() {
  const role = useAuthStore((s) => s.user?.role);
  return role === "CONTENT_ADMIN";
}

export function useIsSystemAdmin() {
  const role = useAuthStore((s) => s.user?.role);
  return role === "SYSTEM_ADMIN";
}

// Hook kiểm tra user có phải là customer không
export function useIsCustomer() {
  const role = useAuthStore((s) => s.user?.role);
  return role === "CUSTOMER";
}

// Hook trả về role hiện tại
export function useRole() {
  return useAuthStore((s) => s.user?.role ?? null);
}
