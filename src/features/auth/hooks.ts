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
      document.cookie = `auth-role=${user.userType}; path=/; max-age=${tokens.expiresIn / 1000}`;

      if (user.userType === "STAFF" || user.userType === "ADMIN") {
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
      // Dù API lỗi vẫn clear local state
      clearAuth();
      router.push("/login");
    },
  });
}
