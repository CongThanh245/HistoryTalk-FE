"use client";

import Image from "next/image";
import { isValidUrl } from "@/lib/utils/url";
import type { ChatMessage, ChatCharacter } from "@/services/chat.service";
import { Volume2, VolumeX, Mic, Quote, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { MarkdownMessage } from "./MarkdownMessage";

interface MessageBubbleProps {
  message: ChatMessage;
  character: ChatCharacter;
  speak?: (text: string) => void;
  onViewQuote?: (quote: string) => void;
}

// AI đôi khi trả lời kèm 1 câu hỏi gợi mở, ngăn cách bởi "---".
// Tách thành các đoạn riêng để hiển thị như 2 tin nhắn liên tiếp thay vì dồn chung 1 bubble.
const ASSISTANT_SPLIT_PATTERN = /\s*-{3,}\s*/;

function splitAssistantContent(content: string): string[] {
  return content
    .split(ASSISTANT_SPLIT_PATTERN)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function MessageBubble({
  message,
  character,
  speak,
  onViewQuote,
}: MessageBubbleProps) {
  const isUser = message.role === "USER";
  const [isSpeaking, setIsSpeaking] = useState(false);
  const userName = useAuthStore((s) => s.user?.userName ?? "Bạn");
  const userAvatarUrl = useAuthStore((s) => s.user?.avatarUrl);

  // Logic lấy chữ cái đầu
  const userInitial = userName.trim().charAt(0).toUpperCase();
  const hasUserAvatar = isValidUrl(userAvatarUrl);
  const assistantParts = isUser ? [] : splitAssistantContent(message.content);
  const displayParts = assistantParts.length > 0 ? assistantParts : [message.content];

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 px-4 mb-4">
        <div className="max-w-[70%] flex flex-col items-end gap-1.5">
          <div
            className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-lg flex items-center gap-2 bg-(--accent-bronze) text-white"
          >
            {message.content}
            {message.messageType === "VOICE" && (
              <Mic size={12} className="opacity-70 fill-current" />
            )}
          </div>
          <span
            className="text-[10px] opacity-60 text-content-heading"
          >
            {new Date(message.createdAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
        </div>

        {/* User Avatar */}
        <div
          className="relative w-9 h-9 rounded-full flex items-center justify-center overflow-hidden text-sm font-bold shrink-0 mt-auto border bg-bg-elevated text-accent-gold-soft border-(--accent-gold-glow) shadow-(--shadow-gold)"
        >
          {hasUserAvatar ? (
            <Image
              src={userAvatarUrl!}
              alt={userName}
              fill
              className="object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            userInitial
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 px-4 mb-4">
      {/* Character Avatar */}
      <div
        className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 mt-auto border-2 bg-(--card-light-border) border-accent-gold-soft"
      >
        {isValidUrl(character.imageUrl) && (
          <Image
            src={character.imageUrl!}
            alt={character.name}
            fill
            className="object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
      </div>

      <div className="max-w-[75%] flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[11px] font-bold px-1 tracking-wide text-accent-gold"
          >
            {character.name.toUpperCase()}
          </span>
          {message.messageType === "VOICE" && (
            <Mic size={12} className="fill-current text-accent-gold" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          {displayParts.map((part, index) => {
            const isLastPart = index === displayParts.length - 1;

            return (
              <div
                key={index}
                className={cn(
                  "relative px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed border bg-bg-surface text-content-heading border-(--border-strong)",
                  isLastPart && "pr-9",
                )}
              >
                <MarkdownMessage text={part} />

                {isLastPart && (
                  <button
                    type="button"
                    aria-label={isSpeaking ? "Tắt đọc tin nhắn" : "Đọc tin nhắn"}
                    onClick={() => {
                      if (isSpeaking) {
                        speechSynthesis.cancel();
                        setIsSpeaking(false);
                      } else {
                        speak?.(message.content);
                        setIsSpeaking(true);
                      }
                    }}
                    className={cn(
                      "absolute bottom-2 right-2 transition-all duration-200 hover:scale-110",
                      isSpeaking ? "text-accent-gold" : "text-content-muted",
                    )}
                  >
                    {isSpeaking ? (
                      <Volume2 size={18} className="fill-current" />
                    ) : (
                      <VolumeX size={18} />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {message.quotes && message.quotes.length > 0 && (
          <MessageQuotes quotes={message.quotes} onViewQuote={onViewQuote} />
        )}

        <span
          className="text-[10px] px-1 opacity-60 text-content-heading"
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

// ── Nguồn trích dẫn AI đã dùng để trả lời ─────────────────

export function MessageQuotes({
  quotes,
  onViewQuote,
}: {
  quotes: string[];
  onViewQuote?: (quote: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="self-start">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border transition-colors cursor-pointer bg-bg-elevated border-border-default text-content-text"
      >
        <Quote size={12} className="fill-current" />
        {quotes.length} nguồn trích dẫn
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {isOpen && (
        <div
          className="mt-1.5 flex flex-col gap-1.5 rounded-xl border px-3 py-2 bg-bg-elevated border-border-default"
        >
          {quotes.map((quote, i) => (
            <div key={i} className="flex flex-col gap-1">
              <blockquote
                className="text-xs leading-relaxed pl-2 border-l-2 border-accent-gold-soft text-content-text"
              >
                {quote}
              </blockquote>
              {onViewQuote && (
                <button
                  type="button"
                  onClick={() => onViewQuote(quote)}
                  className="self-start text-[11px] font-medium pl-2 hover:underline cursor-pointer text-accent-gold"
                >
                  Xem trong tài liệu
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────

export function TypingIndicator({ character }: { character: ChatCharacter }) {
  return (
    <div className="flex gap-2.5 px-4">
      <div
        className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border bg-(--card-light-border) border-border-default"
      >
        {isValidUrl(character.imageUrl) && (
          <Image
            src={character.imageUrl!}
            alt={character.name}
            fill
            className="object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span
          className="text-[10px] font-semibold px-1 text-accent-gold-soft"
        >
          {character.name}
        </span>
        <div
          className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1 bg-bg-elevated border border-border-default"
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-content-text"
              style={{
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
