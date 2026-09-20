"use client";

import { useRouter } from "next/navigation";
import { BookOpen, MessageCircle, Trophy, X } from "lucide-react";
import type { Character } from "@/services/character.service";
import type { HistoricalEvent } from "@/services/event.service";
import { useAuthRequiredNavigation } from "@/features/auth/use-auth-required-navigation";

interface RoomActionsProps {
  character: Character;
  event: HistoricalEvent;
  onClose: () => void;
}

export function RoomActionsPanel({ character, event, onClose }: RoomActionsProps) {
  const router = useRouter();
  const { authRequiredDialog, navigateWithAuth } = useAuthRequiredNavigation();

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#211b18] text-[#f9f1e7] md:border-l md:border-[#76614d]">
      {authRequiredDialog}
      <div className="flex items-start gap-3 border-b border-white/15 p-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold">{character.name}</h2>
          <p className="mt-1 text-xs text-[#d4c2aa]">{character.title}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Đóng thông tin nhân vật" className="grid h-9 w-9 shrink-0 place-items-center rounded-md hover:bg-white/10"><X size={18} /></button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        <div>
          <h3 className="text-sm font-bold">{event.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#e5d8c6]">{event.summary}</p>
        </div>
        <div className="space-y-2">
          <button type="button" onClick={() => navigateWithAuth(`/chat/${character.id}?contextId=${event.id}`)} className="flex w-full items-center gap-3 rounded-md bg-[#a35b34] px-3 py-3 text-left text-sm font-bold text-white hover:bg-[#b66b42]">
            <MessageCircle size={18} />Trò chuyện với {character.name}
          </button>
          <button type="button" onClick={() => router.push(`/events?event=${event.id}`)} className="flex w-full items-center gap-3 rounded-md border border-[#79624b] px-3 py-3 text-left text-sm hover:bg-white/10">
            <BookOpen size={18} />Đọc bối cảnh lịch sử
          </button>
          <button type="button" onClick={() => router.push(`/quiz?contextId=${event.id}`)} className="flex w-full items-center gap-3 rounded-md border border-[#79624b] px-3 py-3 text-left text-sm hover:bg-white/10">
            <Trophy size={18} />Kiểm tra kiến thức
          </button>
        </div>
      </div>
    </div>
  );
}
