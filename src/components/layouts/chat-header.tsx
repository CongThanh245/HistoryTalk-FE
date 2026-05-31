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
      className="h-14 w-full border-b flex items-center justify-between px-3 shrink-0"
      style={{
        background: "var(--header-bg)",
        borderColor: "var(--header-border)",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Back button */}
        <button
          onClick={() => router.push("/home")}
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-white/5 active:scale-95"
          style={{ color: "var(--header-text)" }}
          aria-label="Quay lại trang chủ"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Page title */}
        <span className="font-semibold text-sm" style={{ color: "var(--header-text)" }}>
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
            className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors active:scale-95"
            style={{
              color: "var(--header-text)",
              borderColor: "var(--header-border)",
            }}
          >
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
}
