"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { ReactNode } from "react";

interface MarketingButtonProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * Animated button for marketing / dark-background sections.
 * Hover effect: four corner border lines sweep in from each edge.
 */
export function MarketingButton({
  href,
  onClick,
  children,
  className,
}: MarketingButtonProps) {
  const baseClass = cn(
    "group relative inline-flex items-center justify-center overflow-hidden",
    "border border-white/10 bg-white/[0.03] backdrop-blur-md",
    "px-6 py-3.5 text-sm font-semibold tracking-wider text-white",
    "transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] active:scale-[0.98]",
    "lg:px-8 lg:py-4 lg:text-base",
    className,
  );

  const lines = (
    <>
      {/* Top line — sweeps right */}
      <span className="absolute left-0 top-0 h-[1.5px] w-full origin-left -translate-x-[7.5%] scale-x-0 bg-[var(--text-tertiary)] transition-transform duration-700 ease-out group-hover:scale-x-[1.15]" />
      {/* Bottom line — sweeps left */}
      <span className="absolute bottom-0 left-0 h-[1.5px] w-full origin-right translate-x-[7.5%] scale-x-0 bg-[var(--text-tertiary)] transition-transform duration-700 ease-out group-hover:scale-x-[1.15]" />
      {/* Left line — sweeps down */}
      <span className="absolute left-0 top-0 h-full w-[1.5px] origin-bottom translate-y-[15%] scale-y-0 bg-[var(--text-tertiary)] transition-transform duration-700 ease-out group-hover:scale-y-[1.3]" />
      {/* Right line — sweeps up */}
      <span className="absolute right-0 top-0 h-full w-[1.5px] origin-top -translate-y-[15%] scale-y-0 bg-[var(--text-tertiary)] transition-transform duration-700 ease-out group-hover:scale-y-[1.3]" />
      <span className="relative z-20">{children}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {lines}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClass}>
      {lines}
    </button>
  );
}
