"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { ChatCharacter } from "@/services/chat.service";
import { useVoiceChat, VoiceStatus } from "@/features/chat/useVoiceChat";
import { queryKeys } from "@/shared/query-key";
import { useAuthStore } from "@/store/auth.store";
import { userService, type UserProfile } from "@/services/user.service";

const PROFILE_REFRESH_DELAYS_MS = [400, 1200, 2500, 5000];

function syncProfileUser(profile: UserProfile) {
  useAuthStore.getState().updateUser({
    userName: profile.userName,
    avatarUrl: profile.avatarUrl ?? undefined,
    fullName: profile.fullName,
    tierId: profile.tierId,
    tierTitle: profile.tierTitle,
    token: profile.token,
  });
}

interface VoiceChatModalProps {
  character: ChatCharacter;
  sessionId: string;
  contextId: string;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const STATUS_LABEL: Record<VoiceStatus, string> = {
  idle: "Nhấn để bắt đầu cuộc gọi",
  connecting: "Đang kết nối...",
  connected: "Đã kết nối",
  listening: "Đang lắng nghe...",
  processing: "Đang xử lý...",
  speaking: "Đang trả lời...",
  error: "Lỗi kết nối",
  ended: "Cuộc gọi đã kết thúc",
};

// ── Waveform animation ────────────────────────────────────

function Waveform({ active }: { active: boolean }) {
  const bars = Array.from({ length: 28 });
  return (
    <div className="flex items-center justify-center gap-[3px] h-10">
      {bars.map((_, i) => {
        const height = 8 + ((i * 11) % 24);
        const opacity = 0.7 + (((i * 7) % 30) / 100);

        return (
          <div
            key={i}
            className="rounded-full transition-all"
            style={{
              width: 3,
              backgroundColor: "var(--accent-gold, #c9a84c)",
              height: active ? `${height}px` : "4px",
              opacity: active ? opacity : 0.3,
              animation: active
                ? `waveBar ${0.4 + (i % 5) * 0.08}s ease-in-out infinite alternate`
                : "none",
              animationDelay: `${(i * 37) % 300}ms`,
            }}
          />
        );
      })}
    </div>
  );
}

// ── Ripple ring (khi đang nghe / nói) ────────────────────

function RippleRings({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-full border"
          style={{
            borderColor: "var(--accent-gold, #c9a84c)",
            opacity: 0,
            animation: `ripple 2s ease-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
    </>
  );
}

// ── Message transcript scroll ────────────────────────────

function TranscriptFeed({
  messages,
  currentTranscript,
}: {
  messages: ReturnType<typeof useVoiceChat>["messages"];
  currentTranscript: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentTranscript]);

  if (messages.length === 0 && !currentTranscript) return null;

  return (
    <div className="w-full max-h-40 overflow-y-auto scrollbar-hide space-y-2 px-1">
      {messages.slice(-6).map((m, i) => (
        <div
          key={i}
          className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`
              max-w-[80%] rounded-2xl px-3 py-1.5 text-sm leading-snug
              ${
                m.role === "user"
                  ? "bg-white/10 text-white/80 rounded-br-sm"
                  : "text-white/90 rounded-bl-sm"
              }
            `}
            style={
              m.role === "assistant"
                ? {
                    background:
                      "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))",
                    border: "1px solid rgba(201,168,76,0.2)",
                  }
                : {}
            }
          >
            {m.text}
          </div>
        </div>
      ))}

      {/* Transcript đang nhận dạng (real-time) */}
      {currentTranscript && (
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-br-sm px-3 py-1.5 text-sm text-white/50 bg-white/5 italic">
            {currentTranscript}
            <span className="inline-block w-1 h-3 ml-1 bg-white/40 animate-pulse" />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────

export function VoiceChatModal({
  character,
  sessionId,
  contextId,
  onClose,
}: VoiceChatModalProps) {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const hasStarted = useRef(false);
  const hasEnded = useRef(false);

  const {
    status,
    messages,
    isMuted,
    currentTranscript,
    callDuration,
    startCall,
    endCall,
    toggleMute,
  } = useVoiceChat({
    sessionId,
    characterId: character.id,
    contextId,
    onError: (e) => setErrorMsg(e),
  });

  // Auto-start khi modal mở
  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      startCall();
    }
  }, [startCall]);

  const isActive =
    status === "listening" || status === "speaking" || status === "processing";
  const isSpeaking = status === "speaking";
  const isListening = status === "listening";

  const refreshProfile = () => {
    PROFILE_REFRESH_DELAYS_MS.forEach((delay) => {
      window.setTimeout(() => {
        void userService.getProfile().then((profile) => {
          queryClient.setQueryData(queryKeys.profile.me, profile);
          syncProfileUser(profile);
        });
      }, delay);
    });
  };

  const handleEnd = () => {
    if (hasEnded.current) return;
    hasEnded.current = true;
    endCall();
    refreshProfile();
    onClose();
  };

  return (
    <>
      {/* Keyframes */}
      <style>{`
        @keyframes ripple {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        @keyframes waveBar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1.0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-[12px]"
      >
        {/* Card */}
        <div
          className="relative flex flex-col items-center gap-6 rounded-3xl p-8 w-[360px] max-w-[94vw] bg-gradient-to-b from-[rgba(30,25,15,0.98)] to-[rgba(15,12,8,0.98)] border border-[rgba(201,168,76,0.25)] shadow-[0_0_60px_rgba(201,168,76,0.08),0_24px_80px_rgba(0,0,0,0.7)]"
          style={{
            animation: "fadeSlideUp 0.35s ease both",
          }}
        >
          {/* Close (X) */}
          <button
            onClick={handleEnd}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
            aria-label="Đóng"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Status badge */}
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium tracking-wide bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] text-accent-gold"
          >
            {isActive && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-accent-gold"
                style={{
                  animation: "pulse 1s ease-in-out infinite",
                }}
              />
            )}
            {status === "error"
              ? (errorMsg ?? STATUS_LABEL.error)
              : STATUS_LABEL[status]}
          </div>

          {/* Avatar with rings */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            <RippleRings active={isActive} />
            <div
              className="relative w-24 h-24 rounded-full overflow-hidden"
              style={{
                border: `2px solid ${isSpeaking ? "rgba(201,168,76,0.7)" : "rgba(201,168,76,0.25)"}`,
                boxShadow: isSpeaking
                  ? "0 0 24px rgba(201,168,76,0.3)"
                  : "none",
                transition: "box-shadow 0.4s, border-color 0.4s",
              }}
            >
              {character.imageUrl ? (
                <img
                  src={character.imageUrl}
                  alt={character.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl font-bold bg-gradient-to-br from-[#2a2010] to-[#1a1508] text-accent-gold"
                >
                  {character.name[0]}
                </div>
              )}
            </div>
          </div>

          {/* Character info */}
          <div className="text-center space-y-0.5">
            <h2
              className="text-xl font-semibold tracking-wide text-accent-gold"
            >
              {character.name}
            </h2>
            <p className="text-sm text-white/50">{character.title}</p>
          </div>

          {/* Duration */}
          {isActive && (
            <p className="text-white/40 text-sm font-mono tabular-nums -mt-3">
              {formatDuration(callDuration)}
            </p>
          )}

          {/* Waveform */}
          <div className="w-full">
            <Waveform active={isListening} />
          </div>

          {/* Transcript */}
          <TranscriptFeed
            messages={messages}
            currentTranscript={currentTranscript}
          />

          {/* Controls */}
          <div className="flex items-center gap-5 mt-2">
            {/* Mute */}
            <button
              onClick={toggleMute}
              className="flex flex-col items-center gap-1 group"
              disabled={!isActive}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: isMuted
                    ? "rgba(201,168,76,0.2)"
                    : "rgba(255,255,255,0.08)",
                  border: isMuted
                    ? "1px solid rgba(201,168,76,0.5)"
                    : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {isMuted ? (
                  // Mic off icon
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(201,168,76,0.9)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                ) : (
                  // Mic on icon
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                )}
              </div>
              <span className="text-xs text-white/40">
                {isMuted ? "Bỏ tắt tiếng" : "Tắt tiếng"}
              </span>
            </button>

            {/* End call */}
            <button
              onClick={handleEnd}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 hover:brightness-110 bg-gradient-to-br from-[#c0392b] to-[#e74c3c] shadow-[0_4px_20px_rgba(231,76,60,0.4)]"
              >
                {/* Phone hang up */}
                <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                </svg>
              </div>
              <span className="text-xs text-white/40">Kết thúc</span>
            </button>

            {/* Speaker (placeholder for future speaker toggle) */}
            <button className="flex flex-col items-center gap-1 opacity-40 cursor-default">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center bg-white/8 border border-white/10"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              </div>
              <span className="text-xs text-white/40">Loa ngoài</span>
            </button>
          </div>

          {/* Error state */}
          {status === "error" && (
            <div className="w-full text-center">
              <p className="text-red-400/80 text-xs mb-3">
                {errorMsg ?? "Không thể kết nối. Vui lòng thử lại."}
              </p>
              <button
                onClick={() => {
                  setErrorMsg(null);
                  startCall();
                }}
                className="px-4 py-1.5 rounded-full text-sm transition-all hover:brightness-110 bg-[rgba(201,168,76,0.15)] border border-[rgba(201,168,76,0.3)] text-accent-gold"
              >
                Thử lại
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
