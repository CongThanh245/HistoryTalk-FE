"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import {
  CaretLeftIcon,
  CaretRightIcon,
  PlusIcon,
  ChatTextIcon,
  TimerIcon,
  ClockCounterClockwiseIcon,
} from "@phosphor-icons/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useCreateSession } from "@/features/chat/hooks";
import { ChatSession } from "@/services/chat.service";

interface ChatLeftPanelProps {
  characterId: string;
  contextId: string;
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  sessions: ChatSession[];
  isLoadingSessions: boolean;
  onNewSession: (sessionId: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function ChatLeftPanel({
  characterId,
  contextId,
  sessions,
  isLoadingSessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  isOpen,
  setIsOpen,
}: ChatLeftPanelProps) {
  const [showHint, setShowHint] = useState(false);

  const createSession = useCreateSession();

  useEffect(() => {
    const seen = localStorage.getItem("ht-chat-panel-hint");
    if (!seen) {
      const t = setTimeout(() => setShowHint(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (!showHint) return;
    const t = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(t);
  }, [showHint]);

  const dismissHint = () => {
    setShowHint(false);
    localStorage.setItem("ht-chat-panel-hint", "1");
  };

  const handleOpen = () => {
    setIsOpen(true);
    dismissHint();
  };

  const handleNewSession = () => {
    createSession.mutate(
      { contextId, characterId },
      { onSuccess: (session) => onNewSession(session.id) },
    );
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });

  const tooltipStyle = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    color: "var(--text-primary)",
    fontSize: 12,
  };

  return (
    <TooltipProvider delayDuration={0}>
      <>
        {/* Backdrop on mobile */}
        <div
          className={cn(
            "lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-[2px] transition-opacity duration-300",
            isOpen ? "opacity-100 visible" : "opacity-0 invisible"
          )}
          onClick={() => setIsOpen(false)}
        />

        <div
          className={cn(
            "shrink-0 h-full transition-all duration-300 z-50",
            "lg:relative absolute left-0 top-0 bottom-0",
            isOpen ? "w-[260px]" : "w-0 lg:w-[28px]",
          )}
        >
          <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={isOpen ? () => setIsOpen(false) : handleOpen}
              onMouseEnter={dismissHint}
              className={cn(
                "absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-10 flex items-center justify-center rounded-full border cursor-pointer transition-all duration-150 hover:scale-110",
                !isOpen && "hidden lg:flex",
              )}
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border-default)",
                color: "var(--text-secondary)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              {isOpen ? (
                <CaretLeftIcon className="w-3 h-3" />
              ) : (
                <CaretRightIcon className="w-3 h-3" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" style={tooltipStyle}>
            {isOpen ? "Đóng lịch sử" : "Xem lịch sử chat"}
          </TooltipContent>
        </Tooltip>

        {!isOpen && showHint && (
          <div
            className="hidden lg:absolute left-6 top-1/2 -translate-y-1/2 z-30 flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            <div
              className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rotate-45"
              style={{
                background: "var(--bg-elevated)",
                borderLeft: "1px solid var(--border-default)",
                borderBottom: "1px solid var(--border-default)",
              }}
            />
            <ClockCounterClockwiseIcon
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: "var(--accent-gold)" }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Xem lịch sử chat
            </span>
            <button
              onClick={dismissHint}
              className="text-[10px] ml-1 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: "var(--text-secondary)" }}
            >
              ✕
            </button>
          </div>
        )}

        {isOpen && (
          <div
            className="w-full h-full flex flex-col border-r shadow-2xl lg:shadow-none overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border-default)",
            }}
          >
            <div
              className="px-4 py-4 border-b shrink-0"
              style={{ borderColor: "var(--border-default)" }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: "var(--accent-gold)", opacity: 0.7 }}
              >
                Lịch sử trò chuyện
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {sessions.length} cuộc trò chuyện
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
              <div className="flex items-center justify-between mb-2 px-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Sessions
                </span>
                <button
                  onClick={handleNewSession}
                  disabled={createSession.isPending}
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md cursor-pointer transition-colors hover:bg-white/5"
                  style={{ color: "var(--accent-gold)" }}
                >
                  <PlusIcon className="w-3 h-3" />
                  {createSession.isPending ? "..." : "Mới"}
                </button>
              </div>

              {isLoadingSessions ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 rounded-lg animate-pulse"
                      style={{ background: "var(--card-light-hover)" }}
                    />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <p
                  className="text-[11px] text-center py-4"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Chưa có cuộc trò chuyện nào
                </p>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer border"
                    style={{
                      background:
                        activeSessionId === session.id
                          ? "var(--accent-gold-active-bg)"
                          : "transparent",
                      borderColor:
                        activeSessionId === session.id
                          ? "var(--border-strong)"
                          : "transparent",
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <ChatTextIcon
                        className="w-3.5 h-3.5 mt-0.5 shrink-0"
                        style={{
                          color:
                            activeSessionId === session.id
                              ? "var(--accent-gold)"
                              : "var(--text-secondary)",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[12px] font-semibold truncate"
                          style={{
                            color:
                              activeSessionId === session.id
                                ? "var(--accent-gold-soft)"
                                : "var(--text-primary)",
                          }}
                        >
                          {session.title || "Cuộc trò chuyện"}
                        </p>
                        <p
                          className="text-[10px] truncate mt-0.5"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {session.lastMessage}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <TimerIcon
                            className="w-2.5 h-2.5"
                            style={{ color: "var(--text-secondary)" }}
                          />
                          <span
                            className="text-[9px]"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {formatDate(session.lastMessageAt)} ·{" "}
                            {session.messageCount} tin
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div
              className="px-3 py-3 border-t shrink-0"
              style={{ borderColor: "var(--border-default)" }}
            >
              <button
                onClick={handleNewSession}
                disabled={createSession.isPending}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150"
                style={{
                  background: "var(--accent-gold-active-bg)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--accent-gold-soft)",
                }}
              >
                <PlusIcon className="w-3.5 h-3.5" />
                {createSession.isPending
                  ? "Đang tạo..."
                  : "Cuộc trò chuyện mới"}
              </button>
            </div>
          </div>
        )}
        </div>
      </>
    </TooltipProvider>
  );
}
