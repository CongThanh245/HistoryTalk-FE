import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "./api";
import { useAuthStore } from "@/store/auth.store";
import { LoginRequest, RegisterRequest } from "./type";

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: ({ user, tokens }) => {
      setAuth(user, tokens);

      document.cookie = `auth-token=${tokens.accessToken}; path=/; max-age=${tokens.expiresIn / 1000}`;
      document.cookie = `auth-role=${user.role}; path=/; max-age=${tokens.expiresIn / 1000}`; // ← userType → role

      if (user.role === "STAFF" || user.role === "ADMIN") {
        router.push("/staff");
      } else {
        router.push("/home");
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

export function useLogout() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearAuth();

      // Xóa cookies
      document.cookie = "auth-token=; path=/; max-age=0";
      document.cookie = "auth-role=; path=/; max-age=0";

      router.push("/login");
    },
  });
}
