"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PhoneIcon, ScrollIcon, ListIcon, InfoIcon, CoinsIcon } from "@phosphor-icons/react"; // ← thêm ListIcon, InfoIcon
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
  useSendMessage,
} from "@/features/chat/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query-key";
import { Avatar3DModal } from "./Avatar3DModal";
import { KeywordDetailPanel } from "./KeywordDetailPanel";
import type { KeywordData } from "@/data/keywords";
import { cn } from "@/lib/utils/cn";
import { UpgradeProDialog } from "@/components/layouts/sidebar/upgrade-pro-dialog";
import { toast } from "sonner";

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>(
    [],
  );
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordData | null>(null);
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
  const sendMessage = useSendMessage();
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

  const serverMessages = data?.messages ?? [];
  const messages = [...serverMessages, ...optimisticMessages];
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
  }, [messages, sendMessage.isPending]);

  const qc = useQueryClient();

  const handleSend = async (content: string) => {
    let currentSessionId = sessionId;

    if (!currentSessionId) {
      try {
        const newSession = await createSession.mutateAsync({
          contextId,
          characterId: character.id,
        });
        currentSessionId = newSession.id;
        onSessionCreated?.(currentSessionId);
      } catch {
        return;
      }
    }

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: currentSessionId,
      role: "USER",
      content,
      createdAt: new Date().toISOString(),
    };
    setOptimisticMessages((prev) => [...prev, tempUserMsg]);

    sendMessage.mutate(
      { sessionId: currentSessionId, content },
      {
        onSuccess: (res) => {
          setOptimisticMessages([]);
          setSuggestedQuestions(res.suggestedQuestions);
          setLastTokenUsage({
            remainingTokens: res.remainingTokens,
            promptTokens: res.promptTokens,
            completionTokens: res.completionTokens,
          });
          if (res.assistantMessage?.content) {
            speak(res.assistantMessage.content);
          }
          qc.setQueryData(
            queryKeys.chat.messages(currentSessionId!),
            (old: GetMessagesResponse | undefined) => ({
              messages: [
                ...(old?.messages ?? []),
                res.userMessage,
                res.assistantMessage,
              ],
              suggestedQuestions: res.suggestedQuestions,
            }),
          );
        },
        onError: (err: any) => {
          setOptimisticMessages((prev) =>
            prev.filter((m) => m.id !== tempUserMsg.id),
          );
          
          const serverMessage = err?.response?.data?.message || "";
          if (
            serverMessage.includes("hết token") ||
            serverMessage.includes("nạp thêm") ||
            err?.response?.data?.errorCode === 400
          ) {
            setIsTokenExhausted(true);
            toast.error("Bạn đã hết token. Vui lòng nạp thêm để tiếp tục chat.", {
              action: {
                label: "Nạp thêm",
                onClick: () => setIsUpgradeOpen(true),
              },
              duration: 8000,
            });
          }
        },
      },
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
        {/* Toggle Left (Mobile/Tablet) */}
        {toggleLeftPanel && (
          <button
            onClick={toggleLeftPanel}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-white/5 active:scale-95"
            style={{ color: isLeftOpen ? "var(--accent-gold)" : "var(--text-secondary)" }}
          >
            <ListIcon className="w-5 h-5" />
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
          onClick={() => setIsVoiceOpen(true)}
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
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                character={character}
                speak={speak}
                onKeywordSelect={
                  msg.role === "ASSISTANT" ? handleKeywordSelect : undefined
                }
              />
            ))}
            {sendMessage.isPending && <TypingIndicator character={character} />}
          </>
        )}

        {suggestedQuestions.length > 0 && !sendMessage.isPending && (
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
        {lastTokenUsage && !sendMessage.isPending && (
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
        isLoading={sendMessage.isPending}
        disabled={sendMessage.isPending || isTokenExhausted}
        characterName={character.name}
        isTokenExhausted={isTokenExhausted}
      />

      {/* ── 3D Avatar Modal ── */}
      {isVoiceOpen && sessionId && (
        <Avatar3DModal
          character={character}
          sessionId={sessionId}
          contextId={contextId}
          onClose={() => setIsVoiceOpen(false)}
        />
      )}

      {/* ── Historical Keyword Panel ── */}
      <KeywordDetailPanel
        keyword={selectedKeyword}
        onClose={handleKeywordClose}
      />

      {/* ── Upgrade Pro Dialog ── */}
      <UpgradeProDialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen} />
    </div>
  );
}
