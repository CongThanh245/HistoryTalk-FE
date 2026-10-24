"use client";

import { SearchInputWithSuggestions } from "@/components/commons/search-input-with-suggestions";
import Breadcrumbs from "@/components/commons/breadcrumbs";
import { useAuthStore } from "@/store/auth.store";
import { MagneticButton } from "../commons/MagneticButton";
import { useSidebar } from "./sidebar/sidebar-context";

/**
 * One slim bar above the page: where you are (breadcrumbs) on the left, search on the right.
 * The account menu and theme switch live at the bottom of the sidebar.
 */
export default function Header({ showSearch = true }: { showSearch?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const { toggleMobileSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-50 h-14 w-full shrink-0 border-b border-[var(--border-default)] bg-header-bg backdrop-blur-md">
      <div className="flex h-full items-center gap-3 px-3 md:px-6">
        {/* Mobile hamburger — opens sidebar drawer */}
        <button
          onClick={toggleMobileSidebar}
          aria-label="Mở menu"
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-sm transition-colors shrink-0 text-header-text-muted hover:bg-[var(--sidebar-hover-bg)] hover:text-header-text"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
            <path d="M2 4.5h14M2 9h14M2 13.5h14" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <Breadcrumbs inline />
        </div>

        {showSearch && (
          <div className="hidden md:flex w-full max-w-sm shrink">
            <SearchInputWithSuggestions placeholder="Tìm sự kiện, nhân vật..." />
          </div>
        )}

        {!user && (
          <MagneticButton href="/login" variant="header" rounded="full" size="sm">
            Đăng nhập
          </MagneticButton>
        )}
      </div>
    </header>
  );
}
