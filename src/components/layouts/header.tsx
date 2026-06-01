"use client";

import { Bell } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/commons/search-input";
import { useAuthStore } from "@/store/auth.store";
import { GreetingSection } from "../home/greeting-section";
import { MagneticButton } from "../commons/MagneticButton";
import { useSidebar } from "./sidebar/sidebar-context";
import { UserProfileDropdown } from "./user-profile-dropdown";
import { ThemeToggle } from "./theme-toggle";
import { usePathname } from "next/navigation";

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const { toggleMobileSidebar } = useSidebar();
  const pathname = usePathname();

  // Chat has a dedicated full-screen header inside ChatMain.
  if (pathname?.startsWith("/chat")) return null;

  return (
    <header
      className="sticky top-0 z-50 h-16 w-full border-b"
      style={{
        background: "var(--header-bg)",
        borderColor: "var(--header-border)",
      }}
    >
      <div className="flex h-full items-center justify-between px-3 md:px-6 gap-4">
        {/* Mobile hamburger — opens sidebar drawer */}
        <button
          onClick={toggleMobileSidebar}
          aria-label="Open menu"
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border transition-colors shrink-0"
          style={{
            color: "var(--header-text-muted)",
            borderColor: "var(--header-border)",
            background: "transparent",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
            <path d="M2 4.5h14M2 9h14M2 13.5h14" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Search — hidden on mobile, visible on md+ */}
        <div className="hidden md:flex flex-1 max-w-md">
          <SearchInput
            value=""
            onChange={() => {}}
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

              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full h-9 w-9 cursor-pointer"
                style={{ color: "var(--header-text-muted)" }}
              >
                <Bell className="h-[18px] w-[18px]" />
                <span
                  className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full ring-2 ring-[--header-bg]"
                  style={{ background: "var(--accent-danger)" }}
                />
              </Button>

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
