"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import {
  PlusIcon,
  ChatTextIcon,
  TimerIcon,
  ClockCounterClockwiseIcon,
  TrashIcon,
  CircleNotchIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCreateSession, useSoftDeleteSession } from "@/features/chat/hooks";
import { ChatSession } from "@/services/chat.service";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";

interface ChatLeftPanelProps {
  characterId: string;
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  sessions: ChatSession[];
  isLoadingSessions: boolean;
  onNewSession: (sessionId: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onDeleteSession?: (sessionId: string) => void;
}

export function ChatLeftPanel({
  characterId,
  sessions,
  isLoadingSessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  isOpen,
  setIsOpen,
  onDeleteSession,
}: ChatLeftPanelProps) {
  const [showHint, setShowHint] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const createSession = useCreateSession();
  const softDeleteSession = useSoftDeleteSession();

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
      { characterId },
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

  // Mobile bottom sheet content
  const renderSessionList = () => (
    <div className="flex flex-col h-full">
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
          <div className="space-y-1.5">
            {sessions.map((session, index) => (
              <div
                key={`session-${session.id ?? index}-${index}`}
                className="group relative w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer border"
                onClick={() => {
                  onSelectSession(session.id);
                  setIsOpen(false); // Close sheet on mobile
                }}
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
                <button
                  disabled={softDeleteSession.isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (softDeleteSession.isPending) return;
                    setDeleteSessionId(session.id);
                  }}
                  className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:bg-red-50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ color: "var(--content-subtle)" }}
                >
                  {softDeleteSession.isPending && deleteSessionId === session.id ? (
                    <CircleNotchIcon className="w-3.5 h-3.5 animate-spin text-red-500" />
                  ) : (
                    <TrashIcon className="w-3.5 h-3.5 hover:text-red-500 transition-colors" />
                  )}
                </button>
              </div>
            ))}
          </div>
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
  );

  return (
    <TooltipProvider delayDuration={0}>
      <>
        {/* Desktop: Sidebar */}
        <div
          className={cn(
            "hidden md:block shrink-0 h-full transition-all duration-300 z-50",
            "relative",
            isOpen ? "w-[260px]" : "w-0 md:w-[28px]",
          )}
        >
          <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={isOpen ? () => setIsOpen(false) : handleOpen}
              onMouseEnter={dismissHint}
              aria-label={isOpen ? "Ẩn lịch sử trò chuyện" : "Hiện lịch sử trò chuyện"}
              className={cn(
                "hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-10 items-center justify-center rounded-full border cursor-pointer transition-all duration-150 hover:scale-110",
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
            className="hidden md:absolute left-6 top-1/2 -translate-y-1/2 z-30 flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap"
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
            {renderSessionList()}
          </div>
        )}
        </div>

        {/* Mobile: Bottom Sheet - only render on mobile */}
        {isMobile && (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetContent
              side="bottom"
              className="h-[70vh] p-0 border-t"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border-default)",
              }}
            >
              <SheetTitle className="sr-only">Lịch sử trò chuyện</SheetTitle>
              {renderSessionList()}
            </SheetContent>
          </Sheet>
        )}

        <ConfirmDialog
          open={!!deleteSessionId}
          onOpenChange={(open) => !open && setDeleteSessionId(null)}
          title="Xóa cuộc trò chuyện?"
          description="Cuộc trò chuyện này sẽ bị xóa vĩnh viễn và không thể khôi phục."
          confirmLabel="Xóa"
          variant="danger"
          isPending={softDeleteSession.isPending}
          onConfirm={() => {
            if (deleteSessionId && !softDeleteSession.isPending) {
              const sessionId = deleteSessionId;
              softDeleteSession.mutate(sessionId, {
                onSuccess: () => {
                  onDeleteSession?.(sessionId);
                  setDeleteSessionId(null);
                },
              });
            }
          }}
        />
      </>
    </TooltipProvider>
  );
}
