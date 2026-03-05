"use client";

import Image from "next/image";
import { cn } from "@/lib/utils/cn";

// ── Types ─────────────────────────────────────────────────

interface CardBadge {
  label: string;
  color: string;   // text color
  bg: string;      // background
}

interface CardProps {
  // Ảnh
  imageSrc: string;
  imageAlt: string;
  imageHeight?: number;        // default 128px
  imageSizes?: string;

  // Badge nổi trên ảnh (góc phải)
  badge?: CardBadge;

  // Nội dung phía dưới ảnh
  children: React.ReactNode;

  // Style
  className?: string;
  accentColor?: string;        // màu viền hover + glow
  onClick?: () => void;
}

// ── Card ──────────────────────────────────────────────────

export function Card({
  imageSrc,
  imageAlt,
  imageHeight = 128,
  imageSizes = "(max-width: 768px) 100vw, 400px",
  badge,
  children,
  className,
  accentColor,
  onClick,
}: CardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer",
        "hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] hover:-translate-y-0.5",
        className
      )}
      style={{
        background: "var(--card-light-bg)",
        borderColor: "var(--card-light-border)",
      }}
      onClick={onClick}
    >
      {/* Hover border glow */}
      {accentColor && (
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10"
          style={{ boxShadow: `inset 0 0 0 1px ${accentColor}40` }}
        />
      )}

      {/* Ảnh */}
      <div className="relative w-full overflow-hidden" style={{ height: imageHeight }}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={imageSizes}
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, transparent 40%, var(--card-light-bg) 100%)",
          }}
        />

        {/* Badge nổi trên ảnh */}
        {badge && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm"
              style={{ background: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-4 pt-1">
        {children}
      </div>
    </div>
  );
}

// ── Dark variant (dùng cho carousel — nền tối) ────────────

interface DarkCardProps {
  imageSrc: string;
  imageAlt: string;
  imageHeight?: string;        // % của chiều cao card, default "65%"
  badge?: CardBadge;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  priority?: boolean;
}

export function DarkCard({
  imageSrc,
  imageAlt,
  imageHeight = "65%",
  badge,
  children,
  className,
  onClick,
  priority = false,
}: DarkCardProps) {
  return (
    <div
      className={cn(
        "group w-full h-full rounded-[var(--radius-lg)] overflow-hidden border transition-all duration-300 cursor-pointer flex flex-col",
        "hover:border-[var(--accent-gold)] hover:shadow-[0_10px_40px_rgba(201,162,77,0.2)]",
        className
      )}
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border-default)",
        boxShadow: "var(--shadow-strong)",
      }}
      onClick={onClick}
    >
      {/* Ảnh */}
      <div className="relative w-full overflow-hidden shrink-0" style={{ height: imageHeight, background: "var(--bg-elevated)" }}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="400px"
          priority={priority}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] via-transparent to-transparent z-10" />

        {/* Badge */}
        {badge && (
          <div
            className="absolute top-3 right-3 px-2 py-1 rounded-md border z-10"
            style={{ background: "rgba(14,26,43,0.8)", backdropFilter: "blur(4px)", borderColor: "var(--border-default)" }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--accent-gold)" }}>
              {badge.label}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}