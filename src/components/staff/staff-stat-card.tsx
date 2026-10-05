"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type StaffStatTone = "gold" | "green" | "amber" | "blue" | "red" | "muted";

const toneClasses: Record<StaffStatTone, string> = {
  gold: "bg-[var(--accent-gold-active-bg)] text-[var(--accent-gold)]",
  green: "bg-[var(--status-success-bg)] text-[var(--status-success)]",
  amber: "bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
  blue: "bg-accent-blue/10 text-accent-blue",
  red: "bg-[var(--status-danger-bg)] text-[var(--accent-danger)]",
  muted: "bg-[var(--status-neutral-bg)] text-[var(--text-tertiary)]",
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
      className={cn("rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] p-4", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            {label}
          </p>
          <p
            className="mt-1 truncate font-display text-3xl font-extrabold leading-[1.2] text-content-heading"
            style={valueColor ? { color: valueColor } : undefined}
          >
            {value}
          </p>
        </div>
        {icon && (
          <div className={cn("grid size-10 shrink-0 place-items-center rounded-[2px]", toneClasses[tone])}>
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
