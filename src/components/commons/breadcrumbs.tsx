"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretRight, House } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import React from "react";

const routeLabels: Record<string, string> = {
  home: "Trang chủ",
  staff: "Quản trị",
  quizzes: "Bộ đề",
  characters: "Nhân vật",
  contexts: "Bối cảnh",
  events: "Sự kiện",
  library: "Thư viện",
  map: "Bản đồ",
  profile: "Hồ sơ",
  quiz: "Trắc nghiệm",
  saved: "Đã lưu",
  chat: "Trò chuyện",
  "chat-history": "Lịch sử trò chuyện",
  about: "Giới thiệu",
  features: "Tính năng",
  pricing: "Bảng giá",
};

export default function Breadcrumbs() {
  const pathname = usePathname();

  // Skip rendering if on home or auth pages
  if (
    pathname === "/" ||
    pathname === "/home" ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register")
  ) {
    return null;
  }

  const pathSegments = pathname.split("/").filter((segment) => segment !== "");

  return (
    <nav 
      aria-label="Breadcrumb" 
      className="px-4 md:px-6 py-2.5 border-b"
      style={{ 
        background: "var(--bg-content)",
        borderColor: "var(--header-border)"
      }}
    >
      <ol className="flex items-center space-x-2 text-sm" style={{ color: "var(--content-muted)" }}>
        <li className="flex items-center">
          <Link
            href="/home"
            className="hover:text-[--accent-gold] transition-colors flex items-center gap-1.5"
            style={{ color: "var(--content-text)" }}
          >
            <House size={16} weight="fill" />
            <span className="sr-only">Trang chủ</span>
          </Link>
        </li>

        {pathSegments.map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === pathSegments.length - 1;
          const label = routeLabels[segment] || segment;
          const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);

          return (
            <React.Fragment key={href}>
              <li className="flex items-center">
                <CaretRight size={12} className="mx-1 opacity-40" />
                {isLast ? (
                  <span 
                    className="font-semibold truncate max-w-[200px]"
                    style={{ color: "var(--accent-gold)" }}
                  >
                    {formattedLabel}
                  </span>
                ) : (
                  <Link
                    href={href}
                    className="hover:text-[--accent-gold] transition-colors truncate max-w-[200px]"
                    style={{ color: "var(--content-text)" }}
                  >
                    {formattedLabel}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
