"use client";

// components/room-view/RoomBackground.tsx
// Nền phòng illustration + atmospheric overlays

import React from "react";
import type { HistoricalRoom } from "@/services/room.service";

interface RoomBackgroundProps {
  room: HistoricalRoom;
  children: React.ReactNode;
}

const ERA_TONES: Record<
  string,
  { vignette: string; grain: string; overlay: string }
> = {
  ANCIENT: {
    vignette: "rgba(60, 30, 10, 0.55)",
    grain: "rgba(180,140,80,0.04)",
    overlay: "rgba(40,20,5,0.15)",
  },
  MEDIEVAL: {
    vignette: "rgba(20, 40, 60, 0.5)",
    grain: "rgba(100,140,180,0.04)",
    overlay: "rgba(10,25,40,0.12)",
  },
  MODERN: {
    vignette: "rgba(20,20,20,0.55)",
    grain: "rgba(120,120,120,0.05)",
    overlay: "rgba(0,0,0,0.15)",
  },
  CONTEMPORARY: {
    vignette: "rgba(10,20,40,0.45)",
    grain: "rgba(80,120,160,0.03)",
    overlay: "rgba(5,15,30,0.1)",
  },
};

export function RoomBackground({ room, children }: RoomBackgroundProps) {
  const tone = ERA_TONES[room.era] ?? ERA_TONES.MEDIEVAL;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${room.backgroundUrl})`,
          filter: "sepia(25%) contrast(1.05) brightness(0.85) saturate(0.9)",
          transform: "scale(1.02)", // slight overscan for parallax feel
        }}
      />

      {/* Era color tone overlay */}
      <div className="absolute inset-0" style={{ background: tone.overlay }} />

      {/* Cinematic vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 40%, ${tone.vignette} 100%)`,
        }}
      />

      {/* Bottom ground shadow (makes sprites feel grounded) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)",
        }}
      />

      {/* Top bar shadow */}
      <div
        className="absolute top-0 left-0 right-0 h-20"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)",
        }}
      />

      {/* Film grain texture (CSS noise) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
          opacity: 0.4,
        }}
      />

      {/* Ambient description badge (bottom left) */}
      <div
        className="absolute bottom-5 left-5 max-w-xs z-10 pointer-events-none"
        style={{ animation: "fade-in-up 0.8s ease-out 0.3s both" }}
      >
        <p
          className="text-xs italic leading-relaxed"
          style={{
            color: "rgba(255,245,220,0.7)",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
          }}
        >
          {room.ambientDescription}
        </p>
      </div>

      {/* Children (hotspots) */}
      <div className="absolute inset-0">{children}</div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
