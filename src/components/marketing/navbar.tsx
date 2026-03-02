"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MagneticButton } from "../commons/MagneticButton";
import { useIsMobile } from "@/lib/hooks/use-mobile";

export function MarketingNavbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const navLinks = [
    { href: "/", label: "Trang Chủ" },
    { href: "/features", label: "Tính Năng" },
    { href: "/pricing", label: "Bảng Giá" },
    { href: "/about", label: "Về Chúng Tôi" },
  ];

  return (
    <>
      {/* Inject styles for the auth group */}
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
        .auth-group:hover::before {
          opacity: 1;
        }

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
        .auth-group:hover .login-link {
          color: var(--text-primary);
          background: color-mix(in srgb, var(--accent-gold) 5%, transparent);
        }

        .auth-divider {
          width: 1px;
          height: 18px;
          background: var(--border-default);
          flex-shrink: 0;
          transition: background 0.25s ease;
        }
        .auth-group:hover .auth-divider {
          background: color-mix(in srgb, var(--accent-gold) 30%, transparent);
        }

        .auth-group .cta-wrapper > * {
          border-radius: 0 9999px 9999px 0 !important;
        }
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
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-85 transition-opacity"
            >
              <span className="text-base font-bold text-[var(--accent-gold)] tracking-wide">
                LogoHistoryTalk
              </span>
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

            {/* Desktop CTA — grouped pill */}
            <div className="hidden md:flex items-center ml-6">
              <div className="auth-group">
                {/* Đăng nhập — bỏ border */}
                <MagneticButton
                  href="/login"
                  magnetic={false}
                  className="!border-0 rounded-none"
                >
                  Đăng nhập
                </MagneticButton>

                <div className="auth-divider" />

                {/* KHÁM PHÁ NGAY — bỏ border */}
                <div className="cta-wrapper">
                  <MagneticButton href="/app" className="!border-0">
                    <span className="text-xs px-2">KHÁM PHÁ NGAY</span>
                  </MagneticButton>
                </div>
              </div>
            </div>

            {/* Mobile: Login + Hamburger */}
            <div className="flex items-center gap-2 ml-auto md:hidden">
              <Link
                href="/login"
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2"
              >
                Đăng nhập
              </Link>
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
                  href="/app"
                  onClick={() => setIsOpen(false)}
                  className="
                    flex items-center justify-center w-full py-3.5 rounded-xl
                    bg-[var(--accent-gold)] text-black text-sm font-bold uppercase tracking-widest
                    transition-opacity active:opacity-80
                  "
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
