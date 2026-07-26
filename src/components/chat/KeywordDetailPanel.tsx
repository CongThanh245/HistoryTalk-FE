"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { X, MapPin, User, Sword } from "lucide-react";
import type { KeywordData, KeywordType } from "@/data/keywords";

interface Props {
  keyword: KeywordData | null;
  onClose: () => void;
}

const TYPE_CONFIG: Record<
  KeywordType,
  { icon: React.ReactNode; label: string; accent: string }
> = {
  person: {
    icon: <User size={13} className="fill-current" />,
    label: "Nhân vật",
    accent: "rgba(201, 162, 77, 1)",
  },
  location: {
    icon: <MapPin size={13} className="fill-current" />,
    label: "Địa danh",
    accent: "rgba(100, 200, 180, 1)",
  },
  event: {
    icon: <Sword size={13} className="fill-current" />,
    label: "Sự kiện",
    accent: "rgba(220, 120, 80, 1)",
  },
};

export function KeywordDetailPanel({ keyword, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isOpen = keyword !== null;

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const config = keyword ? TYPE_CONFIG[keyword.type] : null;
  const accent = config?.accent ?? "rgba(201, 162, 77, 1)";
  const accentBg = accent.replace("1)", "0.1)");
  const accentBorder = accent.replace("1)", "0.25)");

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-30 transition-opacity duration-300 bg-black/35"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          backdropFilter: isOpen ? "blur(2px)" : "none",
        }}
        onClick={handleBackdropClick}
      />

      {/* Sliding Panel */}
      <div
        ref={panelRef}
        className="absolute top-0 right-0 bottom-0 z-40 flex flex-col overflow-hidden w-[min(320px,90%)] bg-bg-main transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          borderLeft: `1px solid ${accentBorder}`,
          boxShadow: isOpen ? "-8px 0 32px rgba(0,0,0,0.4)" : "none",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {keyword && config && (
          <>
            {/* Top accent line */}
            <div
              className="h-0.5 w-full shrink-0"
              style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
            />

            {/* Header */}
            <div
              className="px-5 pt-4 pb-3 shrink-0 flex items-start justify-between gap-3"
              style={{ borderBottom: `1px solid ${accentBorder}` }}
            >
              <div className="flex-1 min-w-0">
                {/* Type badge */}
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2"
                  style={{
                    background: accentBg,
                    color: accent,
                    border: `1px solid ${accentBorder}`,
                  }}
                >
                  {config.icon}
                  {config.label}
                </span>
                <h3
                  className="text-base font-bold leading-snug text-content-heading"
                >
                  {keyword.keyword}
                </h3>
                <p
                  className="text-[11px] mt-0.5 leading-relaxed text-content-text"
                >
                  {keyword.shortDesc}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full shrink-0 transition-all hover:scale-110 active:scale-95 cursor-pointer bg-bg-elevated border border-border-default text-content-text"
              >
                <X size={13} strokeWidth={3} />
              </button>
            </div>

            {/* Image (nếu có) */}
            {keyword.imageUrl && (
              <div className="relative w-full h-36 shrink-0 overflow-hidden">
                <Image
                  src={keyword.imageUrl}
                  alt={keyword.keyword}
                  fill
                  className="object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-main"
                />
              </div>
            )}

            {/* Description */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Divider ornament */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="h-px flex-1"
                  style={{ background: accentBorder }}
                />
                <span style={{ color: accent, fontSize: 10 }}>✦</span>
                <div
                  className="h-px flex-1"
                  style={{ background: accentBorder }}
                />
              </div>

              <p
                className="text-sm leading-relaxed text-content-heading/85"
              >
                {keyword.description}
              </p>

              {/* Bottom spacing */}
              <div className="h-4" />
            </div>
          </>
        )}
      </div>
    </>
  );
}
