"use client";

import { useSessionStore } from "@/store/session.store";
import { resetClientAuth } from "@/features/auth/auth-cookies";
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

  const handleConfirm = () => {
    resetClientAuth();
    hideExpired();
    window.location.replace("/login");
  };

  return (
    <AlertDialog open={isExpired}>
      <AlertDialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="bg-bg-surface border-border-default"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-content-heading">
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
