"use client";

import Image from "next/image";
import type { ChatMessage, ChatCharacter } from "@/services/chat.service";
import { SpeakerHighIcon, SpeakerXIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";

interface MessageBubbleProps {
  message: ChatMessage;
  character: ChatCharacter;
  speak?: (text: string) => void;
}

export function MessageBubble({
  message,
  character,
  speak,
}: MessageBubbleProps) {
  const isUser = message.role === "USER";
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const userName = useAuthStore((s) => s.user?.userName ?? "bạn");

  if (isUser) {
    return (
      <div className="flex justify-end gap-2.5 px-4">
        <div className="max-w-[65%] flex flex-col items-end gap-1">
          <div
            className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
            style={{
              background: "var(--accent-gold)",
              color: "var(--bg-deep)",
              boxShadow: "0 2px 12px var(--accent-gold-glow)",
            }}
          >
            {message.content}
          </div>
          <span
            className="text-[10px]"
            style={{ color: "var(--text-secondary)" }}
          >
            {formatTime(message.createdAt)}
          </span>
        </div>

        {/* User avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-auto"
          style={{
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
          }}
        >
          {userName.charAt(0).toUpperCase()}        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 px-4">
      {/* Character avatar */}
      <div
        className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 mt-auto border"
        style={{ borderColor: "var(--border-default)" }}
      >
        <Image
          src={character.imageUrl}
          alt={character.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="max-w-[65%] flex flex-col gap-1">
        <span
          className="text-[10px] font-semibold px-1"
          style={{ color: "var(--accent-gold-soft)" }}
        >
          {character.name}
        </span>
        <div
          className="relative px-4 py-2.5 pr-8 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
          style={{
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
          }}
        >
          {message.content}

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
            className="absolute bottom-1 right-1 opacity-60 hover:opacity-100 transition"
          >
            {isSpeaking ? (
              <SpeakerHighIcon size={16} />
            ) : (
              <SpeakerXIcon size={16} />
            )}
          </button>
        </div>
        <span
          className="text-[10px] px-1"
          style={{ color: "var(--text-secondary)" }}
        >
          {formatTime(message.createdAt)}
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
