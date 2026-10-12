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
 * so "/classes/materials" lights up "Tư liệu lớp & trường" and not also "Lớp học".
 */
function activeHrefFor(pathname: string, sections: SidebarSection[]) {
  let best: string | null = null;
  let bestLength = -1;
  for (const section of sections) {
    for (const item of section.items) {
      const path = pathOf(item.href);
      const matches = item.exact || path === "/" ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
      if (matches && path.length > bestLength) {
        best = item.href;
        bestLength = path.length;
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
        "relative flex group items-center gap-3 rounded-[2px] text-sm font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]",
        isExpanded ? "px-3 py-2" : "w-10 h-10 justify-center mx-auto",
        !isActive &&
          "hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--text-primary)] text-[var(--sidebar-nav-text)]",
        isActive && "bg-accent-gold-active text-[var(--sidebar-active-text)]",
      )}
    >
      <Icon
        className={cn(
          "shrink-0 w-[17px] h-[17px]",
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
}: {
  isExpanded: boolean;
  sections: SidebarSection[];
  catalogUrls: Partial<Record<CatalogPath, string>>;
  onRememberCatalogUrl: (path: CatalogPath, url: string) => void;
}) {
  const pathname = usePathname();
  const activeHref = activeHrefFor(pathname, sections);
  const rememberCurrentUrl = () => {
    const path = window.location.pathname;
    const url = catalogUrl(path, window.location.search);
    if (url) {
      onRememberCatalogUrl(path as CatalogPath, url);
    }
  };

  return (
    <nav className="relative z-10 flex-1 overflow-hidden py-4 space-y-4">
      {sections.map((section) => (
        <div key={section.title} className={cn(isExpanded ? "px-3" : "px-2")}>
          {isExpanded ? (
            <p
              className="mb-1.5 flex items-center gap-2 px-2 text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--sidebar-section-label)]"
            >
              <span className="truncate">{section.title}</span>
              {section.badge && (
                <span className="shrink-0 rounded-[2px] border border-current px-1 py-px text-[9px] leading-[1.3] tracking-[0.08em] text-[var(--text-primary)]">
                  {section.badge}
                </span>
              )}
            </p>
          ) : (
            <div
              className="mb-2 mx-auto h-px w-6 bg-border-default"
            />
          )}
          <div className="space-y-2">
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
