"use client";

import { useAuthStore } from "@/store/auth.store";

export function GreetingSection() {
  const userName = useAuthStore((s) => s.user?.userName ?? "bạn");

  return (
    <div className="hidden md:flex flex-col items-end justify-center leading-tight mr-2">
      <h1 className="text-sm font-semibold text-content-heading">
        <span>{userName}</span>
      </h1>
      {/* Dòng này có thể ẩn đi trên mobile hoặc thu nhỏ tối đa */}
      <p className="text-[10px] opacity-80 text-content-muted">
        Lịch sử hôm nay có gì?
      </p>
    </div>
  );
}
