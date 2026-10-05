"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Phone, ScrollText, Menu, Info, Coins, PhoneCall, Video, Lock, AlertTriangle, X } from "lucide-react";
import type {
  ChatCharacter,
  ChatMessage,
  GetMessagesResponse,
} from "@/services/chat.service";
import { MessageBubble, MessageQuotes, TypingIndicator } from "./chat-message-bubble";
import { ChatInput } from "./chat-input";
import {
  useChatMessages,
  useCreateSession,
} from "@/features/chat/hooks";
import { chatService } from "@/services/chat.service";
import { useQueryClient } from "@tanstack/react-query";
import { recordStudyActivity } from "@/features/gamification/study-check-in";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { queryKeys } from "@/shared/query-key";
import { Avatar3DModal } from "./Avatar3DModal";
import type { VoiceRestMessage } from "@/features/chat/useVoiceChatRest";
import { cn } from "@/lib/utils/cn";
import { isValidUrl } from "@/lib/utils/url";
import { UpgradeProDialog } from "@/components/layouts/sidebar/upgrade-pro-dialog";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { useEntitlements } from "@/features/saas/entitlements";
import { hasPlusAccess, hasProAccess } from "@/services/user.service";
import { isTokenExhaustionError } from "@/lib/utils/api-error";
import { useSidebar } from "@/components/layouts/sidebar/sidebar-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const AI_FEEDBACK_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeRil6ykImcwwFkgnV0lzFHWo8NLgOrOKNjTHNqq8Tt0-XMEQ/viewform?usp=dialog";

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
  toggleRightPanel?: () => void;
  isRightOpen?: boolean;
  /** Overrides the "initializing conversation" message shown while sessionId is null. */
  initializingLabel?: string;
  onOpenCitation?: (quote: string) => void;
  isTokenExhausted?: boolean;
  onTokenExhausted?: () => void;
}

export function ChatMain({
  character,
  contextId,
  sessionId,
  onSessionCreated,
  toggleRightPanel,
  isRightOpen = false,
  initializingLabel,
  onOpenCitation,
  isTokenExhausted: isTokenExhaustedFromParent = false,
  onTokenExhausted,
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
  const [selectedVoiceCall, setSelectedVoiceCall] = useState<VoiceCallGroup | null>(null);
  const [voiceCallDraftMessages, setVoiceCallDraftMessages] = useState<ChatMessage[]>([]);
  const [isLocalTokenExhausted, setIsLocalTokenExhausted] = useState(false);
  const isTokenExhausted = isTokenExhaustedFromParent || isLocalTokenExhausted;
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  // Teacher / School Student tokens come from the school's daily quota; they cannot buy plans.
  const entitlements = useEntitlements();
  const isSchoolAccount = entitlements.mode === "B2B";
  const canUpgrade = entitlements.canPurchase;
  const [aiWarningVisible, setAiWarningVisible] = useState(false);
  const [aiWarningLeaving, setAiWarningLeaving] = useState(false);
  const dismissedCallModeRef = useRef<"2d" | "3d" | null>(null);
  const [lastTokenUsage, setLastTokenUsage] = useState<{
    remainingTokens: number;
    promptTokens: number;
    completionTokens: number;
    messageType?: "TEXT" | "VOICE";
  } | null>(null);
  const speechAudioCtxRef = useRef<AudioContext | null>(null);
  const speechSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [headerAvatarBroken, setHeaderAvatarBroken] = useState(false);

  useEffect(() => {
    setHeaderAvatarBroken(false);
  }, [character.imageUrl]);

  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const { data, isLoading } = useChatMessages(sessionId);
  const createSession = useCreateSession();
  const stopSpeech = useCallback(() => {
    speechSynthesis.cancel();
    speechSourceRef.current?.stop();
    speechSourceRef.current = null;
    setSpeakingMessageId(null);
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
        source.playbackRate.value = 1.25;
        source.connect(audioContext.destination);
        speechSourceRef.current = source;
        source.onended = () => {
          if (speechSourceRef.current === source) {
            speechSourceRef.current = null;
          }
          setTimeout(() => {
            if (!speechSynthesis.speaking && !speechSourceRef.current) {
              setSpeakingMessageId(null);
            }
          }, 100);
          resolve();
        };
        source.addEventListener("error", () => {
          setTimeout(() => {
            if (!speechSynthesis.speaking && !speechSourceRef.current) {
              setSpeakingMessageId(null);
            }
          }, 100);
          reject(new Error("Khong phat duoc audio Azure TTS"));
        });
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
    utterance.rate = 1.25;
    utterance.onend = () => {
      setTimeout(() => {
        if (!speechSynthesis.speaking && !speechSourceRef.current) {
          setSpeakingMessageId(null);
        }
      }, 100);
    };
    utterance.onerror = () => {
      setTimeout(() => {
        if (!speechSynthesis.speaking && !speechSourceRef.current) {
          setSpeakingMessageId(null);
        }
      }, 100);
    };
    speechSynthesis.speak(utterance);
  }, []);

  const speakWithFallback = useCallback(
    async (text: string, messageId: string): Promise<void> => {
      stopSpeech();
      setSpeakingMessageId(messageId);
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

  const speak = useCallback((text: string, messageId: string) => {
    if (speakingMessageId === messageId) {
      stopSpeech();
      return;
    }
    void speakWithFallback(text, messageId);
  }, [speakingMessageId, speakWithFallback, stopSpeech]);

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
    (isSchoolAccount ? entitlements.voiceCall : hasPlusAccess(accessUser));
  const sessionIdRef = useRef(sessionId);
  const isStaffOrAdmin = user?.role === "CONTENT_ADMIN" || user?.role === "SYSTEM_ADMIN";
  // Customers unlock calls with their personal tier; school accounts with the school package.
  const canUseVoiceCall =
    isStaffOrAdmin || (isSchoolAccount ? entitlements.voiceCall : hasPlusAccess(accessUser));
  const canUseVideoCall =
    isStaffOrAdmin || (isSchoolAccount ? entitlements.videoCall : hasProAccess(accessUser));
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
    if (!canUpgrade) {
      toast.info(entitlements.upgradeHint || "Tính năng này chưa có trong gói trường học của bạn.");
      return;
    }
    setIsUpgradeOpen(true);
  }, [canUpgrade, entitlements.upgradeHint]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    setOptimisticMessages([]);
    setSuggestedQuestions(data?.suggestedQuestions ?? []);
  }, [sessionId]);

  const dismissAiWarning = useCallback(() => {
    setAiWarningLeaving(true);
    window.setTimeout(() => setAiWarningVisible(false), 300);
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    setAiWarningVisible(true);
    setAiWarningLeaving(false);

    const leaveTimer = window.setTimeout(() => setAiWarningLeaving(true), 5000);
    const hideTimer = window.setTimeout(() => setAiWarningVisible(false), 5300);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
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
          quotes: message.quotes,
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
        if (isTokenExhaustionError(error)) {
          setIsLocalTokenExhausted(true);
          onTokenExhausted?.();
        }

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
      }, 72); // 72ms delay for 1.25x faster typing effect
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
        // A finished reply is a study activity: check in today's streak (once per day).
        recordStudyActivity(qc);
        
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
          quotes: resData.quotesUsed,
        };

        if (speechSynthesis.speaking || speechSourceRef.current) {
          setSpeakingMessageId(newAssistantMsg.id);
        }

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
            status?: number;
            data?: {
              message?: string;
              errorCode?: string | number;
            };
          };
        };

        const serverMessage = error.message || error.response?.data?.message || "";
        const lowerServerMessage = serverMessage.toLowerCase();

        // Check for token exhaustion - broader matching
        const isTokenExhausted =
          lowerServerMessage.includes("hết token") ||
          lowerServerMessage.includes("không đủ token") ||
          (error.response?.status === 400 && lowerServerMessage.includes("token"));
        
        void isTokenExhausted;

        if (isTokenExhaustionError(err)) {
          setIsLocalTokenExhausted(true);
          onTokenExhausted?.();
          if (canUpgrade) {
            toast.error("Bạn đã hết token. Vui lòng nạp thêm để tiếp tục chat.", {
              action: {
                label: "Nạp thêm",
                onClick: () => setIsUpgradeOpen(true),
              },
              duration: 8000,
            });
          } else {
            toast.error("Bạn đã dùng hết hạn mức token hôm nay do trường cấp. Hạn mức làm mới lúc 00:00.", { duration: 8000 });
          }
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
        className="px-4 md:px-6 py-3.5 border-b border-[var(--text-primary)] flex items-center gap-3 shrink-0 bg-bg-main"
      >
        {/* Mobile hamburger: open website sidebar */}
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-[2px] cursor-pointer hover:bg-[var(--status-neutral-bg)] active:scale-95 text-content-text"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          className="w-11 h-11 rounded-[2px] flex items-center justify-center shrink-0 overflow-hidden bg-[var(--bg-deep)] border border-[var(--text-primary)]"
        >
          {!headerAvatarBroken && isValidUrl(character.imageUrl) ? (
            <img
              src={character.imageUrl!}
              alt={character.name}
              className="w-full h-full object-cover"
              onError={() => setHeaderAvatarBroken(true)}
            />
          ) : (
            <ScrollText
              className="w-6 h-6 text-content-muted"
            />
          )}
        </div>
        {/* Character info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <h2
              className="archive-title is-plain text-[19px] truncate"
            >
              {character.name}
            </h2>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Lưu ý về độ chính xác của AI"
                    className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 border border-[var(--border-strong)] text-content-muted hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
                  >
                    <span className="text-[10px] font-bold leading-none">!</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="start"
                  sideOffset={10}
                  className="max-w-[min(380px,90vw)] whitespace-normal rounded-[2px] bg-bg-elevated border border-[var(--text-primary)] text-content-heading shadow-(--shadow-soft)"
                >
                  <p className="text-xs leading-relaxed">
                    AI có thể đưa ra thông tin không chính xác. Hãy kiểm chứng lại các thông tin quan trọng.
                  </p>
                  <a
                    href={AI_FEEDBACK_FORM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs font-semibold underline underline-offset-2 text-(--gold-on-light)"
                  >
                    Báo lỗi qua form
                  </a>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {aiWarningVisible && sessionId ? (
            <div
              className={cn(
                "flex items-center gap-1 h-3.5 text-[11px] transition-opacity duration-300 text-content-text",
                aiWarningLeaving ? "opacity-0" : "opacity-100",
              )}
            >
              <AlertTriangle
                className="w-3 h-3 shrink-0 text-(--status-warning)"
              />
              <span className="flex-1 min-w-0 truncate">
                AI có thể đưa ra thông tin không chính xác. Hãy kiểm chứng lại các thông tin quan trọng.
              </span>
              <button
                onClick={dismissAiWarning}
                aria-label="Đóng cảnh báo"
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] truncate text-content-muted">
              {character.title}
            </p>
          )}
        </div>

        {/* ── Nút Voice Call ── */}
        <button
          onClick={handleOpenVoice2DCall}
          disabled={isConversationInitializing || (canUseVoiceCall && isTokenExhausted)}
          aria-label={
            canUseVoiceCall
              ? `Gọi thoại với ${character.name}`
              : isSchoolAccount
                ? "Gọi thoại chưa có trong gói của trường"
                : "Mở nâng cấp gói Plus"
          }
          title={
            !canUseVoiceCall
              ? isSchoolAccount
                ? "Gọi thoại chưa có trong gói của trường. Bấm để xem hướng dẫn."
                : "Gọi thoại có trong gói Plus. Bấm để xem các gói nâng cấp."
              : isTokenExhausted
              ? isSchoolAccount
                ? "Đã hết hạn mức hôm nay. Hạn mức làm mới lúc 00:00."
                : "Bạn đã hết token. Vui lòng nâng cấp để gọi thoại."
              : sessionId
                ? `Gọi thoại với ${character.name}`
                : "Đang khởi tạo..."
          }
          className={cn(
            "group/call w-8 h-8 flex items-center justify-center rounded-[2px] transition-colors active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed",
            showVoiceNudge && "voice-call-nudge",
            canUseVoiceCall
              ? "bg-transparent border border-[var(--text-primary)] hover:bg-[var(--text-primary)]"
              : "bg-transparent border border-[var(--border-strong)] opacity-56",
          )}
        >
          <Phone
            className={cn(
              "w-4 h-4",
              canUseVoiceCall ? "text-[var(--text-primary)] group-hover/call:text-[var(--text-inverse)]" : "text-content-text"
            )}
          />
        </button>

        <button
          onClick={handleOpenVoice3DCall}
          disabled={isConversationInitializing || (canUseVideoCall && isTokenExhausted)}
          aria-label={
            canUseVideoCall
              ? `Video call 3D với ${character.name}`
              : isSchoolAccount
                ? "Video call 3D chưa có trong gói của trường"
                : "Mở nâng cấp gói Pro"
          }
          title={
            !canUseVideoCall
              ? isSchoolAccount
                ? "Video call 3D chưa có trong gói của trường. Bấm để xem hướng dẫn."
                : "Video call có trong gói Pro. Bấm để xem các gói nâng cấp."
              : isTokenExhausted
              ? isSchoolAccount
                ? "Đã hết hạn mức hôm nay. Hạn mức làm mới lúc 00:00."
                : "Bạn đã hết token. Vui lòng nâng cấp để gọi 3D."
              : sessionId
                ? `Video call 3D với ${character.name}`
                : "Đang khởi tạo..."
          }
          className={cn(
            "group/call w-8 h-8 flex items-center justify-center rounded-[2px] transition-colors active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed",
            showVoiceNudge && "voice-call-nudge voice-call-nudge--delay",
            canUseVideoCall
              ? "bg-transparent border border-[var(--text-primary)] hover:bg-[var(--text-primary)]"
              : "bg-transparent border border-[var(--border-strong)] opacity-56",
          )}
        >
          <Video
            className={cn(
              "w-4 h-4",
              canUseVideoCall ? "fill-current text-[var(--text-primary)] group-hover/call:text-[var(--text-inverse)]" : "text-content-text"
            )}
          />
        </button>

        {/* Toggle Right Panel: character info, history, other characters, quiz, contexts (Mobile/Tablet) */}
        {toggleRightPanel && (
          <button
            onClick={toggleRightPanel}
            className={cn(
              "md:hidden w-8 h-8 flex items-center justify-center rounded-[2px] cursor-pointer active:scale-95",
              isRightOpen ? "bg-[var(--text-primary)] text-[var(--text-inverse)]" : "text-content-text hover:bg-[var(--status-neutral-bg)]",
            )}
            aria-label="Mở bảng điều khiển"
          >
            <Info className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-5 pb-28 md:pb-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div
              className="w-5 h-5 rounded-full border-2 border-[var(--text-primary)] border-t-transparent animate-spin"
            />
          </div>
        ) : !sessionId ? (
          <>
            {initializingLabel && (
              <p
                className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-center text-content-muted"
              >
                {initializingLabel}
              </p>
            )}
            <TypingIndicator character={character} />
          </>
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
                  speak={(text) => speak(text, item.message.id)}
                  isSpeaking={speakingMessageId === item.message.id}
                  onViewQuote={
                    item.message.role === "ASSISTANT" ? onOpenCitation : undefined
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
                className="text-xs text-left px-3 py-1.5 rounded-[2px] border cursor-pointer transition-colors bg-transparent border-[var(--border-strong)] text-content-text hover:bg-[var(--text-primary)] hover:border-[var(--text-primary)] hover:text-[var(--text-inverse)]"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Token usage display */}
        {lastTokenUsage && !isStreaming && (
          <div className="px-4 flex items-center justify-end gap-3 text-[10px] text-content-muted">
            {isStaffOrAdmin ? (
              lastTokenUsage.messageType === "VOICE" ? (
                <span className="tabular-nums">Đã dùng: {lastTokenUsage.promptTokens + lastTokenUsage.completionTokens}</span>
              ) : (
                <>
                  <span className="tabular-nums">Prompt: {lastTokenUsage.promptTokens}</span>
                  <span className="tabular-nums">Response: {lastTokenUsage.completionTokens}</span>
                  <span className="tabular-nums">Tổng: {lastTokenUsage.promptTokens + lastTokenUsage.completionTokens}</span>
                </>
              )
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <Coins className="w-3 h-3 text-content-muted" />
                  <span>Còn lại: <strong className="tabular-nums text-content-text">{lastTokenUsage.remainingTokens.toLocaleString()}</strong></span>
                </div>
                <span className="w-px h-3 bg-(--border-default)" />
                <span className="tabular-nums">Đã dùng: {(lastTokenUsage.promptTokens + lastTokenUsage.completionTokens).toLocaleString()}</span>
              </>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {isTokenExhausted && (
        <div 
          className="px-4 py-2.5 border-t border-b border-[var(--text-primary)] flex items-center justify-between gap-3 text-xs shrink-0 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 bg-(--accent-gold-active-bg)"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-gold)] animate-pulse shrink-0" />
            <span className="text-content-text">
              {canUpgrade
                ? "Bạn đã dùng hết số token giới hạn. Vui lòng nâng cấp gói để tiếp tục cuộc trò chuyện."
                : `Bạn đã dùng hết hạn mức token hôm nay do trường cấp${
                    entitlements.dailyQuota ? ` (${entitlements.dailyQuota.toLocaleString("vi-VN")} token)` : ""
                  }. Hạn mức sẽ được làm mới lúc 00:00.`}
            </span>
          </div>
          {canUpgrade && (
            <button
              onClick={() => setIsUpgradeOpen(true)}
              className="btn-crimson min-h-0 px-3 py-1.5 text-[11px] active:scale-95 shrink-0 cursor-pointer"
            >
              Nâng cấp ngay
            </button>
          )}
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
          box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent-gold) 36%, transparent);
          transform-origin: 50% 50%;
        }

        .voice-call-nudge--delay {
          animation-delay: 0.16s;
        }

        @keyframes voiceCallNudge {
          0%, 100% {
            transform: translateX(0) rotate(0deg) scale(1);
            box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent-gold) 0%, transparent);
            filter: brightness(1);
          }
          12% {
            transform: translateX(-1px) rotate(-5deg) scale(1.04);
          }
          24% {
            transform: translateX(1px) rotate(5deg) scale(1.07);
            box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent-gold) 16%, transparent);
            filter: brightness(1.28);
          }
          36% {
            transform: translateX(-1px) rotate(-4deg) scale(1.04);
          }
          52% {
            transform: translateX(1px) rotate(3deg) scale(1.06);
            box-shadow: 0 0 0 8px color-mix(in srgb, var(--accent-gold) 0%, transparent);
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
          contextId={contextId}
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
          contextId={contextId}
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

      {/* ── Upgrade Pro Dialog ── */}
      <VoiceCallTranscriptDialog
        call={selectedVoiceCall}
        character={character}
        onOpenChange={(open) => !open && setSelectedVoiceCall(null)}
        onOpenCitation={onOpenCitation}
      />

      {canUpgrade && <UpgradeProDialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen} />}
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
        className="w-[240px] overflow-hidden rounded-[2px] border bg-bg-surface border-[var(--text-primary)]"
      >
        <button
          type="button"
          onClick={() => onOpen(call)}
          aria-label={`Mở chi tiết cuộc gọi thoại lúc ${formatVietnamTime(call.startedAt)}`}
          className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-[var(--status-neutral-bg)]"
        >
          <div
            className="w-10 h-10 rounded-[2px] flex items-center justify-center shrink-0 bg-[var(--text-primary)] text-[var(--text-inverse)]"
          >
            <PhoneCall className="w-5 h-5 fill-current" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-content-heading">
              Cuộc gọi thoại
            </p>
            <p className="text-xs text-content-muted">
              {formatVietnamTime(call.startedAt)}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={onCallAgain}
          aria-label="Gọi lại"
          className="w-full py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] cursor-pointer transition-colors border-t border-[var(--text-primary)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]"
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
  onOpenCitation,
}: {
  call: VoiceCallGroup | null;
  character: ChatCharacter;
  onOpenChange: (open: boolean) => void;
  onOpenCitation?: (quote: string) => void;
}) {
  return (
    <Dialog open={!!call} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[80vh] overflow-hidden rounded-[2px] border border-[var(--text-primary)] bg-bg-surface"
      >
        <DialogHeader>
          <DialogTitle className="archive-title is-plain text-xl">
            Cuộc gọi thoại - {call ? formatVietnamTime(call.startedAt) : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[56vh] overflow-y-auto space-y-3 pr-1">
          {call?.messages.map((message) => {
            const isUser = message.role === "USER";

            return (
              <div
                key={message.id}
                className={cn("flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}
              >
                <div
                  className={cn(
                    "max-w-[82%] rounded-[2px] px-4 py-2.5 text-sm leading-relaxed",
                    isUser
                      ? "bg-accent-gold text-white"
                      : "bg-bg-elevated text-content-heading border border-(--border-strong)",
                  )}
                >
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] opacity-70">
                    {isUser ? "Bạn" : character.name} - {formatVietnamTime(message.createdAt)}
                  </p>
                  <p>{message.content}</p>
                </div>
                {!isUser && message.quotes && message.quotes.length > 0 && (
                  <MessageQuotes quotes={message.quotes} onViewQuote={onOpenCitation} />
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
