"use client";

import Image from "next/image";
import { MessageSquare, Clock, ChevronRight } from "lucide-react";
import type { ChatHistoryItem } from "@/services/chat-history.service";

function timeAgo(iso: string) {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days  <  7) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface SessionCardProps {
  session: ChatHistoryItem;
  onClick: (session: ChatHistoryItem) => void;
  /** Có hiện tên sự kiện không — dùng khi render ngoài EventGroup */
  showEvent?: boolean;
}

export function SessionCard({ session, onClick, showEvent = false }: SessionCardProps) {
  return (
    <button
      onClick={() => onClick(session)}
      className="group relative w-full text-left flex items-start gap-4 px-5 py-4 rounded-xl border transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
      style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{ boxShadow: "inset 0 0 0 1px rgba(201,162,77,0.3)" }}
      />

      {/* Avatar */}
      <div
        className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border"
        style={{ borderColor: "var(--card-light-border)" }}
      >
        <Image
          src={session.characterImage}
          alt={session.characterName}
          fill
          className="object-cover object-top"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <div>
            <p className="text-sm font-bold leading-snug" style={{ color: "var(--content-heading)" }}>
              {session.characterName}
            </p>
            <p className="text-[11px]" style={{ color: "var(--content-muted)" }}>
              {session.characterTitle}
            </p>
            {showEvent && (
              <p className="text-[10px] font-medium mt-0.5" style={{ color: "var(--gold-on-light)" }}>
                {session.contextName} 
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3" style={{ color: "var(--content-subtle)" }} />
            <span className="text-[11px] whitespace-nowrap" style={{ color: "var(--content-subtle)" }}>
              {timeAgo(session.lastMessageAt)}
            </span>
          </div>
        </div>

        {/* Preview */}
        <p className="text-xs leading-relaxed line-clamp-2 mt-1.5 italic" style={{ color: "var(--content-muted)" }}>
          "{session.lastMessage}"
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" style={{ color: "var(--content-subtle)" }} />
            <span className="text-[11px]" style={{ color: "var(--content-subtle)" }}>
              {session.messageCount} tin nhắn
            </span>
            {session.sessionTitle && (
              <>
                <span style={{ color: "var(--content-subtle)" }}>·</span>
                <span className="text-[11px] truncate max-w-[140px]" style={{ color: "var(--gold-on-light)" }}>
                  {session.sessionTitle}
                </span>
              </>
            )}
          </div>
          <div
            className="flex items-center gap-1 text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "var(--gold-on-light)" }}
          >
            Xem lại <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </button>
  );
}