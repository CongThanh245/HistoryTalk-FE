"use client";

import * as React from "react";
import { useAuthStore } from "@/store/auth.store";
import { useProfile } from "@/features/profile/hooks";
import { ChangePasswordDialog } from "@/components/layouts/change-password-dialog";

/**
 * Blocks workspace rendering and opens a non-dismissible ChangePasswordDialog
 * when the signed-in account has `mustChangePassword === true`.
 */
export function ForcedPasswordChangeGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const mustChangeFromStore = useAuthStore((s) => s.user?.mustChangePassword);
  const { data: profile } = useProfile();

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
