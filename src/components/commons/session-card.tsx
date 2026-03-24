"use client";

import Image from "next/image";
import { ChatTextIcon, TimerIcon , CaretRightIcon, TrashIcon } from "@phosphor-icons/react";
import type { ChatHistoryItem } from "@/services/chat-history.service";
import { isValidUrl } from "@/lib/utils/url";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
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

interface SessionCardProps {
  session: ChatHistoryItem;
  onClick: (session: ChatHistoryItem) => void;
  onDelete?: (sessionId: string) => void;
  showEvent?: boolean;
}

export function SessionCard({
  session,
  onClick,
  onDelete,
  showEvent = false,
}: SessionCardProps) {
  return (
    <div
      onClick={() => onClick(session)}
      className="group relative w-full text-left flex items-start gap-4 px-5 py-4 rounded-xl border transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
      style={{
        background: "var(--card-light-bg)",
        borderColor: "var(--card-light-border)",
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{ boxShadow: "inset 0 0 0 1px rgba(201,162,77,0.3)" }}
      />
      {onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="absolute top-3 right-3 z-10 w-6 h-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:bg-red-50"
              style={{ color: "var(--content-subtle)" }}
            >
              <TrashIcon className="w-3.5 h-3.5 hover:text-red-500 transition-colors" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa cuộc trò chuyện?</AlertDialogTitle>
              <AlertDialogDescription>
                Cuộc trò chuyện "{session.sessionTitle || "này"}" sẽ bị xóa vĩnh
                viễn và không thể khôi phục.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                Hủy
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                }}
                className="bg-red-500 hover:bg-red-600"
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {/* Avatar */}
      <div
        className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border"
        style={{ borderColor: "var(--card-light-border)" }}
      >
        <Image
          src={isValidUrl(session.characterImage) ? session.characterImage! : "/card.jpg"}
          alt={session.characterName}
          fill
          className="object-cover object-top"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <div>
            <p
              className="text-sm font-bold leading-snug"
              style={{ color: "var(--content-heading)" }}
            >
              {session.characterName}
            </p>
            <p
              className="text-[11px]"
              style={{ color: "var(--content-muted)" }}
            >
              {session.characterTitle}
            </p>
            {showEvent && (
              <p
                className="text-[10px] font-medium mt-0.5"
                style={{ color: "var(--gold-on-light)" }}
              >
                {session.contextName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <TimerIcon
              className="w-3 h-3"
              style={{ color: "var(--content-subtle)" }}
            />
            <span
              className="text-[11px] whitespace-nowrap"
              style={{ color: "var(--content-subtle)" }}
            >
              {timeAgo(session.lastMessageAt)}
            </span>
          </div>
        </div>

        {/* Preview */}
        <p
          className="text-xs leading-relaxed line-clamp-2 mt-1.5 italic"
          style={{ color: "var(--content-muted)" }}
        >
          "{session.lastMessage}"
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <ChatTextIcon
              className="w-3 h-3"
              style={{ color: "var(--content-subtle)" }}
            />
            <span
              className="text-[11px]"
              style={{ color: "var(--content-subtle)" }}
            >
              {session.messageCount} tin nhắn
            </span>
            {session.sessionTitle && (
              <>
                <span style={{ color: "var(--content-subtle)" }}>·</span>
                <span
                  className="text-[11px] truncate max-w-[140px]"
                  style={{ color: "var(--gold-on-light)" }}
                >
                  {session.sessionTitle}
                </span>
              </>
            )}
          </div>
          <div
            className="flex items-center gap-1 text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "var(--gold-on-light)" }}
          >
            Xem lại <CaretRightIcon className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
