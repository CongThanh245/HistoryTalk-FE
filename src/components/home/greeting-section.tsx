"use client";

// TODO: nhận userName từ auth context sau khi có auth
// import { useAuthContext } from "@/components/context/auth-context";

interface GreetingSectionProps {
  userName?: string;
}

export function GreetingSection({ userName = "Nguyen Thanh" }: GreetingSectionProps) {
  return (
    <div className="space-y-1 pt-2">
      <h1 className="text-3xl font-bold" style={{ color: "var(--text-inverse)" }}>
        Xin chào,{" "}
        <span
          style={{
            background: "linear-gradient(90deg, var(--gold-on-light) 0%, var(--accent-bronze) 100%)",
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