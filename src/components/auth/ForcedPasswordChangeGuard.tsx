"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useProfile } from "@/features/profile/hooks";
import { ChangePasswordDialog } from "@/components/layouts/change-password-dialog";
import { AUTH_COOKIE_KEYS, ROUTES } from "@/constants/routes";

const hasAuthCookie = () => document.cookie.split("; ").some((c) => c.startsWith(`${AUTH_COOKIE_KEYS.TOKEN}=`) && c.length > AUTH_COOKIE_KEYS.TOKEN.length + 1);

const loginUrl = () => `${ROUTES.LOGIN}?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;

/**
 * Blocks workspace rendering and opens a non-dismissible ChangePasswordDialog
 * when the signed-in account has `mustChangePassword === true`.
 *
 * With `requireAuth` (staff / school workspaces) it also sends a signed-out visitor to /login. The middleware only
 * runs on a real request, so pressing Back after logging out (client history or the browser's back-forward cache)
 * would otherwise redraw the workspace shell with failing API calls.
 */
export function ForcedPasswordChangeGuard({ children, requireAuth = false }: { children: React.ReactNode; requireAuth?: boolean }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const mustChangeFromStore = useAuthStore((s) => s.user?.mustChangePassword);
  const { data: profile } = useProfile();

  // Both store and cookie must be gone: with the cookie still set, the middleware would bounce /login straight back here.
  const signedOut = requireAuth && hasHydrated && !isAuthenticated && !hasAuthCookie();

  React.useEffect(() => {
    if (signedOut) router.replace(loginUrl());
  }, [signedOut, router]);

  React.useEffect(() => {
    if (!requireAuth) return;
    // A page restored from the back-forward cache keeps its old in-memory store, so check the session cookie instead.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted && !hasAuthCookie()) window.location.replace(loginUrl());
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [requireAuth]);

  if (signedOut) return null;

  const mustChangePassword = Boolean(profile?.mustChangePassword ?? mustChangeFromStore);

  if (isAuthenticated && mustChangePassword) {
    return (
      // The real workspace is not rendered here (the BE answers every API with 403 PASSWORD_CHANGE_REQUIRED),
      // so show the login banner as a backdrop instead of a blank page.
      <div className="fixed inset-0 overflow-hidden bg-[var(--bg-deep)]">
        <div
          aria-hidden
          className="absolute inset-0 bg-[url('/banner.png')] bg-cover bg-center pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[color-mix(in_srgb,var(--bg-surface)_50%,transparent)] pointer-events-none"
        />
        <ChangePasswordDialog open={true} onOpenChange={() => {}} forced={true} />
      </div>
    );
  }

  return <>{children}</>;
}
