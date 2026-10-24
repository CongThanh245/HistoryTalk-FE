// sidebar-nav.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type SidebarSection, type SidebarMenuItem } from "@/routers/sidebar";

export type CatalogPath = "/characters" | "/events";

function catalogUrl(pathname: string, query: string) {
  if (pathname !== "/characters" && pathname !== "/events") return null;
  const params = new URLSearchParams(query);
  const allowed = pathname === "/characters" ? ["era", "search", "page"] : ["view", "era"];
  const filters = new URLSearchParams();
  for (const key of allowed) {
    const value = params.get(key);
    if (value) filters.set(key, value);
  }
  const suffix = filters.toString();
  return suffix ? `${pathname}?${suffix}` : pathname;
}

/** Path part of a menu href ("/map?layer=class" → "/map"). */
const pathOf = (href: string) => href.split("?")[0];

/**
 * The one menu item that owns the current page: the longest href whose path matches it exactly or as a parent,
 * so "/classes/materials" lights up "Kho tư liệu" and not also "Lớp học".
 */
function activeHrefFor(pathname: string, sections: SidebarSection[]) {
  let best: string | null = null;
  let bestLength = -1;
  for (const section of sections) {
    for (const item of section.items) {
      for (const path of [pathOf(item.href), ...(item.activePaths ?? [])]) {
        const matches = item.exact || path === "/" ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
        if (matches && path.length > bestLength) {
          best = item.href;
          bestLength = path.length;
        }
      }
    }
  }
  return best;
}

function NavItem({
  item,
  isExpanded,
  isActive,
  href,
  onNavigate,
}: {
  item: SidebarMenuItem;
  isExpanded: boolean;
  isActive: boolean;
  href: string;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const Icon = item.icon;


  const linkEl = (
    <Link
      href={href}
      onClick={(event) => {
        if (pathname === item.href && (item.href === "/characters" || item.href === "/events")) {
          event.preventDefault();
        }
        onNavigate();
      }}
      className={cn(
        "relative flex group items-center gap-2.5 rounded-lg text-sm transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]",
        isExpanded ? "h-8 px-2.5" : "w-10 h-9 justify-center mx-auto",
        !isActive &&
          "font-medium hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--text-primary)] text-[var(--sidebar-nav-text)]",
        isActive && "font-semibold bg-accent-gold-active text-[var(--sidebar-active-text)]",
      )}
    >
      <Icon
        className={cn(
          "shrink-0 w-4 h-4",
          isActive ? "text-[var(--sidebar-active-text)]" : "text-[var(--sidebar-nav-icon)] group-hover:text-[var(--text-primary)]"
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
          className="bg-[var(--text-primary)] border border-[var(--text-primary)] text-[var(--text-inverse)] text-xs"
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
  catalogUrls,
  onRememberCatalogUrl,
  onNavigate,
}: {
  isExpanded: boolean;
  sections: SidebarSection[];
  catalogUrls: Partial<Record<CatalogPath, string>>;
  onRememberCatalogUrl: (path: CatalogPath, url: string) => void;
  /** Closes the mobile drawer once a page is picked. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const activeHref = activeHrefFor(pathname, sections);
  const rememberCurrentUrl = () => {
    const path = window.location.pathname;
    const url = catalogUrl(path, window.location.search);
    if (url) {
      onRememberCatalogUrl(path as CatalogPath, url);
    }
    onNavigate?.();
  };

  return (
    <nav className="relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-1 space-y-4 [scrollbar-width:none]">
      {sections.map((section) => (
        <div key={section.title} className={cn(isExpanded ? "px-2.5" : "px-2")}>
          {isExpanded ? (
            <p
              className="mb-1 flex items-center gap-2 px-2.5 text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--sidebar-section-label)]"
            >
              {section.brand && (
                <Image src="/solo-logo.png" alt="" width={14} height={14} unoptimized className="h-3.5 w-3.5 shrink-0 object-contain" />
              )}
              <span className="truncate">{section.title}</span>
            </p>
          ) : (
            <div
              className="mb-2 mx-auto h-px w-6 bg-border-default"
            />
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                isExpanded={isExpanded}
                isActive={item.href === activeHref}
                href={
                  item.href === "/characters" || item.href === "/events"
                    ? catalogUrls[item.href] ?? item.href
                    : item.href
                }
                onNavigate={rememberCurrentUrl}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
