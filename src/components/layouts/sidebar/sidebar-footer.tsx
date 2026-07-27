"use client";

import { Zap, Crown, Coins, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { UpgradeProDialog } from "./upgrade-pro-dialog";
import { useProfile } from "@/features/profile/hooks";
import { isPro } from "@/services/user.service";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface SidebarFooterProps {
  isExpanded: boolean;
  showUpgrade?: boolean;
}

export default function SidebarFooter({ isExpanded, showUpgrade = true }: SidebarFooterProps) {
  const { data: profile, isLoading } = useProfile();
  const proUser = isPro(profile ?? null);

  if (!showUpgrade) return null;

  /* ── Loading: avoid flashing the wrong tier before profile arrives ── */
  if (isLoading) {
    return (
      <div className="relative z-10 shrink-0 px-2 py-3 border-t border-border-default">
        <Skeleton className="w-full rounded-xl h-[72px]" />
      </div>
    );
  }

  /* ── PRO Member Card ─────────────────────────────────── */
  if (proUser && profile) {
    return (
      <div
        className="relative z-10 shrink-0 px-2 py-3 border-t border-accent-gold/25"
      >
        <UpgradeProDialog>
        <button
          type="button"
          className="block rounded-xl overflow-hidden relative group transition-all duration-250 w-full text-left cursor-pointer h-[72px] bg-linear-[135deg] from-accent-gold/18 via-[rgba(163,81,57,0.13)] to-accent-gold/8 border border-accent-gold/40 shadow-[0_2px_12px_rgba(201,162,77,0.12),inset_0_1px_0_rgba(255,255,255,0.06)]"
        >
          {/* shimmer effect */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-linear-[135deg] from-accent-gold/26 to-[rgba(163,81,57,0.18)]"
          />

          {/* Gold top-border line */}
          <div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none bg-linear-to-r from-transparent via-accent-gold/70 to-transparent"
          />

          <div className="relative z-10 h-full flex items-center px-2.5 gap-2.5">
            {/* Crown icon */}
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-linear-[135deg] from-accent-gold to-[var(--truffle)] shadow-[0_2px_10px_var(--accent-gold-glow,rgba(201,162,77,0.4))]"
            >
              <Crown className="w-3.5 h-3.5 text-text-inverse" fill="currentColor" />
            </div>

            <div
              className={cn(
                "flex flex-col gap-1 overflow-hidden transition-all duration-250",
                isExpanded ? "opacity-100 w-full" : "opacity-0 w-0 pointer-events-none"
              )}
            >
              {/* Title */}
              <p
                className="text-[11px] font-bold whitespace-nowrap tracking-wide text-accent-gold"
              >
                ✦ {profile.tierTitle || 'Pro Member'}
              </p>

              {/* Token count */}
              <div className="flex items-center gap-1">
                <Coins className="w-3 h-3 shrink-0 text-accent-gold-soft" />
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
          "flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/5",
          !isExpanded && "justify-center"
        )}
      >
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-bg-main border border-border-default"
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
          className="rounded-xl overflow-hidden relative cursor-pointer group transition-all duration-250 w-full text-left h-[72px] bg-linear-[135deg] from-accent-gold/10 to-[rgba(163,81,57,0.08)] border border-accent-gold/22"
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-linear-[135deg] from-accent-gold/16 to-[rgba(163,81,57,0.12)]"
          />

          <div className="relative z-10 h-full flex items-center px-2.5 gap-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-linear-[135deg] from-accent-gold to-[var(--truffle)] shadow-[0_2px_8px_var(--accent-gold-glow)]"
            >
              <Zap className="w-3.5 h-3.5 text-text-inverse" />
            </div>

            <div
              className={cn(
                "flex flex-col gap-1.5 overflow-hidden transition-all duration-250",
                isExpanded ? "opacity-100 w-full" : "opacity-0 w-0 pointer-events-none"
              )}
            >
              <div>
                <p className="text-xs font-semibold whitespace-nowrap text-accent-gold-soft">
                  Nâng cấp Pro
                </p>
                <p className="text-[11px] whitespace-nowrap text-text-secondary">
                  Mở khóa toàn bộ tính năng.
                </p>
              </div>
              <span
                className="block w-full py-1 rounded-lg text-[11px] font-semibold text-center whitespace-nowrap transition-all duration-150 text-text-inverse bg-linear-to-r from-accent-gold to-[var(--truffle)] shadow-[0_2px_8px_var(--accent-gold-glow)]"
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
