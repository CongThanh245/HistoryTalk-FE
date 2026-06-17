"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
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
  processing: "Đang lần theo dấu vết lịch sử...",
  processing_stt: " Đang nhận dạng giọng nói...",
  processing_chat: "Đang đối chiếu sử liệu...",
  processing_tts: " Đang chuẩn bị nói...",
  speaking: " Đang trả lời...",
  thinking: "Đang ghép lại bức tranh quá khứ...",
  error: " Lỗi — thử lại",
};

const THINKING_LABELS = [
  "Đang lần theo dấu vết lịch sử...",
  "Đang đối chiếu sử liệu...",
  "Đang mở lại một trang biên niên...",
  "Đang ghép lại bức tranh quá khứ...",
  "Đang chọn lời kể dễ hiểu nhất...",
  "Đang hỏi lại các nguồn ký ức...",
];

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
        <div
          key={i}
          className={[
            "avatar-message-row",
            m.role === "user" ? "avatar-message-row--user" : "avatar-message-row--assistant",
          ].join(" ")}
          style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}
        >
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

function ConversationDock({
  character,
  messages,
  isThinking,
  interimText,
  isRecording,
}: {
  character: ChatCharacter;
  messages: VoiceRestMessage[];
  isThinking?: boolean;
  interimText?: string;
  isRecording?: boolean;
}) {
  const hasContent = messages.length > 0 || Boolean(interimText);

  if (hasContent) {
    return (
      <TranscriptFeed
        messages={messages}
        isThinking={isThinking}
        interimText={interimText}
      />
    );
  }

  return (
    <div className="avatar-call-empty">
      <div className="avatar-call-empty__orb" aria-hidden="true">
        <span />
      </div>
      <div>
        <p className="avatar-call-empty__eyebrow">
          {isRecording ? "Đang nghe" : "Sẵn sàng trò chuyện"}
        </p>
        <h3>Hỏi {character.name} một câu</h3>
        <p>
          Một khoảng lặng trước câu chuyện. Lời thoại sẽ xuất hiện ở đây khi cuộc gọi bắt đầu.
        </p>
      </div>
      <div className="avatar-call-prompts">
        <span>Ông là ai?</span>
        <span>Sự kiện nổi bật?</span>
        <span>Bài học lịch sử?</span>
      </div>
    </div>
  );
}

/*
function RemovedModelDiagnosticBadge({ diagnostic }: { diagnostic: unknown }) {
  if (process.env.NODE_ENV !== "development" || !diagnostic) return null;

  const blendshapeNames = Object.keys(diagnostic.blendshapes);
  const sampleBones = diagnostic.bones.slice(0, 6).join(", ") || "none";
  const sampleBlendshapes = blendshapeNames.slice(0, 6).join(", ") || "none";

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        zIndex: 5,
        maxWidth: 360,
        padding: "8px 10px",
        borderRadius: 8,
        background: "rgba(0,0,0,0.68)",
        border: "1px solid rgba(201,168,76,0.3)",
        color: "rgba(255,255,255,0.82)",
        fontSize: 11,
        lineHeight: 1.45,
        pointerEvents: "none",
      }}
    >
      <div style={{ color: "#f0c85a", fontWeight: 700 }}>removed</div>
      <div>
        meshes {diagnostic.meshCount} | bones {diagnostic.bones.length} | morphs{" "}
        {blendshapeNames.length} | anims {diagnostic.animCount}
      </div>
      <div style={{ opacity: 0.72 }}>bones: {sampleBones}</div>
      <div style={{ opacity: 0.72 }}>morphs: {sampleBlendshapes}</div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

*/

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
  const [voiceVolume, setVoiceVolume] = useState(0);
  
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
  const isThinkingStatus = status.startsWith("processing") || status === "thinking";
  const [thinkingLabelIndex, setThinkingLabelIndex] = useState(0);

  useEffect(() => {
    if (!isThinkingStatus) {
      setThinkingLabelIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setThinkingLabelIndex((current) => (current + 1) % THINKING_LABELS.length);
    }, 1800);

    return () => window.clearInterval(interval);
  }, [isThinkingStatus]);

  const dynamicStatusLabel =
    errorMsg ??
    (isThinkingStatus
      ? THINKING_LABELS[thinkingLabelIndex]
      : STATUS_LABEL[status] ?? STATUS_LABEL["idle"]);

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
        @keyframes avatar3DRipple {
          0%, 100% {
            transform: translate(-50%, -50%) scale(calc(0.96 + var(--voice-volume, 0) * 0.08));
            opacity: calc(0.34 + var(--voice-volume, 0) * 0.26);
          }
          50% {
            transform: translate(-50%, -50%) scale(calc(1.03 + var(--voice-volume, 0) * 0.12));
            opacity: calc(0.58 + var(--voice-volume, 0) * 0.28);
          }
        }
        @keyframes thinkingBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes progressShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes callAura {
          0%, 100% { opacity: 0.45; transform: translateX(-50%) scaleX(0.92); }
          50% { opacity: 0.82; transform: translateX(-50%) scaleX(1.06); }
        }
        .avatar-call-body {
          width: 100%;
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
          gap: 28px;
          padding: 20px 28px 0;
          animation: callBodyEnter 0.52s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .avatar-call-viewport {
          width: 100%;
          min-height: 0;
          position: relative;
          overflow: hidden;
          border-radius: 18px;
          background:
            radial-gradient(ellipse at 50% 72%, rgba(201,168,76,0.14) 0%, rgba(201,168,76,0.04) 34%, transparent 62%),
            linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0));
          animation: viewportConnect 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .avatar-call-viewport::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: 10%;
          width: min(480px, 58%);
          height: 58px;
          transform: translateX(-50%);
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(201,168,76,0.28) 0%, rgba(201,168,76,0.1) 42%, transparent 72%);
          filter: blur(8px);
          animation: callAura 3.4s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
        }
        .avatar-call-viewport__connect-core {
          position: absolute;
          left: 50%;
          top: 50%;
          width: min(420px, 32vw);
          aspect-ratio: 1;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(circle, rgba(240,200,90,0.2) 0%, rgba(116,222,177,0.11) 32%, transparent 68%);
          filter: blur(18px);
          opacity: 0;
          animation: connectCore 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both;
        }
        .avatar-call-ripple {
          position: absolute;
          left: 50%;
          top: 50%;
          width: min(390px, 30vw);
          aspect-ratio: 1;
          border-radius: 50%;
          border: 1px solid rgba(201,168,76,0.48);
          box-shadow: inset 0 0 64px rgba(201,168,76,0.07), 0 0 36px rgba(201,168,76,0.14);
          animation: avatar3DRipple 2.8s ease-in-out infinite;
          animation-name: haloConnect, avatar3DRipple;
          animation-duration: 0.95s, 2.8s;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1), ease-in-out;
          animation-delay: 0.08s, 0.75s;
          animation-fill-mode: both, none;
          pointer-events: none;
          z-index: 0;
          mix-blend-mode: screen;
          transform-origin: center;
        }
        .avatar-call-ripple--listening {
          border-color: rgba(116, 222, 177, 0.7);
          box-shadow:
            inset 0 0 86px rgba(116, 222, 177, 0.13),
            0 0 56px rgba(116, 222, 177, 0.3),
            0 0 112px rgba(201,168,76,0.15);
          animation-duration: 0.8s, 1.65s;
        }
        .avatar-call-ripple--speaking {
          border-color: rgba(240,200,90,0.72);
          box-shadow:
            inset 0 0 calc(72px + var(--voice-volume, 0) * 44px) rgba(240,200,90,0.11),
            0 0 calc(48px + var(--voice-volume, 0) * 64px) rgba(240,200,90,calc(0.22 + var(--voice-volume, 0) * 0.28)),
            0 0 calc(96px + var(--voice-volume, 0) * 90px) rgba(201,168,76,calc(0.12 + var(--voice-volume, 0) * 0.18));
        }
        .avatar-call-identity {
          position: absolute;
          left: 28px;
          bottom: 22px;
          z-index: 2;
          max-width: min(420px, calc(100% - 56px));
          pointer-events: none;
          animation: identityEnter 0.72s cubic-bezier(0.16, 1, 0.3, 1) 0.22s both;
        }
        .avatar-call-identity h2 {
          margin: 0;
          color: #f0c85a;
          font-size: 26px;
          font-weight: 800;
          letter-spacing: 0;
          text-shadow: 0 8px 30px rgba(0,0,0,0.65);
        }
        .avatar-call-identity p {
          margin: 4px 0 0;
          color: rgba(255,255,255,0.62);
          font-size: 14px;
        }
        .avatar-call-transcript {
          width: 100%;
          min-width: 0;
          align-self: stretch;
          padding: 18px;
          overflow-y: auto;
          border: 1px solid rgba(201,168,76,0.16);
          border-radius: 18px;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.035)),
            rgba(11,9,5,0.76);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 80px rgba(0,0,0,0.28);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          animation: transcriptEnter 0.72s cubic-bezier(0.16, 1, 0.3, 1) 0.18s both;
        }
        .avatar-call-transcript > div {
          max-height: none !important;
          height: 100%;
        }
        .avatar-message-row {
          animation: messageIn 0.34s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .avatar-message-row--user {
          transform-origin: right center;
        }
        .avatar-message-row--assistant {
          transform-origin: left center;
        }
        .avatar-call-viewport--thinking::before {
          content: "";
          position: absolute;
          inset: 0 -8%;
          z-index: 0;
          pointer-events: none;
          background:
            linear-gradient(90deg, transparent 0%, rgba(255,244,196,0.34) 16%, rgba(240,200,90,0.5) 50%, rgba(255,244,196,0.26) 84%, transparent 100%) 0 16% / 100% 1px no-repeat,
            linear-gradient(90deg, transparent 0%, rgba(116,222,177,0.28) 20%, rgba(116,222,177,0.46) 52%, rgba(116,222,177,0.18) 82%, transparent 100%) 0 25% / 100% 1px no-repeat,
            linear-gradient(90deg, transparent 0%, rgba(240,200,90,0.22) 18%, rgba(255,244,196,0.42) 48%, rgba(240,200,90,0.2) 78%, transparent 100%) 0 37% / 100% 1px no-repeat,
            linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.24) 16%, rgba(240,200,90,0.4) 54%, rgba(201,168,76,0.2) 84%, transparent 100%) 0 52% / 100% 1px no-repeat,
            linear-gradient(90deg, transparent 0%, rgba(116,222,177,0.18) 22%, rgba(116,222,177,0.34) 50%, rgba(116,222,177,0.14) 80%, transparent 100%) 0 66% / 100% 1px no-repeat,
            linear-gradient(90deg, transparent 0%, rgba(255,244,196,0.18) 18%, rgba(240,200,90,0.3) 48%, rgba(255,244,196,0.12) 82%, transparent 100%) 0 80% / 100% 1px no-repeat;
          animation: thinkingTimeBands 2.2s ease-in-out infinite;
          opacity: 0.95;
          mix-blend-mode: screen;
        }
        .avatar-call-viewport--thinking::after {
          content: "";
          position: absolute;
          inset: 0 -12%;
          z-index: 0;
          pointer-events: none;
          background:
            repeating-linear-gradient(
              180deg,
              transparent 0,
              transparent 28px,
              rgba(255,244,196,0.05) 29px,
              transparent 31px,
              transparent 58px,
              rgba(116,222,177,0.04) 59px,
              transparent 61px
            );
          animation: thinkingScanField 3.4s linear infinite;
          opacity: 0.85;
          mix-blend-mode: screen;
        }
        .avatar-call-time-tunnel {
          position: absolute;
          inset: 0 -12%;
          z-index: 0;
          pointer-events: none;
          background:
            linear-gradient(90deg, transparent, rgba(255,244,196,0.22), transparent) 0 20% / 100% 1px no-repeat,
            linear-gradient(90deg, transparent, rgba(116,222,177,0.18), transparent) 0 33% / 100% 1px no-repeat,
            linear-gradient(90deg, transparent, rgba(240,200,90,0.2), transparent) 0 48% / 100% 1px no-repeat,
            linear-gradient(90deg, transparent, rgba(255,244,196,0.16), transparent) 0 73% / 100% 1px no-repeat;
          opacity: 0;
          mix-blend-mode: screen;
        }
        .avatar-call-viewport--thinking .avatar-call-time-tunnel {
          opacity: 1;
          animation: timeTunnelRush 1.6s ease-in-out infinite;
        }
        .avatar-call-time-tunnel::before,
        .avatar-call-time-tunnel::after {
          content: "";
          position: absolute;
          left: -8%;
          right: -8%;
          top: 12%;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(255,244,196,0.62) 48%, transparent 100%);
          box-shadow:
            0 44px 0 rgba(116,222,177,0.34),
            0 92px 0 rgba(240,200,90,0.42),
            0 148px 0 rgba(255,244,196,0.28),
            0 206px 0 rgba(116,222,177,0.22),
            0 278px 0 rgba(240,200,90,0.3);
          filter: drop-shadow(0 0 8px rgba(240,200,90,0.42));
          animation: timeTunnelLines 1.45s ease-in-out infinite;
        }
        .avatar-call-time-tunnel::after {
          top: 18%;
          opacity: 0.72;
          animation-delay: 0.45s;
          transform: translateX(16%);
        }
        .avatar-call-viewport--listening {
          box-shadow: inset 0 0 0 1px rgba(116,222,177,0.12), inset 0 0 80px rgba(116,222,177,0.04);
        }
        .avatar-call-viewport--speaking {
          box-shadow: inset 0 0 0 1px rgba(240,200,90,0.12), inset 0 0 92px rgba(240,200,90,0.05);
        }
        .avatar-call-model-layer {
          animation: none;
        }
        .avatar-call-viewport__time-streaks {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
          background:
            linear-gradient(90deg, transparent 0%, rgba(240,200,90,0.22) 48%, transparent 100%) 8% 18% / 46% 2px no-repeat,
            linear-gradient(90deg, transparent 0%, rgba(116,222,177,0.18) 48%, transparent 100%) 65% 27% / 34% 1px no-repeat,
            linear-gradient(90deg, transparent 0%, rgba(255,244,196,0.22) 48%, transparent 100%) 22% 41% / 58% 3px no-repeat,
            linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.2) 48%, transparent 100%) 72% 56% / 42% 2px no-repeat,
            linear-gradient(90deg, transparent 0%, rgba(116,222,177,0.14) 48%, transparent 100%) 14% 69% / 38% 1px no-repeat,
            linear-gradient(90deg, transparent 0%, rgba(240,200,90,0.16) 48%, transparent 100%) 54% 82% / 50% 2px no-repeat;
          filter: blur(0.3px);
          opacity: 0;
          animation: timeStreaks 1.25s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
          mix-blend-mode: screen;
        }
        .avatar-call-viewport__time-streaks::before,
        .avatar-call-viewport__time-streaks::after {
          content: "";
          position: absolute;
          left: -18%;
          right: -18%;
          height: 1px;
          pointer-events: none;
          background: linear-gradient(90deg, transparent, rgba(255,244,196,0.24), transparent);
          box-shadow:
            0 28px 0 rgba(116,222,177,0.14),
            0 74px 0 rgba(240,200,90,0.18),
            0 134px 0 rgba(255,244,196,0.13),
            0 188px 0 rgba(116,222,177,0.1);
          transform: translateX(-18%);
          opacity: 0;
          animation: timeStreakDrift 1.7s ease-out 0.18s both;
        }
        .avatar-call-viewport__time-streaks::before {
          top: 18%;
        }
        .avatar-call-viewport__time-streaks::after {
          top: 38%;
          animation-delay: 0.34s;
          transform: translateX(18%);
        }
        .avatar-mic-wrap {
          position: relative;
          width: 72px;
          height: 72px;
          display: grid;
          place-items: center;
        }
        .avatar-mic-wrap::before,
        .avatar-mic-wrap::after {
          content: "";
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 1px solid rgba(201,168,76,0.24);
          opacity: 0;
          pointer-events: none;
        }
        .avatar-mic-wrap--idle::before {
          opacity: 0.65;
          animation: micIdleGlow 2.6s ease-in-out infinite;
        }
        .avatar-mic-wrap--recording::before,
        .avatar-mic-wrap--recording::after {
          border-color: rgba(239,83,80,0.52);
          animation: micWave 1.45s ease-out infinite;
        }
        .avatar-mic-wrap--recording::after {
          animation-delay: 0.55s;
        }
        .avatar-mic-wrap--busy::before {
          opacity: 0.7;
          border-color: rgba(79,195,247,0.4);
          animation: micBusySpin 1.2s linear infinite;
          border-top-color: transparent;
        }
        .avatar-mic-button {
          position: relative;
          z-index: 1;
        }
        .avatar-mic-button:hover:not(:disabled) {
          transform: translateY(-1px) scale(1.03);
          filter: brightness(1.08);
        }
        .avatar-hangup-button:hover {
          transform: translateY(-1px) scale(1.04);
        }
        @keyframes callBodyEnter {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes viewportConnect {
          0% { opacity: 0; transform: scale(0.965); filter: blur(6px) saturate(0.55) brightness(0.7); }
          55% { opacity: 1; transform: scale(1.012); filter: blur(0) saturate(1.18) brightness(1.08); }
          100% { opacity: 1; transform: scale(1); filter: blur(0) saturate(1) brightness(1); }
        }
        @keyframes modelConnect {
          0% { opacity: 0; transform: translateY(44px) scale(0.9); filter: blur(7px) saturate(0.55) brightness(0.75); }
          58% { opacity: 1; transform: translateY(-5px) scale(1.018); filter: blur(0) saturate(1.22) brightness(1.08); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0) saturate(1) brightness(1); }
        }
        @keyframes haloConnect {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.18) rotate(-22deg); filter: blur(10px); }
          42% { opacity: 0.95; transform: translate(-50%, -50%) scale(1.2) rotate(4deg); filter: blur(0); }
          100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1) rotate(0); filter: blur(0); }
        }
        @keyframes connectCore {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.24); }
          34% { opacity: 0.85; transform: translate(-50%, -50%) scale(1.12); }
          100% { opacity: 0.22; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes timeStreaks {
          0% { opacity: 0; transform: translateX(-18px) scaleX(0.82); filter: blur(2px); }
          18% { opacity: 0.92; }
          72% { opacity: 0.5; filter: blur(0); }
          100% { opacity: 0; transform: translateX(28px) scaleX(1.08); filter: blur(1px); }
        }
        @keyframes timeStreakDrift {
          0% { opacity: 0; transform: translateX(-20%) scaleX(0.7); filter: blur(2px); }
          20% { opacity: 0.78; }
          100% { opacity: 0; transform: translateX(22%) scaleX(1.15); filter: blur(0.6px); }
        }
        @keyframes identityEnter {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes transcriptEnter {
          from { opacity: 0; transform: translateX(18px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes messageIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes micIdleGlow {
          0%, 100% { transform: scale(0.94); opacity: 0.25; box-shadow: 0 0 18px rgba(201,168,76,0.1); }
          50% { transform: scale(1.08); opacity: 0.65; box-shadow: 0 0 34px rgba(201,168,76,0.2); }
        }
        @keyframes micWave {
          0% { transform: scale(0.84); opacity: 0.72; }
          100% { transform: scale(1.42); opacity: 0; }
        }
        @keyframes micBusySpin {
          to { transform: rotate(360deg); }
        }
        @keyframes thinkingTimeBands {
          0%, 100% {
            transform: translateX(-24px);
            filter: blur(0.8px);
            opacity: 0.58;
            background-position: -12% 16%, 10% 25%, -4% 37%, 14% 52%, -8% 66%, 8% 80%;
          }
          38% {
            transform: translateX(26px);
            filter: blur(0);
            opacity: 1;
            background-position: 18% 16%, -8% 25%, 24% 37%, -6% 52%, 18% 66%, -10% 80%;
          }
          68% {
            transform: translateX(-8px);
            filter: blur(0.4px);
            opacity: 0.76;
            background-position: 6% 16%, 4% 25%, 12% 37%, 2% 52%, 8% 66%, 0 80%;
          }
        }
        @keyframes thinkingScanField {
          from { transform: translateX(-18px) translateY(-12px); }
          to { transform: translateX(18px) translateY(12px); }
        }
        @keyframes timeTunnelRush {
          0%, 100% { transform: translateX(-18px); opacity: 0.52; filter: blur(0.9px); }
          50% { transform: translateX(24px); opacity: 1; filter: blur(0); }
        }
        @keyframes timeTunnelLines {
          0% { transform: translateX(-22%) scaleX(0.8); opacity: 0; }
          18% { opacity: 1; }
          100% { transform: translateX(22%) scaleX(1.08); opacity: 0; }
        }
        .avatar-call-empty {
          min-height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 18px;
          color: rgba(255,255,255,0.68);
        }
        .avatar-call-empty__orb {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          border: 1px solid rgba(201,168,76,0.34);
          background: radial-gradient(circle, rgba(201,168,76,0.22), rgba(201,168,76,0.06));
          box-shadow: 0 0 38px rgba(201,168,76,0.16);
        }
        .avatar-call-empty__orb span {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #c9a84c;
          animation: pulse 1.4s ease-in-out infinite;
        }
        .avatar-call-empty__eyebrow {
          margin: 0 0 8px;
          color: #c9a84c;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .avatar-call-empty h3 {
          margin: 0;
          color: rgba(255,255,255,0.92);
          font-size: 22px;
          line-height: 1.2;
          letter-spacing: 0;
        }
        .avatar-call-empty p {
          margin: 8px 0 0;
          font-size: 14px;
          line-height: 1.65;
        }
        .avatar-call-prompts {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .avatar-call-prompts span {
          padding: 7px 10px;
          border-radius: 999px;
          border: 1px solid rgba(201,168,76,0.18);
          background: rgba(201,168,76,0.08);
          color: rgba(255,255,255,0.72);
          font-size: 12px;
          white-space: nowrap;
        }
        .avatar-call-footer {
          width: calc(100% - 416px);
          align-self: flex-start;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 14px 0 14px 28px;
          flex-shrink: 0;
        }
        .avatar-call-footer-hint {
          width: calc(100% - 416px);
          align-self: flex-start;
          margin: 0 0 14px;
          padding-left: 28px;
          color: rgba(255,255,255,0.22);
          font-size: 11px;
          letter-spacing: 0.03em;
          text-align: center;
        }
        @media (max-width: 900px) {
          .avatar-call-body {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 12px 16px 0;
          }
          .avatar-call-viewport {
            flex: 1;
          }
          .avatar-call-transcript {
            max-height: 140px;
            padding: 12px;
            border-left: 0;
            border-radius: 14px;
          }
          .avatar-call-transcript > div {
            height: auto;
          }
          .avatar-call-empty {
            min-height: 116px;
          }
          .avatar-call-identity {
            left: 18px;
            bottom: 16px;
          }
          .avatar-call-identity h2 {
            font-size: 22px;
          }
          .avatar-call-ripple {
            width: min(360px, 68vw);
          }
          .avatar-call-footer,
          .avatar-call-footer-hint {
            width: 100%;
            align-self: center;
            padding-left: 0;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 1000,
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
              {dynamicStatusLabel}
            </div>

            {/* Mode Toggle - MVP: đã ẩn, luôn dùng web-speech (free) */}
            <div />

            {/* Close */}
            <button
              type="button"
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

          <div className="avatar-call-body">
          {/* ── 3D Viewport ── */}
          <div
            className={[
              "avatar-call-viewport",
              isThinkingStatus ? "avatar-call-viewport--thinking" : "",
              isSpeaking ? "avatar-call-viewport--speaking" : "",
              isListeningStatus || isRecording ? "avatar-call-viewport--listening" : "",
            ].filter(Boolean).join(" ")}
            style={{
              "--voice-volume": isSpeaking ? voiceVolume.toFixed(3) : "0",
              display: is2D ? "flex" : undefined,
              alignItems: is2D ? "center" : undefined,
              justifyContent: is2D ? "center" : undefined,
            } as CSSProperties}
          >
            <span className="avatar-call-viewport__connect-core" aria-hidden="true" />
            <span className="avatar-call-viewport__time-streaks" aria-hidden="true" />
            <span className="avatar-call-time-tunnel" aria-hidden="true" />
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
              <div className="avatar-call-model-layer" style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
                <FBXCharacterViewer
                  modelUrl={character.modelUrl ?? "/models/character.glb"}
                  isSpeaking={status === "speaking"}
                  isListening={status === "listening"}
                  isRecording={status === "listening"}
                  isProcessing={status.startsWith("processing") || status === "thinking"}
                  statusText={dynamicStatusLabel}
                  ttsAnalyserRef={ttsAnalyserRef}
                  onVoiceVolume={setVoiceVolume}
                />
              </div>
            )}
            {!is2D && (isSpeaking || isListeningStatus || isRecording) && (
              <span
                className={[
                  "avatar-call-ripple",
                  isListeningStatus || isRecording
                    ? "avatar-call-ripple--listening"
                    : "avatar-call-ripple--speaking",
                ].join(" ")}
              />
            )}
            <div className="avatar-call-identity">
              <h2>{character.name}</h2>
              {character.title && <p>{character.title}</p>}
            </div>
          </div>

          {/* ── Transcript (right of 3D on desktop) ── */}
          <div className="avatar-call-transcript">
            <ConversationDock
              character={character}
              messages={messages}
              isThinking={status === "processing_chat" || status === "thinking" || status === "processing"}
              interimText={isRecording ? liveTranscript : ""}
              isRecording={isRecording}
            />
          </div>
          </div>

          {/* ── Controls ── */}
          <div className="avatar-call-footer">
            {/* Toggle mic button */}
            <div
              className={[
                "avatar-mic-wrap",
                isRecording ? "avatar-mic-wrap--recording" : "",
                isBusy ? "avatar-mic-wrap--busy" : "",
                !isRecording && !isBusy ? "avatar-mic-wrap--idle" : "",
              ].filter(Boolean).join(" ")}
            >
            <button
              type="button"
              className="avatar-mic-button"
              onClick={handleMicClick}
              disabled={isBusy}
              aria-label={isRecording ? "Dừng ghi âm và gửi" : "Bắt đầu ghi âm"}
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
              } as CSSProperties}
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
            </div>

            {/* End / Close */}
            <button
              type="button"
              className="avatar-hangup-button"
              onClick={handleClose}
              aria-label="Kết thúc cuộc gọi"
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
          <p className="avatar-call-footer-hint">
            Bấm mic hoặc Space để nói, bấm lần nữa để dừng
          </p>
        </div>
      </div>
    </>
  );
}
