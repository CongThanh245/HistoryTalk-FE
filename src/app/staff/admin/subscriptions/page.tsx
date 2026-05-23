"use client";

import { CreditCardIcon } from "@phosphor-icons/react";
import { StaffShell } from "@/components/staff/staff-shell";
import { HourglassMediumIcon } from "@phosphor-icons/react";

export default function AdminSubscriptionsPage() {
  return (
    <StaffShell
      title="Quản lý Gói dịch vụ"
      description="Quản lý các gói Free, Plus, Pro và chính sách giá."
      icon={CreditCardIcon}
      accent="var(--accent-gold)"
    >
      <div
        className="rounded-2xl border flex flex-col items-center justify-center py-24 gap-5"
        style={{
          background: "var(--card-light-bg)",
          borderColor: "var(--card-light-border)",
        }}
      >
        {/* Animated hourglass icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: "rgba(201,162,77,0.10)",
            border: "1px solid rgba(201,162,77,0.20)",
          }}
        >
          <HourglassMediumIcon
            className="w-8 h-8 animate-pulse"
            style={{ color: "var(--accent-gold)" }}
          />
        </div>

        <div className="text-center space-y-2 max-w-xs">
          <h2
            className="text-xl font-bold"
            style={{ color: "var(--content-heading)" }}
          >
            Đang phát triển
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--content-muted)" }}>
            Tính năng quản lý gói dịch vụ (Subscription & Tier management) đang được triển khai trong phiên bản tiếp theo.
          </p>
        </div>

        {/* Coming soon badge */}
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
          style={{
            background: "rgba(201,162,77,0.12)",
            color: "var(--accent-gold)",
            border: "1px solid rgba(201,162,77,0.30)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)] animate-pulse" />
          Coming Soon
        </span>
      </div>
    </StaffShell>
  );
}
