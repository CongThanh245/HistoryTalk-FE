"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  CaretRightIcon,
  ChatTextIcon,
  Flame,
  TimerIcon,
} from "@phosphor-icons/react";
import { useChatHistory } from "@/features/chat/hooks";
import { isValidUrl } from "@/lib/utils/url";
import { useAuthStore } from "@/store/auth.store";
import type { ChatHistorySession } from "@/services/chat.service";

function SkeletonRow() {
  return (
    <div
      className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border animate-pulse"
      style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg" style={{ background: "var(--card-light-border)" }} />
        <div className="space-y-2">
          <div className="h-3 w-40 rounded" style={{ background: "var(--card-light-border)" }} />
          <div className="h-2.5 w-28 rounded" style={{ background: "var(--card-light-border)" }} />
        </div>
      </div>
      <div className="h-5 w-14 rounded-full" style={{ background: "var(--card-light-border)" }} />
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;

  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function RecentChatRow({ session }: { session: ChatHistorySession }) {
  const href = `/chat/${session.characterId}?contextId=${session.contextId}&sessionId=${session.id}`;

  return (
    <Link
      href={href}
      className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition-all duration-150 group"
      style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div
          className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border"
          style={{ borderColor: "var(--card-light-border)" }}
        >
          <Image
            src={isValidUrl(session.characterImage) ? session.characterImage : "/card.jpg"}
            alt={session.characterName}
            fill
            sizes="32px"
            className="object-cover object-top"
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium truncate" style={{ color: "var(--content-text)" }}>
            {session.sessionTitle || session.characterName}
          </p>
          <p className="text-[11px] sm:text-xs mt-0.5 truncate" style={{ color: "var(--content-muted)" }}>
            {session.lastMessage || session.contextName}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(160,120,40,0.10)",
            color: "var(--gold-on-light)",
          }}
        >
          <TimerIcon className="w-3 h-3" />
          {timeAgo(session.lastMessageAt)}
        </span>
        <span
          className="inline-flex sm:hidden items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(160,120,40,0.10)",
            color: "var(--gold-on-light)",
          }}
        >
          <ChatTextIcon className="w-3 h-3" />
          {session.messageCount}
        </span>
        <CaretRightIcon
          className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "var(--gold-on-light)" }}
        />
      </div>
    </Link>
  );
}

export function SuggestedQuiz() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: groups = [], isLoading } = useChatHistory();

  const recentSessions = useMemo(
    () =>
      groups
        .flatMap((group) => group.sessions)
        .sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime(),
        )
        .slice(0, 3),
    [groups],
  );

  return (
    <section>
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4" style={{ color: "var(--burning-flame)" }} />
          <h2 className="text-base font-semibold" style={{ color: "var(--content-heading)" }}>
            Gợi ý cho bạn
          </h2>
        </div>
        <Link
          href="/chat-history"
          className="flex items-center gap-1 text-xs"
          style={{ color: "var(--gold-on-light)" }}
        >
          Xem thêm <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {isAuthenticated && isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
        ) : recentSessions.length === 0 ? (
          <p
            className="text-sm text-center py-4"
            style={{ color: "var(--content-muted)" }}
          >
            Chưa có lịch sử trò chuyện gần đây
          </p>
        ) : (
          recentSessions.map((session) => (
            <RecentChatRow key={session.id} session={session} />
          ))
        )}
      </div>
    </section>
  );
}
