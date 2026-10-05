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
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[2px] text-sm transition-colors hover:bg-[var(--sidebar-hover-bg)] text-[var(--sidebar-nav-text)]"
        >
          <Map size={18} className="text-[var(--sidebar-nav-icon)]" />
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
        className="btn-crimson"
      >
        <Map size={16} />
        {label}
      </button>
      <HistoricalMapModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
