"use client";

// components/historical-map/RegionHoverCard.tsx
// Floating card kiểu Google Maps — hover vào region thì hiện thumbnail + info cơ bản

import React from "react";
import { Crown, MapPin } from "lucide-react";
import type { RegionProperties } from "@/services/period.service";

interface RegionHoverCardProps {
  region: RegionProperties;
  x: number; // px (relative to map container)
  y: number; // px
}

export function RegionHoverCard({ region, x, y }: RegionHoverCardProps) {
  // Position above cursor, offset to avoid covering pointer
  const style: React.CSSProperties = {
    left: x + 12,
    top: y - 12,
    transform: "translate(0, -100%)",
  };

  return (
    <div
      className="absolute z-[1000] pointer-events-none rounded-xl overflow-hidden"
      style={{
        ...style,
        background: "var(--bg-content)",
        border: `2px solid ${region.color}`,
        boxShadow: "0 8px 24px rgba(27,38,50,0.18)",
        width: 240,
        animation: "regionHoverIn 120ms ease-out",
      }}
    >
      {region.imageUrl && (
        <div className="relative h-24 overflow-hidden">
          <img
            src={region.imageUrl}
            alt={region.name}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${region.color}66, transparent 60%)`,
            }}
          />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: region.color }}
          />
          <h3
            className="text-sm font-bold leading-tight"
            style={{ color: "var(--content-heading)" }}
          >
            {region.name}
          </h3>
        </div>

        {region.capital && (
          <div
            className="flex items-center gap-1 text-xs mb-0.5"
            style={{ color: "var(--content-muted)" }}
          >
            <MapPin size={11} />
            <span>Thủ phủ: {region.capital}</span>
          </div>
        )}

        {region.ruler && (
          <div
            className="flex items-center gap-1 text-xs"
            style={{ color: "var(--content-muted)" }}
          >
            <Crown size={11} />
            <span className="truncate">{region.ruler}</span>
          </div>
        )}

        <p
          className="text-[10px] mt-1.5 italic"
          style={{ color: "var(--content-muted)" }}
        >
          Click để xem chi tiết →
        </p>
      </div>

      <style>{`
        @keyframes regionHoverIn {
          from { opacity: 0; transform: translate(0, -100%) translateY(4px); }
          to { opacity: 1; transform: translate(0, -100%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
