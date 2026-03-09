"use client";

import Image from "next/image";
import { cn } from "@/lib/utils/cn";

// ── Types ─────────────────────────────────────────────────

interface CardBadge {
  label: string;
  color: string;
  bg: string;
}

interface CardProps {
  imageSrc: string;
  imageAlt: string;
  imageHeight?: number;
  imageSizes?: string;
  badge?: CardBadge;
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
  onClick?: () => void;
  layout?: "vertical" | "horizontal";
  imageWidth?: number;
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
  layout = "vertical",
  imageWidth = 280,
}: CardProps) {
  const isHorizontal = layout === "horizontal";

  return (
    <div
      className={cn(
        "group relative rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer",
        "hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] hover:-translate-y-0.5",
        isHorizontal ? "flex flex-row" : "flex flex-col",
        className,
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
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{ boxShadow: `inset 0 0 0 1px ${accentColor}40`, zIndex: 20 }}
        />
      )}

      {/* Ảnh */}
      <div
        className="relative overflow-hidden shrink-0"
        style={
          isHorizontal
            ? { width: imageWidth, minHeight: imageHeight }
            : { width: "100%", height: imageHeight }
        }
      >
        <Image
          src={imageSrc || "/card.jpg"}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={imageSizes}
        />
        <div
          className="absolute inset-0"
          style={{
            background: isHorizontal
              ? "linear-gradient(to right, transparent 60%, var(--card-light-bg) 100%)"
              : "linear-gradient(to bottom, transparent 40%, var(--card-light-bg) 100%)",
          }}
        />
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
      <div
        className={cn(
          isHorizontal
            ? "flex-1 px-6 py-5 flex flex-col justify-center"
            : "px-4 pb-4 pt-1",
        )}
      >
        {children}
      </div>
    </div>
  );
}

// ── DarkCard ──────────────────────────────────────────────

interface DarkCardProps {
  imageSrc: string;
  imageAlt: string;
  imageHeight?: string;
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
        // "relative" bắt buộc phải có để overlay absolute bám đúng chỗ
        "group relative w-full h-full rounded-[var(--radius-lg)] overflow-hidden border transition-all duration-300 cursor-pointer flex flex-col",
        className,
      )}
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
      onClick={onClick}
    >
      {/* ── Hover border overlay ──
          - absolute inset-0 = phủ toàn bộ card kể cả phần ảnh
          - zIndex: 50 = cao hơn ảnh (z-10) và badge (z-10)
          - inset box-shadow = vẽ viền bên trong, không bị overflow-hidden clip
          - pointer-events-none = không block click
      */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: "inset 0 0 0 2px #cdd316",
          borderRadius: "var(--radius-lg)",
          zIndex: 50,
        }}
      />

      {/* Ảnh */}
      <div
        className="relative w-full overflow-hidden shrink-0"
        style={{ height: imageHeight, background: "var(--bg-elevated)" }}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="400px"
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] via-transparent to-transparent z-10" />
        {badge && (
          <div
            className="absolute top-3 right-3 px-2 py-1 rounded-md border z-10"
            style={{
              background: "rgba(14,26,43,0.8)",
              backdropFilter: "blur(4px)",
              borderColor: "var(--border-default)",
            }}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--accent-gold)" }}
            >
              {badge.label}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">{children}</div>
    </div>
  );
}
