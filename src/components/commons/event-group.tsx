"use client";

import { SwordIcon } from "@phosphor-icons/react";
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
    <div className="space-y-3">
      {/* Group header */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(201,162,77,0.12) 0%, rgba(163,81,57,0.08) 100%)",
            border: "1px solid rgba(201,162,77,0.2)",
          }}
        >
          <SwordIcon
            className="w-3.5 h-3.5"
            style={{ color: "var(--gold-on-light)" }}
          />
        </div>
        <div>
          <h2
            className="text-sm font-bold"
            style={{ color: "var(--content-heading)" }}
          >
            {group.contextName}
          </h2>
          <p className="text-[11px]" style={{ color: "var(--content-muted)" }}>
            {group.sessions.length} cuộc trò chuyện
          </p>
        </div>
        {/* Divider */}
        <div
          className="flex-1 h-px"
          style={{
            background:
              "linear-gradient(to right, var(--card-light-border), transparent)",
          }}
        />
      </div>

      {/* Sessions — xếp NGANG, wrap khi hết chỗ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
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
