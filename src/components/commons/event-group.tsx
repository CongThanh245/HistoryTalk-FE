"use client";

import { Sword } from "lucide-react";
import { SessionCard } from "@/components/commons/session-card";
import type {
  ChatHistoryGroup,
  ChatHistoryItem,
} from "@/services/chat-history.service";

interface EventGroupProps {
  group: ChatHistoryGroup;
  onSelectSession: (session: ChatHistoryItem) => void;
  onDeleteSession?: (sessionId: string) => void;
  deletingSessionId?: string | null;
}

export function EventGroup({
  group,
  onSelectSession,
  onDeleteSession,
  deletingSessionId = null,
}: EventGroupProps) {
  return (
    <div className="space-y-2.5 md:space-y-3">
      {/* Group header */}
      <div className="flex items-center gap-2.5 md:gap-3">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg md:h-8 md:w-8 border border-accent-gold/20 bg-[linear-gradient(135deg,rgba(201,162,77,0.12)_0%,rgba(163,81,57,0.08)_100%)]"
        >
          <Sword
            className="h-3.5 w-3.5 text-[var(--gold-on-light)]"
          />
        </div>
        <div>
          <h2
            className="text-xs font-bold md:text-sm text-content-heading"
          >
            {group.contextName}
          </h2>
          <p className="text-[10px] md:text-[11px] text-content-muted">
            {group.sessions.length} cuộc trò chuyện
          </p>
        </div>
        {/* Divider */}
        <div
          className="flex-1 h-px bg-[linear-gradient(to_right,var(--card-light-border),transparent)]"
        />
      </div>

      {/* Sessions — xếp NGANG, wrap khi hết chỗ */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3 md:gap-3">
        {group.sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onClick={onSelectSession}
            onDelete={onDeleteSession}
            isDeleting={deletingSessionId === session.id}
          />
        ))}
      </div>
    </div>
  );
}
