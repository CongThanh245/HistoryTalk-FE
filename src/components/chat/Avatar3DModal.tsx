"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, FileText, AlertCircle, ExternalLink, Loader2, ChevronDown, ChevronUp } from "lucide-react";

import type { ChatCharacter } from "@/services/chat.service";
import { useVoiceChatRest, type VoiceRestMessage } from "@/features/chat/useVoiceChatRest";
import { useVoiceChatStream } from "@/features/chat/useVoiceChatStream";
import { useVoiceChatWebSpeech } from "@/features/chat/useVoiceChatWebSpeech";
import { queryKeys } from "@/shared/query-key";
import { useAuthStore } from "@/store/auth.store";
import { userService, type UserProfile } from "@/services/user.service";
import {
  usePublicCharacterDocuments,
  usePublicContextDocuments,
} from "@/features/documents/hooks";
import { findDocumentForQuote, splitContentByQuote } from "@/lib/utils/quote-match";
import type { AnalyserLike } from "./FBXCharacterViewer";
import { cn } from "@/lib/utils/cn";

// Dynamically import 3D viewer (no SSR)
const FBXCharacterViewer = dynamic(
  () => import("./FBXCharacterViewer").then((m) => ({ default: m.FBXCharacterViewer })),
  { ssr: false, loading: () => <ModelLoadingPlaceholder /> },
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function ModelLoadingPlaceholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-[rgba(201,168,76,0.7)]">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[rgba(201,168,76,0.3)] border-t-[#c9a84c]" />
      <p className="m-0 text-[13px] opacity-70">Đang tải mô hình 3D...</p>
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

const UI_SOUNDS = {
  callStart: "/sounds/call-start.mp3",
  callEnd: "/sounds/call-end.mp3",
  micOn: "/sounds/mic-on.mp3",
  micOff: "/sounds/mic-off.mp3",
  thinkingLoop: "/sounds/thinking-loop.mp3",
} as const;

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
    <div className="flex justify-start py-1">
      <div className="flex items-center gap-1 rounded-[16px_16px_16px_4px] border border-[rgba(201,168,76,0.2)] bg-gradient-to-br from-[rgba(201,168,76,0.15)] to-[rgba(201,168,76,0.05)] px-4 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#c9a84c] animate-[thinkingBounce_0.6s_ease-in-out_infinite]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#c9a84c] animate-[thinkingBounce_0.6s_ease-in-out_infinite] [animation-delay:0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#c9a84c] animate-[thinkingBounce_0.6s_ease-in-out_infinite] [animation-delay:0.3s]" />
      </div>
    </div>
  );
}

// ── Transcript feed ───────────────────────────────────────────────────────────

function TranscriptFeed({
  messages,
  isThinking,
  interimText,
  onOpenCitation,
}: {
  messages: VoiceRestMessage[];
  isThinking?: boolean;
  interimText?: string; // Text đang nói (real-time)
  onOpenCitation?: (quote: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [expandedQuotesFor, setExpandedQuotesFor] = useState<number | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimText]);

  const hasContent = messages.length > 0 || interimText;
  if (!hasContent) return null;

  return (
    <div className="flex w-full max-h-55 flex-col gap-1.5 overflow-y-auto px-1 [scrollbar-width:none]">
      {messages.slice(-4).map((m, i) => (
        <div
          key={i}
          className={cn(
            "avatar-message-row flex flex-col gap-1",
            m.role === "user" ? "avatar-message-row--user items-end" : "avatar-message-row--assistant items-start",
          )}
        >
          <div className={cn(
            "max-w-[80%] px-3 py-1.5 text-[13px] leading-normal",
            m.role === "user"
              ? "rounded-[16px_16px_4px_16px] bg-white/[0.08] text-white/75"
              : "rounded-[16px_16px_16px_4px] border border-[rgba(201,168,76,0.2)] bg-gradient-to-br from-[rgba(201,168,76,0.15)] to-[rgba(201,168,76,0.05)] text-white/90",
          )}>
            {m.text}
          </div>
          {m.role === "assistant" && m.quotes && m.quotes.length > 0 && (
            <div className="flex max-w-[80%] flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setExpandedQuotesFor(expandedQuotesFor === i ? null : i)}
                className="flex items-center gap-1 self-start rounded-full border border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.1)] px-2 py-0.5 text-[11px] text-[rgba(240,200,90,0.9)]"
              >
                {m.quotes.length} nguồn trích dẫn
                {expandedQuotesFor === i ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>

              {expandedQuotesFor === i && (
                <div className="flex flex-col gap-2 rounded-[10px] border border-white/10 bg-white/[0.04] px-2.5 py-2">
                  {m.quotes.map((quote, qi) => (
                    <div key={qi} className="flex flex-col gap-1">
                      <blockquote className="m-0 border-l-2 border-[rgba(201,168,76,0.4)] pl-2 text-[11.5px] leading-[1.5] text-white/65">
                        {quote}
                      </blockquote>
                      <button
                        type="button"
                        onClick={() => onOpenCitation?.(quote)}
                        className="self-start border-none bg-none pl-2 text-[11px] font-semibold text-[#e0b84a]"
                      >
                        Xem trong tài liệu
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      
      {/* Hiển thị text đang nói (real-time) với style italic */}
      {interimText && (
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-[16px_16px_4px_16px] border border-dashed border-white/20 bg-white/[0.04] px-3 py-1.5 text-[13px] italic leading-normal text-white/50">
            {interimText}
            <span className="ml-1 inline-block h-3.5 w-0.5 animate-[pulse_0.8s_ease-in-out_infinite] bg-white/50" />
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
  onOpenCitation,
}: {
  character: ChatCharacter;
  messages: VoiceRestMessage[];
  isThinking?: boolean;
  interimText?: string;
  isRecording?: boolean;
  onOpenCitation?: (quote: string) => void;
}) {
  const hasContent = messages.length > 0 || Boolean(interimText);

  if (hasContent) {
    return (
      <TranscriptFeed
        messages={messages}
        isThinking={isThinking}
        interimText={interimText}
        onOpenCitation={onOpenCitation}
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

// ── Citation panel (riêng cho cuộc gọi 2D/3D, không đóng call) ────────────────

function CallCitationPanel({
  quote,
  characterId,
  contextId,
  onClose,
}: {
  quote: string;
  characterId: string;
  contextId?: string;
  onClose: () => void;
}) {
  const { data: characterDocs, isLoading: isLoadingCharacterDocs } =
    usePublicCharacterDocuments(characterId);
  const { data: contextDocs, isLoading: isLoadingContextDocs } =
    usePublicContextDocuments(contextId);

  const isLoading = isLoadingCharacterDocs || isLoadingContextDocs;
  const documents = useMemo(
    () => [...(characterDocs ?? []), ...(contextDocs ?? [])],
    [characterDocs, contextDocs],
  );
  const matchedDocument = useMemo(
    () => findDocumentForQuote(quote, documents),
    [quote, documents],
  );
  const parts = useMemo(
    () => splitContentByQuote(matchedDocument?.content ?? "", quote),
    [matchedDocument, quote],
  );
  const markRef = useRef<HTMLElement>(null);

  useEffect(() => {
    markRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [parts]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-30 flex justify-end bg-[rgba(0,0,0,0.45)]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-[min(380px,100%)] flex-col overflow-hidden border-l border-[rgba(201,168,76,0.25)] bg-[rgba(20,16,10,0.97)] shadow-[-8px_0_32px_rgba(0,0,0,0.4)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[rgba(201,168,76,0.2)] px-[18px] py-4">
          <div className="flex min-w-0 items-center gap-2">
            <FileText size={18} className="shrink-0 text-[#e0b84a]" />
            <h3 className="truncate text-[13px] font-bold text-white/90">
              {matchedDocument?.title || "Nguồn tham khảo"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.06] text-white/70"
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-[13px] text-white/60">
              <Loader2 size={16} className="animate-spin" />
              Đang tải tài liệu...
            </div>
          ) : matchedDocument ? (
            <>
              <p className="text-[13px] leading-[1.7] whitespace-pre-wrap text-white/85">
                {parts.map((part, i) =>
                  part.matched ? (
                    <mark
                      key={i}
                      ref={markRef}
                      className="rounded-[3px] bg-[rgba(201,168,76,0.35)] px-0.5 text-inherit"
                    >
                      {part.text}
                    </mark>
                  ) : (
                    <span key={i}>{part.text}</span>
                  ),
                )}
              </p>
              {matchedDocument.fileUrl && (
                <a
                  href={matchedDocument.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#e0b84a]"
                >
                  <ExternalLink size={14} />
                  Xem file gốc
                </a>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2 rounded-lg border border-white/[0.12] p-3 text-[13px] text-white/60">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>Không tìm thấy vị trí chính xác trong tài liệu. Đây là nội dung AI đã trích dẫn:</span>
              </div>
              <blockquote className="border-l-2 border-[rgba(201,168,76,0.4)] pl-3 text-[13px] leading-[1.7] text-white/70">
                {quote}
              </blockquote>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  contextId?: string;
}

// ── Main component ────────────────────────────────────────────────────────────

export function Avatar3DModal({
  variant = "3d",
  character,
  sessionId,
  onClose,
  onMessagesChange,
  mode: modeProp,
  onTokenUpdate,
  contextId,
}: Avatar3DModalProps) {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [citationQuote, setCitationQuote] = useState<string | null>(null);
  
  const uiSoundRefs = useRef<Record<keyof typeof UI_SOUNDS, HTMLAudioElement | null>>({
    callStart: null,
    callEnd: null,
    micOn: null,
    micOff: null,
    thinkingLoop: null,
  });
  const thinkingLoopDelayRef = useRef<number | null>(null);

  const playUiSound = useCallback((name: keyof typeof UI_SOUNDS, volume = 0.42) => {
    const sound = uiSoundRefs.current[name];
    if (!sound) return;

    sound.pause();
    sound.currentTime = 0;
    sound.volume = volume;
    void sound.play().catch(() => {
      // Browser autoplay policies can block very early playback; this is non-critical.
    });
  }, []);

  const playDetachedUiSound = useCallback((name: keyof typeof UI_SOUNDS, volume = 0.42) => {
    const sound = new Audio(UI_SOUNDS[name]);
    sound.volume = volume;
    void sound.play().catch(() => {
      // The close action should continue even if the browser blocks the cue.
    });
  }, []);
  
  useEffect(() => {
    const audio = new Audio(UI_SOUNDS.callStart);
    audio.loop = false;
    audio.volume = 0.38;
    uiSoundRefs.current = {
      callStart: new Audio(UI_SOUNDS.callStart),
      callEnd: new Audio(UI_SOUNDS.callEnd),
      micOn: new Audio(UI_SOUNDS.micOn),
      micOff: new Audio(UI_SOUNDS.micOff),
      thinkingLoop: new Audio(UI_SOUNDS.thinkingLoop),
    };

    Object.values(uiSoundRefs.current).forEach((sound) => {
      if (!sound) return;
      sound.preload = "auto";
      sound.volume = 0.35;
    });

    const thinkingLoop = uiSoundRefs.current.thinkingLoop;
    if (thinkingLoop) {
      thinkingLoop.loop = false;
      thinkingLoop.volume = 0.13;
    }

    void audio.play().catch(() => {
      // Browser autoplay policies can block very early playback; this is non-critical.
    });

    return () => {
      audio.pause();
      audio.src = "";
      Object.values(uiSoundRefs.current).forEach((sound) => {
        if (!sound) return;
        sound.pause();
        sound.src = "";
      });
      if (thinkingLoopDelayRef.current !== null) {
        window.clearTimeout(thinkingLoopDelayRef.current);
        thinkingLoopDelayRef.current = null;
      }
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
    if (!uiSoundRefs.current.thinkingLoop) return;
    uiSoundRefs.current.thinkingLoop.volume = isThinkingStatus ? 1 : 0.15;
  }, [isThinkingStatus]);

  useEffect(() => {
    const thinkingLoop = uiSoundRefs.current.thinkingLoop;
    if (!thinkingLoop) return;

    const clearThinkingDelay = () => {
      if (thinkingLoopDelayRef.current !== null) {
        window.clearTimeout(thinkingLoopDelayRef.current);
        thinkingLoopDelayRef.current = null;
      }
    };

    if (isThinkingStatus) {
      let shouldContinue = true;
      const replayAfterDelay = () => {
        clearThinkingDelay();
        if (!shouldContinue) return;

        thinkingLoopDelayRef.current = window.setTimeout(() => {
          if (!shouldContinue) return;
          thinkingLoop.currentTime = 0;
          void thinkingLoop.play().catch(() => {
            // Browser autoplay policies can block ambience; the UI should continue silently.
          });
        }, 2500);
      };

      clearThinkingDelay();
      thinkingLoop.loop = false;
      thinkingLoop.addEventListener("ended", replayAfterDelay);
      thinkingLoop.currentTime = 0;
      void thinkingLoop.play().catch(() => {
        // Browser autoplay policies can block ambience; the UI should continue silently.
      });
      return () => {
        shouldContinue = false;
        thinkingLoop.removeEventListener("ended", replayAfterDelay);
        clearThinkingDelay();
      };
    }

    clearThinkingDelay();
    thinkingLoop.pause();
    thinkingLoop.currentTime = 0;
  }, [isThinkingStatus]);
  
  // Lấy interim text cho hiển thị real-time (web-speech mode)
  const liveTranscript = interimText || currentSentence || "";

  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  // ── Toggle Voice Recording handler ────────────────────────────────────────

  const handleMicClick = () => {
    if (isRecording) {
      playUiSound("micOff", 0.42);
      stopRecording();
    } else if (status === "idle") {
      setErrorMsg(null);
      playUiSound("micOn", 0.42);
      startRecording();
    }
  };

  const handleClose = () => {
    playDetachedUiSound("callEnd", 0.55);
    cancel?.();
    refreshProfile();
    window.setTimeout(onClose, 180);
  };

  // ── Keyboard shortcut: Space = toggle voice ───────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (e.repeat) return;
        
        if (isRecording) {
          playUiSound("micOff", 0.42);
          stopRecording();
        } else if (status === "idle") {
          setErrorMsg(null);
          playUiSound("micOn", 0.42);
          startRecording();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [status, isRecording, startRecording, stopRecording, playUiSound]);

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
        @keyframes gridScanFloor {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 0 42px, 42px 0; }
        }
        @keyframes gridScanBackfield {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 58px 58px, -58px 0; }
        }
        @keyframes gridScanBeam {
          0%, 18% { transform: translateX(-34%) skewX(-12deg); opacity: 0; }
          32% { opacity: 0.78; }
          68% { opacity: 0.78; }
          86%, 100% { transform: translateX(34%) skewX(-12deg); opacity: 0; }
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
        .avatar-call-gridscan {
          position: absolute;
          inset: -8%;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 44%, rgba(116,222,177,0.14), transparent 28%),
            radial-gradient(ellipse at 50% 82%, rgba(240,200,90,0.16), transparent 42%),
            linear-gradient(180deg, rgba(9,18,15,0.32), rgba(8,7,4,0.08) 55%, rgba(9,7,3,0.38));
          opacity: 0.92;
          mix-blend-mode: screen;
        }
        .avatar-call-gridscan::before,
        .avatar-call-gridscan::after {
          content: "";
          position: absolute;
          pointer-events: none;
        }
        .avatar-call-gridscan::before {
          left: -18%;
          right: -18%;
          bottom: -34%;
          height: 76%;
          transform-origin: center bottom;
          transform: perspective(760px) rotateX(62deg) scaleX(1.16);
          background-image:
            linear-gradient(rgba(116,222,177,0.18) 1px, transparent 1px),
            linear-gradient(90deg, rgba(240,200,90,0.16) 1px, transparent 1px);
          background-size: 42px 42px;
          filter: drop-shadow(0 0 10px rgba(116,222,177,0.16));
          mask-image: linear-gradient(180deg, transparent 0%, #000 22%, #000 76%, transparent 100%);
          animation: gridScanFloor 5.6s linear infinite;
        }
        .avatar-call-gridscan::after {
          inset: -4% -2% 38%;
          background-image:
            linear-gradient(rgba(240,200,90,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(116,222,177,0.11) 1px, transparent 1px);
          background-size: 58px 58px;
          opacity: 0.55;
          transform: perspective(900px) rotateX(10deg) scale(1.08);
          mask-image: radial-gradient(ellipse at 50% 58%, #000 0%, #000 46%, transparent 78%);
          animation: gridScanBackfield 8s linear infinite;
        }
        .avatar-call-gridscan__beam {
          position: absolute;
          inset: -10% -35%;
          pointer-events: none;
          background:
            linear-gradient(90deg, transparent 0%, rgba(116,222,177,0.05) 42%, rgba(255,244,196,0.28) 49%, rgba(240,200,90,0.16) 53%, transparent 62%),
            linear-gradient(90deg, transparent 0%, rgba(116,222,177,0.12) 48%, transparent 54%);
          filter: blur(0.3px) drop-shadow(0 0 18px rgba(116,222,177,0.24));
          opacity: 0.78;
          transform: skewX(-12deg);
          animation: gridScanBeam 1.55s cubic-bezier(0.45, 0, 0.2, 1) 0.25s both;
        }
        .avatar-call-gridscan__beam::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 52%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,244,196,0.52), transparent);
          box-shadow:
            0 36px 0 rgba(116,222,177,0.24),
            0 92px 0 rgba(240,200,90,0.18),
            0 -44px 0 rgba(116,222,177,0.18);
        }
        .avatar-call-viewport--listening .avatar-call-gridscan,
        .avatar-call-viewport--speaking .avatar-call-gridscan {
          opacity: calc(0.96 + var(--voice-volume, 0) * 0.04);
        }
        .avatar-call-viewport--speaking .avatar-call-gridscan__beam {
          opacity: calc(0.78 + var(--voice-volume, 0) * 0.18);
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
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(0,0,0,0.88)] backdrop-blur-[16px]">
        {/* Card */}
        <div className="relative flex h-screen w-screen flex-col items-center overflow-hidden bg-gradient-to-b from-[rgba(20,16,10,1)] to-[rgba(10,8,4,1)] animate-[fadeSlideUp_0.4s_ease_both]">

          {/* ── Header ── */}
          <div className="flex w-full shrink-0 items-center justify-between border-b border-[rgba(201,168,76,0.12)] px-5 py-3.5">
            {/* Status badge */}
            <div className="flex items-center gap-1.5 rounded-[20px] border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.08)] px-3 py-1 text-xs text-[#c9a84c]">
              {(isRecording || isBusy || isListeningStatus) && (
                <span
                  className={cn(
                    "h-1.75 w-1.75 animate-[pulse_1s_ease-in-out_infinite] rounded-full",
                    isRecording
                      ? "bg-[#ef5350]"
                      : isBusy && !status.includes("speaking")
                        ? "bg-[#4fc3f7]"
                        : "bg-[#c9a84c]",
                  )}
                />
              )}
              {dynamicStatusLabel}
            </div>

            {/* Mode Toggle - MVP: đã ẩn, luôn dùng web-speech (free) */}
            <div />

            {/* Close */}
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-white/[0.06] text-white/50 transition-[background,color] duration-200 hover:bg-white/[0.12] hover:text-white"
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
            className={cn(
              "avatar-call-viewport",
              isThinkingStatus && "avatar-call-viewport--thinking",
              isSpeaking && "avatar-call-viewport--speaking",
              (isListeningStatus || isRecording) && "avatar-call-viewport--listening",
              is2D && "flex items-center justify-center",
            )}
            style={{
              "--voice-volume": isSpeaking ? voiceVolume.toFixed(3) : "0",
            } as CSSProperties}
          >
            <span className="avatar-call-gridscan" aria-hidden="true">
              <span className="avatar-call-gridscan__beam" aria-hidden="true" />
            </span>
            <span className="avatar-call-viewport__connect-core" aria-hidden="true" />
            <span className="avatar-call-viewport__time-streaks" aria-hidden="true" />
            <span className="avatar-call-time-tunnel" aria-hidden="true" />
            {is2D ? (
              <div className="relative flex aspect-square w-[min(54vw,320px)] items-center justify-center rounded-full">
                {(isSpeaking || isListeningStatus || isRecording) && (
                  <>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="absolute inset-0 rounded-full border border-[rgba(201,168,76,0.45)] opacity-0"
                        style={{
                          animation: "avatar2DRipple 2.4s ease-out infinite",
                          animationDelay: `${i * 0.45}s`,
                        }}
                      />
                    ))}
                  </>
                )}
                <div className={cn(
                  "relative h-[78%] w-[78%] overflow-hidden rounded-full bg-gradient-to-br from-[rgba(201,168,76,0.16)] to-white/[0.04] transition-[border-color,box-shadow] duration-[250ms]",
                  isSpeaking
                    ? "border-[3px] border-[rgba(201,168,76,0.85)] shadow-[0_0_48px_rgba(201,168,76,0.28)]"
                    : "border-2 border-[rgba(201,168,76,0.35)] shadow-[0_20px_70px_rgba(0,0,0,0.35)]",
                )}>
                  {character.imageUrl ? (
                    <img
                      src={character.imageUrl}
                      alt={character.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[72px] font-bold text-[#c9a84c]">
                      {character.name[0]}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="avatar-call-model-layer relative z-[1] h-full w-full">
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
                className={cn(
                  "avatar-call-ripple",
                  (isListeningStatus || isRecording)
                    ? "avatar-call-ripple--listening"
                    : "avatar-call-ripple--speaking",
                )}
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
              onOpenCitation={setCitationQuote}
            />
          </div>
          </div>

          {citationQuote && (
            <CallCitationPanel
              quote={citationQuote}
              characterId={character.id}
              contextId={contextId}
              onClose={() => setCitationQuote(null)}
            />
          )}

          {/* ── Controls ── */}
          <div className="avatar-call-footer">
            {/* Toggle mic button */}
            <div
              className={cn(
                "avatar-mic-wrap",
                isRecording && "avatar-mic-wrap--recording",
                isBusy && "avatar-mic-wrap--busy",
                !isRecording && !isBusy && "avatar-mic-wrap--idle",
              )}
            >
            <button
              type="button"
              className={cn(
                "avatar-mic-button flex h-18 w-18 select-none touch-none items-center justify-center rounded-full border-2 bg-gradient-to-br transition-[background,border] duration-200 disabled:cursor-not-allowed disabled:opacity-40",
                !isBusy && "cursor-pointer",
                isRecording
                  ? "animate-[micPulse_1s_ease-in-out_infinite] border-[#ef5350] from-[#c62828] to-[#ef5350] shadow-[0_0_0_0_rgba(239,83,80,0.5)]"
                  : "border-[rgba(201,168,76,0.4)] from-[rgba(201,168,76,0.3)] to-[rgba(201,168,76,0.15)] shadow-[0_4px_24px_rgba(201,168,76,0.2)]",
              )}
              onClick={handleMicClick}
              disabled={isBusy}
              aria-label={isRecording ? "Dừng ghi âm và gửi" : "Bắt đầu ghi âm"}
              title={isRecording ? "Bấm lần nữa để dừng và gửi" : "Bấm để nói"}
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
              className="avatar-hangup-button flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-none bg-gradient-to-br from-[#c0392b] to-[#e74c3c] shadow-[0_4px_24px_rgba(231,76,60,0.45)] transition-[filter] duration-150 hover:brightness-[1.15]"
              onClick={handleClose}
              aria-label="Kết thúc cuộc gọi"
              title="Kết thúc"
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
