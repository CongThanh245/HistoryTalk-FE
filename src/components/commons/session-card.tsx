"use client";

import Image from "next/image";
import { ArrowRight, LoaderCircle, MessageSquareText, Trash2 } from "lucide-react";
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

/** Columns shared by the list header and each row (md+); phones stack the cells. */
export const SESSION_ROW_GRID = "md:grid md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_5.5rem_8rem_4.5rem] md:items-center md:gap-4";

interface SessionCardProps {
  session: ChatHistoryItem;
  onClick: (session: ChatHistoryItem) => void;
  onDelete?: (sessionId: string) => void;
  isDeleting?: boolean;
  showEvent?: boolean;
}

/** One conversation as a list row: who, what was said last, how long, when, then open. */
export function SessionCard({
  session,
  onClick,
  onDelete,
  isDeleting = false,
  showEvent = false,
}: SessionCardProps) {
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  return (
    <li
      onClick={() => onClick(session)}
      className={`group relative flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--bg-elevated)] ${SESSION_ROW_GRID}`}
    >
      {/* Character */}
      <div className="flex min-w-0 flex-1 items-center gap-3 md:flex-none">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--bg-deep)]">
          <Image
            src={isValidUrl(session.characterImage) ? session.characterImage! : "/card.jpg"}
            alt=""
            fill
            sizes="40px"
            className="object-cover object-top"
          />
        </div>
        <div className="min-w-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick(session);
            }}
            className="block max-w-full truncate text-left text-[15px] font-semibold text-content-heading after:absolute after:inset-0 focus-visible:outline-none group-hover:text-[var(--accent-gold)] focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-[var(--accent-gold)]"
          >
            {session.characterName}
          </button>
          <p className="truncate text-xs text-content-muted">{showEvent ? session.contextName : session.characterTitle}</p>
          {/* Phones: summary and meta under the name */}
          <p className="mt-1 line-clamp-1 text-[13px] text-[var(--text-secondary)] md:hidden">{session.lastMessage}</p>
          <p className="mt-0.5 text-xs text-content-subtle md:hidden">
            {session.messageCount} tin nhắn · {timeAgo(session.lastMessageAt)}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="hidden min-w-0 md:block">
        {session.sessionTitle && <p className="truncate text-[13px] font-medium text-content-heading">{session.sessionTitle}</p>}
        <p className="truncate text-[13px] text-[var(--text-tertiary)]">{session.lastMessage}</p>
      </div>

      {/* Messages */}
      <div className="hidden items-center gap-1.5 text-sm tabular-nums text-[var(--text-secondary)] md:flex">
        {session.messageCount}
        <MessageSquareText className="h-4 w-4 text-content-subtle" aria-label="tin nhắn" />
      </div>

      {/* When */}
      <div className="hidden whitespace-nowrap text-sm tabular-nums text-[var(--text-secondary)] md:block">{timeAgo(session.lastMessageAt)}</div>

      {/* Actions */}
      <div className="relative z-10 flex shrink-0 items-center justify-end gap-1">
        {onDelete && (
          <>
            <button
              type="button"
              disabled={isDeleting}
              aria-label="Xóa cuộc trò chuyện"
              title="Xóa"
              onClick={(e) => {
                e.stopPropagation();
                if (isDeleting) return;
                setDeleteOpen(true);
              }}
              className="grid h-8 w-8 place-items-center rounded-full text-content-subtle transition-all cursor-pointer hover:bg-[var(--status-danger-bg)] hover:text-accent-danger focus-visible:opacity-100 disabled:pointer-events-none disabled:opacity-70 md:opacity-0 md:group-hover:opacity-100"
            >
              {isDeleting ? <LoaderCircle className="h-4 w-4 animate-spin text-accent-danger" /> : <Trash2 className="h-4 w-4" />}
            </button>
            {/* React events bubble out of the dialog portal: keep its clicks from opening the conversation. */}
            <span className="contents" onClick={(e) => e.stopPropagation()}>
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
            </span>
          </>
        )}
        <ArrowRight className="hidden h-4 w-4 text-content-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-content-heading md:block" aria-hidden="true" />
      </div>
    </li>
  );
}
