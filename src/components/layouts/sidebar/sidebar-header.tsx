"use client";

import { Pin, PinOff, X } from "lucide-react";
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
        "relative z-10 h-16 flex items-center shrink-0 border-b overflow-hidden border-border-default",
        isExpanded ? "px-4 gap-3" : "justify-center",
      )}
    >
      {/* Logo + Brand name */}
      <Link
        href={logoHref}
        className={cn(
          "flex items-center outline-none transition-opacity hover:opacity-80",
          isExpanded ? "flex-1 justify-center" : "",
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

      {/* Desktop: PushPin button — only when expanded and not in mobile drawer */}
      {isExpanded && !isMobileDrawer && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onTogglePin}
              aria-label={isPinned ? "Bỏ ghim sidebar" : "Ghim sidebar"}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 cursor-pointer shrink-0",
                isPinned
                  ? "text-[var(--sidebar-pin-active)] bg-accent-gold-active"
                  : "text-[var(--sidebar-pin-inactive)] bg-transparent"
              )}
            >
              {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="bg-bg-elevated border border-border-default text-text-primary text-xs"
          >
            {isPinned ? "Bỏ ghim sidebar" : "Ghim sidebar"}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
