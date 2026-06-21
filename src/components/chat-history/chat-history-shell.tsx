"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useChatHistory, useDeleteSession } from "@/features/chat/hooks";
import type { ChatHistorySession } from "@/services/chat.service";
import { useAuthStore } from "@/store/auth.store";

import { ChatHistoryEmptyState } from "./chat-history-empty-state";
import { ChatHistoryFilters } from "./chat-history-filters";
import { ChatHistoryHeader } from "./chat-history-header";
import { ChatHistoryList } from "./chat-history-list";
import { ChatHistorySkeleton } from "./chat-history-skeleton";

type ChatHistoryItem = ChatHistorySession;

export function ChatHistoryShell() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [search, setSearch] = useState("");
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const { data: allGroups = [], isLoading } = useChatHistory();
  const deleteSession = useDeleteSession();

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return allGroups;

    return allGroups
      .map((group) => ({
        ...group,
        sessions: group.sessions.filter(
          (session) =>
            session.characterName.toLowerCase().includes(keyword) ||
            group.contextName.toLowerCase().includes(keyword) ||
            session.lastMessage.toLowerCase().includes(keyword),
        ),
      }))
      .filter((group) => group.sessions.length > 0);
  }, [allGroups, search]);

  const totalSessions = filtered.reduce(
    (acc, group) => acc + group.sessions.length,
    0,
  );
  const hasFilter = !!search.trim();

  const handleSelectSession = (session: ChatHistoryItem) => {
    router.push(
      `/chat/${session.characterId}?contextId=${session.contextId}&sessionId=${session.id}`,
    );
  };

  const handleDeleteSession = (sessionId: string) => {
    if (deleteSession.isPending) return;
    setDeletingSessionId(sessionId);
    deleteSession.mutate(sessionId, {
      onSettled: () => setDeletingSessionId(null),
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-3 py-4 md:px-6 md:py-8">
        <ChatHistoryHeader totalSessions={totalSessions} />

        <ChatHistoryFilters search={search} onSearchChange={setSearch} />

        {!isAuthenticated ? (
          <ChatHistoryEmptyState hasFilter={hasFilter} isNotAuthenticated={true} />
        ) : isLoading ? (
          <ChatHistorySkeleton />
        ) : filtered.length === 0 ? (
          <ChatHistoryEmptyState hasFilter={hasFilter} />
        ) : (
          <ChatHistoryList
            groups={filtered}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            deletingSessionId={deletingSessionId}
          />
        )}
      </div>
    </div>
  );
}
