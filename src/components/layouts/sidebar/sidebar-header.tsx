"use client";

import { ChevronsLeft, ChevronsRight, X } from "lucide-react";
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
  isPinned,
  onTogglePin,
  onClose,
  isMobileDrawer = false,
  logoHref = "/",
}: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        "relative z-10 h-16 flex items-center shrink-0 overflow-hidden",
        isExpanded ? "pl-3 pr-3 gap-2" : "justify-center",
      )}
    >
      {/* Logo + Brand name */}
      <Link
        href={logoHref}
        className={cn(
          "flex items-center outline-none transition-opacity hover:opacity-80",
          isExpanded ? "flex-1" : "",
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
          className="w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 cursor-pointer shrink-0 text-[var(--sidebar-pin-inactive)]"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Desktop: collapse (pinned open) / keep open (hover-expanded). Only when expanded and not in the mobile drawer. */}
      {isExpanded && !isMobileDrawer && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onTogglePin}
              aria-label={isPinned ? "Thu gọn thanh bên" : "Giữ thanh bên mở"}
              className="w-8 h-8 flex items-center justify-center rounded-md transition-colors duration-150 cursor-pointer shrink-0 text-[var(--text-muted)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
            >
              {isPinned ? <ChevronsLeft className="w-[18px] h-[18px]" /> : <ChevronsRight className="w-[18px] h-[18px]" />}
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="bg-bg-elevated border border-border-default text-text-primary text-xs"
          >
            {isPinned ? "Thu gọn thanh bên" : "Giữ thanh bên mở"}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
