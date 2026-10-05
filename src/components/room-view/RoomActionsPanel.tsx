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
    <div className="flex h-full min-h-0 flex-col bg-[var(--bg-surface)] text-[var(--text-primary)] md:border-l md:border-[var(--text-primary)]">
      {authRequiredDialog}
      <div className="flex items-start gap-3 border-b border-[var(--text-primary)] p-4">
        <div className="min-w-0 flex-1">
          <h2 className="archive-title is-plain text-[22px]">{character.name}</h2>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{character.title}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Đóng thông tin nhân vật" className="grid h-9 w-9 shrink-0 place-items-center rounded-[2px] border border-[var(--text-primary)] transition-colors hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]"><X size={18} /></button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        <div>
          <h3 className="archive-title is-plain text-lg">{event.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{event.summary}</p>
        </div>
        <div className="space-y-2">
          <button type="button" onClick={() => navigateWithAuth(`/chat/${character.id}?contextId=${event.id}`)} className="flex w-full items-center gap-3 rounded-[2px] bg-[var(--accent-gold)] px-3 py-3 text-left text-sm font-bold text-white transition-colors hover:bg-[var(--accent-bronze)]">
            <MessageCircle size={18} />Trò chuyện với {character.name}
          </button>
          <button type="button" onClick={() => router.push(`/events?event=${event.id}`)} className="flex w-full items-center gap-3 rounded-[2px] border border-[var(--text-primary)] px-3 py-3 text-left text-sm font-semibold transition-colors hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]">
            <BookOpen size={18} />Đọc bối cảnh lịch sử
          </button>
          <button type="button" onClick={() => router.push(`/quiz?contextId=${event.id}`)} className="flex w-full items-center gap-3 rounded-[2px] border border-[var(--text-primary)] px-3 py-3 text-left text-sm font-semibold transition-colors hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]">
            <Trophy size={18} />Kiểm tra kiến thức
          </button>
        </div>
      </div>
    </div>
  );
}
