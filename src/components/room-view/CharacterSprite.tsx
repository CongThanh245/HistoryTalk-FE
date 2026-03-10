"use client";

// components/room-view/CharacterSprite.tsx
// Sprite nhân vật 2D với idle animation + greeting bubble

import React, { useState } from "react";
import type { RoomHotspot } from "@/services/room.service";

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
          <div
            className="relative px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg"
            style={{
              background: "rgba(255, 251, 240, 0.97)",
              border: "1px solid rgba(201,162,77,0.35)",
              color: "#2d3d4f",
              boxShadow:
                "0 8px 24px rgba(0,0,0,0.18), 0 0 0 1px rgba(201,162,77,0.15)",
            }}
          >
            {/* Quote marks */}
            <span
              className="absolute -top-3 left-4 text-3xl leading-none"
              style={{ color: "var(--accent-gold)", opacity: 0.6 }}
            >
              "
            </span>
            <p className="mt-1 italic">{hotspot.greeting}</p>

            {/* Character name tag */}
            <div
              className="mt-2 pt-2 flex items-center gap-2"
              style={{ borderTop: "1px solid rgba(201,162,77,0.2)" }}
            >
              <div
                className="w-1 h-4 rounded-full"
                style={{ background: "var(--accent-gold)" }}
              />
              <div>
                <p
                  className="text-xs font-bold"
                  style={{ color: "var(--accent-gold)" }}
                >
                  {hotspot.characterName}
                </p>
                <p className="text-xs" style={{ color: "#7a7469" }}>
                  {hotspot.title}
                </p>
              </div>
            </div>

            {/* Tail */}
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
              style={{
                background: "rgba(255, 251, 240, 0.97)",
                border: "1px solid rgba(201,162,77,0.35)",
                clipPath: "polygon(0 0, 100% 100%, 0 100%)",
              }}
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
          className="w-full h-full overflow-hidden"
          style={{
            clipPath:
              "polygon(20% 0%, 80% 0%, 95% 15%, 100% 50%, 95% 85%, 80% 100%, 20% 100%, 5% 85%, 0% 50%, 5% 15%)",
            background: "#2d1810",
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
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, transparent 40%, rgba(20,10,5,0.4) 100%)",
            }}
          />
        </div>

        {/* Glow ring when active */}
        {isActive && (
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              boxShadow:
                "0 0 0 3px rgba(201,162,77,0.6), 0 0 30px rgba(201,162,77,0.3)",
              clipPath:
                "polygon(20% 0%, 80% 0%, 95% 15%, 100% 50%, 95% 85%, 80% 100%, 20% 100%, 5% 85%, 0% 50%, 5% 15%)",
            }}
          />
        )}
      </div>

      {/* Name label below sprite */}
      <div className="text-center mt-1.5">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm transition-all"
          style={
            isActive
              ? {
                  background: "var(--accent-gold)",
                  color: "var(--text-inverse)",
                  boxShadow: "0 4px 12px rgba(201,162,77,0.5)",
                }
              : {
                  background: "rgba(14,26,43,0.75)",
                  color: "rgba(255,255,255,0.9)",
                  border: "1px solid rgba(201,162,77,0.3)",
                }
          }
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: isActive ? "white" : "var(--accent-gold)",
              animation: "pulse 2s infinite",
            }}
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
