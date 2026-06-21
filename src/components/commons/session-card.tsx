"use client";

import Image from "next/image";
import { ChatTextIcon, TimerIcon , CaretRightIcon, TrashIcon, CircleNotchIcon } from "@phosphor-icons/react";
import type { ChatHistoryItem } from "@/services/chat-history.service";
import { isValidUrl } from "@/lib/utils/url";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import * as React from "react";

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
  isDeleting?: boolean;
  showEvent?: boolean;
}

export function SessionCard({
  session,
  onClick,
  onDelete,
  isDeleting = false,
  showEvent = false,
}: SessionCardProps) {
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  return (
    <div
      onClick={() => onClick(session)}
      className="group relative w-full text-left flex items-start gap-3 rounded-xl border px-3 py-3 transition-all duration-200 cursor-pointer md:gap-4 md:px-4 md:py-3.5 md:hover:-translate-y-0.5"
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
        <>
          <button
            disabled={isDeleting}
            onClick={(e) => {
              e.stopPropagation();
              if (isDeleting) return;
              setDeleteOpen(true);
            }}
            className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-md transition-all cursor-pointer hover:bg-red-50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70 md:h-6 md:w-6 md:opacity-0 md:group-hover:opacity-100"
            style={{ color: "var(--content-subtle)" }}
          >
            {isDeleting ? (
              <CircleNotchIcon className="w-3.5 h-3.5 animate-spin text-red-500" />
            ) : (
              <TrashIcon className="w-3.5 h-3.5 hover:text-red-500 transition-colors" />
            )}
          </button>

          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title="Xóa cuộc trò chuyện?"
            description={`Cuộc trò chuyện "${session.sessionTitle || "này"}" sẽ bị xóa vĩnh viễn và không thể khôi phục.`}
            confirmLabel="Xóa"
            variant="danger"
            isPending={isDeleting}
            onConfirm={() => {
              onDelete(session.id);
            }}
          />
        </>
      )}
      {/* Avatar */}
      <div
        className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border md:h-11 md:w-11"
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
        <div className="mb-0.5 flex items-start justify-between gap-2">
          <div className="min-w-0 pr-7 md:pr-0">
            <p
              className="truncate text-sm font-bold leading-snug"
              style={{ color: "var(--content-heading)" }}
            >
              {session.characterName}
            </p>
            <p
              className="truncate text-[11px]"
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
          <div className="hidden shrink-0 items-center gap-1 sm:flex">
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
          className="mt-1 text-xs leading-relaxed line-clamp-1 italic md:mt-1.5 md:line-clamp-2"
          style={{ color: "var(--content-muted)" }}
        >
          &quot;{session.lastMessage}&quot;
        </p>

        {/* Footer */}
        <div className="mt-1.5 flex items-center justify-between md:mt-2">
          <div className="flex min-w-0 items-center gap-1.5">
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
                  className="max-w-[90px] truncate text-[11px] md:max-w-[140px]"
                  style={{ color: "var(--gold-on-light)" }}
                >
                  {session.sessionTitle}
                </span>
              </>
            )}
          </div>
          <div
            className="hidden items-center gap-1 text-[11px] font-semibold opacity-0 transition-opacity group-hover:opacity-100 md:flex"
            style={{ color: "var(--gold-on-light)" }}
          >
            Xem lại <CaretRightIcon className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
