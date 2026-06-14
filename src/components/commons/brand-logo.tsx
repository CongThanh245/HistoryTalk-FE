"use client";

import Image from "next/image";
import { cn } from "@/lib/utils/cn";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  isCollapsed?: boolean;
  forceDark?: boolean;
  forceTheme?: "light" | "dark";
  size?: "default" | "large";
};

export function BrandLogo({
  className,
  priority = false,
  isCollapsed = false,
  forceDark = false,
  forceTheme,
  size = "default",
}: BrandLogoProps) {
  const isLarge = size === "large";
  const width = isCollapsed ? 36 : isLarge ? 180 : 144;
  const height = isCollapsed ? 36 : isLarge ? 56 : 44;
  const themeLogoClassName = cn(
    "relative z-10 object-contain",
    forceTheme === "dark"
      ? "hidden"
      : forceTheme === "light" || forceDark
        ? "block"
        : "block dark:hidden",
  );
  const darkLogoClassName = cn(
    "relative z-10 object-contain",
    forceTheme === "dark"
      ? "block"
      : forceTheme === "light" || forceDark
        ? "hidden"
        : "hidden dark:block",
  );

  return (
    <span className={cn("brand-logo-root inline-flex items-center", className)}>
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-visible",
          isCollapsed ? "h-9 w-9" : isLarge ? "h-14 w-44" : "h-11 w-36",
        )}
      >
        {isCollapsed ? (
          <Image
            src="/solo-logo.png"
            alt="HistoryTalk logo"
            width={width}
            height={height}
            priority={priority}
            unoptimized
            className="relative z-10 object-contain"
          />
        ) : (
          <>
            <Image
              src="/logo-light-theme.png"
              alt="HistoryTalk logo"
              width={width}
              height={height}
              priority={priority}
              unoptimized
              className={themeLogoClassName}
            />
            <Image
              src="/logo-dark-theme.png"
              alt="HistoryTalk logo"
              width={width}
              height={height}
              priority={priority}
              unoptimized
              className={darkLogoClassName}
            />
          </>
        )}
      </span>
    </span>
  );
}
