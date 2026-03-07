"use client";

import * as React from "react";
import { Shield } from "lucide-react";

export function StaffShell({
  title,
  description,
  icon,
  accent,
  children,
}: {
  title: string;
  description: string;
  icon?: React.ElementType;
  accent?: string;
  children: React.ReactNode;
}) {
  const Icon = icon ?? Shield;
  const a = accent ?? "var(--accent-gold)";

  return (
    <div className="space-y-10 pb-10">
      <div className="space-y-1 pt-2">
        <p className="text-sm" style={{ color: "var(--content-subtle)" }}>
          Staff dashboard
        </p>
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
                fontFamily: "'Georgia', 'Times New Roman', serif",
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

      {children}
    </div>
  );
}

