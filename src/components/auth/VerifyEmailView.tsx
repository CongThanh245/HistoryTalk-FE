"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Mail, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useResendVerification, useVerifyEmail } from "@/features/auth/hooks";

type AuthError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

interface VerifyEmailViewProps {
  token: string;
  initialEmail?: string;
}

export default function VerifyEmailView({
  token,
  initialEmail = "",
}: VerifyEmailViewProps) {
  const [email, setEmail] = useState(initialEmail);
  const [cooldown, setCooldown] = useState(0);
  const [status, setStatus] = useState<
    "pending" | "verifying" | "success" | "error"
  >(token ? "verifying" : "pending");
  const [errorMessage, setErrorMessage] = useState("");
  const verifiedOnceRef = useRef(false);

  const verifyEmail = useVerifyEmail();
  const resendVerification = useResendVerification();

  useEffect(() => {
    if (!token || verifiedOnceRef.current) return;
    verifiedOnceRef.current = true;

    verifyEmail.mutate(
      { token },
      {
        onSuccess: () => {
          setStatus("success");
        },
        onError: (err: AuthError) => {
          setStatus("error");
          setErrorMessage(
            err?.response?.data?.message ??
              err?.message ??
              "Liên kết xác thực không hợp lệ hoặc đã hết hạn.",
          );
        },
      },
    );
  }, [token, verifyEmail]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function handleResend(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Vui lòng nhập địa chỉ email");
      return;
    }

    resendVerification.mutate(
      { email: trimmedEmail },
      {
        onSuccess: () => {
          setCooldown(60);
          toast.success("Đã gửi lại email xác thực", {
            description: "Vui lòng kiểm tra hộp thư Gmail của bạn.",
          });
        },
        onError: (err: AuthError) => {
          toast.error("Không thể gửi lại email", {
            description:
              err?.response?.data?.message ??
              err?.message ??
              "Vui lòng thử lại sau.",
          });
        },
      },
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10 bg-[var(--bg-main)]">
      <div className="w-full max-w-md">
        <Link href="/login" className="archive-link mb-6">
          <ArrowLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </Link>

        <div className="rounded-sm border border-border-card border-t-[3px] border-t-[var(--accent-gold)] p-6 sm:p-8 bg-[var(--bg-surface)]">
          {status === "verifying" && (
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[var(--text-primary)] text-[var(--text-inverse)]">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <div>
                <h1 className="archive-title text-[26px]">Đang xác thực email</h1>
                <p className="mt-2 text-sm leading-6 text-content-muted">
                  Vui lòng chờ trong giây lát, hệ thống đang kích hoạt tài khoản của bạn.
                </p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-[var(--text-primary)] text-[var(--text-inverse)]">
                  <CheckCircle2 className="h-5 w-5 text-[var(--accent-gold)]" />
                </div>
                <div>
                  <h1 className="archive-title mt-1 text-[28px]">
                    Xác thực thành công
                  </h1>
                  <p className="mt-1 text-sm leading-6 text-content-muted">
                    Email của bạn đã được xác thực. Bây giờ bạn có thể đăng nhập vào HistoryTalk.
                  </p>
                </div>
              </div>

              <Button
                asChild
                className="h-11 w-full rounded-sm border-0 text-[13px] font-bold uppercase tracking-[0.08em] shadow-none bg-[var(--accent-gold)] text-[#FFFFFF] hover:bg-[var(--accent-bronze)]"
              >
                <Link href="/login">Đăng nhập ngay</Link>
              </Button>
            </div>
          )}

          {(status === "pending" || status === "error") && (
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-[var(--text-primary)] text-[var(--text-inverse)]">
                  {status === "error" ? (
                    <XCircle className="h-5 w-5 text-[var(--accent-danger)]" />
                  ) : (
                    <Mail className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h1 className="archive-title mt-1 text-[28px]">
                    {status === "error" ? "Xác thực thất bại" : "Kiểm tra hộp thư"}
                  </h1>
                  <p className="mt-1 text-sm leading-6 text-content-muted">
                    {status === "error"
                      ? errorMessage
                      : "Chúng tôi đã gửi liên kết xác thực đến email của bạn. Vui lòng mở Gmail và bấm vào liên kết để kích hoạt tài khoản."}
                  </p>
                </div>
              </div>

              <form onSubmit={handleResend} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="verify-email-input"
                    className="text-[11px] font-bold uppercase tracking-[0.1em] text-content-text"
                  >
                    Email nhận liên kết xác thực
                  </Label>
                  <Input
                    id="verify-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập địa chỉ email của bạn"
                    className="h-11 rounded-sm text-sm shadow-none focus-visible:ring-0 focus-visible:border-[var(--accent-gold)] bg-[var(--bg-elevated)] border-[var(--text-primary)] text-content-text placeholder:text-[var(--text-muted)]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={resendVerification.isPending || cooldown > 0}
                  className="h-11 w-full rounded-sm border-0 text-[13px] font-bold uppercase tracking-[0.08em] shadow-none bg-[var(--accent-gold)] text-[#FFFFFF] hover:bg-[var(--accent-bronze)]"
                >
                  {resendVerification.isPending
                    ? "Đang gửi..."
                    : cooldown > 0
                      ? `Gửi lại sau ${cooldown}s`
                      : "Gửi lại email xác thực"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
