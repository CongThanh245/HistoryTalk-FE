"use client";

import { useAuthStore } from "@/store/auth.store";

export function GreetingSection() {
  const userName = useAuthStore((s) => s.user?.userName ?? "bạn"); // ← đọc từ store

  return (
    <div className="space-y-1 pt-2">
      <h1
        className="text-3xl font-bold"
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
        !
      </h1>
      <p className="text-sm" style={{ color: "var(--content-muted)" }}>
        Hôm nay bạn muốn khám phá trang sử nào?
      </p>
    </div>
  );
}
