"use client";

import { useRef, useState, ReactNode } from "react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
  animationDuration =0.8,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLSpanElement>(null);
  const [lastHoverTime, setLastHoverTime] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">(
    "left",
  );
  const textRef = useRef<HTMLSpanElement>(null); // Thêm dòng này

  const handleMouseEnter = () => {
    if (!overlayRef.current) return;

    const now = Date.now();
    const timeSinceLastHover = now - lastHoverTime;
    const newDirection =
      timeSinceLastHover < 2000 && lastHoverTime > 0
        ? slideDirection === "left"
          ? "right"
          : "left"
        : slideDirection;

    setSlideDirection(newDirection);
    setLastHoverTime(now);

    const startX = newDirection === "left" ? "-100%" : "100%";
    gsap.to(textRef.current, {
      color: "var(--text-inverse)", // Màu chữ khi nền đã phủ qua
      duration: animationDuration,
      ease: "power3.inOut",
    });
    // ĐÂY LÀ KEY: Dùng scaleX thay vì translateX để gạt từ từ
    gsap.fromTo(
      overlayRef.current,
      {
        scaleX: 0,
        transformOrigin: newDirection === "left" ? "left" : "right",
      },
      {
        scaleX: 1,
        duration: animationDuration,
        ease: "power3.inOut", // inOut mượt hơn out
      },
    );
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * magneticStrength;
    const deltaY = (e.clientY - centerY) * magneticStrength;

    gsap.to(buttonRef.current, {
      x: deltaX,
      y: deltaY,
      duration: 0.4,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    if (!buttonRef.current) return;
    gsap.to(textRef.current, {
      color: "var(--accent-gold)", // Màu chữ ban đầu
      duration: animationDuration,
      ease: "power2.inOut",
    });
    gsap.to(buttonRef.current, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: "power3.out",
    });

    if (!overlayRef.current) return;

    // Gạt ra cũng dùng scaleX để mượt
    gsap.to(overlayRef.current, {
      scaleX: 0,
      transformOrigin: slideDirection === "left" ? "right" : "left", // Ngược lại
      duration: animationDuration,
      ease: "power2.inOut",
    });
  };

  return (
    <Button
      ref={buttonRef}
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
          ref={overlayRef}
          className="absolute inset-0 pointer-events-none bg-[var(--accent-gold)]"
          style={{
            transform: "scaleX(0)", // Ban đầu thu về 0
            transformOrigin: "left", // Mặc định từ trái
          }}
        ></span>

        <span
          ref={textRef}
          className="relative z-10 tracking-wide text-[var(--accent-gold)]"
        >
          {children}
        </span>
      </Link>
    </Button>
  );
}
