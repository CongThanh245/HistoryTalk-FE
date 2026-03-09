"use client";

// components/historical-map/MapTriggerButton.tsx
// Button kích hoạt mở map modal — đặt ở sidebar hoặc bất kỳ đâu

import React, { useState } from "react";
import { Map } from "lucide-react";
import { HistoricalMapModal } from "./HistoricalMapModal";

interface MapTriggerButtonProps {
  // variant: sidebar nav item style hoặc standalone button
  variant?: "sidebar" | "button";
  label?: string;
}

export function MapTriggerButton({
  variant = "button",
  label = "Bản đồ lịch sử",
}: MapTriggerButtonProps) {
  const [open, setOpen] = useState(false);

  if (variant === "sidebar") {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-[var(--accent-gold-active-bg)]"
          style={{ color: "var(--sidebar-nav-text)" }}
        >
          <Map size={18} style={{ color: "var(--sidebar-nav-icon)" }} />
          {label}
        </button>
        <HistoricalMapModal isOpen={open} onClose={() => setOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
        style={{
          background: "var(--accent-gold)",
          color: "var(--text-inverse)",
          boxShadow: "0 4px 14px var(--accent-gold-glow)",
        }}
      >
        <Map size={16} />
        {label}
      </button>
      <HistoricalMapModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
