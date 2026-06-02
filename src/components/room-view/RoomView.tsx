"use client";

// components/room-view/RoomView.tsx
// Component chính điều phối toàn bộ room experience

import React, { useState, useCallback } from "react";
import { ArrowLeft, Compass, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { HistoricalRoom, RoomHotspot } from "@/services/room.service";
import { RoomBackground } from "./RoomBackground";
import { CharacterSprite } from "./CharacterSprite";
import { RoomChatPlaceholder } from "./RoomChatPlaceholder";

const ERA_LABELS: Record<string, string> = {
  ANCIENT: "Cổ đại",
  MEDIEVAL: "Trung đại",
  MODERN: "Cận đại",
  CONTEMPORARY: "Hiện đại",
};

interface RoomViewProps {
  room: HistoricalRoom;
  onBack?: () => void;
}

export function RoomView({ room, onBack }: RoomViewProps) {
  const router = useRouter();
  const [activeHotspot, setActiveHotspot] = useState<RoomHotspot | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const handleHotspotClick = useCallback((hotspot: RoomHotspot) => {
    setActiveHotspot(hotspot);
    setChatOpen(true);
  }, []);

  const handleCloseChat = useCallback(() => {
    setChatOpen(false);
    // Delay clearing active to allow close animation
    setTimeout(() => setActiveHotspot(null), 300);
  }, []);

  const handleBack = onBack ?? (() => router.back());

  const chatPanelWidth = 340;

  return (
    <div className="relative w-full h-full flex overflow-hidden bg-black">
      {/* Room (shrinks when chat opens) */}
      <div
        className="relative flex-1 h-full transition-all duration-300"
        style={{ minWidth: 0 }}
      >
        <RoomBackground room={room}>
          {/* Character hotspots */}
          {room.hotspots.map((hotspot) => (
            <CharacterSprite
              key={hotspot.hotspotId}
              hotspot={hotspot}
              isActive={activeHotspot?.hotspotId === hotspot.hotspotId}
              onClick={handleHotspotClick}
            />
          ))}

          {/* Top bar */}
          <div
            className="absolute top-0 left-0 right-0 flex items-center gap-3 px-5 py-4 z-20"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)",
            }}
          >
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95"
              style={{
                background: "rgba(0,0,0,0.35)",
                color: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <ArrowLeft size={14} />
              Quay lại
            </button>

            <div className="flex-1" />

            {/* Room name + era */}
            <div className="text-right">
              <p
                className="text-sm font-bold leading-tight"
                style={{
                  color: "rgba(255,245,220,0.95)",
                  textShadow: "0 1px 6px rgba(0,0,0,0.8)",
                }}
              >
                {room.name}
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <Compass size={11} style={{ color: "rgba(201,162,77,0.8)" }} />
                <span
                  className="text-xs"
                  style={{ color: "rgba(201,162,77,0.8)" }}
                >
                  {ERA_LABELS[room.era] ?? room.era}
                </span>
              </div>
            </div>
          </div>

          {/* Click-outside to close chat hint */}
          {!chatOpen && room.hotspots.length > 0 && (
            <div
              className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-xs pointer-events-none"
              style={{
                background: "rgba(0,0,0,0.5)",
                color: "rgba(255,245,220,0.7)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.1)",
                animation: "pulse-hint 3s ease-in-out infinite",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "var(--accent-gold)",
                  animation: "pulse 1.5s infinite",
                }}
              />
              Nhấn vào nhân vật để trò chuyện
            </div>
          )}
        </RoomBackground>
      </div>

      {/* Chat panel — slides in from right */}
      <div
        className="flex-shrink-0 h-full overflow-hidden transition-all duration-300 ease-out"
        style={{ width: chatOpen ? `${chatPanelWidth}px` : "0px" }}
      >
        {activeHotspot && (
          <div style={{ width: `${chatPanelWidth}px`, height: "100%" }}>
            {/* 
              TODO: Khi nối chat thật, thay RoomChatPlaceholder bằng:
              <ChatPanel
                characterId={activeHotspot.characterId}
                contextId={room.contextId}
                roomContext={activeHotspot.roomContext}
                onClose={handleCloseChat}
              />
            */}
            <RoomChatPlaceholder
              hotspot={activeHotspot}
              onClose={handleCloseChat}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-hint {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Loading + Error states ─────────────────────────────────

export function RoomViewLoading() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-3">
        <Loader2
          size={32}
          className="animate-spin"
          style={{ color: "var(--accent-gold)" }}
        />
        <p
          className="text-sm"
          style={{
            color: "rgba(255,245,220,0.6)",
          }}
        >
          Đang bước vào không gian lịch sử...
        </p>
      </div>
    </div>
  );
}

export function RoomViewEmpty({ onBack }: { onBack?: () => void }) {
  const router = useRouter();
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black gap-4">
      <p
        className="text-lg"
        style={{
          color: "rgba(255,245,220,0.5)",
        }}
      >
        Không gian này chưa được mở khóa
      </p>
      <button
        onClick={onBack ?? (() => router.back())}
        className="px-4 py-2 rounded-full text-sm"
        style={{
          background: "rgba(201,162,77,0.15)",
          color: "var(--accent-gold)",
          border: "1px solid rgba(201,162,77,0.3)",
        }}
      >
        Quay lại
      </button>
    </div>
  );
}
