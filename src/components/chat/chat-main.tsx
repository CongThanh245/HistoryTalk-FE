"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PhoneIcon, ScrollIcon, ListIcon, InfoIcon, CoinsIcon, ClockCounterClockwiseIcon } from "@phosphor-icons/react"; // ← thêm ListIcon, InfoIcon
import { PhoneCallIcon, VideoCameraIcon, LockIcon } from "@phosphor-icons/react";
import type {
  ChatCharacter,
  ChatMessage,
  GetMessagesResponse,
} from "@/services/chat.service";
import { MessageBubble, TypingIndicator } from "./chat-message-bubble";
import { ChatInput } from "./chat-input";
import {
  useChatMessages,
  useCreateSession,
} from "@/features/chat/hooks";
import { chatService } from "@/services/chat.service";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { queryKeys } from "@/shared/query-key";
import { Avatar3DModal } from "./Avatar3DModal";
import type { VoiceRestMessage } from "@/features/chat/useVoiceChatRest";
import { KeywordDetailPanel } from "./KeywordDetailPanel";
import type { KeywordData } from "@/data/keywords";
import { cn } from "@/lib/utils/cn";
import { UpgradeProDialog } from "@/components/layouts/sidebar/upgrade-pro-dialog";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { hasPlusAccess, hasProAccess } from "@/services/user.service";
import { useSidebar } from "@/components/layouts/sidebar/sidebar-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const isVoiceMessage = (message: ChatMessage) =>
  message.messageType?.toUpperCase() === "VOICE";

const toMessageType = (value?: string): ChatMessage["messageType"] =>
  value?.toUpperCase() === "VOICE" ? "VOICE" : "TEXT";

const VOICE_CALL_GAP_MS = 2 * 60 * 1000;

type VoiceCallGroup = {
  id: string;
  startedAt: string;
  messages: ChatMessage[];
};

type ChatDisplayItem =
  | { type: "message"; message: ChatMessage }
  | { type: "voice-call"; call: VoiceCallGroup };

const parseApiDate = (value: string) => {
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasTimezone ? value : `${value}Z`);
};

const formatVietnamTime = (value: string) =>
  parseApiDate(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });

const groupChatDisplayItems = (messages: ChatMessage[]): ChatDisplayItem[] => {
  const items: ChatDisplayItem[] = [];
  let currentCall: VoiceCallGroup | null = null;
  let previousVoiceAt = 0;

  messages.forEach((message) => {
    if (!isVoiceMessage(message)) {
      if (currentCall) {
        items.push({ type: "voice-call", call: currentCall });
        currentCall = null;
        previousVoiceAt = 0;
      }

      items.push({ type: "message", message });
      return;
    }

    const messageTime = parseApiDate(message.createdAt).getTime();
    const shouldStartNewCall =
      !currentCall || messageTime - previousVoiceAt > VOICE_CALL_GAP_MS;

    if (shouldStartNewCall) {
      if (currentCall) {
        items.push({ type: "voice-call", call: currentCall });
      }

      currentCall = {
        id: `voice-call-${message.id}`,
        startedAt: message.createdAt,
        messages: [message],
      };
    } else if (currentCall) {
      currentCall.messages.push(message);
    }

    previousVoiceAt = messageTime;
  });

  if (currentCall) {
    items.push({ type: "voice-call", call: currentCall });
  }

  return items;
};

interface ChatMainProps {
  character: ChatCharacter;
  contextId: string;
  sessionId: string | null;
  onSessionCreated: (sessionId: string) => void;
  toggleLeftPanel?: () => void;
  toggleRightPanel?: () => void;
  isLeftOpen?: boolean;
  isRightOpen?: boolean;
}

export function ChatMain({
  character,
  contextId,
  sessionId,
  onSessionCreated,
  toggleLeftPanel,
  toggleRightPanel,
  isLeftOpen = false,
  isRightOpen = false,
}: ChatMainProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toggleMobileSidebar } = useSidebar();
  const user = useAuthStore((s) => s.user);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>(
    [],
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [streamingMessageType, setStreamingMessageType] = useState<"TEXT" | "VOICE">("TEXT");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isVoice2DOpen, setIsVoice2DOpen] = useState(false);
  const [isVoice3DOpen, setIsVoice3DOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordData | null>(null);
  const [selectedVoiceCall, setSelectedVoiceCall] = useState<VoiceCallGroup | null>(null);
  const [voiceCallDraftMessages, setVoiceCallDraftMessages] = useState<ChatMessage[]>([]);
  const [isTokenExhausted, setIsTokenExhausted] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const dismissedCallModeRef = useRef<"2d" | "3d" | null>(null);
  const [lastTokenUsage, setLastTokenUsage] = useState<{
    remainingTokens: number;
    promptTokens: number;
    completionTokens: number;
    messageType?: "TEXT" | "VOICE";
  } | null>(null);
  const speechAudioCtxRef = useRef<AudioContext | null>(null);
  const speechSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const handleKeywordSelect = useCallback((kw: KeywordData) => {
    setSelectedKeyword(kw);
  }, []);
  const handleKeywordClose = useCallback(() => {
    setSelectedKeyword(null);
  }, []);

  const { data, isLoading } = useChatMessages(sessionId);
  const createSession = useCreateSession();
  const stopSpeech = useCallback(() => {
    speechSynthesis.cancel();
    speechSourceRef.current?.stop();
    speechSourceRef.current = null;
  }, []);

  const playAzureSpeech = useCallback(
    async (text: string): Promise<void> => {
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, characterId: character.id }),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || `Azure TTS failed: ${res.status}`);
      }

      const audioBuffer = await res.arrayBuffer();
      if (!audioBuffer.byteLength) {
        throw new Error("Azure TTS khong tra ve audio");
      }

      if (!speechAudioCtxRef.current || speechAudioCtxRef.current.state === "closed") {
        const AudioContextCtor = window.AudioContext || (window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;

        if (!AudioContextCtor) {
          throw new Error("AudioContext khong kha dung");
        }

        speechAudioCtxRef.current = new AudioContextCtor();
      }

      const audioContext = speechAudioCtxRef.current;
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const decodedAudio = await audioContext.decodeAudioData(audioBuffer.slice(0));

      await new Promise<void>((resolve, reject) => {
        const source = audioContext.createBufferSource();
        source.buffer = decodedAudio;
        source.connect(audioContext.destination);
        speechSourceRef.current = source;
        source.onended = () => {
          if (speechSourceRef.current === source) {
            speechSourceRef.current = null;
          }
          resolve();
        };
        source.onerror = () => reject(new Error("Khong phat duoc audio Azure TTS"));
        source.start();
      });
    },
    [character.id],
  );

  const speakWebSpeech = useCallback((text: string) => {
    const voices = speechSynthesis.getVoices();
    const vietnameseVoice = voices.find((v) => v.name.includes("Vietnamese"));
    const utterance = new SpeechSynthesisUtterance(text);
    if (vietnameseVoice) utterance.voice = vietnameseVoice;
    utterance.lang = "vi-VN";
    speechSynthesis.speak(utterance);
  }, []);

  const speakWithFallback = useCallback(
    async (text: string): Promise<void> => {
      stopSpeech();
      try {
        await playAzureSpeech(text);
        return;
      } catch (err) {
        console.warn("[ChatMain] Azure TTS failed, using Web Speech:", err);
      }

      speakWebSpeech(text);
    },
    [playAzureSpeech, speakWebSpeech, stopSpeech],
  );

  const speak = (text: string) => {
    if (speechSynthesis.speaking || speechSourceRef.current) {
      stopSpeech();
      return;
    }
    void speakWithFallback(text);
  };

  useEffect(() => {
    return () => {
      stopSpeech();
      if (speechAudioCtxRef.current && speechAudioCtxRef.current.state !== "closed") {
        speechAudioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopSpeech]);

  const messages = useMemo(
    () => {
      const persistedMessages = data?.messages ?? [];
      const pendingVoiceDrafts = voiceCallDraftMessages.filter(
        (draft) =>
          !persistedMessages.some(
            (message) =>
              isVoiceMessage(message) &&
              message.role === draft.role &&
              message.content === draft.content,
          ),
      );

      return [...persistedMessages, ...pendingVoiceDrafts, ...optimisticMessages];
    },
    [data?.messages, voiceCallDraftMessages, optimisticMessages],
  );
  const displayItems = useMemo(() => groupChatDisplayItems(messages), [messages]);
  const userTextMessageCount = useMemo(
    () =>
      messages.filter(
        (message) =>
          message.role === "USER" &&
          !isVoiceMessage(message) &&
          message.content.trim().length > 0,
      ).length,
    [messages],
  );
  const accessUser = useMemo(
    () =>
      user
        ? {
            tierId: user.tierId ?? null,
            tierTitle: user.tierTitle ?? null,
          }
        : null,
    [user],
  );
  const showVoiceNudge =
    userTextMessageCount >= 2 &&
    userTextMessageCount <= 3 &&
    !isStreaming &&
    !isTokenExhausted &&
    !!sessionId &&
    hasPlusAccess(accessUser);
  const sessionIdRef = useRef(sessionId);
  const isStaffOrAdmin = user?.role === "CONTENT_ADMIN" || user?.role === "SYSTEM_ADMIN";
  const canUseVoiceCall = isStaffOrAdmin || hasPlusAccess(accessUser);
  const canUseVideoCall = isStaffOrAdmin || hasProAccess(accessUser);
  const isConversationInitializing = !sessionId;
  const requestedCallMode = searchParams.get("call");

  const replaceCallModeInUrl = useCallback(
    (mode: "2d" | "3d" | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (mode) {
        params.set("call", mode);
      } else {
        params.delete("call");
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const handleLockedFeatureClick = useCallback(() => {
    setIsUpgradeOpen(true);
  }, []);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    setOptimisticMessages([]);
    setSuggestedQuestions(data?.suggestedQuestions ?? []);
  }, [sessionId]);

  useEffect(() => {
    if (data?.suggestedQuestions) {
      setSuggestedQuestions(data.suggestedQuestions);
    }
  }, [data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming, streamingMessage]);

  const qc = useQueryClient();

  const handleVoiceMessagesChange = useCallback(
    (voiceMessages: VoiceRestMessage[]) => {
      setVoiceCallDraftMessages(
        voiceMessages.map((message, index) => ({
          id: `voice-draft-${sessionId}-${message.timestamp.getTime()}-${index}`,
          sessionId: sessionId!,
          role: message.role === "user" ? "USER" : "ASSISTANT",
          content: message.text,
          messageType: "VOICE",
          createdAt: message.timestamp.toISOString(),
        })),
      );
    },
    [sessionId],
  );

  const handleOpenVoice2DCall = useCallback(() => {
    if (!sessionId || isTokenExhausted) return;
    if (!canUseVoiceCall) {
      handleLockedFeatureClick();
      return;
    }
    setVoiceCallDraftMessages([]);
    dismissedCallModeRef.current = null;
    setIsVoice2DOpen(true);
    replaceCallModeInUrl("2d");
  }, [canUseVoiceCall, handleLockedFeatureClick, isTokenExhausted, replaceCallModeInUrl, sessionId]);

  const handleCloseVoice2DCall = useCallback(() => {
    dismissedCallModeRef.current = "2d";
    replaceCallModeInUrl(null);
    setIsVoice2DOpen(false);
    qc.invalidateQueries({ queryKey: queryKeys.profile.me });
    if (sessionId) {
      qc.invalidateQueries({ queryKey: queryKeys.chat.messages(sessionId) });
    }
  }, [qc, replaceCallModeInUrl, sessionId]);

  const handleOpenVoice3DCall = useCallback(() => {
    if (!sessionId || isTokenExhausted) return;
    if (!canUseVideoCall) {
      handleLockedFeatureClick();
      return;
    }
    setVoiceCallDraftMessages([]);
    dismissedCallModeRef.current = null;
    setIsVoice3DOpen(true);
    replaceCallModeInUrl("3d");
  }, [canUseVideoCall, handleLockedFeatureClick, isTokenExhausted, replaceCallModeInUrl, sessionId]);

  const handleCloseVoice3DCall = useCallback(() => {
    dismissedCallModeRef.current = "3d";
    replaceCallModeInUrl(null);
    setIsVoice3DOpen(false);
    qc.invalidateQueries({ queryKey: queryKeys.profile.me });
    if (sessionId) {
      qc.invalidateQueries({ queryKey: queryKeys.chat.messages(sessionId) });
    }
  }, [qc, replaceCallModeInUrl, sessionId]);

  useEffect(() => {
    if (!sessionId || isVoice2DOpen || isVoice3DOpen) return;
    if (requestedCallMode !== "2d" && requestedCallMode !== "3d") {
      dismissedCallModeRef.current = null;
      return;
    }
    if (dismissedCallModeRef.current === requestedCallMode) return;

    let timeoutId: number | undefined;

    if (requestedCallMode === "2d") {
      timeoutId = window.setTimeout(handleOpenVoice2DCall, 0);
    } else if (requestedCallMode === "3d") {
      timeoutId = window.setTimeout(handleOpenVoice3DCall, 0);
    }

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    handleOpenVoice2DCall,
    handleOpenVoice3DCall,
    isVoice2DOpen,
    isVoice3DOpen,
    requestedCallMode,
    sessionId,
  ]);

  const enqueueSpeech = (text: string) => {
    speakWebSpeech(text);
  };

  const handleSend = async (content: string, type?: "TEXT" | "VOICE") => {
    // Cancel any ongoing speech when starting a new message
    stopSpeech();
    
    // If not specified, default to VOICE if the 3D avatar modal is open, else TEXT
    const msgType = type || (isVoice3DOpen ? "VOICE" : "TEXT");
    setStreamingMessageType(msgType);

    let currentSessionId = sessionId;

    if (!currentSessionId) {
      if (!contextId) return;
      try {
        const newSession = await createSession.mutateAsync({
          characterId: character.id,
          contextId,
        });
        currentSessionId = newSession.id;
        onSessionCreated?.(currentSessionId);
      } catch (error) {
        return;
      }
    }

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: currentSessionId,
      role: "USER",
      content,
      messageType: msgType,
      createdAt: new Date().toISOString(),
    };
    setOptimisticMessages((prev) => [...prev, tempUserMsg]);
    setIsStreaming(true);
    setStreamingMessage("");

    // Queue for smooth typing effect
    let localQueue = "";
    let isTyping = false;
    let typingInterval: NodeJS.Timeout;

    // Buffer for streaming speech chunk-by-chunk
    let sentenceBuffer = "";
    // Only split on sentence endings (. ! ? \n) to avoid unnatural TTS pauses between commas
    const punctuationRegex = /([.!?\n]+)/;

    const processQueue = () => {
      if (isTyping) return;
      isTyping = true;
      typingInterval = setInterval(() => {
        if (localQueue.length > 0) {
          // Dynamic typing speed: if queue is large, type faster to catch up
          let charsToTake = 1;
          if (localQueue.length > 40) charsToTake = 2;
          if (localQueue.length > 100) charsToTake = 4;
          if (localQueue.length > 250) charsToTake = 8;
          
          const textToAdd = localQueue.substring(0, charsToTake);
          localQueue = localQueue.substring(charsToTake);
          setStreamingMessage((prev) => prev + textToAdd);
        }
      }, 90); // 90ms delay for a slower, more deliberate typing effect
    };

    chatService.sendMessageStream(
      currentSessionId,
      content,
      (chunk) => {
        localQueue += chunk;
        processQueue();

        // Streaming voice logic: speak phrases as soon as punctuation is detected
        sentenceBuffer += chunk;
        const match = sentenceBuffer.match(punctuationRegex);
        if (match && match.index !== undefined) {
          const splitIndex = match.index + match[0].length;
          const phraseToSpeak = sentenceBuffer.slice(0, splitIndex).trim();
          sentenceBuffer = sentenceBuffer.slice(splitIndex);
          if (phraseToSpeak.length > 1) { // Avoid speaking stray punctuation
            enqueueSpeech(phraseToSpeak);
          }
        }
      },
      (resData) => {
        // Ensure the remaining queue is flushed quickly before ending
        clearInterval(typingInterval);
        setIsStreaming(false);
        setOptimisticMessages([]);
        setSuggestedQuestions(resData.suggestedQuestions || []);
        
        // Update tokens correctly, using values from resData or defaulting to 0
        setLastTokenUsage((prev) => ({
           remainingTokens: resData.remainingTokens !== undefined ? resData.remainingTokens : (prev?.remainingTokens || 0),
           promptTokens: resData.promptTokens || 0,
           completionTokens: resData.completionTokens || 0,
           messageType: msgType
        }));

        // Speak any remaining buffer when stream finishes
        if (sentenceBuffer.trim().length > 0) {
           enqueueSpeech(sentenceBuffer.trim());
        }

        const newAssistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sessionId: currentSessionId,
          role: "ASSISTANT",
          content: resData.fullContent,
          messageType: toMessageType(resData.messageType),
          createdAt: new Date().toISOString(),
        };

        qc.setQueryData(
          queryKeys.chat.messages(currentSessionId!),
          (old: GetMessagesResponse | undefined) => ({
            messages: [
              ...(old?.messages ?? []),
              tempUserMsg,
              newAssistantMsg,
            ],
            suggestedQuestions: resData.suggestedQuestions,
          }),
        );
        qc.invalidateQueries({ queryKey: queryKeys.profile.me });
      },
      (err: unknown) => {
        setIsStreaming(false);
        setOptimisticMessages((prev) =>
          prev.filter((m) => m.id !== tempUserMsg.id),
        );

        const error = err as {
          message?: string;
          response?: {
            data?: {
              message?: string;
              errorCode?: string | number;
            };
          };
        };
        
        const serverMessage = error.message || error.response?.data?.message || "";
        const errorCode = error.response?.data?.errorCode;
        
        // Check for token exhaustion - broader matching
        const isTokenExhausted = 
          serverMessage.toLowerCase().includes("hết token") ||
          serverMessage.toLowerCase().includes("nạp thêm") ||
          serverMessage.toLowerCase().includes("token") ||
          errorCode === 400 ||
          errorCode === "400";
        
        if (isTokenExhausted) {
          setIsTokenExhausted(true);
          toast.error("Bạn đã hết token. Vui lòng nạp thêm để tiếp tục chat.", {
            action: {
              label: "Nạp thêm",
              onClick: () => setIsUpgradeOpen(true),
            },
            duration: 8000,
          });
        } else {
          toast.error("Không thể gửi tin nhắn");
        }
      },
      msgType
    );
  };

  return (
    <div className="relative flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      {/* Header */}
      <div
        className="px-4 md:px-6 py-4 border-b flex items-center gap-3 shrink-0"
        style={{
          borderColor: "var(--border-default)",
          background: "var(--bg-main)",
        }}
      >
        {/* Mobile hamburger: open website sidebar */}
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-white/5 active:scale-95"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Mở menu"
        >
          <ListIcon className="w-5 h-5" />
        </button>

        {/* Toggle Chat History (Mobile/Tablet) */}
        {toggleLeftPanel && (
          <button
            onClick={toggleLeftPanel}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-white/5 active:scale-95"
            style={{ color: isLeftOpen ? "var(--accent-gold)" : "var(--text-secondary)" }}
            aria-label="Lịch sử trò chuyện"
          >
            <ClockCounterClockwiseIcon className="w-5 h-5" />
          </button>
        )}

        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
          style={{
            background: "var(--bg-elevated)",
          }}
        >
          {character.imageUrl ? (
            <img
              src={character.imageUrl}
              alt={character.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ScrollIcon
              className="w-4 h-4"
              style={{ color: "var(--bg-deep)" }}
            />
          )}
        </div>
        {/* Character info */}
        <div className="flex-1">
          <h2
            className="text-sm font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {character.name}
          </h2>
          <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
            {character.title}
          </p>
        </div>

        {/* ── Nút Voice Call ── */}
        <button
          onClick={handleOpenVoice2DCall}
          disabled={isConversationInitializing || (canUseVoiceCall && isTokenExhausted)}
          aria-label={
            canUseVoiceCall ? `Gọi thoại với ${character.name}` : "Mở nâng cấp gói Plus"
          }
          title={
            !canUseVoiceCall
              ? "Gọi thoại có trong gói Plus. Bấm để xem các gói nâng cấp."
              : isTokenExhausted
              ? "Bạn đã hết token. Vui lòng nâng cấp để gọi thoại."
              : sessionId
                ? `Gọi thoại với ${character.name}`
                : "Đang khởi tạo..."
          }
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-full transition-all hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed",
            showVoiceNudge && "voice-call-nudge",
          )}
          style={{
            background: canUseVoiceCall ? "rgba(201,168,76,0.12)" : "rgba(148,163,184,0.08)",
            border: canUseVoiceCall ? "1px solid rgba(201,168,76,0.3)" : "1px solid rgba(148,163,184,0.22)",
            opacity: canUseVoiceCall ? 1 : 0.56,
          }}
        >
          {canUseVoiceCall ? (
            <PhoneIcon
              className="w-4 h-4"
              style={{ color: "var(--accent-gold)" }}
            />
          ) : (
            <LockIcon className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          )}
        </button>

        <button
          onClick={handleOpenVoice3DCall}
          disabled={isConversationInitializing || (canUseVideoCall && isTokenExhausted)}
          aria-label={
            canUseVideoCall ? `Video call 3D với ${character.name}` : "Mở nâng cấp gói Pro"
          }
          title={
            !canUseVideoCall
              ? "Video call có trong gói Pro. Bấm để xem các gói nâng cấp."
              : isTokenExhausted
              ? "Bạn đã hết token. Vui lòng nâng cấp để gọi 3D."
              : sessionId
                ? `Video call 3D với ${character.name}`
                : "Đang khởi tạo..."
          }
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-full transition-all hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed",
            showVoiceNudge && "voice-call-nudge voice-call-nudge--delay",
          )}
          style={{
            background: canUseVideoCall ? "rgba(201,168,76,0.12)" : "rgba(148,163,184,0.08)",
            border: canUseVideoCall ? "1px solid rgba(201,168,76,0.3)" : "1px solid rgba(148,163,184,0.22)",
            opacity: canUseVideoCall ? 1 : 0.56,
          }}
        >
          {canUseVideoCall ? (
            <VideoCameraIcon
              className="w-4 h-4"
              weight="fill"
              style={{ color: "var(--accent-gold)" }}
            />
          ) : (
            <LockIcon className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          )}
        </button>

        {/* Toggle Right (Mobile/Tablet) */}
        {toggleRightPanel && (
          <button
            onClick={toggleRightPanel}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-white/5 active:scale-95"
            style={{ color: isRightOpen ? "var(--accent-gold)" : "var(--text-secondary)" }}
            aria-label="Thông tin nhân vật"
          >
            <InfoIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-5 pb-28 md:pb-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{
                borderColor: "var(--accent-gold)",
                borderTopColor: "transparent",
              }}
            />
          </div>
        ) : !sessionId ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
            <div
              className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{
                borderColor: "var(--accent-gold)",
                borderTopColor: "transparent",
              }}
            />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Đang khởi tạo cuộc trò chuyện...
            </p>
          </div>
        ) : (
          <>
            {displayItems.map((item) =>
              item.type === "voice-call" ? (
                <VoiceCallBubble
                  key={item.call.id}
                  call={item.call}
                  onOpen={setSelectedVoiceCall}
                  onCallAgain={handleOpenVoice2DCall}
                />
              ) : (
                <MessageBubble
                  key={item.message.id}
                  message={item.message}
                  character={character}
                  speak={speak}
                  onKeywordSelect={
                    item.message.role === "ASSISTANT" ? handleKeywordSelect : undefined
                  }
                />
              ),
            )}
            {isStreaming && streamingMessage && streamingMessageType !== "VOICE" && (
              <MessageBubble
                key="streaming-bubble"
                message={{
                  id: "streaming-bubble",
                  sessionId: sessionId!,
                  role: "ASSISTANT",
                  content: streamingMessage,
                  messageType: "TEXT",
                  createdAt: new Date().toISOString()
                }}
                character={character}
              />
            )}
            {(isStreaming && !streamingMessage && streamingMessageType !== "VOICE") && (
              <TypingIndicator character={character} />
            )}
          </>
        )}

        {suggestedQuestions.length > 0 && !isStreaming && (
          <div className="px-4 flex flex-wrap gap-2">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-all hover:border-[var(--accent-gold)]"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-secondary)",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Token usage display */}
        {lastTokenUsage && !isStreaming && (
          <div className="px-4 flex items-center justify-end gap-3 text-[10px]" style={{ color: "var(--text-muted)" }}>
            <div className="flex items-center gap-1.5">
              <CoinsIcon className="w-3 h-3" style={{ color: "var(--accent-gold)" }} />
              <span>Còn: <strong className="tabular-nums" style={{ color: "var(--text-secondary)" }}>{lastTokenUsage.remainingTokens.toLocaleString()}</strong></span>
            </div>
            <span className="w-px h-3 bg-[var(--border-default)]" />
            {lastTokenUsage.messageType === "VOICE" ? (
              <span className="tabular-nums">Tổng dùng: {lastTokenUsage.promptTokens + lastTokenUsage.completionTokens}</span>
            ) : (
              <>
                <span className="tabular-nums">Prompt: {lastTokenUsage.promptTokens}</span>
                <span className="tabular-nums">Response: {lastTokenUsage.completionTokens}</span>
                <span className="tabular-nums">Tổng: {lastTokenUsage.promptTokens + lastTokenUsage.completionTokens}</span>
              </>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {isTokenExhausted && (
        <div 
          className="px-4 py-2.5 border-t border-b flex items-center justify-between gap-3 text-xs shrink-0 backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
          style={{
            borderColor: "rgba(212, 175, 55, 0.25)",
            background: "rgba(212, 175, 55, 0.08)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-gold)] animate-pulse shrink-0" />
            <span style={{ color: "var(--text-secondary)" }}>
              Bạn đã dùng hết số token giới hạn. Vui lòng nâng cấp gói để tiếp tục cuộc trò chuyện.
            </span>
          </div>
          <button
            onClick={() => setIsUpgradeOpen(true)}
            className="px-3 py-1.5 rounded-lg text-[var(--bg-deep)] font-semibold transition-all duration-200 hover:brightness-110 active:scale-95 shrink-0 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, var(--accent-gold), var(--truffle))",
            }}
          >
            Nâng cấp ngay
          </button>
        </div>
      )}

      <ChatInput
        onSend={handleSend}
        isLoading={isStreaming}
        disabled={isStreaming || isTokenExhausted || isConversationInitializing}
        characterName={character.name}
        isTokenExhausted={isTokenExhausted}
      />

      <style>{`
        .voice-call-nudge {
          animation: voiceCallNudge 1.15s ease-in-out 4;
          box-shadow: 0 0 0 0 rgba(201, 168, 76, 0.36);
          transform-origin: 50% 50%;
        }

        .voice-call-nudge--delay {
          animation-delay: 0.16s;
        }

        @keyframes voiceCallNudge {
          0%, 100% {
            transform: translateX(0) rotate(0deg) scale(1);
            box-shadow: 0 0 0 0 rgba(201, 168, 76, 0);
            filter: brightness(1);
          }
          12% {
            transform: translateX(-1px) rotate(-5deg) scale(1.04);
          }
          24% {
            transform: translateX(1px) rotate(5deg) scale(1.07);
            box-shadow: 0 0 0 5px rgba(201, 168, 76, 0.16);
            filter: brightness(1.28);
          }
          36% {
            transform: translateX(-1px) rotate(-4deg) scale(1.04);
          }
          52% {
            transform: translateX(1px) rotate(3deg) scale(1.06);
            box-shadow: 0 0 0 8px rgba(201, 168, 76, 0);
            filter: brightness(1.18);
          }
          68% {
            transform: translateX(0) rotate(0deg) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .voice-call-nudge,
          .voice-call-nudge--delay {
            animation: none;
          }
        }
      `}</style>

      {/* ── 3D Avatar Modal ── */}
      {isVoice2DOpen && sessionId && (
        <Avatar3DModal
          variant="2d"
          character={character}
          sessionId={sessionId}
          onClose={handleCloseVoice2DCall}
          onMessagesChange={handleVoiceMessagesChange}
          onTokenUpdate={(remainingTokens, promptTokens, completionTokens, messageType) => {
            setLastTokenUsage({
              remainingTokens,
              promptTokens: promptTokens || 0,
              completionTokens: completionTokens || 0,
              messageType: messageType || "VOICE"
            });
          }}
        />
      )}

      {isVoice3DOpen && sessionId && (
        <Avatar3DModal
          variant="3d"
          character={character}
          sessionId={sessionId}
          onClose={handleCloseVoice3DCall}
          onMessagesChange={handleVoiceMessagesChange}
          onTokenUpdate={(remainingTokens, promptTokens, completionTokens, messageType) => {
            setLastTokenUsage({
              remainingTokens,
              promptTokens: promptTokens || 0,
              completionTokens: completionTokens || 0,
              messageType: messageType || "VOICE"
            });
          }}
        />
      )}

      {/* ── Historical Keyword Panel ── */}
      <KeywordDetailPanel
        keyword={selectedKeyword}
        onClose={handleKeywordClose}
      />

      {/* ── Upgrade Pro Dialog ── */}
      <VoiceCallTranscriptDialog
        call={selectedVoiceCall}
        character={character}
        onOpenChange={(open) => !open && setSelectedVoiceCall(null)}
      />

      <UpgradeProDialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen} />
    </div>
  );
}

function VoiceCallBubble({
  call,
  onOpen,
  onCallAgain,
}: {
  call: VoiceCallGroup;
  onOpen: (call: VoiceCallGroup) => void;
  onCallAgain: () => void;
}) {
  return (
    <div className="flex justify-end px-4 mb-4">
      <div
        className="w-[240px] overflow-hidden rounded-2xl border shadow-lg"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border-strong)",
        }}
      >
        <button
          type="button"
          onClick={() => onOpen(call)}
          aria-label={`Mở chi tiết cuộc gọi thoại lúc ${formatVietnamTime(call.startedAt)}`}
          className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-white/5"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: "var(--accent-gold-active-bg)",
              color: "var(--accent-gold)",
            }}
          >
            <PhoneCallIcon className="w-5 h-5" weight="fill" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Cuộc gọi thoại
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {formatVietnamTime(call.startedAt)}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={onCallAgain}
          aria-label="Gọi lại"
          className="w-full py-2.5 text-sm font-semibold cursor-pointer transition-colors hover:brightness-110"
          style={{
            background: "var(--accent-gold-active-bg)",
            color: "var(--accent-gold-soft)",
          }}
        >
          Gọi lại
        </button>
      </div>
    </div>
  );
}

function VoiceCallTranscriptDialog({
  call,
  character,
  onOpenChange,
}: {
  call: VoiceCallGroup | null;
  character: ChatCharacter;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!call} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[80vh] overflow-hidden border"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-default)",
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "var(--text-primary)" }}>
            Cuộc gọi thoại - {call ? formatVietnamTime(call.startedAt) : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[56vh] overflow-y-auto space-y-3 pr-1">
          {call?.messages.map((message) => {
            const isUser = message.role === "USER";

            return (
              <div
                key={message.id}
                className={cn("flex", isUser ? "justify-end" : "justify-start")}
              >
                <div
                  className="max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                  style={{
                    background: isUser ? "var(--accent-bronze)" : "var(--bg-elevated)",
                    color: isUser ? "white" : "var(--text-primary)",
                    border: isUser ? "none" : "1px solid var(--border-default)",
                  }}
                >
                  <p className="mb-1 text-[10px] font-semibold opacity-70">
                    {isUser ? "Bạn" : character.name} - {formatVietnamTime(message.createdAt)}
                  </p>
                  <p>{message.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
