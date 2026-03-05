"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { TooltipProvider } from "@/components/ui/tooltip";
import SidebarHeader from "./sidebar-header";
import SidebarNav from "./sidebar-nav";
import SidebarFooter from "./sidebar-footer";

export default function Sidebar() {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isExpanded = isPinned || isHovered;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ht-sidebar-pinned");
      if (saved !== null) setIsPinned(JSON.parse(saved));
    } catch {}
  }, []);

  const togglePin = () => {
    const next = !isPinned;
    setIsPinned(next);
    try {
      localStorage.setItem("ht-sidebar-pinned", JSON.stringify(next));
    } catch {}
  };

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => setIsHovered(false), 120);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "relative h-screen flex flex-col transition-all duration-250 ease-in-out select-none shrink-0 border-r z-40",
          isExpanded ? "w-[220px]" : "w-[68px]",
        )}
        style={{
          background: "var(--abyssal-blue)",
          borderColor: "var(--border-default)",
        }}
      >
        {/* Grain texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.025] z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Gold edge line */}
        {/* <div aria-hidden className="pointer-events-none absolute right-0 top-10 bottom-10 w-px z-10 opacity-20"
          style={{ background: "linear-gradient(180deg, transparent 0%, var(--accent-gold) 30%, var(--accent-gold) 70%, transparent 100%)" }}
        /> */}

        <SidebarHeader
          isExpanded={isExpanded}
          isPinned={isPinned}
          onTogglePin={togglePin}
        />
        <SidebarNav isExpanded={isExpanded} />
        <SidebarFooter isExpanded={isExpanded} />
      </aside>
    </TooltipProvider>
  );
}
