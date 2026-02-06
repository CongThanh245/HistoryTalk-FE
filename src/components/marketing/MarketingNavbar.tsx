"use client";

import Link from "next/link";

export default function MarketingNavbar() {
  return (
    <header
      className="
        fixed top-0 left-0 right-0 z-50
        border-b border-[var(--border-default)]
        bg-[rgba(14,26,43,0.75)]
        backdrop-blur-md
      "
    >
      <nav className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-lg font-semibold tracking-wide">
          <span className="text-[var(--accent-gold)]">History</span>
          <span className="text-[var(--text-primary)]">Talk</span>
        </Link>

        {/* Navigation */}
        <div className="hidden md:flex items-center gap-8 text-sm text-[var(--text-secondary)]">
          <Link href="#features" className="hover:text-[var(--text-primary)]">
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="hover:text-[var(--text-primary)]"
          >
            How it works
          </Link>
          <Link href="#pricing" className="hover:text-[var(--text-primary)]">
            Pricing
          </Link>
          <Link href="#about" className="hover:text-[var(--text-primary)]">
            About
          </Link>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Sign in
          </Link>

          <Link
            href="/app"
            className="
              text-sm font-medium
              px-4 py-2
              rounded-[var(--radius-md)]
              bg-[var(--accent-gold)]
              text-[var(--text-inverse)]
              hover:bg-[var(--accent-gold-soft)]
              transition
            "
          >
            Try now
          </Link>
        </div>
      </nav>
    </header>
  );
}
