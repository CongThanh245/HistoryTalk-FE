"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";
import { useGoogleLogin, useLogin, useRegister } from "@/features/auth/hooks";
import { BrandLogo } from "@/components/commons/brand-logo";
import { cn } from "@/lib/utils/cn";

interface AuthFormProps {
  mode: "login" | "register";
}

type AuthError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              type?: "standard" | "icon";
              shape?: "rectangular" | "pill" | "circle" | "square";
              text?: "signin_with" | "signup_with" | "continue_with";
              width?: number;
            },
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_AUTH_MODE = process.env.NEXT_PUBLIC_GOOGLE_AUTH_MODE ?? "id_token";
const GOOGLE_OAUTH_START_URL =
  process.env.NEXT_PUBLIC_GOOGLE_OAUTH_START_URL ??
  `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}${(
    process.env.NEXT_PUBLIC_API_BASE_PATH ?? "/api/v1"
  ).replace(/\/api\/v1\/?$/, "")}/oauth2/authorization/google`;

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isRegister = mode === "register";

  const login = useLogin();
  const googleLogin = useGoogleLogin();
  const register = useRegister();

  const loading = login.isPending || register.isPending || googleLogin.isPending;
  const usesRedirectGoogleLogin = GOOGLE_AUTH_MODE === "redirect";

  useEffect(() => {
    if (usesRedirectGoogleLogin) return;
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return;
    const googleClientId = GOOGLE_CLIENT_ID;

    let disposed = false;

    function renderGoogleButton() {
      if (disposed || !window.google || !googleButtonRef.current) return;

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          if (!response.credential) {
            toast.error("Không nhận được Google ID token");
            return;
          }

          googleLogin.mutate(
            { idToken: response.credential },
            {
              onError: (err: AuthError) =>
                toast.error("Đăng nhập Google thất bại", {
                  description:
                    err?.response?.data?.message ??
                    err?.message ??
                    "Vui lòng thử lại.",
                }),
            },
          );
        },
      });
      const buttonWidth = Math.min(
        360,
        googleButtonRef.current.offsetWidth || 360,
      );
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        type: "standard",
        shape: "rectangular",
        text: isRegister ? "signup_with" : "signin_with",
        width: buttonWidth,
      });
    }

    if (window.google) {
      renderGoogleButton();
    } else {
      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[src="${GOOGLE_SCRIPT_SRC}"]`,
      );
      const script = existingScript ?? document.createElement("script");

      script.src = GOOGLE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = renderGoogleButton;

      if (!existingScript) {
        document.head.appendChild(script);
      }
    }

    return () => {
      disposed = true;
    };
  }, [googleLogin, isRegister, usesRedirectGoogleLogin]);

  function handleGoogleRedirect() {
    window.location.href = GOOGLE_OAUTH_START_URL;
  }

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
          onError: (err: AuthError) =>
            toast.error("Đăng ký thất bại", {
              description: err?.response?.data?.message ?? "Vui lòng thử lại",
            }),
        },
      );
    } else {
      login.mutate(
        { email, password },
        {
          onError: (err: AuthError) =>
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

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[var(--bg-main)]">
      {/* ── Left — Hero ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col bg-[var(--bg-deep)] border-r border-[var(--text-primary)]">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: "url('/banner.png')",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, color-mix(in srgb, var(--bg-surface) 96%, transparent) 0%, color-mix(in srgb, var(--bg-surface) 84%, transparent) 36%, color-mix(in srgb, var(--bg-surface) 40%, transparent) 68%, color-mix(in srgb, var(--bg-surface) 12%, transparent) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.045] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-20 p-14 flex flex-col justify-between h-full">
          <div className="max-w-[460px]">
            <h1 className="archive-title mt-3 mb-5 text-[clamp(40px,4.4vw,60px)]">
              Khám phá lịch sử
              <br />
              theo cách
              <br />
              <em>hoàn toàn mới.</em>
            </h1>
            <div className="mb-5 h-px w-16 bg-[var(--accent-gold)]" aria-hidden="true" />
            <p className="text-base leading-relaxed max-w-sm text-content-text">
              Chat với nhân vật lịch sử, khám phá sự kiện qua dòng thời gian và
              kiểm tra kiến thức của bạn.
            </p>
          </div>
          <div className="flex items-end justify-between gap-6">
            <BrandLogo size="large" />
            {/* 國史 — "quốc sử", national history */}
            <span className="archive-seal" aria-hidden="true">國史</span>
          </div>
        </div>
      </div>

      {/* ── Right — Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-5 sm:p-8 relative overflow-y-auto bg-[var(--bg-surface)]">
        <button
          onClick={() => router.push("/")}
          tabIndex={-1}
          className="absolute top-6 right-6 rounded-[2px] border border-transparent p-1.5 transition-colors cursor-pointer text-content-muted hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-full max-w-md sm:max-w-xl lg:max-w-md space-y-7">
          <span className="archive-label">
            {isRegister ? "Tạo tài khoản" : "Hồ sơ người học"}
          </span>

          {/* Tabs */}
          <div className="grid grid-cols-2 border-b border-[var(--text-primary)] font-display text-[20px] font-bold uppercase tracking-[0.02em]">
            <Link
              href="/register"
              className={cn(
                "-mb-px pb-2.5 text-center transition-colors border-b-[3px]",
                isRegister
                  ? "text-content-heading border-[var(--accent-gold)]"
                  : "text-content-muted border-transparent hover:text-content-heading",
              )}
            >
              Đăng ký
            </Link>
            <Link
              href="/login"
              className={cn(
                "-mb-px pb-2.5 text-center transition-colors border-b-[3px]",
                !isRegister
                  ? "text-content-heading border-[var(--accent-gold)]"
                  : "text-content-muted border-transparent hover:text-content-heading",
              )}
            >
              Đăng nhập
            </Link>
          </div>

          <div className="space-y-5">
            {/* Google button */}
            <div
              className="flex min-h-12 w-full items-center justify-center"
              aria-disabled={loading}
            >
              {usesRedirectGoogleLogin ? (
                <Button
                  type="button"
                  onClick={handleGoogleRedirect}
                  disabled={loading}
                  className="h-12 w-full rounded-[2px] border text-sm font-semibold shadow-none bg-[var(--bg-elevated)] border-[var(--text-primary)] text-content-text hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]"
                  variant="outline"
                >
                  Continue with Google
                </Button>
              ) : GOOGLE_CLIENT_ID ? (
                <div ref={googleButtonRef} className={loading ? "opacity-60" : ""} />
              ) : (
                <button
                  type="button"
                  disabled
                  className="h-12 w-full rounded-[2px] border text-sm font-medium opacity-60 bg-[var(--bg-elevated)] border-[var(--border-strong)] text-content-text"
                >
                  Thiếu NEXT_PUBLIC_GOOGLE_CLIENT_ID
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border-strong)]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 text-[10px] font-bold uppercase tracking-[0.12em] bg-[var(--bg-surface)] text-content-subtle">
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
                    className="text-[11px] font-bold uppercase tracking-[0.1em] text-content-text"
                  >
                    Tên người dùng
                  </Label>
                  <Input
                    id="userName"
                    type="text"
                    placeholder="Nhập tên người dùng"
                    value={userName}
                    autoFocus={isRegister}
                    onChange={(e) => setUserName(e.target.value)}
                    className="h-11 text-sm rounded-[2px] shadow-none focus-visible:ring-0 focus-visible:border-[var(--accent-gold)] bg-[var(--bg-elevated)] border-[var(--text-primary)] text-content-text placeholder:text-[var(--text-muted)]"
                  />
                </div>
              )}

              {/* Email */}
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
                  placeholder="Nhập địa chỉ email của bạn"
                  value={email}
                  autoFocus={!isRegister}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 text-sm rounded-[2px] shadow-none focus-visible:ring-0 focus-visible:border-[var(--accent-gold)] bg-[var(--bg-elevated)] border-[var(--text-primary)] text-content-text placeholder:text-[var(--text-muted)]"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label
                    htmlFor="password"
                    className="text-[11px] font-bold uppercase tracking-[0.1em] text-content-text"
                  >
                    Mật khẩu
                  </Label>
                  {!isRegister && (
                    <Link
                      href="/forgot-password"
                      tabIndex={-1}
                      className="text-xs underline-offset-2 hover:underline text-gold-on-light"
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
                    className="h-11 text-sm rounded-[2px] pr-10 shadow-none focus-visible:ring-0 focus-visible:border-[var(--accent-gold)] bg-[var(--bg-elevated)] border-[var(--text-primary)] text-content-text placeholder:text-[var(--text-muted)]"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-content-muted"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {isRegister && (
                  <p className="text-xs text-content-subtle">
                    Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số
                  </p>
                )}
              </div>

              {/* Confirm Password — chỉ hiện khi register */}
              {isRegister && (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-[11px] font-bold uppercase tracking-[0.1em] text-content-text"
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
                      className="h-11 text-sm rounded-[2px] pr-10 shadow-none focus-visible:ring-0 focus-visible:border-[var(--accent-gold)] bg-[var(--bg-elevated)] border-[var(--text-primary)] text-content-text placeholder:text-[var(--text-muted)]"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-content-muted"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-[var(--accent-danger)]">
                      Mật khẩu không khớp
                    </p>
                  )}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 rounded-[2px] border-0 cursor-pointer mt-2 text-[13px] font-bold uppercase tracking-[0.08em] shadow-none bg-[var(--accent-gold)] text-[#FFFFFF] hover:bg-[var(--accent-bronze)]"
                disabled={loading}
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
            <p className="text-xs text-center text-content-subtle">
              Bằng cách nhấp {isRegister ? "Đăng ký" : "Đăng nhập"}, bạn chấp
              nhận{" "}
              <Link
                href="/terms"
                className="hover:underline text-gold-on-light"
              >
                Điều khoản dịch vụ
              </Link>{" "}
              và{" "}
              <Link
                href="/privacy"
                className="hover:underline text-gold-on-light"
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
