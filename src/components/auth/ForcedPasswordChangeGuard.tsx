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
      <div className="min-h-screen w-full bg-[var(--bg-main)]">
        <ChangePasswordDialog open={true} onOpenChange={() => {}} forced={true} />
      </div>
    );
  }

  return <>{children}</>;
}
