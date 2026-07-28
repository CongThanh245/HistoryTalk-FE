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

export function UserLockedDialog() {
  const isLocked = useSessionStore((s) => s.isLocked);
  const hideLocked = useSessionStore((s) => s.hideLocked);
  const router = useRouter();

  const handleConfirm = () => {
    useAuthStore.getState().clearAuth();
    clearAuthCookies();
    hideLocked();
    router.replace("/login");
  };

  return (
    <AlertDialog open={isLocked}>
      <AlertDialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="bg-bg-surface border-border-default"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-content-heading">
            Tài khoản đã bị vô hiệu hóa
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleConfirm}>
            Quay lại đăng nhập
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
