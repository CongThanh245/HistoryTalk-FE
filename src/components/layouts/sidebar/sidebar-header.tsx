"use client";

import { ScrollIcon, PushPinIcon, PushPinSlashIcon } from "@phosphor-icons/react";
import Link from "next/link"; // 1. Import Link
import { cn } from "@/lib/utils/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarHeaderProps {
  isExpanded: boolean;
  isPinned: boolean;
  onTogglePin: () => void;
}

export default function SidebarHeader({ isExpanded, isPinned, onTogglePin }: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        "relative z-10 h-16 flex items-center shrink-0 border-b overflow-hidden",
        isExpanded ? "px-4 gap-3" : "justify-center"
      )}
      style={{ borderColor: "var(--border-default)" }}
    >
      {/* 2. Bọc Logo và Brand name trong Link */}
      <Link 
        href="/" 
        className={cn(
          "flex items-center outline-none transition-opacity hover:opacity-80",
          isExpanded ? "flex-1 gap-3 overflow-hidden" : ""
        )}
      >
        {/* Logo icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
            boxShadow: "var(--shadow-gold)",
          }}
        >
          <ScrollIcon className="w-4 h-4" style={{ color: "var(--bg-deep)" }} />
        </div>

        {/* Brand name */}
        {isExpanded && (
          <span
            className="text-[15px] font-bold tracking-wide truncate"
            style={{
              background: "linear-gradient(90deg, var(--accent-gold) 0%, var(--accent-gold-soft) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontFamily: "'Georgia', 'Times New Roman', serif",
            }}
          >
            HistoryTalk
          </span>
        )}
      </Link>

      {/* PushPinIcon button — Giữ nguyên bên ngoài Link để tránh click nhầm */}
      {isExpanded && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onTogglePin}
              aria-label={isPinned ? "Bỏ ghim sidebar" : "Ghim sidebar"}
              className="w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 cursor-pointer shrink-0"
              style={{
                color: isPinned ? "var(--sidebar-pin-active)" : "var(--sidebar-pin-inactive)",
                background: isPinned ? "var(--accent-gold-active-bg)" : "transparent",
              }}
            >
              {isPinned ? <PushPinIcon className="w-3.5 h-3.5" /> : <PushPinSlashIcon className="w-3.5 h-3.5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
              fontSize: 12,
            }}
          >
            {isPinned ? "Bỏ ghim sidebar" : "Ghim sidebar"}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}