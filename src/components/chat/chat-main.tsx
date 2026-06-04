"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PhoneIcon, ScrollIcon, ListIcon, InfoIcon, CoinsIcon, ClockCounterClockwiseIcon } from "@phosphor-icons/react"; // ← thêm ListIcon, InfoIcon
import { PhoneCallIcon } from "@phosphor-icons/react";
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
import { queryKeys } from "@/shared/query-key";
import { Avatar3DModal } from "./Avatar3DModal";
import type { VoiceRestMessage } from "@/features/chat/useVoiceChatRest";
import { KeywordDetailPanel } from "./KeywordDetailPanel";
import type { KeywordData } from "@/data/keywords";
import { cn } from "@/lib/utils/cn";
import { UpgradeProDialog } from "@/components/layouts/sidebar/upgrade-pro-dialog";
import { toast } from "sonner";
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
  sessionId: string | null;
  contextId: string;
  onSessionCreated: (sessionId: string) => void;
  toggleLeftPanel?: () => void;
  toggleRightPanel?: () => void;
  isLeftOpen?: boolean;
  isRightOpen?: boolean;
}

export function ChatMain({
  character,
  sessionId,
  contextId,
  onSessionCreated,
  toggleLeftPanel,
  toggleRightPanel,
  isLeftOpen = false,
  isRightOpen = false,
}: ChatMainProps) {
  const { toggleMobileSidebar } = useSidebar();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>(
    [],
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [streamingMessageType, setStreamingMessageType] = useState<"TEXT" | "VOICE">("TEXT");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordData | null>(null);
  const [selectedVoiceCall, setSelectedVoiceCall] = useState<VoiceCallGroup | null>(null);
  const [voiceCallDraftMessages, setVoiceCallDraftMessages] = useState<ChatMessage[]>([]);
  const [isTokenExhausted, setIsTokenExhausted] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [lastTokenUsage, setLastTokenUsage] = useState<{
    remainingTokens: number;
    promptTokens: number;
    completionTokens: number;
  } | null>(null);

  const handleKeywordSelect = useCallback((kw: KeywordData) => {
    setSelectedKeyword(kw);
  }, []);
  const handleKeywordClose = useCallback(() => {
    setSelectedKeyword(null);
  }, []);

  const { data, isLoading } = useChatMessages(sessionId);
  const createSession = useCreateSession();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const v = speechSynthesis.getVoices();
      setVoices(v);
    };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = (text: string) => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      return;
    }
    const voices = speechSynthesis.getVoices();
    const vietnameseVoice = voices.find((v) => v.name.includes("Vietnamese"));
    const utterance = new SpeechSynthesisUtterance(text);
    if (vietnameseVoice) utterance.voice = vietnameseVoice;
    utterance.lang = "vi-VN";
    speechSynthesis.speak(utterance);
  };

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
  const sessionIdRef = useRef(sessionId);

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

  const handleOpenVoiceCall = useCallback(() => {
    setVoiceCallDraftMessages([]);
    setIsVoiceOpen(true);
  }, []);

  const handleCloseVoiceCall = useCallback(() => {
    setIsVoiceOpen(false);
    if (sessionId) {
      qc.invalidateQueries({ queryKey: queryKeys.chat.messages(sessionId) });
    }
  }, [qc, sessionId]);

  const enqueueSpeech = (text: string) => {
    const voices = speechSynthesis.getVoices();
    const vietnameseVoice = voices.find((v) => v.name.includes("Vietnamese"));
    const utterance = new SpeechSynthesisUtterance(text);
    if (vietnameseVoice) utterance.voice = vietnameseVoice;
    utterance.lang = "vi-VN";
    speechSynthesis.speak(utterance);
  };

  const handleSend = async (content: string, type?: "TEXT" | "VOICE") => {
    // Cancel any ongoing speech when starting a new message
    speechSynthesis.cancel();
    
    // If not specified, default to VOICE if the 3D avatar modal is open, else TEXT
    const msgType = type || (isVoiceOpen ? "VOICE" : "TEXT");
    setStreamingMessageType(msgType);

    let currentSessionId = sessionId;

    if (!currentSessionId) {
      try {
        const newSession = await createSession.mutateAsync({
          contextId,
          characterId: character.id,
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
    const punctuationRegex = /([.,!?;\n]+)/;

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
           completionTokens: resData.completionTokens || 0
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
          onClick={handleOpenVoiceCall}
          disabled={!sessionId}
          title={
            sessionId ? `Gọi thoại với ${character.name}` : "Đang khởi tạo..."
          }
          className="w-8 h-8 flex items-center justify-center rounded-full transition-all
                     hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: "rgba(201,168,76,0.12)",
            border: "1px solid rgba(201,168,76,0.3)",
          }}
        >
          <PhoneIcon
            className="w-4 h-4"
            style={{ color: "var(--accent-gold)" }}
          />
        </button>

        {/* Toggle Right (Mobile/Tablet) */}
        {toggleRightPanel && (
          <button
            onClick={toggleRightPanel}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-white/5 active:scale-95"
            style={{ color: isRightOpen ? "var(--accent-gold)" : "var(--text-secondary)" }}
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
                  onCallAgain={handleOpenVoiceCall}
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
            <span className="tabular-nums">Prompt: {lastTokenUsage.promptTokens}</span>
            <span className="tabular-nums">Response: {lastTokenUsage.completionTokens}</span>
            <span className="tabular-nums">Tổng: {lastTokenUsage.promptTokens + lastTokenUsage.completionTokens}</span>
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
        disabled={isStreaming || isTokenExhausted}
        characterName={character.name}
        isTokenExhausted={isTokenExhausted}
      />

      {/* ── 3D Avatar Modal ── */}
      {isVoiceOpen && sessionId && (
        <Avatar3DModal
          character={character}
          sessionId={sessionId}
          contextId={contextId}
          onClose={handleCloseVoiceCall}
          onMessagesChange={handleVoiceMessagesChange}
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
