"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { TooltipProvider } from "@/components/ui/tooltip";
import SidebarHeader from "./sidebar-header";
import SidebarNav from "./sidebar-nav";
import SidebarFooter from "./sidebar-footer";
import { SidebarSection } from "@/routers/sidebar";
import { useSidebar } from "./sidebar-context";

export default function Sidebar({ sections, showUpgrade = true, logoHref = "/" }: { sections: SidebarSection[]; showUpgrade?: boolean; logoHref?: string }) {
  const [isPinned, setIsPinned] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = localStorage.getItem("ht-sidebar-pinned");
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDesktopExpanded = isPinned || isHovered;

  // Mobile drawer state from context
  const { isMobileOpen, closeMobileSidebar } = useSidebar();

  // Close mobile drawer on route change / resize past md
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) closeMobileSidebar();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [closeMobileSidebar]);

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

  const sidebarContent = (isExpanded: boolean) => (
    <aside
      className={cn(
        "relative h-screen flex flex-col transition-all duration-250 ease-in-out select-none shrink-0 border-r z-40",
        isExpanded ? "w-[220px]" : "w-[68px]",
      )}
      style={{
        background: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
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

      <SidebarHeader
        isExpanded={isExpanded}
        isPinned={isPinned}
        onTogglePin={togglePin}
        onClose={closeMobileSidebar}
        isMobileDrawer={isMobileOpen}
        logoHref={logoHref}
      />
      <SidebarNav isExpanded={isExpanded} sections={sections} />
      <SidebarFooter isExpanded={isExpanded} showUpgrade={showUpgrade} />
    </aside>
  );

  return (
    <TooltipProvider delayDuration={0}>
      {/* ── Mobile drawer (< md) ── */}
      <div className="md:hidden">
        {/* Backdrop */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={closeMobileSidebar}
            aria-hidden
          />
        )}

        {/* Drawer */}
        <div
          className={cn(
            "fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-in-out",
            isMobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {sidebarContent(true)}
        </div>
      </div>

      {/* ── Desktop sidebar (≥ md) ── */}
      <div
        className="hidden md:block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {sidebarContent(isDesktopExpanded)}
      </div>
    </TooltipProvider>
  );
}
