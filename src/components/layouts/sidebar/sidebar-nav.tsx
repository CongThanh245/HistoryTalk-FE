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

function NavItem({
  item,
  isExpanded,
  href,
  onNavigate,
}: {
  item: SidebarMenuItem;
  isExpanded: boolean;
  href: string;
  onNavigate: () => void;
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
      href={href}
      onClick={(event) => {
        if (pathname === item.href && (item.href === "/characters" || item.href === "/events")) {
          event.preventDefault();
        }
        onNavigate();
      }}
      className={cn(
        "relative flex group items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 outline-none",
        isExpanded ? "px-3 py-2" : "w-10 h-10 justify-center mx-auto",
        !isActive &&
          "hover:bg-[var(--sidebar-hover-bg,rgba(255,255,255,0.05))] hover:text-[var(--sidebar-active-text)] text-[var(--sidebar-nav-text)]",
        isActive && "bg-accent-gold-active text-[var(--sidebar-active-text)]",
      )}
    >
      <Icon
        className={cn(
          "shrink-0 w-[17px] h-[17px]",
          isActive ? "text-[var(--sidebar-active-text)]" : "text-[var(--sidebar-nav-icon)] group-hover:text-[var(--sidebar-active-text)]"
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
  catalogUrls,
  onRememberCatalogUrl,
}: {
  isExpanded: boolean;
  sections: SidebarSection[];
  catalogUrls: Partial<Record<CatalogPath, string>>;
  onRememberCatalogUrl: (path: CatalogPath, url: string) => void;
}) {
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
              <NavItem
                key={item.href}
                item={item}
                isExpanded={isExpanded}
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
