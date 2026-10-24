"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SidebarQuickMenu as QuickMenu } from "@/routers/sidebar";

/** "Tạo" / "Bắt đầu" button above the nav: one menu of everything the user can make or start, each with a one-line hint. */
export default function SidebarQuickMenu({
  menu,
  isExpanded,
  onOpenChange,
  onNavigate,
}: {
  menu: QuickMenu;
  isExpanded: boolean;
  onOpenChange?: (open: boolean) => void;
  onNavigate?: () => void;
}) {
  return (
    <div className={cn("relative z-10 shrink-0 pb-2 pt-1", isExpanded ? "px-3" : "px-2")}>
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={menu.label}
            title={isExpanded ? undefined : menu.label}
            className={cn(
              "group inline-flex items-center gap-2 rounded-full border border-border-card bg-[var(--bg-elevated)] text-sm font-semibold text-[var(--text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-[box-shadow,border-color] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] data-[state=open]:border-[var(--border-strong)]",
              isExpanded ? "h-10 pl-1 pr-4" : "mx-auto h-10 w-10 justify-center",
            )}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--accent-gold)] text-white transition-transform group-data-[state=open]:rotate-45">
              <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            </span>
            {isExpanded && menu.label}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={isExpanded ? "bottom" : "right"}
          align="start"
          sideOffset={8}
          className="z-[1100] w-[340px] rounded-xl border border-border-card bg-[var(--bg-elevated)] p-2 text-[var(--text-primary)] shadow-[var(--shadow-strong)]"
        >
          {menu.items.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem
                key={item.href}
                asChild
                className="cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 focus:bg-[var(--status-neutral-bg)]"
              >
                <Link href={item.href} onClick={onNavigate}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--status-neutral-bg)] text-[var(--text-secondary)]">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold leading-snug text-[var(--text-primary)]">{item.label}</span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-[var(--text-tertiary)]">{item.description}</span>
                  </span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
