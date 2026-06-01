"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { ChatCharacter } from "@/services/chat.service";
import { useVoiceChatRest, type VoiceRestMessage } from "@/features/chat/useVoiceChatRest";
import { useVoiceChatStream, type VoiceMessage as VoiceStreamMessage } from "@/features/chat/useVoiceChatStream";
import { useVoiceChatWebSpeech, type WebSpeechMessage } from "@/features/chat/useVoiceChatWebSpeech";

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
  idle: "Nhấn và giữ để nói",
  recording: "🔴 Đang ghi âm... (thả để gửi)",
  processing_stt: "🎤 Đang nhận dạng giọng nói...",
  processing_chat: "🤔 Đang suy nghĩ...",
  processing_tts: "🔊 Đang chuẩn bị nói...",
  speaking: "💬 Đang trả lời...",
  thinking: "🤔 Đang suy nghĩ...",       // Streaming: đã hiện user text
  error: "⚠️ Lỗi — thử lại",
};

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

interface Avatar3DModalProps {
  character: ChatCharacter;
  sessionId: string;
  contextId: string;
  onClose: () => void;
  /** @deprecated use mode instead */
  useStream?: boolean; // true = streaming mode, false = REST mode
  mode?: VoiceMode; // "rest" | "stream" | "web-speech" (miễn phí, không API key)
}

// ── Main component ────────────────────────────────────────────────────────────

export function Avatar3DModal({ 
  character, 
  sessionId, 
  contextId, 
  onClose, 
  useStream = true,
  mode: modeProp
}: Avatar3DModalProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Internal mode state (can be toggled by user)
  // MVP: Luôn dùng web-speech (free) - ẩn toggle Pro/Free
  const [internalMode, setInternalMode] = useState<VoiceMode>("web-speech");
  
  // Update internal mode when prop changes
  useEffect(() => {
    if (modeProp) setInternalMode(modeProp);
  }, [modeProp]);
  
  // Determine active mode
  const mode = internalMode;

  // Use appropriate hook based on mode
  const restHook = useVoiceChatRest({
    sessionId,
    characterId: character.id,
    contextId,
    onError: (e) => setErrorMsg(e),
  });

  const streamHook = useVoiceChatStream({
    sessionId,
    characterId: character.id,
    contextId,
    onError: (e) => setErrorMsg(e),
  });

  const webSpeechHook = useVoiceChatWebSpeech({
    sessionId,
    characterId: character.id,
    contextId,
    onError: (e) => setErrorMsg(e),
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
    ttsAnalyserRef,
    isRecording,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interimText,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentSentence,
  } = activeHook as any;

  const isSpeaking = status === "speaking";
  
  // Lấy interim text cho hiển thị real-time (web-speech mode)
  const liveTranscript = interimText || currentSentence || "";

  // ── Hold-to-talk handlers ─────────────────────────────────────────────────

  const handlePointerDown = () => {
    if (status.startsWith("processing") || status === "speaking") return;
    setErrorMsg(null);
    startRecording();
  };

  const handlePointerUp = () => {
    if (isRecording) stopRecording();
  };

  // Stop recording if pointer leaves button while held
  const handlePointerLeave = () => {
    if (isRecording) stopRecording();
  };

  // ── Keyboard shortcut: Space = hold to talk ───────────────────────────────
  const spaceHeld = useRef(false);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !spaceHeld.current) {
        e.preventDefault();
        spaceHeld.current = true;
        if (!status.startsWith("processing") && status !== "speaking") {
          setErrorMsg(null);
          startRecording();
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        spaceHeld.current = false;
        if (isRecording) stopRecording();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [status, isRecording, startRecording, stopRecording]);

  // ── Render ────────────────────────────────────────────────────────────────

  const isBusy = status.startsWith("processing") || status === "speaking" || status === "thinking";

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
              {(isRecording || isBusy) && (
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: isRecording ? "#ef5350" : "#c9a84c",
                  animation: "pulse 1s ease-in-out infinite",
                }} />
              )}
              {errorMsg ?? STATUS_LABEL[status]}
            </div>

            {/* Mode Toggle - MVP: đã ẩn, luôn dùng web-speech (free) */}
            <div />

            {/* Close */}
            <button
              onClick={onClose}
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
            background: "radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.08) 0%, transparent 60%)",
          }}>
            <FBXCharacterViewer
              modelUrl={character.modelUrl ?? "/models/character.glb"}
              isSpeaking={isSpeaking}
              isListening={false}
              isRecording={isRecording}
              isProcessing={status.startsWith("processing") || status === "thinking"}
              ttsAnalyserRef={ttsAnalyserRef}
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

          {/* ── Transcript ── */}
          <div style={{ width: "100%", maxWidth: 600, padding: "8px 16px 0", flexShrink: 0 }}>
            <TranscriptFeed 
              messages={messages} 
              isThinking={status === "processing_chat" || status === "thinking"}
              interimText={isRecording ? liveTranscript : ""} // Chỉ hiện khi đang thu
            />
          </div>

          {/* ── Controls ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 20, padding: "16px 0 28px", flexShrink: 0,
          }}>
            {/* Hold-to-talk mic button */}
            <button
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              disabled={isBusy}
              title="Giữ để nói (hoặc giữ Space)"
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
              onClick={onClose}
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
            Giữ nút mic hoặc phím Space để nói
          </p>
        </div>
      </div>
    </>
  );
}
