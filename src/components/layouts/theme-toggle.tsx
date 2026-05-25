"use client";

import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const activeTheme = resolvedTheme ?? "dark";
  const isDark = activeTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-full cursor-pointer"
      aria-label={isDark ? "Chuyá»ƒn sang giao diá»‡n sÃ¡ng" : "Chuyá»ƒn sang giao diá»‡n tá»‘i"}
      title={isDark ? "Giao diá»‡n sÃ¡ng" : "Giao diá»‡n tá»‘i"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      style={{
        color: "var(--header-text-muted)",
        background: "var(--header-input-bg)",
        border: "1px solid var(--card-light-border)",
      }}
      suppressHydrationWarning
    >
      {isDark ? <SunIcon className="h-[18px] w-[18px]" /> : <MoonIcon className="h-[18px] w-[18px]" />}
    </Button>
  );
}
