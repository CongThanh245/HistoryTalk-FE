"use client";

import { useState, useRef } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string) => void;
  isLoading: boolean;
  characterName: string;
}

export function ChatInput({ onSend, isLoading, characterName }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto resize
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }
  };

  return (
    <div
      className="px-4 py-3 border-t shrink-0"
      style={{ borderColor: "var(--border-default)", background: "var(--bg-main)" }}
    >
      <div
        className="flex items-end gap-2 rounded-xl border px-3 py-2 transition-all duration-150 focus-within:border-[var(--accent-gold)]"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border-default)" }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={`Hỏi ${characterName}...`}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed py-1"
          style={{
            color: "var(--text-primary)",
            minHeight: 36,
            maxHeight: 140,
          }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || isLoading}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: value.trim() && !isLoading
              ? "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)"
              : "var(--bg-elevated)",
            color: value.trim() && !isLoading ? "var(--bg-deep)" : "var(--text-secondary)",
          }}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}