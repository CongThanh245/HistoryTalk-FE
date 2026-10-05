"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, lazy, Suspense, useEffect } from "react";
import { MagneticButton } from "../commons/MagneticButton";
import Image from "next/image";
import { useAuthStore } from "@/store/auth.store";
import { useEntitlements } from "@/features/saas/entitlements";

// Lazy load UserProfileDropdown để giảm initial render load
const UserProfileDropdown = lazy(() => import("../layouts/user-profile-dropdown").then(m => ({ default: m.UserProfileDropdown })));

// Simple placeholder cho avatar
const AvatarPlaceholder = () => (
  <div className="w-9 h-9 rounded-full bg-[var(--bg-deep)] animate-pulse" />
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

  // School accounts cannot buy plans (middleware blocks /pricing for them), so hide the pricing link.
  const { canPurchase } = useEntitlements();
  const navLinks = [
    { href: "/", label: "Trang Chủ" },
    { href: "/features", label: "Tính Năng" },
    ...(canPurchase ? [{ href: "/pricing", label: "Bảng Giá" }] : []),
  ];

  return (
    <>
      <style>{`
        .auth-group {
          display: flex;
          align-items: center;
          border: 1px solid var(--accent-gold);
          border-radius: 2px;
          overflow: hidden;
          position: relative;
        }
        .auth-divider {
          width: 1px;
          align-self: stretch;
          background: var(--accent-gold);
          flex-shrink: 0;
        }
        .auth-group > *,
        .auth-group .cta-wrapper > * { border-radius: 0 !important; }

        .marketing-nav {
          background: color-mix(in srgb, var(--bg-surface) 92%, transparent);
          border-color: var(--text-primary);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .brand-link {
          padding: 0;
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
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          transition: color 0.2s ease;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          left: 13px;
          right: 13px;
          bottom: 4px;
          height: 2px;
          background: var(--accent-gold);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.2s ease;
        }
        .nav-link:hover,
        .nav-link.is-active {
          color: var(--text-primary);
        }
        .nav-link:hover::after,
        .nav-link.is-active::after {
          transform: scaleX(1);
        }
        .nav-link > span {
          position: relative;
          z-index: 1;
        }

      `}</style>

      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-3 md:p-4 pointer-events-none [contain:layout]">
        <nav
          className={`
            pointer-events-auto
            marketing-nav
            border
            transition-all duration-300
            w-full rounded-[2px]
            md:max-w-fit
            [contain:layout_style_paint]
          `}
        >
          {/* ── Top bar ── */}
          <div className="flex items-center px-4 py-3 md:px-6 md:py-2">
            <Link
              href="/"
              className="brand-link flex items-center"
            >
              <span className="brand-mark">
                <Image
                  src="/logo-light-theme.png"
                  alt="HistoryTalk Logo"
                  width={140}
                  height={44}
                  priority
                  className="brand-logo-img object-contain w-[140px] h-auto md:w-[180px] dark:hidden"
                />
                <Image
                  src="/logo-dark-theme.png"
                  alt="HistoryTalk Logo"
                  width={140}
                  height={44}
                  priority
                  className="brand-logo-img object-contain w-[140px] h-auto md:w-[180px] hidden dark:block"
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
                    className={`nav-link text-[12px] font-bold ${isActive ? "is-active" : ""}`}
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
                    className="border-0! rounded-none text-[12px]! font-bold uppercase tracking-[0.08em]"
                  >
                    Đăng nhập
                  </MagneticButton>
                  <div className="auth-divider" />
                  <div className="cta-wrapper">
                    <MagneticButton
                      href="/home"
                      magnetic={false}
                      className="border-0! text-[12px]! font-bold uppercase tracking-[0.08em]"
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
                  className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-2 whitespace-nowrap"
                >
                  Đăng nhập
                </Link>
              )}

              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
                className="flex items-center justify-center w-10 h-10 rounded-[2px] bg-transparent border border-[var(--text-primary)] text-[var(--text-primary)] transition-colors active:bg-[var(--bg-surface)] shrink-0"
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
            <div className="md:hidden border-t border-[var(--border-default)] px-4 py-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center justify-between
                      w-full px-3 py-3.5 text-[13px] font-bold uppercase tracking-[0.08em]
                      border-b border-[var(--border-default)]
                      transition-colors
                      ${isActive
                        ? "text-[var(--accent-gold)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]"
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
                  className="btn-crimson w-full py-3.5"
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
