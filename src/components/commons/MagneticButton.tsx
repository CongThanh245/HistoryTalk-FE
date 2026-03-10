"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useMagneticEffect } from "@/lib/hooks/use-magnetic";
import { useSlideOverlay } from "@/lib/hooks/use-overlay-slide";

interface MagneticButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  magnetic?: boolean;
  magneticStrength?: number;
  animationDuration?: number;
  variant?: "gold-outline" | "header-style";
  rounded?: "none" | "full";
}

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2 text-[15px]",
  lg: "px-8 py-3 text-lg",
  xl: "px-10 py-4 text-xl",
};

export function MagneticButton({
  href,
  children,
  className = "",
  size = "md",
  magnetic = true,
  magneticStrength = 0.12,
  animationDuration = 0.8,
  variant = "gold-outline",
  rounded = "none",
}: MagneticButtonProps) {
  const variantStyles = {
    "gold-outline": {
      border: "border-2 border-[var(--accent-gold)]",
      text: "text-[var(--accent-gold)]",
      overlay: "bg-[var(--accent-gold)]",
    },
    "header-style": {
      border:
        "border border-[var(--header-border)] hover:border-[var(--accent-gold)]",
      text: "text-[var(--text-primary)]",
      overlay:
        "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
    },
  };
  const currentStyle = variantStyles[variant];
  const magneticEffect = useMagneticEffect<HTMLButtonElement>({
    strength: magnetic ? magneticStrength : 0, // ← strength = 0 khi tắt
    duration: 0.4,
  });

  // Hiệu ứng overlay gạt
  const overlay = useSlideOverlay({
    duration: animationDuration,
  });

  // Gộp handlers
  const handleMouseEnter = () => {
    overlay.handleMouseEnter();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (magnetic) magneticEffect.handleMouseMove(e);
  };

  const handleMouseLeave = () => {
    if (magnetic) magneticEffect.handleMouseLeave();
    overlay.handleMouseLeave();
  };

  return (
    <Button
      ref={magneticEffect.ref}
      asChild
      variant="magnetic"
      className={`
        relative overflow-hidden bg-transparent font-medium cursor-pointer
        ${currentStyle.border}
        ${rounded === "full" ? "rounded-full" : "rounded-none"}
        ${sizeClasses[size]}
        ${className}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={href}>
        <span
          ref={overlay.overlayRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: currentStyle.overlay, // Sử dụng màu từ variant
            transform: "scaleX(0)",
            transformOrigin: "left",
          }}
        />

        <span
          ref={overlay.textRef}
          className="relative z-10 tracking-wide"
          style={{
            color:
              variant === "gold-outline" ? "var(--accent-gold)" : "inherit",
          }}
        >
          {children}
        </span>
      </Link>
    </Button>
  );
}
