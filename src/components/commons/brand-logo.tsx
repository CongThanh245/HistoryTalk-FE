"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils/cn";
import { useEffect, useState } from "react";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = forceDark || resolvedTheme === "dark";

  // When collapsed, use solo-logo.png
  // Otherwise use theme-based logo
  // During SSR, use light theme logo to avoid hydration mismatch
  const logoSrc = isCollapsed
    ? "/solo-logo.png"
    : !mounted
      ? "/logo-light-theme.png"
      : isDark
        ? "/logo-dark-theme.png"
        : "/logo-light-theme.png";

  // Dimensions based on collapsed state and size prop
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
        <Image
          src={logoSrc}
          alt="HistoryTalk logo"
          width={width}
          height={height}
          priority={priority}
          className="relative z-10 object-contain"
        />
      </span>
    </span>
  );
}
