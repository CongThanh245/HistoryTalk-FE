"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, MailCheck, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForgotPassword } from "@/features/auth/hooks";

type AuthError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

const INPUT_CLASS =
  "h-11 rounded-sm text-sm shadow-none focus-visible:ring-0 focus-visible:border-[var(--accent-gold)] bg-[var(--bg-elevated)] border-[var(--text-primary)] text-content-text placeholder:text-[var(--text-muted)]";
const PRIMARY_BTN =
  "h-11 w-full rounded-sm border-0 text-[13px] font-bold uppercase tracking-[0.08em] shadow-none bg-[var(--accent-gold)] text-[#FFFFFF] hover:bg-[var(--accent-bronze)]";

/** Form body shared by the login popup and the standalone /forgot-password page. */
function ForgotPasswordBody({
  defaultEmail = "",
  onDone,
  inDialog = false,
}: {
  defaultEmail?: string;
  onDone?: () => void;
  inDialog?: boolean;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const forgotPassword = useForgotPassword();

  const Title = inDialog ? DialogTitle : "h1";
  const Desc = inDialog ? DialogDescription : "p";

  function send(target: string) {
    forgotPassword.mutate(
      { email: target },
      {
        onSuccess: () => setSentTo(target),
        onError: (err: AuthError) =>
          toast.error("Không thể gửi email", {
            description: err?.response?.data?.message ?? err?.message ?? "Vui lòng thử lại sau.",
          }),
      },
    );
  }

  if (sentTo) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-gold-active-bg)] text-[var(--accent-gold)]">
          <MailCheck className="h-7 w-7" />
        </div>
        <Title className="archive-title mt-4 text-[26px]">Kiểm tra hộp thư</Title>
        <Desc className="mt-2 text-sm leading-6 text-content-muted">
          Đã gửi liên kết đặt lại mật khẩu tới{" "}
          <strong className="break-all text-content-heading">{sentTo}</strong>. Nếu không thấy, hãy xem thêm mục
          Thư rác.
        </Desc>
        <div className="mt-6 grid w-full gap-2">
          {onDone && (
            <Button type="button" onClick={onDone} className={PRIMARY_BTN}>
              Quay lại đăng nhập
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            disabled={forgotPassword.isPending}
            onClick={() => send(sentTo)}
            className="h-10 text-[13px] font-semibold text-content-muted hover:text-content-heading"
          >
            {forgotPassword.isPending ? "Đang gửi lại..." : "Chưa nhận được? Gửi lại"}
          </Button>
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="text-xs text-content-muted underline-offset-2 hover:underline"
          >
            Dùng email khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--text-primary)] text-[var(--text-inverse)]">
          <KeyRound className="h-6 w-6" />
        </div>
        <Title className="archive-title mt-4 text-[26px]">Quên mật khẩu?</Title>
        <Desc className="mt-1.5 max-w-xs text-sm leading-6 text-content-muted">
          Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết để bạn đặt lại mật khẩu.
        </Desc>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(email.trim());
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label
            htmlFor="forgot-email"
            className="text-[11px] font-bold uppercase tracking-[0.1em] text-content-text"
          >
            Email
          </Label>
          <Input
            id="forgot-email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ten@email.com"
            className={INPUT_CLASS}
          />
        </div>

        <Button type="submit" disabled={forgotPassword.isPending} className={PRIMARY_BTN}>
          {forgotPassword.isPending ? "Đang gửi..." : "Gửi liên kết"}
        </Button>
      </form>
    </>
  );
}

/** Popup version, opened from "Quên mật khẩu?" on the login form. */
export function ForgotPasswordDialog({
  open,
  onOpenChange,
  defaultEmail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
}) {
  // DialogContent unmounts on close, so each opening starts with a fresh form (email + "sent" state).
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border-card border-t-[3px] border-t-[var(--accent-gold)] bg-[var(--bg-surface)] p-6 sm:max-w-md sm:p-8">
        <ForgotPasswordBody defaultEmail={defaultEmail} onDone={() => onOpenChange(false)} inDialog />
      </DialogContent>
    </Dialog>
  );
}

/** Standalone page (/forgot-password), kept for direct links. */
export default function ForgotPasswordForm() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10 bg-[var(--bg-main)]">
      <div className="w-full max-w-md">
        <Link href="/login" className="archive-link mb-6">
          <ArrowLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </Link>

        <div className="rounded-sm border border-border-card border-t-[3px] border-t-[var(--accent-gold)] p-6 sm:p-8 bg-[var(--bg-surface)]">
          <ForgotPasswordBody />
        </div>
      </div>
    </div>
  );
}
