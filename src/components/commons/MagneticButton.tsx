"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
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
  // Thêm 2 props mới để tùy biến mà không làm hỏng cái cũ
  variant?: "default" | "header";
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
  variant = "default", // Mặc định là kiểu cũ (viền vàng, vuông)
  rounded = "none", // Mặc định là vuông
}: MagneticButtonProps) {
  const magneticEffect = useMagneticEffect<HTMLButtonElement>({
    strength: magnetic ? magneticStrength : 0,
    duration: 0.4,
  });

  const overlay = useSlideOverlay({
    duration: animationDuration,
  });

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

  // Logic định nghĩa style cho Header
  const isHeader = variant === "header";

  return (
    <Button
      ref={magneticEffect.ref}
      asChild
      variant="magnetic"
      className={cn(
        "relative overflow-hidden bg-transparent font-medium cursor-pointer transition-all duration-300",
        isHeader
          ? "border border-header-border text-text-primary"
          : "border-2 border-accent-gold text-accent-gold",
        rounded === "full" ? "rounded-full" : "rounded-none",
        sizeClasses[size],
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={href}>
        {/* Lớp Overlay gạt - GSAP-driven transform kept as inline style */}
        <span
          ref={overlay.overlayRef}
          className={cn(
            "absolute inset-0 pointer-events-none",
            isHeader
              ? "bg-gradient-to-r from-accent-gold to-[var(--truffle)]"
              : "bg-accent-gold",
          )}
          style={{
            transform: "scaleX(0)",
            transformOrigin: "left",
          }}
        />

        {/* Text */}
        <span
          ref={overlay.textRef}
          className={cn(
            "relative z-10 tracking-wide",
            isHeader ? "text-inherit" : "text-accent-gold",
          )}
        >
          {children}
        </span>
      </Link>
    </Button>
  );
}
