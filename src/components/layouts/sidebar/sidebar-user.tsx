"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { EllipsisVertical } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { displayName } from "@/features/auth/display-name";
import { useAuthStore } from "@/store/auth.store";
import { UserProfileDropdown } from "../user-profile-dropdown";

function initialsOf(name: string) {
  return (
    name
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

type CardProps = ComponentPropsWithoutRef<"button"> & { isExpanded: boolean };

/** The trigger: avatar, name and email, with a kebab hinting at the menu. Forwards ref/props so Radix can own it. */
const UserCard = forwardRef<HTMLButtonElement, CardProps>(function UserCard({ isExpanded, className, ...props }, ref) {
  const user = useAuthStore((s) => s.user);
  const name = displayName(user, "");
  return (
    <button
      ref={ref}
      type="button"
      aria-label="Tài khoản"
      title={isExpanded ? undefined : name}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg text-left transition-colors hover:bg-[var(--sidebar-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] data-[state=open]:bg-[var(--sidebar-hover-bg)]",
        isExpanded ? "px-2 py-2" : "mx-auto h-10 w-10 justify-center",
        className,
      )}
      {...props}
    >
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={user?.avatarUrl ?? undefined} alt="" />
        <AvatarFallback className="bg-[var(--accent-gold)] text-sm font-semibold text-white">{initialsOf(name)}</AvatarFallback>
      </Avatar>
      {isExpanded && (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{name || "—"}</span>
            <span className="block truncate text-xs text-[var(--text-muted)]">{user?.email ?? ""}</span>
          </span>
          <EllipsisVertical className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
        </>
      )}
    </button>
  );
});

/** Bottom of the sidebar: who is signed in, opening the account menu (profile, theme, sign out). */
export default function SidebarUser({ isExpanded, onOpenChange }: { isExpanded: boolean; onOpenChange?: (open: boolean) => void }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  return (
    <div className={cn("relative z-10 shrink-0 border-t border-border-default py-2", isExpanded ? "px-3" : "px-2")}>
      <UserProfileDropdown
        side={isExpanded ? "top" : "right"}
        align={isExpanded ? "start" : "end"}
        showDiscovery={false}
        onOpenChange={onOpenChange}
        trigger={<UserCard isExpanded={isExpanded} />}
      />
    </div>
  );
}
