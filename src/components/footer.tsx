import Link from "next/link";
import { Container } from "./marketing/container";


const NAV_LINKS = [
  {
    heading: "Sản phẩm",
    links: [
      { label: "Trò chuyện lịch sử", href: "/features" },
      { label: "Quiz ôn tập", href: "/features#quiz" },
      { label: "Bảng giá", href: "/pricing" },
    ],
  },
  {
    heading: "Công ty",
    links: [
      { label: "Về chúng tôi", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Liên hệ", href: "/contact" },
    ],
  },
  {
    heading: "Pháp lý",
    links: [
      { label: "Điều khoản sử dụng", href: "/terms" },
      { label: "Chính sách bảo mật", href: "/privacy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-[var(--bg-deep)] border-t border-[var(--border-default)]">
      <Container>
        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 py-16">

          {/* LEFT: Brand + contact */}
          <div className="max-w-xs">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
              <span className="text-xl font-bold tracking-wide text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors duration-200">
                History<span className="text-[var(--accent-gold)]">Talk</span>
              </span>
            </Link>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-8">
              Nơi bạn không chỉ đọc lịch sử — mà trò chuyện với những người đã tạo nên nó.
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
          <p className="text-xs text-[var(--text-muted)]">
            Được xây dựng tại Việt Nam 🇻🇳
          </p>
        </div>
      </Container>
    </footer>
  );
}