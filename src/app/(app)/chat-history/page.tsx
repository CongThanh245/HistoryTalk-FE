"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { History, CalendarDays } from "lucide-react";

// ── Tái sử dụng components đã có ─────────────────────────
import { EraFilter } from "@/components/commons/era-filter"; // ← từ trang events
import { SearchInput } from "@/components/commons/search-input"; // ← mới tách
import { EventGroup } from "@/components/commons/event-group"; // ← mới tách

// ── Types + mock ──────────────────────────────────────────
import type {
  ChatHistoryItem,
  ChatHistoryGroup,
} from "@/services/chat-history.service";
import { useChatHistory, useDeleteSession } from "@/features/chat/hooks";
import type { EventEra } from "@/services/event.service";
import { ERA_CONFIG } from "@/services/event.service";

// ── Empty state ───────────────────────────────────────────

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, rgba(201,162,77,0.10) 0%, rgba(163,81,57,0.06) 100%)",
          border: "1px solid rgba(201,162,77,0.15)",
        }}
      >
        <History
          className="w-7 h-7"
          style={{ color: "var(--gold-on-light)", opacity: 0.5 }}
        />
      </div>
      <div className="text-center">
        <p
          className="text-base font-semibold"
          style={{ color: "var(--content-heading)" }}
        >
          {hasFilter ? "Không tìm thấy kết quả" : "Chưa có lịch sử trò chuyện"}
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--content-muted)" }}>
          {hasFilter
            ? "Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm"
            : "Bắt đầu trò chuyện với nhân vật lịch sử để xem lại ở đây"}
        </p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────

export default function ChatHistoryPage() {
  const router = useRouter();
  const [era, setEra] = useState<EventEra>("all");
  const [search, setSearch] = useState("");

  // TODO: useQuery + chatHistoryService.getHistory() khi có API
  const { data: allGroups = [], isLoading } = useChatHistory();
  const deleteSession = useDeleteSession();

  // Tính counts cho EraFilter badge
  const eraCounts = (() => {
    const counts: Partial<Record<EventEra, number>> = {};
    allGroups.forEach((g) => {
      const [min, max] = ERA_CONFIG["all"].range; // all không cần check
      (
        Object.entries(ERA_CONFIG) as [
          EventEra,
          (typeof ERA_CONFIG)[EventEra],
        ][]
      ).forEach(([key, cfg]) => {
        if (key === "all") return;
        const [lo, hi] = cfg.range;
        // if (g.eventYear >= lo && g.eventYear <= hi) {
        //   counts[key] = (counts[key] ?? 0) + g.sessions.length;
        // }
      });
      counts["all"] = (counts["all"] ?? 0) + g.sessions.length;
    });
    return counts;
  })();

  // Filter theo era
  const eraFiltered =
    era === "all"
      ? allGroups
      : allGroups.filter((g) => {
          const [lo, hi] = ERA_CONFIG[era].range;
          // return g.eventYear >= lo && g.eventYear <= hi;
        });

  // Filter theo search
  const filtered = search.trim()
    ? eraFiltered
        .map((g) => ({
          ...g,
          sessions: g.sessions.filter(
            (s) =>
              s.characterName.toLowerCase().includes(search.toLowerCase()) ||
              g.contextName.toLowerCase().includes(search.toLowerCase()) ||
              s.lastMessage.toLowerCase().includes(search.toLowerCase()),
          ),
        }))
        .filter((g) => g.sessions.length > 0)
    : eraFiltered;

  const totalSessions = filtered.reduce((acc, g) => acc + g.sessions.length, 0);
  const hasFilter = era !== "all" || !!search.trim();

  const handleSelectSession = (session: ChatHistoryItem) => {
    // TODO: truyền sessionId khi có API
    router.push(`/chat/${session.characterId}`);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-8 ">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(201,162,77,0.15) 0%, rgba(163,81,57,0.10) 100%)",
                border: "1px solid rgba(201,162,77,0.25)",
              }}
            >
              <History
                className="w-5 h-5"
                style={{ color: "var(--gold-on-light)" }}
              />
            </div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: "var(--content-heading)" }}
              >
                Lịch sử trò chuyện
              </h1>
              <p
                className="text-sm mt-0.5"
                style={{ color: "var(--content-muted)" }}
              >
                Xem lại các cuộc trò chuyện với nhân vật lịch sử
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(201,162,77,0.08)",
              border: "1px solid rgba(201,162,77,0.18)",
              color: "var(--gold-on-light)",
            }}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            {totalSessions} cuộc trò chuyện
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 mb-8">
          {/* EraFilter — tái sử dụng từ trang events */}
          <EraFilter
            active={era}
            onChange={(e) => {
              setEra(e);
            }}
            counts={eraCounts}
          />

          {/* SearchInput — component mới tách */}
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm nhân vật, sự kiện, nội dung..."
          />
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          <EmptyState hasFilter={hasFilter} />
        ) : (
          <div className="space-y-10 pb-16">
            {filtered.map((group) => (
              <EventGroup
                key={group.contextId}
                group={group}
                onSelectSession={handleSelectSession}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
