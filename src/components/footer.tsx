import Link from "next/link";
import { Container } from "./marketing/container";
import { BrandLogo } from "./commons/brand-logo";

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
      { label: "Cài đặt", href: "/settings" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-[var(--bg-main)] border-t border-[var(--border-default)]">
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
              <BrandLogo forceTheme="dark" size="large" />
            </Link>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-8">
              Nơi bạn không chỉ đọc lịch sử — mà trò chuyện với những người đã
              tạo nên nó.
            </p>

            {/* Contact */}
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-2">
                Liên hệ
              </p>
              <a
                href="mailto:hello@historytalk.vn"
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors duration-200"
              >
                hello@historytalk.vn
              </a>
            </div>
          </div>

          {/* RIGHT: Nav columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 lg:gap-16">
            {NAV_LINKS.map((col) => (
              <div key={col.heading}>
                <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-gold)] opacity-80 mb-4">
                  {col.heading}
                </p>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200"
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
        <div className="border-t border-[var(--border-default)] py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--text-muted)]">
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
