"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, lazy, Suspense, useEffect } from "react";
import { MagneticButton } from "../commons/MagneticButton";
import Image from "next/image";
import { useAuthStore } from "@/store/auth.store";

// Lazy load UserProfileDropdown để giảm initial render load
const UserProfileDropdown = lazy(() => import("../layouts/user-profile-dropdown").then(m => ({ default: m.UserProfileDropdown })));

// Simple placeholder cho avatar
const AvatarPlaceholder = () => (
  <div className="w-9 h-9 rounded-full bg-[var(--bg-surface)] animate-pulse" />
);


export function MarketingNavbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = !!user;

  // Defer dropdown render để tránh lag initial render
  useEffect(() => {
    const timer = setTimeout(() => setShowDropdown(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const navLinks = [
    { href: "/", label: "Trang Chủ" },
    { href: "/features", label: "Tính Năng" },
    { href: "/pricing", label: "Bảng Giá" },
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

        .marketing-nav {
          background:
            linear-gradient(135deg, rgba(14, 26, 43, 0.9), rgba(19, 35, 43, 0.85)),
            color-mix(in srgb, var(--bg-main) 80%, transparent);
          border-color: rgba(255, 146, 21, 0.15);
          box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          /* Giảm blur để tăng performance */
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .brand-link {
          border-radius: 9999px;
          padding: 0;
          transition: transform 0.25s ease;
        }
        .brand-link:hover {
          transform: translateY(-1px);
        }
        .brand-mark {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0;
          border: 0;
          box-shadow: none;
        }
        .brand-logo-img {
          position: relative;
          z-index: 1;
          object-fit: contain;
        }
        .nav-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          min-height: 36px;
          padding: 0 13px;
          border-radius: 9999px;
          overflow: hidden;
          color: rgba(247, 241, 232, 0.72);
          transition: color 0.2s ease, transform 0.2s ease, text-shadow 0.2s ease;
        }
        .nav-link:hover,
        .nav-link.is-active {
          color: #ffb95c;
          transform: translateY(-2px);
          text-shadow: 0 0 14px rgba(255, 146, 21, 0.38);
        }
        .nav-link > span {
          position: relative;
          z-index: 1;
        }

      `}</style>

      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-3 md:p-4 pointer-events-none" style={{ contain: "layout" }}>
        <nav
          className={`
            pointer-events-auto
            marketing-nav
            border
            transition-all duration-300
            w-full rounded-2xl
            md:max-w-fit md:rounded-full
          `}
          style={{ contain: "layout style paint" }}
        >
          {/* ── Top bar ── */}
          <div className="flex items-center px-4 py-3 md:px-6 md:py-2">
            <Link
              href="/"
              className="brand-link flex items-center"
            >
              <span className="brand-mark">
                <Image
                  src="/logo-dark-theme.png"
                  alt="HistoryTalk Logo"
                  width={140}
                  height={44}
                  priority
                  className="brand-logo-img object-contain w-[140px] h-auto md:w-[180px]"
                />
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1.5 ml-7">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`nav-link text-[14px] font-semibold tracking-wide ${isActive ? "is-active" : ""}`}
                  >
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Desktop CTA — đã đăng nhập: avatar pill, chưa: auth group */}
            <div className="hidden md:flex items-center ml-6">
              {isLoggedIn ? (
                showDropdown ? (
                  <Suspense fallback={<AvatarPlaceholder />}>
                    <UserProfileDropdown align="end" showPremium={false} showBorder={false} />
                  </Suspense>
                ) : (
                  <AvatarPlaceholder />
                )
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
            <div className="flex items-center gap-1.5 ml-auto md:hidden">
              {isLoggedIn ? (
                showDropdown ? (
                  <Suspense fallback={<AvatarPlaceholder />}>
                    <UserProfileDropdown align="end" showPremium={false} showBorder={false} />
                  </Suspense>
                ) : (
                  <AvatarPlaceholder />
                )
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-2 whitespace-nowrap"
                >
                  Đăng nhập
                </Link>
              )}

              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] transition-colors active:bg-[var(--bg-surface)] shrink-0"
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
                      ${isActive
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
