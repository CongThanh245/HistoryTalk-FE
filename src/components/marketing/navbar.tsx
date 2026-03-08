"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MagneticButton } from "../commons/MagneticButton";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import Image from "next/image";
import { useAuthStore } from "@/store/auth.store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/features/auth/hooks";

// Avatar component tối giản, hòa hợp với navbar
function NavAvatar({ userName }: { userName?: string }) {
  const initials = userName
    ? userName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background:
          "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle, #8B7355) 100%)",
        color: "var(--bg-deep, #0a0a0a)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.05em",
        border:
          "1px solid color-mix(in srgb, var(--accent-gold) 40%, transparent)",
        boxShadow:
          "0 0 10px -2px color-mix(in srgb, var(--accent-gold) 30%, transparent)",
        flexShrink: 0,
        cursor: "pointer",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "scale(1.05)";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 0 16px -2px color-mix(in srgb, var(--accent-gold) 50%, transparent)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 0 10px -2px color-mix(in srgb, var(--accent-gold) 30%, transparent)";
      }}
    >
      {initials}
    </div>
  );
}

export function MarketingNavbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const user = useAuthStore((s) => s.user);
  const { mutate: logout, isPending } = useLogout();
  const isLoggedIn = !!user;

  const navLinks = [
    { href: "/", label: "Trang Chủ" },
    { href: "/features", label: "Tính Năng" },
    { href: "/pricing", label: "Bảng Giá" },
    { href: "/about", label: "Về Chúng Tôi" },
  ];

  return (
    <>
      <style>{`
        .auth-group {
          display: flex;
          align-items: center;
          border: 1px solid var(--border-default);
          border-radius: 9999px;
          overflow: hidden;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
          position: relative;
        }
        .auth-group::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          opacity: 0;
          transition: opacity 0.3s ease;
          background: radial-gradient(ellipse at center, color-mix(in srgb, var(--accent-gold) 8%, transparent), transparent 70%);
          pointer-events: none;
        }
        .auth-group:hover {
          border-color: color-mix(in srgb, var(--accent-gold) 40%, transparent);
          box-shadow: 0 0 16px -4px color-mix(in srgb, var(--accent-gold) 25%, transparent);
        }
        .auth-group:hover::before { opacity: 1; }
        .auth-group .login-link {
          position: relative;
          padding: 6px 16px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s ease, background 0.2s ease;
          white-space: nowrap;
        }
        .auth-group:hover .login-link { color: var(--text-primary); background: color-mix(in srgb, var(--accent-gold) 5%, transparent); }
        .auth-divider {
          width: 1px; height: 18px;
          background: var(--border-default);
          flex-shrink: 0;
          transition: background 0.25s ease;
        }
        .auth-group:hover .auth-divider { background: color-mix(in srgb, var(--accent-gold) 30%, transparent); }
        .auth-group .cta-wrapper > * { border-radius: 0 9999px 9999px 0 !important; }

        /* Logged-in avatar pill */
        .avatar-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px 4px 4px;
          border: 1px solid var(--border-default);
          border-radius: 9999px;
          transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
          cursor: pointer;
          background: transparent;
        }
        .avatar-pill:hover {
          border-color: color-mix(in srgb, var(--accent-gold) 40%, transparent);
          box-shadow: 0 0 16px -4px color-mix(in srgb, var(--accent-gold) 25%, transparent);
          background: color-mix(in srgb, var(--accent-gold) 4%, transparent);
        }
        .avatar-pill-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          transition: color 0.2s ease;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .avatar-pill:hover .avatar-pill-name { color: var(--text-primary); }
      `}</style>

      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-3 md:p-4 pointer-events-none">
        <nav
          className={`
            pointer-events-auto
            bg-[var(--bg-main)]/80 backdrop-blur-xl
            border border-[var(--border-default)]
            shadow-[var(--shadow-soft)]
            transition-all duration-300
            w-full rounded-2xl
            md:max-w-fit md:rounded-full
          `}
        >
          {/* ── Top bar ── */}
          <div className="flex items-center px-4 py-3 md:px-6 md:py-2">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-85 transition-opacity"
            >
              <Image
                src="https://p1.hiclipart.com/preview/198/296/36/tv-channel-icons-history-black-black-history-logo-png-clipart.jpg"
                alt="HistoryTalk Logo"
                width={50}
                height={50}
                priority
                className="object-contain invert"
              />
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-6 ml-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      relative py-1 text-[14px] font-medium tracking-wide transition-colors group
                      ${
                        isActive
                          ? "text-[var(--accent-gold)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }
                    `}
                  >
                    {link.label}
                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 bg-[var(--accent-gold)] transition-all duration-300
                      ${isActive ? "w-full" : "w-0 group-hover:w-full"}`}
                    />
                  </Link>
                );
              })}
            </div>

            {/* Desktop CTA — đã đăng nhập: avatar pill, chưa: auth group */}
            <div className="hidden md:flex items-center ml-6">
              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="avatar-pill" style={{ outline: "none" }}>
                      <NavAvatar userName={user.userName} />
                      <span className="avatar-pill-name">{user.userName}</span>
                      {/* chevron nhỏ */}
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                        style={{ color: "var(--text-muted)", flexShrink: 0 }}
                      >
                        <path
                          d="M2 4l3 3 3-3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-52 border mt-2"
                    style={{
                      background: "var(--bg-elevated)",
                      borderColor: "var(--border-default)",
                      color: "var(--text-primary)",
                      borderRadius: "14px",
                    }}
                  >
                    <DropdownMenuLabel>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {user.userName}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {user.email ?? ""}
                      </p>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator
                      style={{ background: "var(--border-default)" }}
                    />

                    <DropdownMenuItem
                      className="cursor-pointer"
                      style={{ color: "var(--text-secondary)" }}
                      asChild
                    >
                      <Link href="/home">Khám phá</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      style={{ color: "var(--text-secondary)" }}
                      asChild
                    >
                      <Link href="/profile">Hồ sơ</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Cài đặt
                    </DropdownMenuItem>

                    <DropdownMenuSeparator
                      style={{ background: "var(--border-default)" }}
                    />

                    <DropdownMenuItem
                      className="cursor-pointer"
                      style={{ color: "var(--accent-danger)" }}
                      disabled={isPending}
                      onClick={() => logout()}
                    >
                      {isPending ? "Đang đăng xuất..." : "Đăng xuất"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="auth-group">
                  <MagneticButton
                    href="/login"
                    magnetic={false}
                    className="!border-0 rounded-none"
                  >
                    Đăng nhập
                  </MagneticButton>
                  <div className="auth-divider" />
                  <div className="cta-wrapper">
                    <MagneticButton
                      href="/home"
                      className="!border-0"
                      magnetic={false}
                    >
                      Khám phá ngay
                    </MagneticButton>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile: Login + Hamburger */}
            <div className="flex items-center gap-2 ml-auto md:hidden">
              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                      }}
                    >
                      <NavAvatar userName={user.userName} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 border mt-2"
                    style={{
                      background: "var(--bg-elevated)",
                      borderColor: "var(--border-default)",
                      color: "var(--text-primary)",
                      borderRadius: "14px",
                    }}
                  >
                    <DropdownMenuLabel>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {user.userName}
                      </p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator
                      style={{ background: "var(--border-default)" }}
                    />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      style={{ color: "var(--text-secondary)" }}
                      asChild
                    >
                      <Link href="/home">Khám phá</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Hồ sơ
                    </DropdownMenuItem>
                    <DropdownMenuSeparator
                      style={{ background: "var(--border-default)" }}
                    />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      style={{ color: "var(--accent-danger)" }}
                      disabled={isPending}
                      onClick={() => logout()}
                    >
                      {isPending ? "Đang đăng xuất..." : "Đăng xuất"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2"
                >
                  Đăng nhập
                </Link>
              )}

              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
                className="flex items-center justify-center w-11 h-11 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] transition-colors active:bg-[var(--bg-surface)]"
              >
                {isOpen ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M4 4l10 10M14 4L4 14"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M2 4.5h14M2 9h14M2 13.5h14"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* ── Mobile dropdown menu ── */}
          {isOpen && (
            <div className="md:hidden border-t border-[var(--border-default)] px-4 py-4 space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center justify-between
                      w-full px-3 py-3.5 rounded-xl text-sm font-medium
                      transition-colors active:scale-[0.98]
                      ${
                        isActive
                          ? "bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                      }
                    `}
                  >
                    {link.label}
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)]" />
                    )}
                  </Link>
                );
              })}

              <div className="pt-3">
                <Link
                  href="/home"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center w-full py-3.5 rounded-xl bg-[var(--accent-gold)] text-black text-sm font-bold uppercase tracking-widest transition-opacity active:opacity-80"
                >
                  TRẢI NGHIỆM NGAY
                </Link>
              </div>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}
