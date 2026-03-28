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
import { Badge } from "@/components/ui/badge";
import { useLogout } from "@/features/auth/hooks";
import { useAuthStore } from "@/store/auth.store";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

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
          <Avatar
            className={cn(
              "h-9 w-9 transition-transform duration-200",
              showBorder ? "border" : "border-0"
            )}
            style={{ borderColor: "var(--header-border)" }}
          >
            <AvatarImage
              src={user?.avatarUrl ?? "/api/placeholder/36/36"}
              alt={user?.userName}
            />
            <AvatarFallback
              className="text-xs font-bold"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
                color: "var(--bg-deep)",
              }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        side={side}
        className="w-56 border p-1"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border-strong)",
          color: "var(--text-primary)",
          borderRadius: "14px",
          boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)",
        }}
      >
        <DropdownMenuLabel className="font-normal px-2.5 py-3">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none" style={{ color: "var(--text-primary)" }}>
              {user?.userName ?? "—"}
            </p>
            <p
              className="text-[11px] leading-none"
              style={{ color: "var(--text-muted)" }}
            >
              {user?.email ?? "—"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator
          className="-mx-1 my-1"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />
        
        <div className="py-1">
          {showDiscovery && (
            <DropdownMenuItem 
              className="cursor-pointer mx-1 rounded-lg px-2 py-2 text-sm font-medium focus:bg-[var(--accent-blue)] focus:text-[var(--bg-main)] transition-colors" 
              asChild
            >
              <Link href="/home" className="flex items-center w-full">
                Khám phá
              </Link>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            className="cursor-pointer mx-1 rounded-lg px-2 py-2 text-sm font-medium focus:bg-[var(--accent-blue)] focus:text-[var(--bg-main)] transition-colors" 
            asChild
          >
            <Link href="/profile" className="flex items-center w-full">
              Hồ sơ
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="cursor-pointer mx-1 rounded-lg px-2 py-2 text-sm font-medium focus:bg-[var(--accent-blue)] focus:text-[var(--bg-main)] transition-colors">
            Cài đặt
          </DropdownMenuItem>
          
          {showPremium && (
            <DropdownMenuItem className="cursor-pointer mx-1 rounded-lg px-2 py-2 text-sm font-medium focus:bg-[var(--accent-blue)] focus:text-[var(--bg-main)] transition-colors justify-between group">
              <span style={{ color: "inherit" }}>Nâng cấp Premium</span>
              <Badge
                className="text-[9px] px-1.5 py-0 border-0 font-bold"
                style={{
                  background: "var(--accent-gold-active-bg)",
                  color: "var(--accent-gold)",
                }}
              >
                Pro
              </Badge>
            </DropdownMenuItem>
          )}
        </div>
        
        <DropdownMenuSeparator
          className="-mx-1 my-1"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />
        
        <DropdownMenuItem
          className="cursor-pointer mx-1 my-1 rounded-lg px-2 py-2 text-sm font-semibold focus:bg-[var(--accent-danger)] focus:!text-white transition-colors"
          style={{ color: "var(--accent-danger)" }}
          disabled={isPending}
          onClick={() => logout()}
        >
          {isPending ? "Đang đăng xuất..." : "Đăng xuất"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
