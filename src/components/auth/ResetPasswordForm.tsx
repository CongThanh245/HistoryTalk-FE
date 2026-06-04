"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeftIcon,
  EyeClosedIcon,
  EyeIcon,
  KeyIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useResetPassword } from "@/features/auth/hooks";

type AuthError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const resetPassword = useResetPassword();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!token) {
      toast.error("Liên kết đặt lại mật khẩu không hợp lệ");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu không khớp");
      return;
    }

    resetPassword.mutate(
      { token, newPassword: password, confirmPassword },
      {
        onSuccess: () =>
          toast.success("Đặt lại mật khẩu thành công", {
            description: "Vui lòng đăng nhập bằng mật khẩu mới.",
          }),
        onError: (err: AuthError) =>
          toast.error("Không thể đặt lại mật khẩu", {
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
              <KeyIcon className="h-5 w-5" />
            </div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: "var(--content-heading)" }}
              >
                Đặt lại mật khẩu
              </h1>
              <p
                className="mt-1 text-sm leading-6"
                style={{ color: "var(--content-muted)" }}
              >
                Tạo mật khẩu mới cho tài khoản HistoryTalk của bạn.
              </p>
            </div>
          </div>

          {!token && (
            <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              Thiếu mã đặt lại mật khẩu. Vui lòng mở đúng liên kết trong email.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordField
              id="password"
              label="Mật khẩu mới"
              value={password}
              show={showPassword}
              onChange={setPassword}
              onToggle={() => setShowPassword((value) => !value)}
            />
            <PasswordField
              id="confirmPassword"
              label="Xác nhận mật khẩu"
              value={confirmPassword}
              show={showConfirmPassword}
              onChange={setConfirmPassword}
              onToggle={() => setShowConfirmPassword((value) => !value)}
            />

            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-600">Mật khẩu không khớp</p>
            )}

            <Button
              type="submit"
              disabled={resetPassword.isPending || !token}
              className="h-11 w-full rounded-xl border-0 font-semibold"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
                color: "var(--bg-deep)",
                boxShadow: "0 4px 16px var(--accent-gold-glow)",
              }}
            >
              {resetPassword.isPending ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  show,
  onChange,
  onToggle,
}: {
  id: string;
  label: string;
  value: string;
  show: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-sm font-medium"
        style={{ color: "var(--content-text)" }}
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 rounded-xl pr-10 text-sm focus-visible:ring-1"
          style={{
            background: "var(--palladian)",
            borderColor: "var(--card-light-border)",
            color: "var(--content-text)",
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
          style={{ color: "var(--content-muted)" }}
        >
          {show ? (
            <EyeClosedIcon className="h-4 w-4" />
          ) : (
            <EyeIcon className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
