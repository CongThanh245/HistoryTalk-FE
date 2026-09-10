"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { SearchInputWithSuggestions } from "@/components/commons/search-input-with-suggestions";
import { useAuthStore } from "@/store/auth.store";
import { GreetingSection } from "../home/greeting-section";
import { MagneticButton } from "../commons/MagneticButton";
import { useSidebar } from "./sidebar/sidebar-context";
import { UserProfileDropdown } from "./user-profile-dropdown";
import { ThemeToggle } from "./theme-toggle";

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const { toggleMobileSidebar } = useSidebar();
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    // The scroll container is the <main> element with overflow-y-auto
    const scrollEl = document.querySelector("main");
    if (!scrollEl) return;
    const onScroll = () => {
      setIsCompact(scrollEl.scrollTop > 10);
    };
    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-header-border backdrop-blur-md bg-header-bg/80 transition-[height] duration-200 ease-in-out",
        isCompact ? "h-12" : "h-16",
      )}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        {/* Mobile hamburger — opens sidebar drawer */}
        <button
          onClick={toggleMobileSidebar}
          aria-label="Open menu"
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border transition-colors shrink-0 text-header-text-muted border-header-border bg-transparent"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
            <path d="M2 4.5h14M2 9h14M2 13.5h14" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Search — hidden on mobile, visible on md+ */}
        <div className="hidden md:flex flex-1 max-w-md">
          <SearchInputWithSuggestions
            placeholder="Tìm kiếm sự kiện, nhân vật..."
          />
        </div>

        {/* Spacer on mobile so auth section pushes right */}
        <div className="flex-1 md:hidden" />

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />

          {user ? (
            /* --- TRẠNG THÁI ĐÃ ĐĂNG NHẬP --- */
            <>
              <GreetingSection />

              <UserProfileDropdown showDiscovery={false} />
            </>
          ) : (
            /* --- TRẠNG THÁI CHƯA ĐĂNG NHẬP --- */
            <MagneticButton
              href="/login"
              variant="header"
              rounded="full"
              size="sm"
            >
              Đăng nhập
            </MagneticButton>
          )}
        </div>
      </div>
    </header>
  );
}
