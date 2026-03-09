// components/chat-history/chat-history-list.tsx
// ✅ Không cần "use client" — nhận data đã filtered từ Shell
// Nếu EventGroup dùng onClick thì nó tự khai báo "use client" bên trong

import { EventGroup } from "@/components/commons/event-group";
import type { ChatHistoryGroup, ChatHistorySession } from "@/services/chat.service";

// Alias cho nhất quán với codebase cũ
type ChatHistoryItem = ChatHistorySession;

interface ChatHistoryListProps {
  groups: ChatHistoryGroup[];
  onSelectSession: (session: ChatHistoryItem) => void;
  onDeleteSession: (sessionId: string) => void;
}

export function ChatHistoryList({
  groups,
  onSelectSession,
  onDeleteSession,
}: ChatHistoryListProps) {
  return (
    <div className="space-y-10 pb-16">
      {groups.map((group) => (
        <EventGroup
          key={group.contextId}
          group={group}
          onSelectSession={onSelectSession}
          onDeleteSession={onDeleteSession}
        />
      ))}
    </div>
  );
}