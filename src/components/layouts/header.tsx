"use client";

import { Plus, Flame, Bell } from "lucide-react";
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

export default function Header() {
  const { mutate: logout, isPending } = useLogout();
  const user = useAuthStore((s) => s.user); // ← đọc từ store

  // Tạo initials từ userName (vd: "STAFF1" → "ST", "Nguyen Thanh" → "NT")
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
          {/* <Button
            size="sm"
            className="rounded-full px-4 font-medium text-sm border-0 cursor-pointer"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
              color: "var(--bg-deep)",
              boxShadow: "0 0 14px var(--accent-gold-glow)",
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Tạo mới
          </Button> */}

          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
            style={{
              background: "var(--streak-bg)",
              borderColor: "var(--streak-border)",
            }}
          >
            <Flame
              className="h-4 w-4"
              style={{ color: "var(--streak-text)" }}
            />
            <span
              className="text-sm font-bold"
              style={{ color: "var(--streak-text)" }}
            >
              3
            </span>
            <span
              className="text-xs hidden sm:inline"
              style={{ color: "var(--streak-text-muted)" }}
            >
              ngày
            </span>
          </div>

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
                    src="/api/placeholder/36/36"
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
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user?.userName ?? "—"}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {user?.email ?? "—"}
                </p>
              </DropdownMenuLabel>

              <DropdownMenuSeparator
                style={{ background: "var(--border-default)" }}
              />

              <DropdownMenuItem
                className="cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
              >
                Hồ sơ
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
              >
                Cài đặt
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer justify-between"
                style={{ color: "var(--text-secondary)" }}
              >
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
        </div>
      </div>
    </header>
  );
}
