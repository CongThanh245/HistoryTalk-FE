"use client";

import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/session.store";
import { useAuthStore } from "@/store/auth.store";
import { clearAuthCookies } from "@/features/auth/auth-cookies";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SessionExpiredDialog() {
  const isExpired = useSessionStore((s) => s.isExpired);
  const hideExpired = useSessionStore((s) => s.hideExpired);
  const router = useRouter();

  const handleConfirm = () => {
    useAuthStore.getState().clearAuth();
    clearAuthCookies();
    hideExpired();
    router.replace("/login");
  };

  return (
    <AlertDialog open={isExpired}>
      <AlertDialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-default)",
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle style={{ color: "var(--text-primary)" }}>
            Phiên đăng nhập đã hết hạn
          </AlertDialogTitle>
          <AlertDialogDescription>
            Vui lòng đăng nhập lại để tiếp tục sử dụng HistoryTalk.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleConfirm}>
            Đăng nhập lại
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
