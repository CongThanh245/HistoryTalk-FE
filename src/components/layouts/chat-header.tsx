"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { UserProfileDropdown } from "./user-profile-dropdown";
import { ThemeToggle } from "./theme-toggle";

export default function ChatHeader() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  return (
    <header
      className="h-14 w-full border-b flex items-center justify-between px-3 shrink-0 bg-header-bg border-[var(--text-primary)]"
    >
      <div className="flex items-center gap-3">
        {/* Back button */}
        <button
          onClick={() => router.push("/home")}
          className="flex items-center justify-center w-9 h-9 rounded-[2px] border border-transparent transition-colors hover:border-[var(--text-primary)] active:scale-95 text-header-text"
          aria-label="Quay lại trang chủ"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Page title */}
        <span className="font-display text-lg font-extrabold uppercase tracking-[0.02em] text-header-text">
          Chat
        </span>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        {user ? (
          <UserProfileDropdown showDiscovery={false} />
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] rounded-[2px] border transition-colors active:scale-95 text-header-text border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]"
          >
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
}
