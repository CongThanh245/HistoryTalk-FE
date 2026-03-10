"use client";

// components/room-view/RoomChatPlaceholder.tsx
// Placeholder cho chat panel — thay bằng component chat thật khi nối API

import React from "react";
import { X, MessageCircle, Send } from "lucide-react";
import type { RoomHotspot } from "@/services/room.service";

interface RoomChatPlaceholderProps {
  hotspot: RoomHotspot;
  onClose: () => void;
}

export function RoomChatPlaceholder({
  hotspot,
  onClose,
}: RoomChatPlaceholderProps) {
  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: "var(--bg-deep)",
        borderLeft: "1px solid rgba(201,162,77,0.2)",
      }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
        style={{
          background: "rgba(14,26,43,0.95)",
          borderBottom: "1px solid rgba(201,162,77,0.15)",
        }}
      >
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
          style={{ border: "2px solid var(--accent-gold)" }}
        >
          <img
            src={hotspot.spriteUrl}
            alt={hotspot.characterName}
            className="w-full h-full object-cover object-top"
            style={{ filter: "sepia(20%)" }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-bold truncate"
            style={{ color: "var(--accent-gold-soft)" }}
          >
            {hotspot.characterName}
          </p>
          <p
            className="text-xs truncate"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            {hotspot.title}
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* System message */}
        <div className="text-center">
          <span
            className="text-xs px-3 py-1 rounded-full"
            style={{
              background: "rgba(201,162,77,0.1)",
              color: "rgba(201,162,77,0.7)",
            }}
          >
            Bạn đang trò chuyện với {hotspot.characterName}
          </span>
        </div>

        {/* Character greeting message */}
        <div className="flex gap-2.5">
          <div
            className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5"
            style={{ border: "1.5px solid rgba(201,162,77,0.4)" }}
          >
            <img
              src={hotspot.spriteUrl}
              alt=""
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="flex-1">
            <div
              className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,245,220,0.9)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p className="italic">"{hotspot.greeting}"</p>
            </div>
            <p
              className="text-xs mt-1 ml-1"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {hotspot.characterName}
            </p>
          </div>
        </div>

        {/* TODO placeholder */}
        <div
          className="mx-auto max-w-[220px] text-center py-6 px-4 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px dashed rgba(201,162,77,0.2)",
          }}
        >
          <MessageCircle
            size={24}
            className="mx-auto mb-2"
            style={{ color: "rgba(201,162,77,0.4)" }}
          />
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            Kết nối AI chat để trò chuyện
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(201,162,77,0.4)" }}>
            POST /chat/sessions
          </p>
        </div>
      </div>

      {/* Input area */}
      <div
        className="flex-shrink-0 p-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(201,162,77,0.2)",
          }}
        >
          <input
            type="text"
            placeholder={`Hỏi ${hotspot.characterName}...`}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{
              color: "rgba(255,255,255,0.7)",
            }}
            disabled
          />
          <button
            className="p-1.5 rounded-lg opacity-40"
            style={{ color: "var(--accent-gold)" }}
            disabled
          >
            <Send size={15} />
          </button>
        </div>
        <p
          className="text-center text-xs mt-2"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          // TODO: nối vào useChat hook
        </p>
      </div>
    </div>
  );
}
