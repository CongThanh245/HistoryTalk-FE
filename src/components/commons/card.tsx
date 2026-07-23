"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { isValidUrl } from "@/lib/utils/url";

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
  const [imageBroken, setImageBroken] = useState(false);
  const resolvedImageSrc = !imageBroken && isValidUrl(imageSrc) ? imageSrc : "/card.jpg";

  return (
    <div
      className={cn(
        "group relative rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer",
        "hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] hover:-translate-y-0.5",
        isHorizontal ? "flex flex-col md:flex-row" : "flex flex-col",
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
        className={cn(
          "relative overflow-hidden shrink-0",
          isHorizontal ? "w-full md:w-[var(--desktop-width)] md:h-auto" : "w-full",
        )}
        style={
          isHorizontal
            ? ({
                "--desktop-width": `${imageWidth}px`,
                "--mobile-height": `${imageHeight}px` || "240px",
                minHeight: imageHeight,
              } as React.CSSProperties)
            : { width: "100%", height: imageHeight }
        }
      >
        <div
          className={cn(
            "relative w-full overflow-hidden",
            isHorizontal
              ? "h-[var(--mobile-height)] md:h-full"
              : "h-full",
          )}
        >
          <Image
            src={resolvedImageSrc}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes={imageSizes}
            onError={() => setImageBroken(true)}
          />
          <div
            className={cn(
              "absolute inset-0 z-10",
              isHorizontal
                ? "bg-gradient-to-t from-[var(--card-light-bg)] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[var(--card-light-bg)]"
                : "bg-gradient-to-t from-[var(--card-light-bg)] via-transparent to-transparent",
            )}
          />
        </div>

        {badge && (
          <div className="absolute top-2.5 right-2.5 z-20">
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
            ? "flex-1 px-4 py-5 md:px-6 md:py-6 flex flex-col justify-center"
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
  imageSizes?: string;
  badge?: CardBadge;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  priority?: boolean;
  imageQuality?: number;
  hoverEffects?: boolean;
}

export function DarkCard({
  imageSrc,
  imageAlt,
  imageHeight = "65%",
  imageSizes = "356px",
  badge,
  children,
  className,
  onClick,
  priority = false,
  imageQuality = 65,
  hoverEffects = true,
}: DarkCardProps) {
  const [imageBroken, setImageBroken] = useState(false);
  const resolvedImageSrc = !imageBroken && isValidUrl(imageSrc) ? imageSrc : "/card.jpg";

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
        className={cn(
          "absolute inset-0 pointer-events-none opacity-0 transition-all duration-300",
          hoverEffects && "group-hover:opacity-100",
        )}
        style={{
          boxShadow: "inset 0 0 0 1.5px var(--accent-gold), var(--shadow-gold)",
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
          src={resolvedImageSrc}
          alt={imageAlt}
          fill
          className={cn(
            "object-cover transition-transform duration-700",
            hoverEffects && "group-hover:scale-105",
          )}
          sizes={imageSizes}
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
          quality={imageQuality}
          onError={() => setImageBroken(true)}
        />
        <div
          className="absolute inset-0 z-10"
          style={{
            background: "linear-gradient(to top, var(--bg-surface) 0%, rgba(26,36,54,0) 50%)",
          }}
        />
        {badge && (
          <div
            className="absolute right-2 top-2 z-10 rounded-md border px-1.5 py-0.5 sm:right-3 sm:top-3 sm:px-2 sm:py-1"
            style={{
              background: "rgba(14,26,43,0.8)",
              backdropFilter: "blur(4px)",
              borderColor: "var(--border-default)",
            }}
          >
            <span
              className="text-[8px] font-bold uppercase tracking-wider sm:text-[10px]"
              style={{ color: "var(--accent-gold)" }}
            >
              {badge.label}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">{children}</div>
    </div>
  );
}
