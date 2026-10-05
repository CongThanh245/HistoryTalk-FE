"use client";

import { getRoleHome } from "@/constants/roles";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { User } from "@/features/auth/type";
import { persistAuthCookies, resetClientAuth } from "@/features/auth/auth-cookies";

const VALID_ROLES = ["CUSTOMER", "CONTENT_ADMIN", "SYSTEM_ADMIN", "SCHOOL_ADMIN", "TEACHER", "SCHOOL_STUDENT"] as const;

function isValidRole(role: string | null): role is User["role"] {
  return VALID_ROLES.includes(role as User["role"]);
}

export default function GoogleOAuthSuccessPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

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
      resetClientAuth();
      router.replace("/login");
      return;
    }

    setAuth(
      { uid, userName, email, role },
      { accessToken, refreshToken, tokenType, expiresIn },
    );
    persistAuthCookies(accessToken, role, expiresIn);

    const isNewUser = params.get("isNewUser") === "true";

    // Force full page reload to trigger middleware with fresh cookies.
    // For CUSTOMER, append ?notify=google_welcome ONLY if it is a new user
    const home = getRoleHome(role);
    const redirectPath = isNewUser && home === "/home" ? "/home?notify=google_welcome" : home;

    window.location.href = redirectPath;
  }, [router, setAuth]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 bg-[var(--bg-main)] text-content-text">
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-content-muted animate-pulse">Completing Google sign in...</p>
      </div>
    </div>
  );
}
