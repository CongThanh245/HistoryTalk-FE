"use client";

import { useAuthStore } from "@/store/auth.store";

export function GreetingSection() {
  const userName = useAuthStore((s) => s.user?.userName ?? "bạn");

  return (
    <div className="hidden md:flex flex-col items-end justify-center leading-tight mr-2">
      <h1
        className="text-sm font-semibold" // Giảm từ 3xl xuống sm/base
        style={{ color: "var(--text-inverse)" }}
      >
        Xin chào,{" "}
        <span
          style={{
            background:
              "linear-gradient(90deg, var(--gold-on-light) 0%, var(--accent-bronze) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "var(--gold-on-light)",
          }}
        >
          {userName}
        </span>
      </h1>
      {/* Dòng này có thể ẩn đi trên mobile hoặc thu nhỏ tối đa */}
      <p
        className="text-[10px] opacity-80"
        style={{ color: "var(--content-muted)" }}
      >
        Lịch sử hôm nay có gì?
      </p>
    </div>
  );
}
