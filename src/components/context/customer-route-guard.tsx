"use client";

import type React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { syncAuthCookies } from "@/features/auth/auth-cookies";

function getStaffHome(role: string | undefined) {
  if (role === "CONTENT_ADMIN") return "/staff";
  if (role === "SYSTEM_ADMIN") return "/staff/admin";
  return null;
}

export function CustomerRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const tokens = useAuthStore((state) => state.tokens);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const role = user?.role;
  const staffHome = hasHydrated ? getStaffHome(role) : null;

  useEffect(() => {
    if (!staffHome) return;

    syncAuthCookies(user, tokens);
    router.replace(staffHome);
  }, [router, staffHome, tokens, user]);

  if (!hasHydrated || staffHome) {
    return null;
  }

  return children;
}
