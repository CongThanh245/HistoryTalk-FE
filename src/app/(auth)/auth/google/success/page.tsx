"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { User } from "@/features/auth/type";
import { clearAuthCookies, persistAuthCookies } from "@/features/auth/auth-cookies";

const VALID_ROLES = ["CUSTOMER", "CONTENT_ADMIN", "SYSTEM_ADMIN"] as const;

function getRedirectPath(role: User["role"]) {
  if (role === "CONTENT_ADMIN") return "/staff";
  if (role === "SYSTEM_ADMIN") return "/staff/admin";
  return "/home";
}

function isValidRole(role: string | null): role is User["role"] {
  return VALID_ROLES.includes(role as User["role"]);
}

export default function GoogleOAuthSuccessPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const tokenType = params.get("tokenType");
    const expiresInRaw = params.get("expiresIn");
    const uid = params.get("uid");
    const userName = decodeURIComponent(params.get("userName") ?? "");
    const email = decodeURIComponent(params.get("email") ?? "");
    const role = params.get("role");
    const expiresIn = Number(expiresInRaw);

    window.history.replaceState({}, document.title, "/auth/google/success");

    if (
      !accessToken ||
      !refreshToken ||
      tokenType !== "Bearer" ||
      !Number.isFinite(expiresIn) ||
      expiresIn <= 0 ||
      !uid ||
      !userName ||
      !email ||
      !isValidRole(role)
    ) {
      clearAuth();
      clearAuthCookies();
      router.replace("/login");
      return;
    }

    setAuth(
      { uid, userName, email, role },
      { accessToken, refreshToken, tokenType, expiresIn },
    );
    persistAuthCookies(accessToken, role, expiresIn);
    // Force full page reload to trigger middleware with fresh cookies
    window.location.href = getRedirectPath(role);
  }, [clearAuth, router, setAuth]);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{ background: "var(--palladian)", color: "var(--content-text)" }}
    >
      <div className="text-center">
        <p className="text-sm font-semibold">Completing Google sign in...</p>
      </div>
    </div>
  );
}
