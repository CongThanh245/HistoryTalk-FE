"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { TooltipProvider } from "@/components/ui/tooltip";
import SidebarHeader from "./sidebar-header";
import SidebarNav from "./sidebar-nav";
import SidebarFooter from "./sidebar-footer";
import SidebarQuickMenu from "./sidebar-quick-menu";
import SidebarUser from "./sidebar-user";
import type { CatalogPath } from "./sidebar-nav";
import type { SidebarQuickMenu as QuickMenu, SidebarSection } from "@/routers/sidebar";
import { useSidebar } from "./sidebar-context";

export default function Sidebar({
  sections,
  quickMenu,
  showUpgrade = true,
  logoHref = "/",
}: {
  sections: SidebarSection[];
  /** "Tạo" / "Bắt đầu" menu above the nav; omitted for roles with nothing to start from here. */
  quickMenu?: QuickMenu;
  showUpgrade?: boolean;
  logoHref?: string;
}) {
  const [isPinned, setIsPinned] = useState(true);
  const [isTablet, setIsTablet] = useState(false);
  const [catalogUrls, setCatalogUrls] = useState<Partial<Record<CatalogPath, string>>>({});
  // Collapsed means collapsed: no hover expansion. Expanding on hover either shoved the page sideways or, as an
  // overlay, covered its left edge whenever the pointer brushed past. Icons carry tooltips; » expands for good.
  // On tablet (md–lg) always icon-only.
  const isDesktopExpanded = isTablet ? false : isPinned;

  // Mobile drawer state from context
  const { isMobileOpen, closeMobileSidebar } = useSidebar();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem("ht-sidebar-pinned");
        if (saved !== null) setIsPinned(JSON.parse(saved));
      } catch {}
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  // Close mobile drawer on route change / resize past md; track tablet range
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      if (w >= 768) closeMobileSidebar();
      setIsTablet(w >= 768 && w < 1024);
    };
    onResize();
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

  const rememberCatalogUrl = (path: CatalogPath, url: string) => {
    setCatalogUrls((current) => current[path] === url ? current : { ...current, [path]: url });
  };

  const sidebarContent = (isExpanded: boolean) => (
    <aside
      className={cn(
        "sidebar-ink relative h-[100dvh] flex flex-col transition-all duration-250 ease-in-out select-none shrink-0 border-r z-40 bg-[var(--sidebar-bg)] border-sidebar-border",
        isExpanded ? "w-60" : "w-16",
      )}
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
      {quickMenu && (
        <SidebarQuickMenu menu={quickMenu} isExpanded={isExpanded} onNavigate={closeMobileSidebar} />
      )}
      <SidebarNav
        isExpanded={isExpanded}
        sections={sections}
        catalogUrls={catalogUrls}
        onRememberCatalogUrl={rememberCatalogUrl}
        onNavigate={closeMobileSidebar}
      />
      <SidebarFooter isExpanded={isExpanded} showUpgrade={showUpgrade} />
      <SidebarUser isExpanded={isExpanded} />
    </aside>
  );

  return (
    <TooltipProvider delayDuration={0}>
      {/* ── Mobile drawer (< md) ── */}
      <div className="md:hidden">
        {/* Backdrop */}
        {isMobileOpen && (
          <div
            // Above the sticky page header (z-50), so the drawer and its logo are not covered.
            className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm"
            onClick={closeMobileSidebar}
            aria-hidden
          />
        )}

        {/* Drawer */}
        <div
          className={cn(
            "fixed top-0 left-0 h-full z-[60] transition-transform duration-300 ease-in-out",
            isMobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {sidebarContent(true)}
        </div>
      </div>

      {/* ── Desktop sidebar (≥ md) ── */}
      <div className="hidden md:block">{sidebarContent(isDesktopExpanded)}</div>
    </TooltipProvider>
  );
}
