import { Footer } from "@/components/footer";
import { MarketingNavbar } from "@/components/marketing/navbar";
import type { CSSProperties } from "react";

const marketingTheme = {
  "--bg-main": "#0e1a2b",
  "--bg-deep": "#070d18",
  "--bg-content": "#16223a",
  "--bg-surface": "#1a2436",
  "--bg-elevated": "#24314a",
  "--text-primary": "#ff9215",
  "--text-secondary": "#dfdab5",
  "--text-tertiary": "#e1e62a",
  "--text-muted": "#8da0ab",
  "--text-inverse": "#0e1a2b",
  "--accent-gold": "#ff9215",
  "--accent-gold-soft": "#e2c77a",
  "--accent-gold-active-bg": "rgba(201, 162, 77, 0.18)",
  "--accent-gold-glow": "rgba(201, 162, 77, 0.3)",
  "--gold-on-light": "#a07828",
  "--accent-blue": "#8fb3c8",
  "--accent-teal": "#2f6f73",
  "--accent-earth": "#3b2a1f",
  "--accent-bronze": "#c46a2f",
  "--accent-blood": "#5a2323",
  "--accent-danger": "#b8322a",
  "--burning-flame": "#FAB95B",
  "--truffle": "#a35139",
  "--blue-fantastic": "#2c3b4d",
  "--abyssal-blue": "#1b2632",
  "--border-default": "rgba(231, 221, 200, 0.12)",
  "--border-strong": "rgba(231, 221, 200, 0.24)",
  "--shadow-soft": "0 8px 30px rgba(0, 0, 0, 0.35)",
  "--shadow-strong": "0 20px 60px rgba(0, 0, 0, 0.6)",
  "--shadow-gold": "0 0 18px rgba(201, 162, 77, 0.3)",
} as CSSProperties;

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] relative"
      style={marketingTheme}
    >
      {/* Background pattern */}
      <div 
        className="fixed inset-0 pointer-events-none -z-10 opacity-[0.03]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, var(--accent-gold) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, var(--accent-blue) 0%, transparent 50%)
          `,
        }}
      />
      
      {/* Navigation */}
      <MarketingNavbar />
      
      {/* Main Content */}

      <main className="w-full">
        {children}
      </main>
      <Footer></Footer>
    </div>
  );
}
