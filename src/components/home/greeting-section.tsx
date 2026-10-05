"use client";

import { useAuthStore } from "@/store/auth.store";

export function GreetingSection() {
  const userName = useAuthStore((s) => s.user?.userName ?? "bạn");

  return (
    <div className="hidden md:flex flex-col items-end justify-center leading-tight mr-2">
      <p className="font-display text-[16px] font-bold leading-[1.1] text-content-heading">
        <span className="text-[var(--gold-on-light)]">
          {userName}
        </span>
      </p>
      {/* Dòng này có thể ẩn đi trên mobile hoặc thu nhỏ tối đa */}
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-content-muted">
        Lịch sử hôm nay có gì?
      </p>
    </div>
  );
}
