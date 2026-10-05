"use client";

import { Zap, Crown, Coins, ChevronRight, School } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { UpgradeProDialog } from "./upgrade-pro-dialog";
import { useProfile } from "@/features/profile/hooks";
import { isPro } from "@/services/user.service";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useEntitlements } from "@/features/saas/entitlements";
import { useTodayQuota } from "@/features/saas/quota-bonus";

interface SidebarFooterProps {
  isExpanded: boolean;
  showUpgrade?: boolean;
}

/** School accounts (Teacher / School Student): today's quota from the school, no upgrade button. */
function SchoolQuotaCard({ isExpanded }: { isExpanded: boolean }) {
  const entitlements = useEntitlements();
  const quota = useTodayQuota();
  if (!quota) return null;
  const percent = quota.quota > 0 ? Math.min(100, Math.round((quota.used / quota.quota) * 100)) : 0;
  const fmt = (n: number) => n.toLocaleString("vi-VN");

  return (
    <div className="relative z-10 shrink-0 px-2 py-3 border-t border-border-default">
      <Link
        href="/profile"
        title={`Hạn mức hôm nay: ${fmt(quota.used)} / ${fmt(quota.quota)} token · Reset lúc 00:00`}
        className={cn(
          "flex items-center gap-2.5 rounded-[2px] border border-border-default px-2.5 py-2 transition-colors hover:bg-[var(--sidebar-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]",
          !isExpanded && "justify-center px-0 border-transparent",
        )}
      >
        <div className="w-7 h-7 rounded-[2px] flex items-center justify-center shrink-0 border border-[color-mix(in_srgb,var(--gold-leaf)_45%,transparent)] bg-[var(--gold-leaf-bg)]">
          <Coins className="w-3.5 h-3.5 text-[var(--gold-leaf)]" />
        </div>
        <div
          className={cn(
            "flex min-w-0 flex-col gap-1 overflow-hidden transition-all duration-250",
            isExpanded ? "opacity-100 w-full" : "opacity-0 w-0 pointer-events-none",
          )}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap text-text-muted">
              Hạn mức hôm nay
            </span>
            <span className="text-[11px] font-semibold tabular-nums whitespace-nowrap text-text-secondary">
              {fmt(quota.used)} / {fmt(quota.quota)}
            </span>
          </div>
          <div
            className="h-1 w-full rounded-[2px] bg-[var(--border-default)] overflow-hidden"
            role="progressbar"
            aria-label="Hạn mức token hôm nay"
            aria-valuemin={0}
            aria-valuemax={quota.quota}
            aria-valuenow={quota.used}
          >
            <svg className="block h-full w-full" aria-hidden="true">
              <rect width={`${percent}%`} height="100%" className="fill-[var(--gold-leaf)]" />
            </svg>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <School className="w-3 h-3 shrink-0 text-text-tertiary" />
            <span className="truncate text-[10px] text-text-secondary">{entitlements.planLabel}</span>
          </div>
          <span className="text-[10px] whitespace-nowrap text-text-muted">
            {quota.bonus > 0 ? `+${fmt(quota.bonus)} từ nhiệm vụ · ` : ""}Reset lúc 00:00
          </span>
        </div>
      </Link>
    </div>
  );
}

export default function SidebarFooter({ isExpanded, showUpgrade = true }: SidebarFooterProps) {
  const { data: profile, isLoading } = useProfile();
  const proUser = isPro(profile ?? null);
  const { mode } = useEntitlements();

  if (!showUpgrade) return null;
  if (mode === "B2B") return <SchoolQuotaCard isExpanded={isExpanded} />;

  /* ── Loading: avoid flashing the wrong tier before profile arrives ── */
  if (isLoading) {
    return (
      <div className="relative z-10 shrink-0 px-2 py-3 border-t border-border-default">
        <Skeleton className="w-full rounded-[2px] h-[72px]" />
      </div>
    );
  }

  /* ── PRO Member Card ─────────────────────────────────── */
  if (proUser && profile) {
    return (
      <div
        className="relative z-10 shrink-0 px-2 py-3 border-t border-border-default"
      >
        <UpgradeProDialog>
        <button
          type="button"
          className="block rounded-[2px] overflow-hidden relative group transition-colors duration-250 w-full text-left cursor-pointer h-[72px] bg-bg-surface border border-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
        >
          {/* Crimson top rule */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px] pointer-events-none bg-accent-gold"
          />

          <div className="relative z-10 h-full flex items-center px-2.5 gap-2.5">
            {/* Crown icon */}
            <div
              className="w-7 h-7 rounded-[2px] flex items-center justify-center shrink-0 bg-accent-gold"
            >
              <Crown className="w-3.5 h-3.5 text-white" fill="currentColor" />
            </div>

            <div
              className={cn(
                "flex flex-col gap-1 overflow-hidden transition-all duration-250",
                isExpanded ? "opacity-100 w-full" : "opacity-0 w-0 pointer-events-none"
              )}
            >
              {/* Title */}
              <p
                className="text-[11px] font-bold uppercase whitespace-nowrap tracking-[0.1em] text-accent-gold"
              >
                ✦ {profile.tierTitle || 'Pro Member'}
              </p>

              {/* Token count */}
              <div className="flex items-center gap-1">
                <Coins className="w-3 h-3 shrink-0 text-text-tertiary" />
                <span
                  className="text-[11px] font-semibold whitespace-nowrap tabular-nums text-text-secondary"
                >
                  {profile.token.toLocaleString("vi-VN")} Token còn lại
                </span>
              </div>
            </div>

            <ChevronRight
              className={cn(
                "w-3.5 h-3.5 shrink-0 transition-opacity duration-250 text-accent-gold",
                isExpanded ? "opacity-40 group-hover:opacity-80" : "opacity-0 w-0"
              )}
            />
          </div>
        </button>
        </UpgradeProDialog>
      </div>
    );
  }

  /* ── Free User: Token card + Upgrade button ──────────────── */
  return (
    <div
      className="relative z-10 shrink-0 px-2 py-3 border-t flex flex-col gap-2 border-border-default"
    >
      {/* Token display for free users */}
      <Link
        href="/profile?tab=billing"
        className={cn(
          "flex items-center gap-2 rounded-[2px] px-2.5 py-2 transition-colors hover:bg-[var(--sidebar-hover-bg)]",
          !isExpanded && "justify-center"
        )}
      >
        <div
          className="w-7 h-7 rounded-[2px] flex items-center justify-center shrink-0 bg-bg-main border border-border-strong"
        >
          <Coins className="w-3.5 h-3.5 text-text-muted" />
        </div>
        <div
          className={cn(
            "flex flex-col overflow-hidden transition-all duration-250",
            isExpanded ? "opacity-100 w-full" : "opacity-0 w-0 pointer-events-none"
          )}
        >
          <span
            className="text-[11px] font-semibold whitespace-nowrap tabular-nums text-text-secondary"
          >
            {profile?.token?.toLocaleString("vi-VN") ?? 0} Token
          </span>
          <span className="text-[10px] whitespace-nowrap text-text-muted">
            Còn lại
          </span>
        </div>
      </Link>

      <UpgradeProDialog>
        <button
          type="button"
          className="rounded-[2px] overflow-hidden relative cursor-pointer group transition-colors duration-250 w-full text-left h-[72px] bg-transparent border border-[var(--text-primary)] hover:bg-[var(--sidebar-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
        >

          <div className="relative z-10 h-full flex items-center px-2.5 gap-2.5">
            <div
              className="w-7 h-7 rounded-[2px] flex items-center justify-center shrink-0 bg-accent-gold"
            >
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>

            <div
              className={cn(
                "flex flex-col gap-1.5 overflow-hidden transition-all duration-250",
                isExpanded ? "opacity-100 w-full" : "opacity-0 w-0 pointer-events-none"
              )}
            >
              <div>
                <p className="font-display text-sm font-extrabold uppercase leading-[1.3] whitespace-nowrap text-text-primary">
                  Nâng cấp Pro
                </p>
                <p className="text-[11px] whitespace-nowrap text-text-secondary">
                  Mở khóa toàn bộ tính năng.
                </p>
              </div>
              <span
                className="block w-full py-1 rounded-[2px] text-[10px] font-bold uppercase tracking-[0.1em] text-center whitespace-nowrap transition-colors duration-150 text-white bg-accent-gold group-hover:bg-[var(--accent-bronze)]"
              >
                Upgrade to Pro ✦
              </span>
            </div>
          </div>
        </button>
      </UpgradeProDialog>
    </div>
  );
}
