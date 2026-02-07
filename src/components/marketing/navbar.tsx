'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MarketingNavbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Trang Chủ' },
    { href: '/features', label: 'Tính Năng' },
    { href: '/pricing', label: 'Bảng Giá' },
    { href: '/about', label: 'Về Chúng Tôi' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-[var(--bg-main)]/85 backdrop-blur-xl border-b border-[var(--border-default)] shadow-[var(--shadow-soft)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4 gap-8">
        
        {/* Logo / Brand */}
        <Link 
          href="/" 
          className="flex items-center gap-3 hover:opacity-85 transition-opacity"
        >
          <span className="text-3xl">⚔️</span>
          <span className="text-xl font-bold text-[var(--accent-gold)] tracking-wide">
            HistoryTalk
          </span>
        </Link>

        {/* Navigation Links - Desktop */}
        <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  relative py-2 text-[15px] font-medium tracking-wide transition-colors
                  ${isActive 
                    ? 'text-[var(--accent-gold)]' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }
                  group
                `}
              >
                {link.label}
                
                {/* Underline animation */}
                <span 
                  className={`
                    absolute bottom-0 left-0 h-0.5 bg-[var(--accent-gold)] transition-all duration-300
                    ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}
                  `}
                />
              </Link>
            );
          })}
        </div>

        {/* CTA Button - Desktop */}
        <Link
          href="/app"
          className="
            hidden md:inline-block
            px-6 py-2.5 text-[15px] font-semibold
            bg-[var(--accent-gold)] text-[var(--text-inverse)]
            rounded-[var(--radius-md)]
            hover:bg-[var(--accent-gold-soft)]
            transition-colors duration-300
          "
        >
          Bắt Đầu Ngay
        </Link>

        {/* Mobile Menu Button */}
        <button className="md:hidden flex items-center justify-center w-10 h-10 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--bg-elevated)] transition-colors">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
            <path d="M3 5h14M3 10h14M3 15h14" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </nav>
  );
}