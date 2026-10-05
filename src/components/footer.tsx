"use client";

import Link from "next/link";
import { Container } from "./marketing/container";
import { BrandLogo } from "./commons/brand-logo";
import { useEntitlements } from "@/features/saas/entitlements";

const NAV_LINKS = [
  {
    heading: "Khám phá",
    links: [
      { label: "Sự kiện lịch sử", href: "/events" },
      { label: "Nhân vật lịch sử", href: "/characters" },
      { label: "Lịch sử trò chuyện", href: "/chat-history" },
    ],
  },
  {
    heading: "Ứng dụng",
    links: [
      { label: "Trò chuyện AI", href: "/characters" },
      { label: "Thử thách Quiz", href: "/quiz" },
    ],
  },
  {
    heading: "Tài khoản",
    links: [
      { label: "Trang cá nhân", href: "/profile" },
      { label: "Bảng giá", href: "/pricing", purchaseOnly: true },
    ],
  },
];

export function Footer() {
  // School accounts cannot buy plans, so the pricing link is hidden for them.
  const { canPurchase } = useEntitlements();
  const navLinks = NAV_LINKS.map((col) => ({
    ...col,
    links: col.links.filter((link) => canPurchase || !("purchaseOnly" in link && link.purchaseOnly)),
  }));

  return (
    <footer className="bg-[var(--bg-main)] border-t border-[var(--text-primary)]">
      <Container>
        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 sm:gap-12 py-10 sm:py-16">
          {/* LEFT: Brand + contact */}
          <div className="max-w-xs">
            {/* Logo */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 mb-6 group"
            >
              <BrandLogo size="large" />
            </Link>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-8">
              Nơi bạn không chỉ đọc lịch sử — mà trò chuyện với những người đã
              tạo nên nó.
            </p>

            {/* Contact */}
            <div className="space-y-1">
              <p className="archive-label mb-2">
                Liên hệ
              </p>
              <a
                href="mailto:hello@historytalk.vn"
                className="archive-link normal-case tracking-normal text-sm font-semibold"
              >
                hello@historytalk.vn
              </a>
            </div>
          </div>

          {/* RIGHT: Nav columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 lg:gap-16">
            {navLinks.map((col) => (
              <div key={col.heading}>
                <p className="font-display text-lg font-extrabold uppercase leading-[1.25] tracking-[0.02em] text-[var(--text-primary)] pb-3 mb-4 border-b border-[var(--text-primary)]">
                  {col.heading}
                </p>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[var(--border-strong)] py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
            © {new Date().getFullYear()} HistoryTalk. Bảo lưu mọi quyền.
          </p>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[var(--text-muted)] opacity-[0.1] select-none pointer-events-none">
              NganNK34
            </span>

            <p className="text-xs text-[var(--text-muted)]">
              Được xây dựng tại Việt Nam 🇻🇳
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
