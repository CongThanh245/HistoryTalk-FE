"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MicrophoneIcon, PaperPlaneRightIcon } from "@phosphor-icons/react";

// ── Web Speech API types (chưa có trong lib dom mặc định) ──
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare const SpeechRecognition: {
  new (): SpeechRecognition;
  prototype: SpeechRecognition;
};

interface ChatInputProps {
  onSend: (content: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  characterName?: string;
}

export function ChatInput({
  onSend,
  isLoading,
  disabled,
  characterName,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Kiểm tra browser support
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [text, isLoading, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Push-to-talk ─────────────────────────────────────
  const startRecording = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.interimResults = true; // hiện text tạm thời khi đang nói
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      setText(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
      // Focus textarea sau khi nhả mic
      textareaRef.current?.focus();
    };

    recognition.onerror = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  // Mouse / Touch events cho push-to-talk
  const micProps = {
    onMouseDown: startRecording,
    onMouseUp: stopRecording,
    onMouseLeave: stopRecording, // nhả nếu kéo chuột ra ngoài
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault(); // tránh trigger click sau touch
      startRecording();
    },
    onTouchEnd: stopRecording,
  };

  return (
    <div
      className="px-4 py-3 border-t shrink-0"
      style={{
        borderColor: "var(--border-default)",
        background: "var(--bg-main)",
      }}
    >
      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "#ef4444" }}
          />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Đang nghe... nhả để dừng
          </span>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isRecording
              ? "Đang nhận giọng nói..."
              : `Nhắn tin với ${characterName ?? "nhân vật"}...`
          }
          disabled={disabled || isRecording}
          rows={1}
          className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm outline-none
                     transition-all placeholder:text-[var(--text-secondary)]
                     disabled:opacity-60 overflow-hidden"
          style={{
            background: "var(--bg-elevated)",
            border: `1px solid ${isRecording ? "rgba(239,68,68,0.4)" : "var(--border-default)"}`,
            color: "var(--text-primary)",
            lineHeight: "1.5",
            minHeight: "42px",
            maxHeight: "160px",
          }}
        />

        {/* Mic button (push-to-talk) — chỉ hiện khi browser support */}
        {isSupported && (
          <button
            {...micProps}
            disabled={disabled || isLoading}
            title="Giữ để nói"
            className="w-10 h-10 flex items-center justify-center rounded-xl
                       transition-all active:scale-95 select-none
                       disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            style={{
              background: isRecording
                ? "rgba(239,68,68,0.15)"
                : "var(--bg-elevated)",
              border: `1px solid ${isRecording ? "rgba(239,68,68,0.5)" : "var(--border-default)"}`,
              boxShadow: isRecording ? "0 0 12px rgba(239,68,68,0.2)" : "none",
              // Tắt context menu khi giữ chuột phải
              WebkitUserSelect: "none",
              userSelect: "none",
            }}
          >
            <MicrophoneIcon
              className="w-4 h-4 transition-colors"
              style={{
                color: isRecording ? "#ef4444" : "var(--text-secondary)",
              }}
            />
          </button>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || isLoading || disabled}
          className="w-10 h-10 flex items-center justify-center rounded-xl
                     transition-all hover:brightness-110 active:scale-95
                     disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          style={{
            background: text.trim()
              ? "linear-gradient(135deg, var(--accent-gold), var(--truffle))"
              : "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
          }}
        >
          {isLoading ? (
            <div
              className="w-4 h-4 rounded-full border-2 animate-spin"
              style={{
                borderColor: "var(--accent-gold)",
                borderTopColor: "transparent",
              }}
            />
          ) : (
            <PaperPlaneRightIcon
              className="w-4 h-4"
              style={{
                color: text.trim() ? "var(--bg-deep)" : "var(--text-secondary)",
              }}
            />
          )}
        </button>
      </div>

      <p
        className="text-[10px] mt-1.5 px-1"
        style={{ color: "var(--text-secondary)", opacity: 0.5 }}
      >
        Enter để gửi · Shift+Enter xuống dòng
        {isSupported ? " · Giữ 🎙 để nói" : ""}
      </p>
    </div>
  );
}
