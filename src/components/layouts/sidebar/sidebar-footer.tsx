"use client";

import { LightningIcon, CrownSimpleIcon, CoinsIcon, CaretRightIcon } from "@phosphor-icons/react";
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
      <div className="relative z-10 shrink-0 px-2 py-3 border-t" style={{ borderColor: "var(--border-default)" }}>
        <Skeleton className="w-full rounded-xl" style={{ height: 72 }} />
      </div>
    );
  }

  /* ── PRO Member Card ─────────────────────────────────── */
  if (proUser && profile) {
    return (
      <div
        className="relative z-10 shrink-0 px-2 py-3 border-t"
        style={{ borderColor: "rgba(201,162,77,0.25)" }}
      >
        <UpgradeProDialog>
        <button
          type="button"
          className="block rounded-xl overflow-hidden relative group transition-all duration-250 w-full text-left cursor-pointer"
          style={{
            height: 72,
            background:
              "linear-gradient(135deg, rgba(201,162,77,0.18) 0%, rgba(163,81,57,0.13) 50%, rgba(201,162,77,0.08) 100%)",
            border: "1px solid rgba(201,162,77,0.40)",
            boxShadow: "0 2px 12px rgba(201,162,77,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* shimmer effect */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(201,162,77,0.26) 0%, rgba(163,81,57,0.18) 100%)",
            }}
          />

          {/* Gold top-border line */}
          <div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(201,162,77,0.7), transparent)",
            }}
          />

          <div className="relative z-10 h-full flex items-center px-2.5 gap-2.5">
            {/* Crown icon */}
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
                boxShadow: "0 2px 10px var(--accent-gold-glow, rgba(201,162,77,0.4))",
              }}
            >
              <CrownSimpleIcon className="w-3.5 h-3.5" style={{ color: "var(--text-inverse)" }} weight="fill" />
            </div>

            <div
              className={cn(
                "flex flex-col gap-1 overflow-hidden transition-all duration-250",
                isExpanded ? "opacity-100 w-full" : "opacity-0 w-0 pointer-events-none"
              )}
            >
              {/* Title */}
              <p
                className="text-[11px] font-bold whitespace-nowrap tracking-wide"
                style={{ color: "var(--accent-gold)" }}
              >
                ✦ {profile.tierTitle || 'Pro Member'}
              </p>

              {/* Token count */}
              <div className="flex items-center gap-1">
                <CoinsIcon className="w-3 h-3 shrink-0" style={{ color: "var(--accent-gold-soft, #d4a84b)" }} />
                <span
                  className="text-[11px] font-semibold whitespace-nowrap tabular-nums"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {profile.token.toLocaleString("vi-VN")} Token còn lại
                </span>
              </div>
            </div>

            <CaretRightIcon
              className={cn(
                "w-3.5 h-3.5 shrink-0 transition-opacity duration-250",
                isExpanded ? "opacity-40 group-hover:opacity-80" : "opacity-0 w-0"
              )}
              style={{ color: "var(--accent-gold)" }}
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
      className="relative z-10 shrink-0 px-2 py-3 border-t flex flex-col gap-2"
      style={{ borderColor: "var(--border-default)" }}
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
          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
          style={{
            background: "var(--bg-main)",
            border: "1px solid var(--border-default)",
          }}
        >
          <CoinsIcon className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
        </div>
        <div
          className={cn(
            "flex flex-col overflow-hidden transition-all duration-250",
            isExpanded ? "opacity-100 w-full" : "opacity-0 w-0 pointer-events-none"
          )}
        >
          <span
            className="text-[11px] font-semibold whitespace-nowrap tabular-nums"
            style={{ color: "var(--text-secondary)" }}
          >
            {profile?.token?.toLocaleString("vi-VN") ?? 0} Token
          </span>
          <span className="text-[10px] whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
            Còn lại
          </span>
        </div>
      </Link>

      <UpgradeProDialog>
        <button
          type="button"
          className="rounded-xl overflow-hidden relative cursor-pointer group transition-all duration-250 w-full text-left"
          style={{
            height: 72,
            background:
              "linear-gradient(135deg, rgba(201,162,77,0.10) 0%, rgba(163,81,57,0.08) 100%)",
            border: "1px solid rgba(201,162,77,0.22)",
          }}
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(201,162,77,0.16) 0%, rgba(163,81,57,0.12) 100%)",
            }}
          />

          <div className="relative z-10 h-full flex items-center px-2.5 gap-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
                boxShadow: "0 2px 8px var(--accent-gold-glow)",
              }}
            >
              <LightningIcon className="w-3.5 h-3.5" style={{ color: "var(--text-inverse)" }} />
            </div>

            <div
              className={cn(
                "flex flex-col gap-1.5 overflow-hidden transition-all duration-250",
                isExpanded ? "opacity-100 w-full" : "opacity-0 w-0 pointer-events-none"
              )}
            >
              <div>
                <p className="text-xs font-semibold whitespace-nowrap" style={{ color: "var(--accent-gold-soft)" }}>
                  Nâng cấp Pro
                </p>
                <p className="text-[11px] whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>
                  Mở khóa toàn bộ tính năng.
                </p>
              </div>
              <span
                className="block w-full py-1 rounded-lg text-[11px] font-semibold text-center whitespace-nowrap transition-all duration-150"
                style={{
                  background: "linear-gradient(90deg, var(--accent-gold) 0%, var(--truffle) 100%)",
                  color: "var(--text-inverse)",
                  boxShadow: "0 2px 8px var(--accent-gold-glow)",
                }}
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
