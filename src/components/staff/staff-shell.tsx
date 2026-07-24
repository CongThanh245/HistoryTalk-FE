"use client";

import * as React from "react";
import { ShieldIcon } from "@phosphor-icons/react";

export function StaffShell({
  title,
  description,
  icon,
  accent,
  children,
}: {
  title: string;
  description: string;
  icon?: React.ComponentType<any>;
  accent?: string;
  children: React.ReactNode;
}) {
  const Icon = icon ?? ShieldIcon;
  const a = accent ?? "var(--accent-gold)";

  return (
    // THÊM: px-6 (cho mobile) và lg:px-10 (cho màn hình lớn)
    // để tạo khoảng cách với sidebar và mép phải.
    <div
      className="space-y-6 pb-6 px-6 lg:px-10 max-w-[1600px]"
      style={{ color: "var(--content-text)" }}
    >
      <div className="space-y-1 pt-4">
        {" "}
        {/* Padding vừa phải để trang fit trong 1 màn hình, không cần cuộn thêm */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border"
            style={{
              background: `${a}18`,
              borderColor: "var(--card-light-border)",
            }}
          >
            <Icon className="w-5 h-5" style={{ color: a }} />
          </div>
          <div>
            <h1
              className="text-3xl font-bold leading-tight"
              style={{
                color: "var(--content-heading)",
              }}
            >
              {title}
            </h1>
            <p className="text-sm" style={{ color: "var(--content-muted)" }}>
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Phần children bây giờ sẽ tự động thụt vào theo padding của cha */}
      <div className="w-full">{children}</div>
    </div>
  );
}
