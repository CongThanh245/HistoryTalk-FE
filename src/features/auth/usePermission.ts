import { useAuthStore } from "@/store/auth.store";

// Hook kiểm tra user có phải là staff/admin không
export function useIsStaff() {
  const role = useAuthStore((s) => s.user?.role);
  return role === "STAFF" || role === "ADMIN";
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
