import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService, type UpdateProfilePayload, type ChangePasswordPayload } from "@/services/user.service";
import { paymentService } from "@/services/payment.service";
import { queryKeys } from "@/shared/query-key";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }
  return fallback;
}

// ── useProfile ────────────────────────────────────────────────────────────────
/**
 * Lấy profile đầy đủ từ /users/me và đồng bộ avatar/tier vào auth store
 * để Header & Sidebar luôn hiển thị thông tin mới nhất.
 */
export function useProfile() {
  const updateUser = useAuthStore((s) => s.updateUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: [...queryKeys.profile.me, isAuthenticated],
    queryFn: async () => {
      const profile = await userService.getProfile();
      // Đồng bộ các trường cơ bản lên store
      updateUser({
        userName: profile.userName,
        avatarUrl: profile.avatarUrl ?? undefined,
        fullName: profile.fullName,
        tierId: profile.tierId,
        tierTitle: profile.tierTitle,
        token: profile.token,
      });
      return profile;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // Cache 5 phút
    refetchOnWindowFocus: false,
  });
}

// ── useUpdateProfile ──────────────────────────────────────────────────────────
/** Cập nhật profile (PATCH /users/me) rồi invalidate để refetch mới nhất */
export function useUpdateProfile() {
  const qc = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => userService.updateProfile(payload),
    onSuccess: (updatedProfile) => {
      qc.setQueryData(queryKeys.profile.me, updatedProfile);
      // Đồng bộ ngay lên store
      updateUser({
        userName: updatedProfile.userName,
        avatarUrl: updatedProfile.avatarUrl ?? undefined,
        fullName: updatedProfile.fullName,
        tierId: updatedProfile.tierId,
        tierTitle: updatedProfile.tierTitle,
        token: updatedProfile.token,
      });
      // Invalidate cache profile để refetch dữ liệu đầy đủ
      qc.invalidateQueries({ queryKey: queryKeys.profile.me });
      toast.success("Cập nhật hồ sơ thành công!");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Cập nhật thất bại. Vui lòng thử lại."));
    },
  });
}

// ── useChangePassword ─────────────────────────────────────────────────────────
/** Đổi mật khẩu (PATCH /users/me/password) */
export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => userService.changePassword(payload),
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công!");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại."));
    },
  });
}

// ── useMyPaymentHistory ───────────────────────────────────────────────────────
/** Lấy lịch sử giao dịch của người dùng hiện tại từ /payments/me */
export function useMyPaymentHistory() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.payments.myHistory,
    queryFn: () => paymentService.getMyHistory(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // Cache 2 phút
    refetchOnWindowFocus: false,
  });
}
