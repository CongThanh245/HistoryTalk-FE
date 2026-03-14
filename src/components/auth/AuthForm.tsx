"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeClosedIcon, XIcon, ScrollIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useLogin, useRegister } from "@/features/auth/hooks";

interface AuthFormProps {
  mode: "login" | "register";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isRegister = mode === "register";

  const login = useLogin();
  const register = useRegister();

  const loading = login.isPending || register.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isRegister) {
      if (password !== confirmPassword) {
        toast.error("Mật khẩu không khớp");
        return;
      }
      register.mutate(
        { userName, email, password, confirmPassword },
        {
          onSuccess: () =>
            toast.success("Đăng ký thành công", {
              description: "Vui lòng đăng nhập",
            }),
          onError: (err: any) =>
            toast.error("Đăng ký thất bại", {
              description: err?.response?.data?.message ?? "Vui lòng thử lại",
            }),
        },
      );
    } else {
      login.mutate(
        { email, password },
        {
          onError: (err: any) =>
            toast.error("Đăng nhập thất bại", {
              description:
                err?.response?.data?.message ??
                err?.message ??
                "Email hoặc mật khẩu không đúng",
            }),
        },
      );
    }
  }

  async function handleGoogleSignIn() {
    // TODO: integrate Google OAuth
  }

  return (
    <div
      className="fixed inset-0 flex overflow-hidden"
      style={{ background: "var(--bg-deep)" }}
    >
      {/* ── Left — Hero ── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col"
        style={{
          background:
            "linear-gradient(145deg, var(--bg-deep) 0%, var(--abyssal-blue) 50%, var(--blue-fantastic) 100%)",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "30%",
            left: "-10%",
            width: 480,
            height: 480,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(201,162,77,0.12) 0%, transparent 70%)",
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px]">
          {[
            {
              rotate: "-18deg",
              top: "0px",
              left: "0px",
              from: "var(--bg-surface)",
              to: "var(--bg-elevated)",
            },
            {
              rotate: "-7deg",
              top: "60px",
              left: "80px",
              from: "var(--bg-elevated)",
              to: "var(--blue-fantastic)",
            },
            {
              rotate: "4deg",
              top: "120px",
              left: "160px",
              from: "var(--blue-fantastic)",
              to: "var(--abyssal-blue)",
            },
            {
              rotate: "14deg",
              top: "180px",
              left: "240px",
              from: "var(--abyssal-blue)",
              to: "var(--bg-surface)",
            },
          ].map((c, i) => (
            <div
              key={i}
              className="absolute w-48 h-64 rounded-2xl shadow-2xl border"
              style={{
                top: c.top,
                left: c.left,
                transform: `rotate(${c.rotate})`,
                background: `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)`,
                borderColor: "var(--border-default)",
                opacity: 0.85,
              }}
            >
              <div
                className="absolute top-4 left-4 w-6 h-1 rounded-full opacity-40"
                style={{ background: "var(--accent-gold)" }}
              />
              <div
                className="absolute top-7 left-4 w-10 h-1 rounded-full opacity-20"
                style={{ background: "var(--text-primary)" }}
              />
            </div>
          ))}
        </div>
        <div className="relative z-20 p-14 flex flex-col justify-between h-full">
          <div>
            <h1
              className="text-4xl font-bold leading-tight mb-4"
              style={{
                color: "var(--text-primary)",
                fontFamily: "'Georgia', serif",
              }}
            >
              Khám phá lịch sử
              <br />
              theo cách
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(90deg, var(--accent-gold) 0%, var(--accent-gold-soft) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                hoàn toàn mới.
              </span>
            </h1>
            <p
              className="text-sm leading-relaxed max-w-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Chat với nhân vật lịch sử, khám phá sự kiện qua dòng thời gian và
              kiểm tra kiến thức của bạn.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
                boxShadow: "var(--shadow-gold)",
              }}
            >
              <ScrollIcon className="w-4 h-4" style={{ color: "var(--bg-deep)" }} />
            </div>
            <span
              className="text-xl font-bold"
              style={{
                background:
                  "linear-gradient(90deg, var(--accent-gold) 0%, var(--accent-gold-soft) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontFamily: "'Georgia', serif",
              }}
            >
              HistoryTalk
            </span>
          </div>
        </div>
      </div>

      {/* ── Right — Form ── */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center p-5 sm:p-8 relative overflow-y-auto"
        style={{ background: "var(--palladian)" }}
      >
        <button
          onClick={() => router.push("/")}
          className="absolute top-6 right-6 rounded-lg p-1.5 transition-colors cursor-pointer hover:bg-black/5"
          style={{ color: "var(--content-muted)" }}
        >
          <XIcon className="w-5 h-5" />
        </button>

        <div className="w-full max-w-md space-y-7">
          {/* Tabs */}
          <div className="flex justify-center gap-8 text-base font-semibold">
            <Link
              href="/register"
              className="pb-2 transition-colors border-b-2"
              style={{
                color: isRegister
                  ? "var(--content-heading)"
                  : "var(--content-muted)",
                borderBottomColor: isRegister
                  ? "var(--gold-on-light)"
                  : "transparent",
              }}
            >
              Đăng ký
            </Link>
            <Link
              href="/login"
              className="pb-2 transition-all border-b-2 hover:brightness-95"
              style={{
                color: !isRegister
                  ? "var(--content-heading)"
                  : "var(--content-muted)",
                borderBottomColor: !isRegister
                  ? "var(--gold-on-light)"
                  : "transparent",
              }}
            >
              Đăng nhập
            </Link>
          </div>

          <div className="space-y-5">
            {/* Google button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border text-sm font-medium transition-all cursor-pointer hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: "var(--card-light-bg)",
                borderColor: "var(--card-light-border)",
                color: "var(--content-text)",
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isRegister ? "Đăng ký" : "Đăng nhập"} bằng Google
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div
                  className="w-full border-t"
                  style={{ borderColor: "var(--card-light-border)" }}
                />
              </div>
              <div className="relative flex justify-center text-xs">
                <span
                  className="px-3 font-medium"
                  style={{
                    background: "var(--palladian)",
                    color: "var(--content-subtle)",
                  }}
                >
                  hoặc email
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username — chỉ hiện khi register */}
              {isRegister && (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="userName"
                    className="text-sm font-medium"
                    style={{ color: "var(--content-text)" }}
                  >
                    Tên người dùng
                  </Label>
                  <Input
                    id="userName"
                    type="text"
                    placeholder="Nhập tên người dùng"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="h-11 text-sm rounded-xl focus-visible:ring-1"
                    style={{
                      background: "var(--card-light-bg)",
                      borderColor: "var(--card-light-border)",
                      color: "var(--content-text)",
                    }}
                  />
                </div>
              )}

              {/* Email */}
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
                  placeholder="Nhập địa chỉ email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 text-sm rounded-xl focus-visible:ring-1"
                  style={{
                    background: "var(--card-light-bg)",
                    borderColor: "var(--card-light-border)",
                    color: "var(--content-text)",
                  }}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium"
                    style={{ color: "var(--content-text)" }}
                  >
                    Mật khẩu
                  </Label>
                  {!isRegister && (
                    <Link
                      href="/forgot-password"
                      className="text-xs hover:underline"
                      style={{ color: "var(--content-text)" }}
                    >
                      Quên mật khẩu?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu của bạn"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 text-sm rounded-xl pr-10 focus-visible:ring-1"
                    style={{
                      background: "var(--card-light-bg)",
                      borderColor: "var(--card-light-border)",
                      color: "var(--content-text)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ color: "var(--content-muted)" }}
                  >
                    {showPassword ? (
                      <EyeClosedIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {isRegister && (
                  <p
                    className="text-xs"
                    style={{ color: "var(--content-subtle)" }}
                  >
                    Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số
                  </p>
                )}
              </div>

              {/* Confirm Password — chỉ hiện khi register */}
              {isRegister && (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium"
                    style={{ color: "var(--content-text)" }}
                  >
                    Xác nhận mật khẩu
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu của bạn"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 text-sm rounded-xl pr-10 focus-visible:ring-1"
                      style={{
                        background: "var(--card-light-bg)",
                        borderColor: "var(--card-light-border)",
                        color: "var(--content-text)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ color: "var(--content-muted)" }}
                    >
                      {showConfirmPassword ? (
                        <EyeClosedIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs" style={{ color: "#ef4444" }}>
                      Mật khẩu không khớp
                    </p>
                  )}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 font-semibold rounded-xl border-0 cursor-pointer mt-2"
                disabled={loading}
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
                  color: "var(--bg-deep)",
                  boxShadow: "0 4px 16px var(--accent-gold-glow)",
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {isRegister ? "Đang đăng ký..." : "Đang đăng nhập..."}
                  </span>
                ) : isRegister ? (
                  "Đăng ký"
                ) : (
                  "Đăng nhập"
                )}
              </Button>
            </form>

            {/* Terms */}
            <p
              className="text-xs text-center"
              style={{ color: "var(--content-subtle)" }}
            >
              Bằng cách nhấp {isRegister ? "Đăng ký" : "Đăng nhập"}, bạn chấp
              nhận{" "}
              <Link
                href="/terms"
                className="hover:underline"
                style={{ color: "var(--gold-on-light)" }}
              >
                Điều khoản dịch vụ
              </Link>{" "}
              và{" "}
              <Link
                href="/privacy"
                className="hover:underline"
                style={{ color: "var(--gold-on-light)" }}
              >
                Chính sách quyền riêng tư
              </Link>{" "}
              của HistoryTalk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
