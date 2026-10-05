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
import { ROLE_LABELS, type Role } from "@/constants/roles";
import { useEntitlements } from "@/features/saas/entitlements";
import { useTodayQuota } from "@/features/saas/quota-bonus";

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

  // School accounts (Teacher / School Student / School Admin) never buy plans, so no PRO styling or upsell.
  const entitlements = useEntitlements();
  const isSchoolAccount = entitlements.mode === "B2B";
  const todayQuota = useTodayQuota();
  const proUser = entitlements.canPurchase && isPro(profile ?? null);
  const roleLabel = user?.role ? (ROLE_LABELS[user.role as Role] ?? user.role) : null;

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
            "relative h-9 w-9 rounded-full p-0 cursor-pointer outline-none hover:bg-transparent active:scale-95 transition-all duration-200",
            className
          )}
        >
          {/* PRO: vòng đỏ bao quanh avatar */}
          {proUser && (
            <span
              className="absolute inset-0 rounded-full pointer-events-none z-10 shadow-[0_0_0_2px_var(--accent-gold)]"
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
              className="text-xs font-bold bg-[var(--text-primary)] text-[var(--text-inverse)]"
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
          "w-56 border p-1 bg-bg-elevated text-text-primary rounded-[2px] shadow-[var(--shadow-soft)]",
          proUser ? "border-t-2 border-[var(--text-primary)] border-t-accent-gold" : "border-[var(--text-primary)]"
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
              <p className="archive-title is-plain text-base leading-[1.3] truncate">
                {user?.userName ?? "—"}
              </p>
            </div>
            <p
              className="text-[11px] leading-none text-text-muted"
            >
              {user?.email ?? "—"}
            </p>
            {roleLabel && (
              <span className="mt-1 inline-flex w-fit items-center rounded-[2px] border border-[var(--border-strong)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                {roleLabel}
              </span>
            )}
            {/* School package + today's quota (Teacher / School Student) */}
            {isSchoolAccount && (
              <div className="mt-1.5 space-y-1">
                <p className="text-[11px] leading-[1.35] text-text-secondary">
                  Gói của trường: {entitlements.planLabel}
                </p>
                {todayQuota && (
                  <p className="text-[11px] leading-[1.35] tabular-nums text-text-muted">
                    Hạn mức hôm nay{" "}
                    <span className="font-semibold text-[var(--gold-leaf)]">
                      {todayQuota.used.toLocaleString("vi-VN")} / {todayQuota.quota.toLocaleString("vi-VN")}
                    </span>{" "}
                    · reset 00:00
                  </p>
                )}
              </div>
            )}
            {/* PRO tier label */}
            {proUser && profile?.tierTitle && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] mt-1 px-1.5 py-0.5 rounded-[2px] w-fit text-white bg-accent-gold"
              >
                ✦ {profile.tierTitle}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator
          className="-mx-1 bg-[var(--border-default)]"
        />

        <div>
          {showDiscovery && (
            <DropdownMenuItem 
              className="cursor-pointer mx-1 rounded-[2px] px-2 py-2 text-sm font-medium focus:bg-[var(--text-primary)] focus:text-[var(--text-inverse)] transition-colors" 
              asChild
            >
              <Link href="/home" className="flex items-center w-full">
                Khám phá
              </Link>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            className="cursor-pointer mx-1 rounded-[2px] px-2 py-2 text-sm font-medium focus:bg-[var(--text-primary)] focus:text-[var(--text-inverse)] transition-colors" 
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
          className="-mx-1 my-1 bg-[var(--border-default)]"
        />
        
        <DropdownMenuItem
          className="cursor-pointer mx-1 my-1 rounded-[2px] px-2 py-2 text-sm font-semibold focus:bg-accent-danger focus:!text-white transition-colors text-accent-danger"
          disabled={isPending}
          onClick={() => logout()}
        >
          {isPending ? "Đang đăng xuất..." : "Đăng xuất"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
