import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "./api";
import { useAuthStore } from "@/store/auth.store";
import { queryKeys } from "@/shared/query-key";
import {
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from "./type";
import { clearAuthCookies, persistAuthCookies } from "./auth-cookies";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: ({ user, tokens }) => {
      setAuth(user, tokens);
      persistAuthCookies(tokens.accessToken, user.role, tokens.expiresIn);

      // Force full page reload to trigger middleware with fresh cookies
      if (user.role === "CONTENT_ADMIN") {
        window.location.href = "/staff";
      } else if (user.role === "SYSTEM_ADMIN") {
        window.location.href = "/staff/admin";
      } else {
        window.location.href = "/home";
      }
    },
  });
}

export function useGoogleLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: GoogleLoginRequest) => authApi.googleLogin(data),
    onSuccess: ({ user, tokens, isNewUser }) => {
      setAuth(user, tokens);
      persistAuthCookies(tokens.accessToken, user.role, tokens.expiresIn);

      // Force full page reload to trigger middleware with fresh cookies.
      // For CUSTOMER accounts we append ?notify=google_welcome so the home page
      // can show a toast reminding the user to check their email for the
      // temporary application password sent by the backend.
      if (user.role === "CONTENT_ADMIN") {
        window.location.href = "/staff";
      } else if (user.role === "SYSTEM_ADMIN") {
        window.location.href = "/staff/admin";
      } else {
        window.location.href = isNewUser
          ? "/home?notify=google_welcome"
          : "/home";
      }
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: () => {
      router.push("/login");
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authApi.forgotPassword(data),
  });
}

export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data),
    onSuccess: () => {
      router.push("/login");
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearAuth();

      // Xóa (không refetch) profile cache để đảm bảo dữ liệu được làm mới khi login tài khoản mới.
      // Dùng removeQueries thay vì invalidateQueries vì lúc này token đã bị clearAuth() xoá —
      // nếu query đang active, invalidate sẽ trigger refetch không token → 401 → hiện nhầm
      // SessionExpiredDialog ngay khi người dùng chỉ đang logout bình thường.
      queryClient.removeQueries({ queryKey: queryKeys.profile.me });

      clearAuthCookies();

      router.push("/login");
    },
  });
}
