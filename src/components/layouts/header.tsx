"use client";

import { Search, Plus, Flame, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  return (
    <header
      className="sticky top-0 z-50 h-16 w-full border-b"
      style={{
        background: "var(--header-bg)",        // #EEE9DF
        borderColor: "var(--header-border)",   // #C9C1B1
      }}
    >
      <div className="flex h-full items-center justify-between px-6 gap-4">

        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: "var(--header-text-muted)" }} />
            <Input
              type="search"
              placeholder="Tìm kiếm sự kiện, nhân vật..."
              className="w-full pl-10 pr-4 h-9 rounded-full text-sm border outline-none focus-visible:ring-0"
              style={{
                background: "var(--header-input-bg)",
                borderColor: "var(--header-border)",
                color: "var(--header-text)",
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">

          {/* Create button */}
          <Button size="sm"
            className="rounded-full px-4 font-medium text-sm border-0 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
              color: "var(--bg-deep)",
              boxShadow: "0 0 14px var(--accent-gold-glow)",
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Tạo mới
          </Button>

          {/* Streak */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
            style={{ background: "var(--streak-bg)", borderColor: "var(--streak-border)" }}>
            <Flame className="h-4 w-4" style={{ color: "var(--streak-text)" }} />
            <span className="text-sm font-bold" style={{ color: "var(--streak-text)" }}>3</span>
            <span className="text-xs hidden sm:inline" style={{ color: "var(--streak-text-muted)" }}>ngày</span>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon"
            className="relative rounded-full h-9 w-9 cursor-pointer"
            style={{ color: "var(--header-text-muted)" }}>
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full ring-2 ring-[--header-bg]"
              style={{ background: "var(--accent-danger)" }} />
          </Button>

          {/* Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 cursor-pointer">
                <Avatar className="h-9 w-9 border" style={{ borderColor: "var(--oatmeal)" }}>
                  <AvatarImage src="/api/placeholder/36/36" alt="User" />
                  <AvatarFallback className="text-sm font-semibold"
                    style={{
                      background: "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
                      color: "var(--bg-deep)",
                    }}>
                    NT
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 border"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}>
              <DropdownMenuLabel>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Nguyen Thanh</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>nguyen@example.com</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ background: "var(--border-default)" }} />
              <DropdownMenuItem className="cursor-pointer" style={{ color: "var(--text-secondary)" }}>Hồ sơ</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" style={{ color: "var(--text-secondary)" }}>Cài đặt</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer justify-between" style={{ color: "var(--text-secondary)" }}>
                Nâng cấp Premium
                <Badge className="text-[10px] px-1.5 py-0 border-0"
                  style={{ background: "var(--accent-gold-active-bg)", color: "var(--accent-gold)" }}>
                  Pro
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ background: "var(--border-default)" }} />
              <DropdownMenuItem className="cursor-pointer" style={{ color: "var(--accent-danger)" }}>Đăng xuất</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}