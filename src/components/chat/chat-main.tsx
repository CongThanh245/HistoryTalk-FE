"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollIcon } from "@phosphor-icons/react";
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

interface ChatMainProps {
  character: ChatCharacter;
  sessionId: string | null;
  contextId: string;
  onSessionCreated: (sessionId: string) => void; // ← thêm callback khi tạo session mới
}

export function ChatMain({
  character,
  sessionId,
  contextId,
  onSessionCreated,
}: ChatMainProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>(
    [],
  );
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

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
    // nếu đang đọc thì dừng
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      return;
    }

    const voices = speechSynthesis.getVoices();

    const vietnameseVoice = voices.find((v) => v.name.includes("Vietnamese"));

    const utterance = new SpeechSynthesisUtterance(text);

    if (vietnameseVoice) {
      utterance.voice = vietnameseVoice;
    }

    utterance.lang = "vi-VN";

    speechSynthesis.speak(utterance);
  };
  const serverMessages = data?.messages ?? [];
  const messages = [...serverMessages, ...optimisticMessages];
  const sessionIdRef = useRef(sessionId);
  useEffect(() => {
    console.log("sessionId changed during send:", sessionId);
    sessionIdRef.current = sessionId;
  }, [sessionId]);
  // Reset optimistic khi sessionId đổi
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

    // Auto-create nếu chưa có session
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

          // 🔊 đọc message của nhân vật
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
        onError: () => {
          setOptimisticMessages((prev) =>
            prev.filter((m) => m.id !== tempUserMsg.id),
          );
        },
      },
    );
  };
  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center gap-3 shrink-0"
        style={{
          borderColor: "var(--border-default)",
          background: "var(--bg-main)",
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
          }}
        >
          <ScrollIcon className="w-4 h-4" style={{ color: "var(--bg-deep)" }} />
        </div>
        <div>
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
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-5 space-y-4">
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
              />
            ))}
            {sendMessage.isPending && <TypingIndicator character={character} />}
          </>
        )}

        {/* Suggested questions */}
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

        <div ref={bottomRef} />
      </div>

      <ChatInput
        onSend={handleSend}
        isLoading={sendMessage.isPending}
        disabled={!sessionId && sendMessage.isPending} // disable input khi đang tạo session mới
        characterName={character.name}
      />
    </div>
  );
}
