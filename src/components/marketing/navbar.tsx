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
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-3 md:p-4 pointer-events-none">
      <nav
        className={`
          pointer-events-auto
          bg-[var(--bg-main)]/80 backdrop-blur-xl
          border border-[var(--border-default)]
          shadow-[var(--shadow-soft)]
          transition-all duration-300
          /* Mobile: full width, bo góc vừa phải */
          w-full rounded-2xl
          /* Desktop: thu nhỏ lại thành pill */
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
                    ${isActive
                      ? "text-[var(--accent-gold)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }
                  `}
                >
                  {link.label}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[var(--accent-gold)] transition-all duration-300
                    ${isActive ? "w-full" : "w-0 group-hover:w-full"}`}
                  />
                </Link>
              );
            })}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3 ml-6">
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3"
            >
              Đăng nhập
            </Link>
            <MagneticButton className="rounded-full" href="/app">
              <span className="text-xs px-2">TRẢI NGHIỆM</span>
            </MagneticButton>
          </div>

          {/* Mobile: Login + Hamburger */}
          <div className="flex items-center gap-2 ml-auto md:hidden">
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2"
            >
              Đăng nhập
            </Link>
            {/* Hamburger — touch target 44x44 */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] transition-colors active:bg-[var(--bg-surface)]"
            >
              {isOpen ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                  <path d="M4 4l10 10M14 4L4 14" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                  <path d="M2 4.5h14M2 9h14M2 13.5h14" strokeWidth="2" strokeLinecap="round" />
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

            {/* Mobile CTA button — full width */}
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
  );
}