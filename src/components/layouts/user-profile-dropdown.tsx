"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/features/auth/hooks";
import { useAuthStore } from "@/store/auth.store";
import { useProfile } from "@/features/profile/hooks";
import { isPro } from "@/services/user.service";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { CrownIcon } from "lucide-react";

interface UserProfileDropdownProps {
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  showDiscovery?: boolean;
  showPremium?: boolean;
  showBorder?: boolean;
}

export function UserProfileDropdown({
  align = "end",
  side = "bottom",
  className,
  showDiscovery = true,
  showPremium = true,
  showBorder = true,
}: UserProfileDropdownProps) {
  const { mutate: logout, isPending } = useLogout();
  const user = useAuthStore((s) => s.user);
  const { data: profile } = useProfile();

  const proUser = isPro(profile ?? null);

  if (!user) return null;

  const initials = user.userName
    ? user.userName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "relative h-9 w-9 rounded-full p-0 cursor-pointer outline-none hover:bg-black/5 active:scale-95 transition-all duration-200",
            className
          )}
        >
          {/* PRO: vòng sáng vàng bao quanh avatar */}
          {proUser && (
            <span
              className="absolute inset-0 rounded-full pointer-events-none z-10 shadow-[0_0_0_2px_var(--accent-gold),0_0_10px_2px_var(--accent-gold-glow,rgba(201,162,77,0.5))]"
            />
          )}
          <Avatar
            className={cn(
              "h-9 w-9 transition-transform duration-200",
              showBorder ? "border" : "border-0",
              proUser ? "border-accent-gold" : "border-header-border"
            )}
          >
            <AvatarImage
              src={user?.avatarUrl ?? undefined}
              alt={user?.userName}
            />
            <AvatarFallback
              className="text-xs font-bold bg-linear-[135deg] from-accent-gold to-[var(--truffle)] text-bg-deep"
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        side={side}
        className={cn(
          "w-56 border p-1 bg-bg-elevated text-text-primary rounded-[14px]",
          proUser
            ? "border-accent-gold/35 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5),0_0_0_1px_rgba(201,162,77,0.1)]"
            : "border-border-strong shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]"
        )}
      >
        <DropdownMenuLabel className="font-normal px-2.5 py-3">
          <div className="flex flex-col space-y-1">
            {/* Tên + PRO Crown */}
            <div className="flex items-center gap-1.5">
              {proUser && (
                <CrownIcon
                  className="w-3.5 h-3.5 shrink-0 text-accent-gold"
                />
              )}
              <p className="text-sm font-semibold leading-none truncate text-text-primary">
                {user?.userName ?? "—"}
              </p>
            </div>
            <p
              className="text-[11px] leading-none text-text-muted"
            >
              {user?.email ?? "—"}
            </p>
            {/* PRO tier label */}
            {proUser && profile?.tierTitle && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded-md w-fit text-accent-gold bg-linear-to-r from-accent-gold/18 to-[rgba(163,81,57,0.12)] border border-accent-gold/25"
              >
                ✦ {profile.tierTitle}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator
          className="-mx-1 bg-white/[0.08]"
        />

        <div>
          {showDiscovery && (
            <DropdownMenuItem 
              className="cursor-pointer mx-1 rounded-lg px-2 py-2 text-sm font-medium focus:bg-accent-blue focus:text-bg-main transition-colors" 
              asChild
            >
              <Link href="/home" className="flex items-center w-full">
                Khám phá
              </Link>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            className="cursor-pointer mx-1 rounded-lg px-2 py-2 text-sm font-medium focus:bg-accent-blue focus:text-bg-main transition-colors" 
            asChild
          >
            <Link href="/profile" className="flex items-center w-full">
              Hồ sơ
            </Link>
          </DropdownMenuItem>
          
          {/* MVP: Ẩn Cài đặt
          <DropdownMenuItem className="cursor-pointer mx-1 rounded-lg px-2 py-2 text-sm font-medium focus:bg-[var(--accent-blue)] focus:text-[var(--bg-main)] transition-colors">
            Cài đặt
          </DropdownMenuItem>
          */}
        </div>
        
        <DropdownMenuSeparator
          className="-mx-1 my-1 bg-white/[0.08]"
        />
        
        <DropdownMenuItem
          className="cursor-pointer mx-1 my-1 rounded-lg px-2 py-2 text-sm font-semibold focus:bg-accent-danger focus:!text-white transition-colors text-accent-danger"
          disabled={isPending}
          onClick={() => logout()}
        >
          {isPending ? "Đang đăng xuất..." : "Đăng xuất"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
