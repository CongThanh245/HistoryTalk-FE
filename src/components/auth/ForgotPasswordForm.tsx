"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeftIcon, EnvelopeIcon } from "@phosphor-icons/react";
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
    <div
      className="min-h-screen flex items-center justify-center px-5 py-10"
      style={{ background: "var(--palladian)" }}
    >
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium hover:underline"
          style={{ color: "var(--content-text)" }}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Quay lại đăng nhập
        </Link>

        <div
          className="rounded-2xl border p-6 shadow-sm"
          style={{
            background: "var(--card-light-bg)",
            borderColor: "var(--card-light-border)",
          }}
        >
          <div className="mb-6 flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
                color: "var(--bg-deep)",
              }}
            >
              <EnvelopeIcon className="h-5 w-5" />
            </div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: "var(--content-heading)" }}
              >
                Quên mật khẩu
              </h1>
              <p
                className="mt-1 text-sm leading-6"
                style={{ color: "var(--content-muted)" }}
              >
                Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-sm font-medium"
                style={{ color: "var(--content-text)" }}
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
                className="h-11 rounded-xl text-sm focus-visible:ring-1"
                style={{
                  background: "var(--palladian)",
                  borderColor: "var(--card-light-border)",
                  color: "var(--content-text)",
                }}
              />
            </div>

            <Button
              type="submit"
              disabled={forgotPassword.isPending}
              className="h-11 w-full rounded-xl border-0 font-semibold"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
                color: "var(--bg-deep)",
                boxShadow: "0 4px 16px var(--accent-gold-glow)",
              }}
            >
              {forgotPassword.isPending ? "Đang gửi..." : "Gửi liên kết"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
