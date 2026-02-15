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
  magneticStrength?: number;
  animationDuration?: number;
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
  magneticStrength = 0.12,
  animationDuration = 0.8,
}: MagneticButtonProps) {
  // Hiệu ứng nam châm
  const magnetic = useMagneticEffect<HTMLButtonElement>({
    strength: magneticStrength,
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
    magnetic.handleMouseMove(e);
  };

  const handleMouseLeave = () => {
    magnetic.handleMouseLeave();
    overlay.handleMouseLeave();
  };

  return (
    <Button
      ref={magnetic.ref}
      asChild
      variant="magnetic"
      className={`
        relative overflow-hidden
        bg-transparent
        border-2 border-[var(--accent-gold)]
        text-[var(--accent-gold)]
        font-medium
        rounded-none
        cursor-pointer
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
          className="absolute inset-0 pointer-events-none bg-[var(--accent-gold)]"
          style={{
            transform: "scaleX(0)",
            transformOrigin: "left",
          }}
        />

        <span
          ref={overlay.textRef}
          className="relative z-10 tracking-wide text-[var(--accent-gold)]"
        >
          {children}
        </span>
      </Link>
    </Button>
  );
}