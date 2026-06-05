"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { ChatCharacter } from "@/services/chat.service";
import { useVoiceChatRest, type VoiceRestMessage } from "@/features/chat/useVoiceChatRest";
import { useVoiceChatStream } from "@/features/chat/useVoiceChatStream";
import { useVoiceChatWebSpeech } from "@/features/chat/useVoiceChatWebSpeech";
import { queryKeys } from "@/shared/query-key";
import { useAuthStore } from "@/store/auth.store";
import { userService, type UserProfile } from "@/services/user.service";
import type { AnalyserLike } from "./FBXCharacterViewer";

// Dynamically import 3D viewer (no SSR)
const FBXCharacterViewer = dynamic(
  () => import("./FBXCharacterViewer").then((m) => ({ default: m.FBXCharacterViewer })),
  { ssr: false, loading: () => <ModelLoadingPlaceholder /> },
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function ModelLoadingPlaceholder() {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 12, color: "rgba(201,168,76,0.7)",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid rgba(201,168,76,0.3)",
        borderTopColor: "#c9a84c",
        animation: "spin 1s linear infinite",
      }} />
      <p style={{ fontSize: 13, opacity: 0.7, margin: 0 }}>Đang tải mô hình 3D...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  idle: "Bấm mic để nói",
  listening: "Đang nghe... bấm mic lần nữa để dừng",
  recording: " Đang ghi âm... (click để gửi)",
  processing: " Hãy đợi tôi 1 chút, tôi đang đào lại quá khứ...",
  processing_stt: " Đang nhận dạng giọng nói...",
  processing_chat: "Hãy đợi tôi 1 chút, tôi đang đào lại quá khứ...",
  processing_tts: " Đang chuẩn bị nói...",
  speaking: " Đang trả lời...",
  thinking: " Hãy đợi tôi 1 chút, tôi đang đào lại quá khứ...",
  error: " Lỗi — thử lại",
};

const PROFILE_REFRESH_DELAYS_MS = [300, 1000, 2500, 5000];

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

// ── Thinking indicator (typing dots) ───────────────────────────────────────────

function ThinkingIndicator() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "flex-start",
      padding: "4px 0",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "8px 16px",
        borderRadius: "16px 16px 16px 4px",
        background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))",
        border: "1px solid rgba(201,168,76,0.2)",
      }}>
        <span style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#c9a84c",
          animation: "thinkingBounce 0.6s ease-in-out infinite",
        }} />
        <span style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#c9a84c",
          animation: "thinkingBounce 0.6s ease-in-out infinite 0.15s",
        }} />
        <span style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#c9a84c",
          animation: "thinkingBounce 0.6s ease-in-out infinite 0.3s",
        }} />
      </div>
    </div>
  );
}

// ── Transcript feed ───────────────────────────────────────────────────────────

function TranscriptFeed({
  messages,
  isThinking,
  interimText,
}: {
  messages: VoiceRestMessage[];
  isThinking?: boolean;
  interimText?: string; // Text đang nói (real-time)
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimText]);

  const hasContent = messages.length > 0 || interimText;
  if (!hasContent) return null;

  return (
    <div style={{
      width: "100%", maxHeight: 140, overflowY: "auto",
      display: "flex", flexDirection: "column", gap: 6,
      padding: "0 4px", scrollbarWidth: "none",
    }}>
      {messages.slice(-4).map((m, i) => (
        <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
          <div style={{
            maxWidth: "80%",
            borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            padding: "6px 12px", fontSize: 13, lineHeight: 1.5,
            background: m.role === "user"
              ? "rgba(255,255,255,0.08)"
              : "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))",
            border: m.role === "assistant" ? "1px solid rgba(201,168,76,0.2)" : "none",
            color: m.role === "user" ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.9)",
          }}>
            {m.text}
          </div>
        </div>
      ))}
      
      {/* Hiển thị text đang nói (real-time) với style italic */}
      {interimText && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{
            maxWidth: "80%",
            borderRadius: "16px 16px 4px 16px",
            padding: "6px 12px", fontSize: 13, lineHeight: 1.5,
            background: "rgba(255,255,255,0.04)",
            border: "1px dashed rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.5)",
            fontStyle: "italic",
          }}>
            {interimText}
            <span style={{
              display: "inline-block",
              width: 2, height: 14,
              background: "rgba(255,255,255,0.5)",
              marginLeft: 4,
              animation: "pulse 0.8s ease-in-out infinite",
            }} />
          </div>
        </div>
      )}
      
      {isThinking && <ThinkingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

type VoiceMode = "rest" | "stream" | "web-speech";

type ActiveVoiceHook = {
  status: string;
  messages: VoiceRestMessage[];
  startRecording: () => Promise<void> | void;
  stopRecording: () => void;
  cancel?: () => void;
  ttsAnalyserRef: React.RefObject<AnalyserLike | null>;
  isRecording: boolean;
  interimText?: string;
  currentSentence?: string;
};

interface Avatar3DModalProps {
  variant?: "2d" | "3d";
  character: ChatCharacter;
  sessionId: string;
  onClose: () => void;
  onMessagesChange?: (messages: VoiceRestMessage[]) => void;
  /** @deprecated use mode instead */
  useStream?: boolean; // true = streaming mode, false = REST mode
  mode?: VoiceMode; // "rest" | "stream" | "web-speech" (miễn phí, không API key)
  onTokenUpdate?: (remainingTokens: number, promptTokens?: number, completionTokens?: number, messageType?: "TEXT" | "VOICE") => void;
}

// ── Main component ────────────────────────────────────────────────────────────

export function Avatar3DModal({ 
  variant = "3d",
  character, 
  sessionId, 
  onClose, 
  onMessagesChange,
  mode: modeProp,
  onTokenUpdate
}: Avatar3DModalProps) {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Audio nền hùng hồn
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Khởi tạo audio
    const audio = new Audio("/epic-bgm.mp3");
    // Nếu bạn chưa có file epic-bgm.mp3, nó sẽ dùng link dự phòng miễn phí từ Pixabay:
    // const audio = new Audio("https://cdn.pixabay.com/audio/2022/10/25/audio_40df035728.mp3");
    audio.loop = true;
    audio.volume = 0.15; // Âm lượng nhỏ làm nền
    bgmRef.current = audio;

    // Phát nhạc ngay khi mở modal (user đã tương tác bấm nút call)
    audio.play().catch(e => console.warn("Auto-play BGM blocked:", e));

    return () => {
      // Tắt nhạc khi đóng modal
      audio.pause();
      audio.src = "";
    };
  }, []);
  // Internal mode state (can be toggled by user)
  // MVP: Luôn dùng web-speech (free) - ẩn toggle Pro/Free
  const [internalMode] = useState<VoiceMode>("web-speech");
  
  // Determine active mode
  const mode = modeProp ?? internalMode;

  const syncRemainingTokens = useCallback(
    (remainingTokens: number, promptTokens?: number, completionTokens?: number, messageType?: "TEXT" | "VOICE") => {
      queryClient.setQueryData(
        queryKeys.profile.me,
        (old: UserProfile | undefined) =>
          old ? { ...old, token: remainingTokens } : old,
      );
      useAuthStore.getState().updateUser({ token: remainingTokens });
      onTokenUpdate?.(remainingTokens, promptTokens, completionTokens, messageType);
    },
    [queryClient, onTokenUpdate],
  );

  const refreshProfile = useCallback(() => {
    PROFILE_REFRESH_DELAYS_MS.forEach((delay) => {
      window.setTimeout(() => {
        void userService.getProfile().then((profile) => {
          queryClient.setQueryData(queryKeys.profile.me, profile);
          syncProfileUser(profile);
        });
      }, delay);
    });
  }, [queryClient]);

  // Use appropriate hook based on mode
  const restHook = useVoiceChatRest({
    sessionId,
    characterId: character.id,
    onError: (e) => setErrorMsg(e),
  });

  const streamHook = useVoiceChatStream({
    sessionId,
    characterId: character.id,
    onError: (e) => setErrorMsg(e),
  });

  const webSpeechHook = useVoiceChatWebSpeech({
    sessionId,
    characterId: character.id,
    onError: (e) => setErrorMsg(e),
    onProfileRefresh: refreshProfile,
    onTokenUpdate: syncRemainingTokens,
  });

  // Select active hook based on mode
  const activeHook = mode === "web-speech" ? webSpeechHook : 
                     mode === "stream" ? streamHook : 
                     restHook;

  const {
    status,
    messages,
    startRecording,
    stopRecording,
    cancel,
    ttsAnalyserRef,
    isRecording,
    interimText,
    currentSentence,
  } = activeHook as ActiveVoiceHook;

  const isSpeaking = status === "speaking";

  // Hiệu ứng âm lượng BGM: Nhỏ đi khi AI đang nói, to lên khi AI đang nghĩ
  useEffect(() => {
    if (!bgmRef.current) return;
    if (isSpeaking) {
      bgmRef.current.volume = 0.05; // AI nói -> Nhạc nền bé lại
    } else if (status === "thinking" || status === "processing_chat") {
      bgmRef.current.volume = 0.25; // AI đang nghĩ -> Nhạc nền dồn dập, to hơn
    } else {
      bgmRef.current.volume = 0.15; // Bình thường
    }
  }, [status, isSpeaking]);
  
  // Lấy interim text cho hiển thị real-time (web-speech mode)
  const liveTranscript = interimText || currentSentence || "";

  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  // ── Toggle Voice Recording handler ────────────────────────────────────────

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else if (status === "idle") {
      setErrorMsg(null);
      startRecording();
    }
  };

  const handleClose = () => {
    cancel?.();
    refreshProfile();
    onClose();
  };

  // ── Keyboard shortcut: Space = toggle voice ───────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (e.repeat) return;
        
        if (isRecording) {
          stopRecording();
        } else if (status === "idle") {
          setErrorMsg(null);
          startRecording();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [status, isRecording, startRecording, stopRecording]);

  // ── Render ────────────────────────────────────────────────────────────────

  const isBusy = status.startsWith("processing") || status === "speaking" || status === "thinking";
  const isListeningStatus = status === "listening";
  const is2D = variant === "2d";

  return (
    <>
      {/* Keyframes */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes micPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,83,80,0.5); }
          50%       { box-shadow: 0 0 0 16px rgba(239,83,80,0); }
        }
        @keyframes avatar2DRipple {
          0%   { transform: scale(0.85); opacity: 0.45; }
          100% { transform: scale(1.25); opacity: 0; }
        }
        @keyframes thinkingBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes progressShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Backdrop */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      }}>
        {/* Card */}
        <div style={{
          position: "relative", display: "flex", flexDirection: "column",
          alignItems: "center", width: "100vw", height: "100vh",
          background: "linear-gradient(180deg, rgba(20,16,10,1) 0%, rgba(10,8,4,1) 100%)",
          animation: "fadeSlideUp 0.4s ease both", overflow: "hidden",
        }}>

          {/* ── Header ── */}
          <div style={{
            width: "100%", display: "flex", alignItems: "center",
            justifyContent: "space-between", padding: "14px 20px",
            borderBottom: "1px solid rgba(201,168,76,0.12)", flexShrink: 0,
          }}>
            {/* Status badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "4px 12px", borderRadius: 20,
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.2)",
              color: "#c9a84c", fontSize: 12,
            }}>
              {(isRecording || isBusy || isListeningStatus) && (
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: isRecording ? "#ef5350" 
                    : (isBusy && !status.includes("speaking")) ? "#4fc3f7" 
                    : "#c9a84c",
                  animation: "pulse 1s ease-in-out infinite",
                }} />
              )}
              {errorMsg ?? (STATUS_LABEL[status] ?? STATUS_LABEL["idle"])}
            </div>

            {/* Mode Toggle - MVP: đã ẩn, luôn dùng web-speech (free) */}
            <div />

            {/* Close */}
            <button
              onClick={handleClose}
              style={{
                width: 32, height: 32, borderRadius: "50%", border: "none",
                background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", transition: "background 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
                (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)";
              }}
              aria-label="Đóng"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* ── 3D Viewport ── */}
          <div style={{
            width: "100%", flex: 1, position: "relative",
            display: is2D ? "flex" : undefined,
            alignItems: is2D ? "center" : undefined,
            justifyContent: is2D ? "center" : undefined,
            background: "radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.08) 0%, transparent 60%)",
          }}>
            {is2D ? (
              <div style={{
                position: "relative",
                width: "min(54vw, 320px)",
                aspectRatio: "1",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {(isSpeaking || isListeningStatus || isRecording) && (
                  <>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "50%",
                          border: "1px solid rgba(201,168,76,0.45)",
                          animation: "avatar2DRipple 2.4s ease-out infinite",
                          animationDelay: `${i * 0.45}s`,
                          opacity: 0,
                        }}
                      />
                    ))}
                  </>
                )}
                <div style={{
                  position: "relative",
                  width: "78%",
                  height: "78%",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: isSpeaking
                    ? "3px solid rgba(201,168,76,0.85)"
                    : "2px solid rgba(201,168,76,0.35)",
                  boxShadow: isSpeaking
                    ? "0 0 48px rgba(201,168,76,0.28)"
                    : "0 20px 70px rgba(0,0,0,0.35)",
                  transition: "border-color 0.25s, box-shadow 0.25s",
                  background: "linear-gradient(135deg, rgba(201,168,76,0.16), rgba(255,255,255,0.04))",
                }}>
                  {character.imageUrl ? (
                    <img
                      src={character.imageUrl}
                      alt={character.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#c9a84c",
                      fontSize: 72,
                      fontWeight: 700,
                    }}>
                      {character.name[0]}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <FBXCharacterViewer
                modelUrl={character.modelUrl ?? "/models/character.glb"}
                isSpeaking={status === "speaking"}
                isListening={status === "listening"}
                isRecording={status === "listening"}
                isProcessing={status.startsWith("processing") || status === "thinking"}
                ttsAnalyserRef={ttsAnalyserRef}
              />
            )}
          </div>

          {/* ── Transcript (below 3D, không che model) ── */}
          <div style={{
            width: "100%",
            maxWidth: 600,
            alignSelf: "center",
            padding: "0 16px",
            flexShrink: 0,
            maxHeight: 140,
            overflowY: "auto",
          }}>
            <TranscriptFeed 
              messages={messages} 
              isThinking={status === "processing_chat" || status === "thinking" || status === "processing"}
              interimText={isRecording ? liveTranscript : ""}
            />
          </div>

          {/* ── Character name ── */}
          <div style={{ textAlign: "center", padding: "8px 0 0", flexShrink: 0 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "0.02em", color: "#c9a84c" }}>
              {character.name}
            </h2>
            {character.title && (
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                {character.title}
              </p>
            )}
          </div>

          {/* ── Controls ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 20, padding: "16px 0 28px", flexShrink: 0,
          }}>
            {/* Toggle mic button */}
            <button
              onClick={handleMicClick}
              disabled={isBusy}
              title={isRecording ? "Bấm lần nữa để dừng và gửi" : "Bấm để nói"}
              style={{
                width: 72, height: 72, borderRadius: "50%",
                background: isRecording
                  ? "linear-gradient(135deg, #c62828, #ef5350)"
                  : "linear-gradient(135deg, rgba(201,168,76,0.3), rgba(201,168,76,0.15))",
                border: isRecording
                  ? "2px solid #ef5350"
                  : "2px solid rgba(201,168,76,0.4)",
                boxShadow: isRecording
                  ? "0 0 0 0 rgba(239,83,80,0.5)"
                  : "0 4px 24px rgba(201,168,76,0.2)",
                animation: isRecording ? "micPulse 1s ease-in-out infinite" : "none",
                cursor: isBusy ? "not-allowed" : "pointer",
                opacity: isBusy ? 0.4 : 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s, border 0.2s",
                userSelect: "none", WebkitUserSelect: "none",
                touchAction: "none",
              } as React.CSSProperties}
            >
              {/* Mic icon */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke={isRecording ? "#fff" : "#c9a84c"}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>

            {/* End / Close */}
            <button
              onClick={handleClose}
              title="Kết thúc"
              style={{
                width: 56, height: 56, borderRadius: "50%", border: "none",
                background: "linear-gradient(135deg, #c0392b, #e74c3c)",
                boxShadow: "0 4px 24px rgba(231,76,60,0.45)",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", transition: "filter 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.15)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1)"; }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
              </svg>
            </button>
          </div>

          {/* Hint text */}
          <p style={{
            margin: "0 0 16px", fontSize: 11,
            color: "rgba(255,255,255,0.2)", letterSpacing: "0.03em",
          }}>
            Bấm mic hoặc Space để nói, bấm lần nữa để dừng
          </p>
        </div>
      </div>
    </>
  );
}
