"use client";

import Image from "next/image";
import type { ChatMessage, ChatCharacter } from "@/services/chat.service";
import { SpeakerHighIcon, SpeakerXIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { HighlightedText } from "./HighlightedText";
import type { KeywordData } from "@/data/keywords";

interface MessageBubbleProps {
  message: ChatMessage;
  character: ChatCharacter;
  speak?: (text: string) => void;
  onKeywordSelect?: (kw: KeywordData) => void;
}

export function MessageBubble({
  message,
  character,
  speak,
  onKeywordSelect,
}: MessageBubbleProps) {
  const isUser = message.role === "USER";
  const [isSpeaking, setIsSpeaking] = useState(false);
  const userName = useAuthStore((s) => s.user?.userName ?? "Bạn");

  // Logic lấy chữ cái đầu
  const userInitial = userName.trim().charAt(0).toUpperCase();

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 px-4 mb-4">
        <div className="max-w-[70%] flex flex-col items-end gap-1.5">
          <div
            className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-lg"
            style={{
              // Phối màu Gradient Bronze -> Truffle (Cổ điển & Sang trọng)
              background: "var(--accent-bronze)",
              color: "white",
            }}
          >
            {message.content}
          </div>
          <span
            className="text-[10px] opacity-60"
            style={{ color: "var(--text-primary)" }}
          >
            {new Date(message.createdAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
        </div>

        {/* User Avatar - Chữ cái đầu với Glow nhẹ */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-auto border"
          style={{
            background: "var(--bg-elevated)",
            color: "var(--accent-gold-soft)",
            borderColor: "var(--accent-gold-glow)",
            boxShadow: "var(--shadow-gold)",
          }}
        >
          {userInitial}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 px-4 mb-4">
      {/* Character Avatar */}
      <div
        className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 mt-auto border-2"
        style={{ borderColor: "var(--accent-gold-soft)" }}
      >
        <Image
          src={character.imageUrl}
          alt={character.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="max-w-[75%] flex flex-col gap-1.5">
        <span
          className="text-[11px] font-bold px-1 tracking-wide"
          style={{ color: "--accent-gold" }}
        >
          {character.name.toUpperCase()}
        </span>
        <div
          className="relative px-4 py-3 pr-9 rounded-2xl rounded-tl-sm text-sm leading-relaxed border"
          style={{
            background: "var(--bg-surface)",
            color: "var(--text-on-dark)",
            borderColor: "var(--border-strong)",
          }}
        >
          {onKeywordSelect ? (
            <HighlightedText
              text={message.content}
              onKeywordSelect={onKeywordSelect}
            />
          ) : (
            message.content
          )}

          <button
            onClick={() => {
              if (isSpeaking) {
                speechSynthesis.cancel();
                setIsSpeaking(false);
              } else {
                speak?.(message.content);
                setIsSpeaking(true);
              }
            }}
            className="absolute bottom-2 right-2 transition-all duration-200 hover:scale-110"
            style={{
              color: isSpeaking ? "var(--accent-gold)" : "var(--text-muted)",
            }}
          >
            {isSpeaking ? (
              <SpeakerHighIcon size={18} weight="fill" />
            ) : (
              <SpeakerXIcon size={18} />
            )}
          </button>
        </div>
        <span
          className="text-[10px] px-1 opacity-60"
          style={{ color: "var(--text-primary)" }}
        >
          {new Date(message.createdAt).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </span>
      </div>
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────

export function TypingIndicator({ character }: { character: ChatCharacter }) {
  return (
    <div className="flex gap-2.5 px-4">
      <div
        className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border"
        style={{ borderColor: "var(--border-default)" }}
      >
        <Image
          src={character.imageUrl}
          alt={character.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span
          className="text-[10px] font-semibold px-1"
          style={{ color: "var(--accent-gold-soft)" }}
        >
          {character.name}
        </span>
        <div
          className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: "var(--text-secondary)",
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
