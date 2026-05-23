import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "./api";
import { useAuthStore } from "@/store/auth.store";
import {
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from "./type";

function getCookieMaxAge(expiresIn: number) {
  return expiresIn > 100000 ? expiresIn / 1000 : expiresIn;
}

function persistAuthCookies(
  accessToken: string,
  role: string,
  expiresIn: number,
) {
  const maxAge = getCookieMaxAge(expiresIn);

  document.cookie = `auth-token=${accessToken}; path=/; max-age=${maxAge}`;
  document.cookie = `auth-role=${role}; path=/; max-age=${maxAge}`;
}

function redirectAfterLogin(role: string, router: ReturnType<typeof useRouter>) {
  if (role === "CONTENT_ADMIN") {
    router.push("/staff");
    return;
  }

  if (role === "SYSTEM_ADMIN") {
    router.push("/staff/admin");
    return;
  }

  router.push("/home");
}

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: ({ user, tokens }) => {
      setAuth(user, tokens);
      persistAuthCookies(tokens.accessToken, user.role, tokens.expiresIn);
      redirectAfterLogin(user.role, router);
    },
  });
}

export function useGoogleLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: GoogleLoginRequest) => authApi.googleLogin(data),
    onSuccess: ({ user, tokens }) => {
      setAuth(user, tokens);
      persistAuthCookies(tokens.accessToken, user.role, tokens.expiresIn);
      redirectAfterLogin(user.role, router);
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

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearAuth();

      document.cookie = "auth-token=; path=/; max-age=0";
      document.cookie = "auth-role=; path=/; max-age=0";

      router.push("/login");
    },
  });
}
