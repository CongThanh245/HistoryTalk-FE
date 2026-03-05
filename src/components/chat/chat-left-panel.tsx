"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, MessageSquare, Clock, History } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import type { ChatSession, ChatEvent } from "@/services/chat.service";
import { MOCK_EVENT, MOCK_SESSIONS } from "./chat.mock";

interface ChatLeftPanelProps {
  characterId: string;
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
}

export function ChatLeftPanel({
  characterId,
  activeSessionId,
  onSelectSession,
  onNewSession,
}: ChatLeftPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Hiện hint lần đầu sau 800ms nếu chưa từng thấy
  useEffect(() => {
    const seen = localStorage.getItem("ht-chat-panel-hint");
    if (!seen) {
      const t = setTimeout(() => setShowHint(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  // Tự tắt hint sau 4s
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

  const event: ChatEvent = MOCK_EVENT;
  const sessions: ChatSession[] = MOCK_SESSIONS.filter((s) => s.characterId === characterId);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

  const tooltipStyle = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    color: "var(--text-primary)",
    fontSize: 12,
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className="relative flex shrink-0 h-full transition-all duration-250"
        style={{ width: isOpen ? 260 : 28 }}
      >
        {/* Toggle — chỉ có mũi tên, không có viền/column khi đóng */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={isOpen ? () => setIsOpen(false) : handleOpen}
              onMouseEnter={dismissHint}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-10 flex items-center justify-center rounded-full border cursor-pointer transition-all duration-150 hover:scale-110"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border-default)",
                color: "var(--text-secondary)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              {isOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" style={tooltipStyle}>
            {isOpen ? "Đóng lịch sử" : "Xem lịch sử chat"}
          </TooltipContent>
        </Tooltip>

        {/* Hint popup lần đầu */}
        {!isOpen && showHint && (
          <div
            className="absolute left-6 top-1/2 -translate-y-1/2 z-30 flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            {/* Arrow */}
            <div
              className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rotate-45"
              style={{
                background: "var(--bg-elevated)",
                borderLeft: "1px solid var(--border-default)",
                borderBottom: "1px solid var(--border-default)",
              }}
            />
            <History className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent-gold)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
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

        {/* Panel mở */}
        {isOpen && (
          <div
            className="w-full h-full flex flex-col border-r overflow-hidden"
            style={{ background: "var(--abyssal-blue)", borderColor: "var(--border-default)" }}
          >
            {/* Header */}
            <div className="px-4 py-4 border-b shrink-0" style={{ borderColor: "var(--border-default)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--accent-gold)", opacity: 0.7 }}>
                Bối cảnh
              </p>
              <h3 className="text-sm font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
                {event.title}
              </h3>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Năm {event.year}
              </p>
            </div>

            {/* Sessions */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                  Lịch sử chat
                </span>
                <button
                  onClick={onNewSession}
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md cursor-pointer transition-colors hover:bg-white/5"
                  style={{ color: "var(--accent-gold)" }}
                >
                  <Plus className="w-3 h-3" /> Mới
                </button>
              </div>

              {sessions.length === 0 ? (
                <p className="text-[11px] text-center py-4" style={{ color: "var(--text-secondary)" }}>
                  Chưa có cuộc trò chuyện nào
                </p>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer border"
                    style={{
                      background: activeSessionId === session.id ? "var(--accent-gold-active-bg)" : "transparent",
                      borderColor: activeSessionId === session.id ? "rgba(201,162,77,0.3)" : "transparent",
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare
                        className="w-3.5 h-3.5 mt-0.5 shrink-0"
                        style={{ color: activeSessionId === session.id ? "var(--accent-gold)" : "var(--text-secondary)" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold truncate" style={{ color: activeSessionId === session.id ? "var(--accent-gold-soft)" : "var(--text-primary)" }}>
                          {session.title}
                        </p>
                        <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
                          {session.lastMessage}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-2.5 h-2.5" style={{ color: "var(--text-secondary)" }} />
                          <span className="text-[9px]" style={{ color: "var(--text-secondary)" }}>
                            {formatDate(session.lastMessageAt)} · {session.messageCount} tin
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* New chat CTA */}
            <div className="px-3 py-3 border-t shrink-0" style={{ borderColor: "var(--border-default)" }}>
              <button
                onClick={onNewSession}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150"
                style={{
                  background: "linear-gradient(135deg, rgba(201,162,77,0.12) 0%, rgba(163,81,57,0.08) 100%)",
                  border: "1px solid rgba(201,162,77,0.2)",
                  color: "var(--accent-gold-soft)",
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                Cuộc trò chuyện mới
              </button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}