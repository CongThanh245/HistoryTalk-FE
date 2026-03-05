"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Scroll } from "lucide-react";
import type { ChatCharacter, ChatMessage } from "@/services/chat.service";
import { MessageBubble, TypingIndicator } from "./chat-message-bubble";
import { ChatInput } from "./chat-input";
import { MOCK_MESSAGES } from "./chat.mock";

interface ChatMainProps {
  character: ChatCharacter;
  sessionId: string | null;
}

export function ChatMain({ character, sessionId }: ChatMainProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);

  // TODO: uncomment khi có API
  // const { data } = useQuery({
  //   queryKey: chatQueryKeys.messages(sessionId ?? ""),
  //   queryFn: () => chatService.getMessages(sessionId!),
  //   enabled: !!sessionId,
  // });
  // useEffect(() => { if (data) setMessages(data); }, [data]);

  // Scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (content: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sessionId: sessionId ?? "new",
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // TODO: thay bằng chatService.sendMessage(...)
    await new Promise((r) => setTimeout(r, 1500));
    setIsTyping(false);

    const reply: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      sessionId: sessionId ?? "new",
      role: "assistant",
      content: `Ta hiểu câu hỏi của ngươi về "${content}". Đây là câu trả lời từ ${character.name}... (TODO: tích hợp AI)`,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, reply]);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center gap-3 shrink-0"
        style={{ borderColor: "var(--border-default)", background: "var(--bg-main)" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)" }}
        >
          <Scroll className="w-4 h-4" style={{ color: "var(--bg-deep)" }} />
        </div>
        <div>
          <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {character.name}
          </h2>
          <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
            {character.title} · {character.era}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-5 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} character={character} />
        ))}
        {isTyping && <TypingIndicator character={character} />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} isLoading={isTyping} characterName={character.name} />
    </div>
  );
}