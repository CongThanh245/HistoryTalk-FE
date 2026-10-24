"use client";

import { SESSION_ROW_GRID, SessionCard } from "@/components/commons/session-card";
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

/** Conversations of one historical context: a heading, then a framed list with column headers on md+. */
export function EventGroup({
  group,
  onSelectSession,
  onDeleteSession,
  deletingSessionId = null,
}: EventGroupProps) {
  return (
    <section className="space-y-3" aria-label={group.contextName}>
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold text-content-heading">{group.contextName}</h2>
        <span className="text-sm tabular-nums text-content-subtle">{group.sessions.length}</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border-card bg-[var(--bg-surface)]">
        <div
          aria-hidden="true"
          className={`hidden h-11 border-b border-border-card bg-[var(--bg-deep)] px-4 text-[13px] font-semibold text-[var(--text-secondary)] ${SESSION_ROW_GRID}`}
        >
          <span>Nhân vật</span>
          <span>Cuộc trò chuyện</span>
          <span>Tin nhắn</span>
          <span>Lần cuối</span>
          <span />
        </div>
        <ul className="divide-y divide-[var(--border-default)]">
          {group.sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onClick={onSelectSession}
              onDelete={onDeleteSession}
              isDeleting={deletingSessionId === session.id}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
