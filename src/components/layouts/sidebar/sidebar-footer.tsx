"use client";

import { LightningIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { UpgradeProDialog } from "./upgrade-pro-dialog";

interface SidebarFooterProps {
  isExpanded: boolean;
  showUpgrade?: boolean;
}

export default function SidebarFooter({ isExpanded, showUpgrade = true }: SidebarFooterProps) {
  if (!showUpgrade) return null;

  return (
    <div
      className="relative z-10 shrink-0 px-2 py-3 border-t"
      style={{ borderColor: "var(--border-default)" }}
    >
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
