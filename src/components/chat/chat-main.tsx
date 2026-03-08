"use client";

import { useEffect, useRef, useState } from "react";
import { Scroll } from "lucide-react";
import type { ChatCharacter, ChatMessage } from "@/services/chat.service";
import { MessageBubble, TypingIndicator } from "./chat-message-bubble";
import { ChatInput } from "./chat-input";
import { useChatMessages, useSendMessage } from "@/features/chat/hooks";

interface ChatMainProps {
  character: ChatCharacter;
  sessionId: string | null;
  contextId: string;
}

export function ChatMain({ character, sessionId, contextId }: ChatMainProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>(
    [],
  );
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  const { data, isLoading } = useChatMessages(sessionId);
  const sendMessage = useSendMessage();

  const serverMessages = data?.messages ?? [];
  const messages = [...serverMessages, ...optimisticMessages];

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

  const handleSend = async (content: string) => {
    if (!sessionId) return;

    // Optimistic update
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setOptimisticMessages((prev) => [...prev, tempUserMsg]);
    setSuggestedQuestions([]);

    sendMessage.mutate(
      { sessionId, content },
      {
        onSuccess: (res) => {
          // Xóa optimistic, thêm real messages
          setOptimisticMessages([]);
          setSuggestedQuestions(res.suggestedQuestions);
          // React Query sẽ tự refetch messages qua invalidate nếu cần
          // Hoặc update cache trực tiếp
        },
        onError: () => {
          // Rollback optimistic
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
          <Scroll className="w-4 h-4" style={{ color: "var(--bg-deep)" }} />
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
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Chọn cuộc trò chuyện hoặc tạo mới để bắt đầu
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} character={character} />
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
        disabled={!sessionId}
        characterName={character.name}
      />
    </div>
  );
}
