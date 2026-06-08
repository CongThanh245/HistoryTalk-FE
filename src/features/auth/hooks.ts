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

      // Xóa profile cache để đảm bảo token được làm mới khi login tài khoản mới
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });

      clearAuthCookies();

      router.push("/login");
    },
  });
}
