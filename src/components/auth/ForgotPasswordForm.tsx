"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForgotPassword } from "@/features/auth/hooks";

type AuthError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const forgotPassword = useForgotPassword();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    forgotPassword.mutate(
      { email },
      {
        onSuccess: (data) =>
          toast.success("Đã gửi email đặt lại mật khẩu", {
            description:
              data.message ?? "Vui lòng kiểm tra hộp thư của bạn.",
          }),
        onError: (err: AuthError) =>
          toast.error("Không thể gửi email", {
            description:
              err?.response?.data?.message ??
              err?.message ??
              "Vui lòng thử lại sau.",
          }),
      },
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10 bg-[var(--bg-main)]">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="archive-link mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </Link>

        <div className="rounded-[2px] border border-[var(--text-primary)] border-t-[3px] border-t-[var(--accent-gold)] p-6 sm:p-8 bg-[var(--bg-surface)]">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[2px] bg-[var(--text-primary)] text-[var(--text-inverse)]">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h1 className="archive-title mt-1 text-[28px]">
                Quên mật khẩu
              </h1>
              <p className="mt-1 text-sm leading-6 text-content-muted">
                Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-[11px] font-bold uppercase tracking-[0.1em] text-content-text"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập địa chỉ email của bạn"
                className="h-11 rounded-[2px] text-sm shadow-none focus-visible:ring-0 focus-visible:border-[var(--accent-gold)] bg-[var(--bg-elevated)] border-[var(--text-primary)] text-content-text placeholder:text-[var(--text-muted)]"
              />
            </div>

            <Button
              type="submit"
              disabled={forgotPassword.isPending}
              className="h-11 w-full rounded-[2px] border-0 text-[13px] font-bold uppercase tracking-[0.08em] shadow-none bg-[var(--accent-gold)] text-[#FFFFFF] hover:bg-[var(--accent-bronze)]"
            >
              {forgotPassword.isPending ? "Đang gửi..." : "Gửi liên kết"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
