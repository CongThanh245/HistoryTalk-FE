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
        shape: "pill",
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
    <div className="fixed inset-0 flex overflow-hidden bg-bg-deep">
      {/* ── Left — Hero ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col bg-[var(--palladian)] dark:bg-[var(--bg-deep)]">
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
              "linear-gradient(90deg, rgba(255,251,245,0.96) 0%, rgba(255,251,245,0.82) 36%, rgba(255,251,245,0.38) 68%, rgba(255,251,245,0.12) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.045] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 hidden pointer-events-none dark:block"
          style={{
            background:
              "linear-gradient(90deg, rgba(15,23,42,0.94) 0%, rgba(15,23,42,0.76) 42%, rgba(15,23,42,0.28) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full blur-3xl pointer-events-none bg-[rgba(245,158,11,0.15)]"
        />
        <div className="relative z-20 p-14 flex flex-col justify-between h-full">
          <div className="max-w-[460px]">
            <h1 className="text-4xl font-bold leading-tight mb-5 font-title text-content-heading">
              KHÁM PHÁ LỊCH SỬ
              <br />
              THEO CÁCH
              <br />
              <span className="bg-gradient-to-r from-accent-gold to-accent-gold-soft bg-clip-text text-transparent">
                HOÀN TOÀN MỚI.
              </span>
            </h1>
            <p className="text-base leading-relaxed max-w-sm text-content-heading">
              Chat với nhân vật lịch sử, khám phá sự kiện qua dòng thời gian và
              kiểm tra kiến thức của bạn.
            </p>
          </div>
          <BrandLogo size="large" forceTheme="light" />
        </div>
      </div>

      {/* ── Right — Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-5 sm:p-8 relative overflow-y-auto bg-[var(--palladian)]">
        <button
          onClick={() => router.push("/")}
          tabIndex={-1}
          className="absolute top-6 right-6 rounded-lg p-1.5 transition-colors cursor-pointer hover:bg-black/5 text-content-muted"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-full max-w-md sm:max-w-xl lg:max-w-md space-y-7">
          {/* Tabs */}
          <div className="flex justify-center gap-8 text-base font-semibold">
            <Link
              href="/register"
              className={cn(
                "pb-2 transition-colors border-b-2",
                isRegister
                  ? "text-content-heading border-gold-on-light"
                  : "text-content-muted border-transparent",
              )}
            >
              Đăng ký
            </Link>
            <Link
              href="/login"
              className={cn(
                "pb-2 transition-all border-b-2 hover:brightness-95",
                !isRegister
                  ? "text-content-heading border-gold-on-light"
                  : "text-content-muted border-transparent",
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
                  className="h-12 w-full rounded-xl border text-sm font-semibold bg-card-light-bg border-card-light-border text-content-text"
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
                  className="h-12 w-full rounded-xl border text-sm font-medium opacity-60 bg-card-light-bg border-card-light-border text-content-text"
                >
                  Thiếu NEXT_PUBLIC_GOOGLE_CLIENT_ID
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-card-light-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 font-medium bg-[var(--palladian)] text-content-subtle">
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
                    className="text-sm font-medium text-content-text"
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
                    className="h-11 text-sm rounded-xl focus-visible:ring-1 bg-card-light-bg border-card-light-border text-content-text"
                  />
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-content-text"
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
                  className="h-11 text-sm rounded-xl focus-visible:ring-1 bg-card-light-bg border-card-light-border text-content-text"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-content-text"
                  >
                    Mật khẩu
                  </Label>
                  {!isRegister && (
                    <Link
                      href="/forgot-password"
                      tabIndex={-1}
                      className="text-xs hover:underline text-content-text"
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
                    className="h-11 text-sm rounded-xl pr-10 focus-visible:ring-1 bg-card-light-bg border-card-light-border text-content-text"
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
                    className="text-sm font-medium text-content-text"
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
                      className="h-11 text-sm rounded-xl pr-10 focus-visible:ring-1 bg-card-light-bg border-card-light-border text-content-text"
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
                    <p className="text-xs text-red-500">
                      Mật khẩu không khớp
                    </p>
                  )}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 font-semibold rounded-xl border-0 cursor-pointer mt-2 bg-gradient-to-br from-accent-gold to-[var(--truffle)] text-bg-deep shadow-[0_4px_16px_var(--accent-gold-glow)]"
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
