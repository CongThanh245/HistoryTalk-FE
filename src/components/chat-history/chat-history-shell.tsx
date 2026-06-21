"use client";
// components/chat-history/chat-history-shell.tsx
// ✅ Client Component tối giản — chỉ giữ filter state
// Mọi UI tĩnh đã tách ra Server-compatible components

import { useState, useMemo } from "react";
import { useChatHistory, useDeleteSession } from "@/features/chat/hooks";
import { ERA_CONFIG } from "@/services/event.service";
import type { EventEra } from "@/services/event.service";
import type { ChatHistorySession } from "@/services/chat.service";

// ChatHistoryItem = ChatHistorySession (alias để code dễ đọc)
type ChatHistoryItem = ChatHistorySession;
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

import { ChatHistoryHeader } from "./chat-history-header";
import { ChatHistoryFilters } from "./chat-history-filters";
import { ChatHistoryList } from "./chat-history-list";
import { ChatHistoryEmptyState } from "./chat-history-empty-state";
import { ChatHistorySkeleton } from "./chat-history-skeleton";

export function ChatHistoryShell() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [era, setEra] = useState<EventEra>("all");
  const [search, setSearch] = useState("");
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // Data đã được prefetch trên server → hook này chỉ đọc từ cache
  const { data: allGroups = [], isLoading } = useChatHistory();
  const deleteSession = useDeleteSession();

  // ── Tính counts cho EraFilter badge ──────────────────
  const eraCounts = useMemo(() => {
    const counts: Partial<Record<EventEra, number>> = {};
    counts["all"] = allGroups.reduce((acc, g) => acc + g.sessions.length, 0);

    allGroups.forEach((g) => {
      (
        Object.entries(ERA_CONFIG) as [
          EventEra,
          (typeof ERA_CONFIG)[EventEra],
        ][]
      ).forEach(([key, cfg]) => {
        if (key === "all") return;
        const [lo, hi] = cfg.range;
        // Uncomment khi g.eventYear có sẵn:
        // if (g.eventYear >= lo && g.eventYear <= hi) {
        //   counts[key] = (counts[key] ?? 0) + g.sessions.length;
        // }
      });
    });
    return counts;
  }, [allGroups]);

  // ── Filter theo era + search ──────────────────────────
  const filtered = useMemo(() => {
    const eraFiltered =
      era === "all"
        ? allGroups
        : allGroups.filter((g) => {
            // const [lo, hi] = ERA_CONFIG[era].range;
            // return g.eventYear >= lo && g.eventYear <= hi;
            return true; // placeholder
          });

    if (!search.trim()) return eraFiltered;

    return eraFiltered
      .map((g) => ({
        ...g,
        sessions: g.sessions.filter(
          (s) =>
            s.characterName.toLowerCase().includes(search.toLowerCase()) ||
            g.contextName.toLowerCase().includes(search.toLowerCase()) ||
            s.lastMessage.toLowerCase().includes(search.toLowerCase()),
        ),
      }))
      .filter((g) => g.sessions.length > 0);
  }, [allGroups, era, search]);

  const totalSessions = filtered.reduce((acc, g) => acc + g.sessions.length, 0);
  const hasFilter = era !== "all" || !!search.trim();

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
      <div className="px-6 py-8">
        {/* ✅ Server-compatible: không cần props reaktif */}
        <ChatHistoryHeader totalSessions={totalSessions} />

        {/* ✅ Client: butuh state era & search */}
        <ChatHistoryFilters
          era={era}
          search={search}
          eraCounts={eraCounts}
          onEraChange={setEra}
          onSearchChange={setSearch}
        />

        {/* ✅ Loading → Skeleton, có data → List, rỗng → EmptyState */}
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
