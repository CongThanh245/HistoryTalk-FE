"use client";

import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BrandLogo } from "@/components/commons/brand-logo";

interface SidebarHeaderProps {
  isExpanded: boolean;
  isPinned: boolean;
  onTogglePin: () => void;
  /** Called when the mobile × button is pressed */
  onClose?: () => void;
  /** True when rendered inside the mobile drawer */
  isMobileDrawer?: boolean;
  /** URL khi click vào logo, mặc định "/" */
  logoHref?: string;
}

export default function SidebarHeader({
  isExpanded,
  onTogglePin,
  onClose,
  isMobileDrawer = false,
  logoHref = "/",
}: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        "relative z-10 flex items-center shrink-0 overflow-hidden",
        // Expanded: logo centred, the collapse button on the right edge so it does not push the logo aside.
        // Collapsed: logo with the expand button right under it, both always visible.
        isExpanded ? "h-16 justify-center px-11" : "flex-col justify-center gap-1 pt-3 pb-2",
      )}
    >
      {/* Logo + Brand name */}
      <Link
        href={logoHref}
        className={cn(
          "flex items-center justify-center outline-none transition-opacity hover:opacity-80",
          !isExpanded && "h-10",
        )}
      >
        <BrandLogo
          priority
          isCollapsed={!isExpanded}
        />
      </Link>

      {/* Mobile: × close button */}
      {isMobileDrawer && onClose && (
        <button
          onClick={onClose}
          aria-label="Đóng menu"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 cursor-pointer text-[var(--sidebar-pin-inactive)]"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Desktop, collapsed: an always-visible open/close toggle (the sidebar no longer expands on hover).
          Hidden on tablet, which is always icon-only. */}
      {!isExpanded && !isMobileDrawer && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onTogglePin}
              aria-label="Mở rộng thanh bên"
              className="hidden h-8 w-8 items-center justify-center rounded-md transition-colors duration-150 cursor-pointer text-[var(--text-muted)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] lg:flex"
            >
              <PanelLeftOpen className="w-[18px] h-[18px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-bg-elevated border border-border-default text-text-primary text-xs">
            Mở rộng thanh bên
          </TooltipContent>
        </Tooltip>
      )}

      {/* Desktop, expanded: collapse it. Not in the mobile drawer. */}
      {isExpanded && !isMobileDrawer && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onTogglePin}
              aria-label="Thu gọn thanh bên"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md transition-colors duration-150 cursor-pointer text-[var(--text-muted)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
            >
              <PanelLeftClose className="w-[18px] h-[18px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="bg-bg-elevated border border-border-default text-text-primary text-xs"
          >
            Thu gọn thanh bên
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
