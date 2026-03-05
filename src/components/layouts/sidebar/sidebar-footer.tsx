"use client";

import { Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarFooterProps {
  isExpanded: boolean;
}

export default function SidebarFooter({ isExpanded }: SidebarFooterProps) {
  return (
    <div
      className="relative z-10 shrink-0 px-2 py-3 border-t"
      style={{ borderColor: "var(--border-default)" }}
    >
      {isExpanded ? (
        /* Expanded — full card */
        <div
          className="rounded-xl p-3 flex flex-col gap-2 overflow-hidden relative cursor-pointer group transition-all duration-200"
          style={{
            background:
              "linear-gradient(135deg, rgba(201,162,77,0.12) 0%, rgba(163,81,57,0.10) 100%)",
            border: "1px solid rgba(201,162,77,0.25)",
          }}
        >
          {/* Glow bg */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(201,162,77,0.18) 0%, rgba(163,81,57,0.15) 100%)",
            }}
          />

          <div className="relative flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
              }}
            >
              <Zap
                className="w-3.5 h-3.5"
                style={{ color: "var(--bg-deep)" }}
              />
            </div>
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--accent-gold-soft)" }}
            >
              Nâng cấp Pro
            </span>
          </div>

          <p
            className="relative text-[11px] leading-relaxed"
            style={{ color: "var(--text-on-dark-muted)" }}
          >
            Mở khóa toàn bộ nhân vật, chat không giới hạn và nhiều hơn nữa.
          </p>

          <button
            className="relative w-full py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 cursor-pointer"
            style={{
              background:
                "linear-gradient(90deg, var(--accent-gold) 0%, var(--truffle) 100%)",
              color: "var(--bg-deep)",
              boxShadow: "0 2px 10px var(--accent-gold-glow)",
            }}
          >
            Upgrade to Pro ✦
          </button>
        </div>
      ) : (
        /* Collapsed — chỉ hiện icon */
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn(
                "w-10 h-10 mx-auto flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer",
              )}
              style={{
                background:
                  "linear-gradient(135deg, rgba(201,162,77,0.15) 0%, rgba(163,81,57,0.12) 100%)",
                border: "1px solid rgba(201,162,77,0.25)",
                color: "var(--accent-gold)",
              }}
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
              fontSize: 12,
            }}
          >
            Nâng cấp Pro
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
