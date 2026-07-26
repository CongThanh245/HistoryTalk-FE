"use client";

// components/room-view/CharacterSprite.tsx
// Sprite nhân vật 2D với idle animation + greeting bubble

import React, { useState } from "react";
import type { RoomHotspot } from "@/services/room.service";
import { cn } from "@/lib/utils/cn";

interface CharacterSpriteProps {
  hotspot: RoomHotspot;
  isActive: boolean;
  onClick: (hotspot: RoomHotspot) => void;
}

export function CharacterSprite({
  hotspot,
  isActive,
  onClick,
}: CharacterSpriteProps) {
  const [showGreeting, setShowGreeting] = useState(false);

  const spriteHeight = 220 * hotspot.scale;
  const spriteWidth = spriteHeight * 0.55;

  return (
    <div
      className="absolute group cursor-pointer select-none"
      style={{
        left: `${hotspot.x}%`,
        bottom: `${100 - hotspot.y - 30}%`,
        transform: "translateX(-50%)",
        zIndex: isActive ? 30 : 20,
      }}
      onClick={() => onClick(hotspot)}
      onMouseEnter={() => setShowGreeting(true)}
      onMouseLeave={() => setShowGreeting(false)}
    >
      {/* Greeting bubble */}
      {(showGreeting || isActive) && (
        <div
          className="absolute bottom-full left-1/2 mb-3 w-56 animate-fade-in"
          style={{ transform: "translateX(-50%)" }}
        >
          <div className="relative px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-[0_8px_24px_rgba(0,0,0,0.18),0_0_0_1px_rgba(201,162,77,0.15)] bg-[rgba(255,251,240,0.97)] border border-[rgba(201,162,77,0.35)] text-[#2d3d4f]">
            {/* Quote marks */}
            <span className="absolute -top-3 left-4 text-3xl leading-none text-accent-gold opacity-60">
              &ldquo;
            </span>
            <p className="mt-1 italic">{hotspot.greeting}</p>

            {/* Character name tag */}
            <div className="mt-2 pt-2 flex items-center gap-2 border-t border-[rgba(201,162,77,0.2)]">
              <div className="w-1 h-4 rounded-full bg-accent-gold" />
              <div>
                <p className="text-xs font-bold text-accent-gold">
                  {hotspot.characterName}
                </p>
                <p className="text-xs text-[#7a7469]">
                  {hotspot.title}
                </p>
              </div>
            </div>

            {/* Tail */}
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-[rgba(255,251,240,0.97)] border border-[rgba(201,162,77,0.35)]"
              style={{ clipPath: "polygon(0 0, 100% 100%, 0 100%)" }}
            />
          </div>
        </div>
      )}

      {/* Sprite container */}
      <div
        className="relative transition-transform duration-200 group-hover:scale-105"
        style={{
          width: `${spriteWidth}px`,
          height: `${spriteHeight}px`,
          transform: hotspot.side === "left" ? "scaleX(-1)" : "scaleX(1)",
          animation: "sprite-breathe 3s ease-in-out infinite",
          filter: isActive
            ? "drop-shadow(0 0 20px rgba(201,162,77,0.8))"
            : "drop-shadow(0 8px 16px rgba(0,0,0,0.5))",
        }}
      >
        {/* Sprite image — circular crop thành silhouette */}
        <div
          className="w-full h-full overflow-hidden bg-[#2d1810]"
          style={{
            clipPath:
              "polygon(20% 0%, 80% 0%, 95% 15%, 100% 50%, 95% 85%, 80% 100%, 20% 100%, 5% 85%, 0% 50%, 5% 15%)",
          }}
        >
          <img
            src={hotspot.spriteUrl}
            alt={hotspot.characterName}
            className="w-full h-full object-cover object-top"
            style={{
              filter: "sepia(30%) contrast(1.1) brightness(0.9)",
            }}
          />
          {/* Historical tone overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(20,10,5,0.4)]" />
        </div>

        {/* Glow ring when active */}
        {isActive && (
          <div
            className="absolute inset-0 rounded-full animate-pulse shadow-[0_0_0_3px_rgba(201,162,77,0.6),0_0_30px_rgba(201,162,77,0.3)]"
            style={{
              clipPath:
                "polygon(20% 0%, 80% 0%, 95% 15%, 100% 50%, 95% 85%, 80% 100%, 20% 100%, 5% 85%, 0% 50%, 5% 15%)",
            }}
          />
        )}
      </div>

      {/* Name label below sprite */}
      <div className="text-center mt-1.5">
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm transition-all",
            isActive
              ? "bg-accent-gold text-[var(--text-inverse)] shadow-[0_4px_12px_rgba(201,162,77,0.5)]"
              : "bg-[rgba(14,26,43,0.75)] text-white/90 border border-[rgba(201,162,77,0.3)]"
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full animate-pulse",
              isActive ? "bg-white" : "bg-accent-gold"
            )}
          />
          {hotspot.characterName}
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes sprite-breathe {
          0%, 100% { transform: translateY(0px) ${hotspot.side === "left" ? "scaleX(-1)" : "scaleX(1)"}; }
          50% { transform: translateY(-6px) ${hotspot.side === "left" ? "scaleX(-1)" : "scaleX(1)"}; }
        }
        @keyframes animate-fade-in {
          from { opacity: 0; transform: translateX(-50%) translateY(6px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .animate-fade-in {
          animation: animate-fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
