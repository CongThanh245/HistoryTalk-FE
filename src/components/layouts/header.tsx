"use client";

import { Bell, SignIn } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchInput } from "@/components/commons/search-input";
import { useLogout } from "@/features/auth/hooks";
import { useAuthStore } from "@/store/auth.store";
import { GreetingSection } from "../home/greeting-section";
import Link from "next/link"; // Giả sử bạn dùng Next.js Link
import { MagneticButton } from "../commons/MagneticButton";

export default function Header() {
  const { mutate: logout, isPending } = useLogout();
  const user = useAuthStore((s) => s.user);

  const initials = user?.userName
    ? user.userName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header
      className="sticky top-0 z-50 h-16 w-full border-b"
      style={{
        background: "var(--header-bg)",
        borderColor: "var(--header-border)",
      }}
    >
      <div className="flex h-full items-center justify-between px-6 gap-4">
        <div className="flex-1 max-w-xl">
          <SearchInput
            value=""
            onChange={() => {}}
            placeholder="Tìm kiếm sự kiện, nhân vật..."
          />
        </div>

        <div className="flex items-center gap-2">
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full p-0 cursor-pointer"
                  >
                    <Avatar
                      className="h-9 w-9 border"
                      style={{ borderColor: "var(--oatmeal)" }}
                    >
                      <AvatarImage
                        src={user?.avatarUrl ?? "/api/placeholder/36/36"}
                        alt={user?.userName}
                      />
                      <AvatarFallback
                        className="text-sm font-semibold"
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
                  align="end"
                  className="w-56 border"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                >
                  <DropdownMenuLabel>
                    <p className="text-sm font-medium">
                      {user?.userName ?? "—"}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {user?.email ?? "—"}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator
                    style={{ background: "var(--border-default)" }}
                  />
                  <DropdownMenuItem className="cursor-pointer">
                    Hồ sơ
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    Cài đặt
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer justify-between">
                    Nâng cấp Premium
                    <Badge
                      className="text-[10px] px-1.5 py-0 border-0"
                      style={{
                        background: "var(--accent-gold-active-bg)",
                        color: "var(--accent-gold)",
                      }}
                    >
                      Pro
                    </Badge>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator
                    style={{ background: "var(--border-default)" }}
                  />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    style={{ color: "var(--accent-danger)" }}
                    disabled={isPending}
                    onClick={() => logout()}
                  >
                    {isPending ? "Đang đăng xuất..." : "Đăng xuất"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            /* --- TRẠNG THÁI CHƯA ĐĂNG NHẬP --- */
            <MagneticButton
              href="/login"
              variant="header-style"
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
