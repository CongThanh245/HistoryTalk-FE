"use client";

import { useSessionStore } from "@/store/session.store";
import { resetClientAuth } from "@/features/auth/auth-cookies";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const COPY = {
  SCHOOL_SUBSCRIPTION_EXPIRED: {
    title: "Gói năm học của trường đã hết hạn",
    body: "Gói đăng ký năm học của nhà trường đã hết hạn. Vui lòng liên hệ Quản trị viên nhà trường để gia hạn gói năm học mới (01/09 – 31/05).",
  },
  SCHOOL_SUBSCRIPTION_NOT_STARTED: {
    title: "Năm học mới chưa bắt đầu",
    body: "Gói năm học của nhà trường sẽ được kích hoạt từ ngày 01/09. Nền tảng tạm khóa trong thời gian nghỉ hè.",
  },
} as const;

/** Whole-school lock (Sprint 7): shown when any request returns SCHOOL_SUBSCRIPTION_EXPIRED / _NOT_STARTED. */
export function SchoolLockDialog() {
  const lock = useSessionStore((s) => s.schoolLock);
  const hide = useSessionStore((s) => s.hideSchoolLock);
  const copy = lock ? COPY[lock.code] : null;

  const signOut = () => {
    resetClientAuth();
    hide();
    window.location.replace("/login");
  };

  return (
    <AlertDialog open={!!lock}>
      <AlertDialogContent onEscapeKeyDown={(e) => e.preventDefault()} className="bg-bg-surface border-[var(--text-primary)]">
        <AlertDialogHeader>
          <AlertDialogTitle className="archive-title text-2xl">{copy?.title}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">{copy?.body}</span>
            {lock?.message && <span className="block text-xs text-content-muted">{lock.message}</span>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => window.location.reload()}>Thử lại</AlertDialogCancel>
          <AlertDialogAction onClick={signOut}>Đăng xuất</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
