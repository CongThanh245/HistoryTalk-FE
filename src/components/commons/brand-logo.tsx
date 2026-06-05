"use client";

import { useTheme } from "next-themes";
import { cn } from "@/lib/utils/cn";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  isCollapsed?: boolean;
  forceDark?: boolean;
  size?: "default" | "large";
};

export function BrandLogo({
  className,
  priority = false,
  isCollapsed = false,
  forceDark = false,
  size = "default",
}: BrandLogoProps) {
  const { resolvedTheme } = useTheme();

  const isDark = forceDark || resolvedTheme === "dark";

  // When collapsed, use solo-logo.png
  // Otherwise use theme-based logo
  const logoSrc = isCollapsed
    ? "/solo-logo.png"
    : isDark
        ? "/logo-dark-theme.png"
        : "/logo-light-theme.png";

  const isLarge = size === "large";
  const width = isCollapsed ? 36 : isLarge ? 180 : 144;
  const height = isCollapsed ? 36 : isLarge ? 56 : 44;

  return (
    <span className={cn("brand-logo-root inline-flex items-center", className)}>
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-visible",
          isCollapsed ? "h-9 w-9" : isLarge ? "h-14 w-44" : "h-11 w-36",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt="HistoryTalk logo"
          width={width}
          height={height}
          fetchPriority={priority ? "high" : undefined}
          className="relative z-10 object-contain"
        />
      </span>
    </span>
  );
}
