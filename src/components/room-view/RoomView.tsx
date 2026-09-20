"use client";

// components/room-view/RoomView.tsx
// Component chính điều phối toàn bộ room experience

import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Compass, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { HistoricalRoom, RoomHotspot } from "@/services/room.service";
import { RoomBackground } from "./RoomBackground";
import { CharacterSprite } from "./CharacterSprite";
import { RoomActionsPanel } from "./RoomActionsPanel";
import { eventService, type HistoricalEvent } from "@/services/event.service";
import { characterService } from "@/services/character.service";

const ROOM_SEARCH: Record<string, { terms: string[]; year: number }> = {
  "room-bach-dang-938": { terms: ["Bạch Đằng"], year: 938 },
  "room-co-loa": { terms: ["Cổ Loa", "Âu Lạc"], year: -257 },
  "room-dien-bien-phu": { terms: ["Điện Biên Phủ"], year: 1954 },
  "room-thang-long": { terms: ["Chiếu dời đô", "Thăng Long"], year: 1010 },
  "room-lam-son": { terms: ["Lam Sơn"], year: 1418 },
};

function personName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
    .toLowerCase().replace(/^dai tuong\s+/, "").trim();
}

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
  const roomContent = useQuery({
    queryKey: ["room", "content", room.roomId],
    queryFn: async () => {
      const search = ROOM_SEARCH[room.roomId];
      if (!search) return null;
      let event: HistoricalEvent | null = null;
      for (const term of search.terms) {
        const result = await eventService.getAllClient({ search: term, page: 1, limit: 100 });
        event = result.content.find((item) =>
          (item.beforeTCN ? -Math.abs(item.year) : item.year) === search.year,
        ) ?? null;
        if (event) break;
      }
      if (!event) return null;
      const characters = await characterService.getByContext(event.id);
      return { event, characters };
    },
    retry: false,
  });
  const selectedCharacter = roomContent.data?.characters.find(
    (character) => activeHotspot && personName(character.name) === personName(activeHotspot.characterName),
  );

  const handleHotspotClick = useCallback((hotspot: RoomHotspot) => {
    setActiveHotspot(hotspot);
    setChatOpen(true);
  }, []);

  const handleCloseChat = useCallback(() => {
    setChatOpen(false);
    setActiveHotspot(null);
  }, []);

  const handleBack = onBack ?? (() => router.back());

  return (
    <div className="relative w-full h-full flex overflow-hidden bg-black">
      {/* Room (shrinks when chat opens) */}
      <div className="relative flex-1 h-full transition-all duration-300 min-w-0">
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
          <div className="absolute top-0 left-0 right-0 flex items-center gap-3 px-5 py-4 z-20 bg-gradient-to-b from-black/55 to-transparent">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95 bg-black/35 text-white/85 border border-white/15"
            >
              <ArrowLeft size={14} />
              Quay lại
            </button>

            <div className="flex-1" />

            {/* Room name + era */}
            <div className="text-right">
              <p className="text-sm font-bold leading-tight text-[rgba(255,245,220,0.95)] [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">
                {room.name}
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <Compass size={11} className="text-[rgba(201,162,77,0.8)]" />
                <span className="text-xs text-[rgba(201,162,77,0.8)]">
                  {ERA_LABELS[room.era] ?? room.era}
                </span>
              </div>
            </div>
          </div>

          {/* Room action hint */}
          {!chatOpen && room.hotspots.length > 0 && (
            <div
              className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-xs pointer-events-none bg-black/50 text-[rgba(255,245,220,0.7)] backdrop-blur-[8px] border border-white/10"
              style={{ animation: "pulse-hint 3s ease-in-out infinite" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse" />
              Chọn nhân vật để tìm hiểu sự kiện, trò chuyện hoặc làm quiz
            </div>
          )}
        </RoomBackground>
      </div>

      {/* Chat panel — slides in from right */}
      {chatOpen && activeHotspot && (
        <div className="absolute inset-0 z-30 h-full w-full overflow-hidden md:static md:w-[min(380px,42%)] md:shrink-0">
          {roomContent.data?.event && selectedCharacter ? (
            <RoomActionsPanel
              character={selectedCharacter}
              event={roomContent.data.event}
              onClose={handleCloseChat}
            />
          ) : (
            <div className="flex h-full flex-col gap-3 bg-[#211b18] p-4 text-sm text-white">
              <button type="button" onClick={handleCloseChat} className="self-end rounded-md border border-white/40 px-3 py-2">Đóng</button>
              <p>{roomContent.isPending ? "Đang tìm dữ liệu lịch sử..." : roomContent.isError ? "Không tải được dữ liệu. Vui lòng thử lại sau." : "Chưa có nhân vật và bối cảnh tương ứng trong thư viện."}</p>
              {roomContent.isError && <button type="button" onClick={() => void roomContent.refetch()} className="self-start rounded-md border border-white/40 px-3 py-2">Thử lại</button>}
            </div>
          )}
        </div>
      )}

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
        <Loader2 size={32} className="animate-spin text-accent-gold" />
        <p className="text-sm text-[rgba(255,245,220,0.6)]">
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
      <p className="text-lg text-[rgba(255,245,220,0.5)]">
        Không gian này chưa được mở khóa
      </p>
      <button
        onClick={onBack ?? (() => router.back())}
        className="px-4 py-2 rounded-full text-sm bg-[rgba(201,162,77,0.15)] text-accent-gold border border-[rgba(201,162,77,0.3)]"
      >
        Quay lại
      </button>
    </div>
  );
}
