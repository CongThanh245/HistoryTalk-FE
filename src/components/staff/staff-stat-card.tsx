"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type StaffStatTone = "gold" | "green" | "amber" | "blue" | "red" | "muted";

const toneClasses: Record<StaffStatTone, string> = {
  gold: "bg-[rgba(255,146,21,0.14)] text-[var(--accent-gold)]",
  green: "bg-emerald-500/10 text-emerald-500",
  amber: "bg-amber-500/10 text-amber-500",
  blue: "bg-blue-500/10 text-blue-500",
  red: "bg-rose-500/10 text-rose-500",
  muted: "bg-slate-500/10 text-slate-500",
};

interface StaffStatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: StaffStatTone;
  valueColor?: string;
  className?: string;
}

export function StaffStatCard({
  label,
  value,
  icon,
  tone = "gold",
  valueColor,
  className,
}: StaffStatCardProps) {
  return (
    <div
      className={cn("rounded-xl border p-4 shadow-sm", className)}
      style={{
        background: "var(--card-light-bg)",
        borderColor: "var(--card-light-border)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--content-subtle)]">
            {label}
          </p>
          <p
            className="mt-1 truncate text-2xl font-extrabold text-[var(--content-heading)]"
            style={valueColor ? { color: valueColor } : undefined}
          >
            {value}
          </p>
        </div>
        {icon && (
          <div className={cn("grid size-10 shrink-0 place-items-center rounded-lg", toneClasses[tone])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export function StaffStatsGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {children}
    </div>
  );
}
