// sidebar-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type SidebarSection, type SidebarMenuItem } from "@/routers/sidebar";

function NavItem({
  item,
  isExpanded,
}: {
  item: SidebarMenuItem;
  isExpanded: boolean;
}) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive = item.exact
    ? pathname === item.href
    : item.href === "/"
    ? pathname === "/"
    : pathname.startsWith(item.href);


  const linkEl = (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 outline-none",
        isExpanded ? "px-3 py-2" : "w-10 h-10 justify-center mx-auto",
        !isActive &&
          "hover:bg-[var(--sidebar-hover-bg,rgba(255,255,255,0.05))] hover:text-[var(--sidebar-active-text)] text-[var(--sidebar-nav-text)]",
        isActive && "bg-accent-gold-active text-[var(--sidebar-active-text)]",
      )}
    >
      {isActive && isExpanded && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[22px] rounded-r-full bg-linear-to-b from-accent-gold-soft to-[var(--truffle)] shadow-[0_0_8px_var(--accent-gold-glow)]"
        />
      )}
      {isActive && !isExpanded && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[18px] rounded-r-full bg-linear-to-b from-accent-gold-soft to-[var(--truffle)]"
        />
      )}
      <Icon
        className={cn(
          "shrink-0 w-[17px] h-[17px]",
          isActive ? "text-[var(--sidebar-active-text)]" : "text-[var(--sidebar-nav-icon)]"
        )}
      />
      {isExpanded && (
        <span className="truncate leading-normal whitespace-nowrap">
          {item.label}
        </span>
      )}
    </Link>
  );

  if (!isExpanded) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
        <TooltipContent
          side="right"
          className="bg-bg-elevated border border-border-default text-text-primary text-xs"
        >
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }
  return linkEl;
}

export default function SidebarNav({
  isExpanded,
  sections,
}: {
  isExpanded: boolean;
  sections: SidebarSection[];
}) {
  return (
    <nav className="relative z-10 flex-1 overflow-hidden py-4 space-y-4">
      {sections.map((section) => (
        <div key={section.title} className={cn(isExpanded ? "px-3" : "px-2")}>
          {isExpanded ? (
            <p
              className="mb-1.5 px-2 text-[10px] font-semibold tracking-[0.14em] uppercase text-[var(--sidebar-section-label)]"
            >
              {section.title}
            </p>
          ) : (
            <div
              className="mb-2 mx-auto h-px w-6 bg-border-default"
            />
          )}
          <div className="space-y-2">
            {section.items.map((item) => (
              <NavItem key={item.href} item={item} isExpanded={isExpanded} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
