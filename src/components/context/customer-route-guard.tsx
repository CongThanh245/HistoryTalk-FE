"use client";

import type React from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { syncAuthCookies } from "@/features/auth/auth-cookies";
import { getRoleHome } from "@/constants/roles";

/** Roles that work outside the learning app get sent to their own area. */
function getStaffHome(role: string | undefined) {
  if (role === "CONTENT_ADMIN" || role === "SYSTEM_ADMIN" || role === "SCHOOL_ADMIN") return getRoleHome(role);
  return null;
}

export function CustomerRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const publicCatalog = pathname === "/characters" || pathname === "/events";
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

  if ((!hasHydrated && !publicCatalog) || staffHome) {
    return null;
  }

  return children;
}
