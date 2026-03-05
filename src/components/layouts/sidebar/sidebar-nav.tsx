"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SIDEBAR_SECTIONS, type SidebarMenuItem } from "@/routers/sidebar";

function NavItem({
  item,
  isExpanded,
}: {
  item: SidebarMenuItem;
  isExpanded: boolean;
}) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive =
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

  const linkEl = (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 outline-none",
        isExpanded ? "px-3 py-2" : "w-10 h-10 justify-center mx-auto",
        !isActive &&
          "hover:bg-[var(--sidebar-hover-bg,rgba(255,255,255,0.05))] hover:text-[var(--sidebar-active-text)]",
      )}
      style={
        isActive
          ? {
              background: "var(--accent-gold-active-bg)",
              color: "var(--sidebar-active-text)",
            }
          : { color: "var(--sidebar-nav-text)" }
      }
    >
      {isActive && isExpanded && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[22px] rounded-r-full"
          style={{
            background:
              "linear-gradient(180deg, var(--accent-gold-soft) 0%, var(--truffle) 100%)",
            boxShadow: "0 0 8px var(--accent-gold-glow)",
          }}
        />
      )}
      {isActive && !isExpanded && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[18px] rounded-r-full"
          style={{
            background:
              "linear-gradient(180deg, var(--accent-gold-soft) 0%, var(--truffle) 100%)",
          }}
        />
      )}
      <Icon
        className="shrink-0"
        style={{
          width: 17,
          height: 17,
          color: isActive
            ? "var(--sidebar-active-text)"
            : "var(--sidebar-nav-icon)",
        }}
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
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
            fontSize: 12,
          }}
        >
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }
  return linkEl;
}

export default function SidebarNav({ isExpanded }: { isExpanded: boolean }) {
  return (
    <nav className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-4">
      {SIDEBAR_SECTIONS.map((section) => (
        <div key={section.title} className={cn(isExpanded ? "px-3" : "px-2")}>
          {isExpanded ? (
            <p
              className="mb-1.5 px-2 text-[10px] font-semibold tracking-[0.14em] uppercase"
              style={{ color: "var(--sidebar-section-label)" }}
            >
              {section.title}
            </p>
          ) : (
            <div
              className="mb-2 mx-auto h-px w-6"
              style={{ background: "var(--border-default)" }}
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
